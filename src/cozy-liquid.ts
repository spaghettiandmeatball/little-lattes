import {CUP_RADIUS_M,UV_LENGTH_M,clamp,type JetState} from './jet.ts';
import {CUP_DEPTH_M,CUP_AREA_M2,CAPACITY_ML} from './volume.ts';

export const COZY_VERSION='hydrostatic-two-layer-2';
export const PREPARED={coffeeMl:55,milkMl:8,gasMl:.02,cremaM:.00002};
export type LiquidSource={x:number;y:number;jet:JetState};

/** Conservative hydrostatic columns with an active wet-foam upper layer.
 * All inventories are volume / normalized cell area (meters), never colors. */
export class CozyLiquid {
 readonly size:number;readonly mask:Uint8Array;readonly cells:number[]=[];
 readonly h:Float64Array;readonly upperMilk:Float64Array;readonly lowerMilk:Float64Array;
 readonly foam:Float64Array;readonly gas:Float64Array;readonly deepGas:Float64Array;readonly crema:Float64Array;
 readonly u:Float64Array;readonly v:Float64Array;
 readonly taggedFoam:Float64Array;
 private fields:Float64Array[];private changes:Float64Array[];
 readonly dx:number;readonly area:number;
 emittedMl=0;missMl=0;rimSpillMl=0;spilledMilkMl=0;spilledCoffeeMl=0;spilledGasMl=0;
 injectedFoamMl=0;entrainedFoamMl=0;resurfacedFoamMl=0;drainedFoamMl=0;spilledFoamMl=0;
 injectedGasMl=0;lostGasMl=0;bubbleFoamLossMl=0;incomingImpulseNs=0;steps=0;substeps=0;cpuMs=0;
 stopAtRim=false;surfaceYield=true;lastSpill={x:.5,y:.015};
 constructor(size=64){
  this.size=size;const count=size*size;this.mask=new Uint8Array(count);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(Math.hypot((x+.5)/size-.5,(y+.5)/size-.5)<.485){this.mask[y*size+x]=1;this.cells.push(y*size+x);}
  this.dx=UV_LENGTH_M/size;this.area=CUP_AREA_M2/this.cells.length;
  [this.h,this.upperMilk,this.lowerMilk,this.foam,this.gas,this.deepGas,this.crema,this.u,this.v,this.taggedFoam]=Array.from({length:10},()=>new Float64Array(count));
  this.fields=[this.h,this.upperMilk,this.lowerMilk,this.foam,this.gas,this.deepGas,this.crema,this.taggedFoam];
  this.changes=this.fields.map(()=>new Float64Array(count));this.reset();
 }
 reset(prepared=true,fillMl=prepared?63:55){
  for(const f of [...this.fields,this.u,this.v])f.fill(0);
  const milk=prepared?Math.min(PREPARED.milkMl,fillMl):0,depth=fillMl*1e-6/CUP_AREA_M2;
  for(const i of this.cells){this.h[i]=depth;const top=Math.min(depth,.0015);this.upperMilk[i]=top*milk/fillMl;this.lowerMilk[i]=(depth-top)*milk/fillMl;this.deepGas[i]=prepared?PREPARED.gasMl*1e-6/CUP_AREA_M2:0;this.crema[i]=PREPARED.cremaM;}
  this.initialMilkMl=milk;this.initialCoffeeMl=fillMl-milk;this.initialGasMl=prepared?PREPARED.gasMl:0;
  this.emittedMl=this.missMl=this.rimSpillMl=this.spilledMilkMl=this.spilledCoffeeMl=this.spilledGasMl=0;
  this.injectedFoamMl=this.entrainedFoamMl=this.resurfacedFoamMl=this.drainedFoamMl=this.spilledFoamMl=0;
  this.injectedGasMl=this.lostGasMl=this.bubbleFoamLossMl=this.incomingImpulseNs=this.steps=this.substeps=0;
 }
 private initialMilkMl=8;private initialCoffeeMl=55;private initialGasMl=.02;
 private sum(field:Float64Array){let total=0;for(const i of this.cells)total+=field[i];return total*this.area*1e6;}
 get fillMl(){return this.sum(this.h);}
 get milkMl(){return this.sum(this.upperMilk)+this.sum(this.lowerMilk);}
 get surfaceM(){return this.fillMl*1e-6/CUP_AREA_M2-CUP_DEPTH_M;}
 get full(){return this.fillMl>=CAPACITY_ML-1e-5;}
 private top(i:number){return Math.min(this.h[i],.0015+this.foam[i]);}
 depthAt(x:number,y:number){
  const n=this.size,px=clamp(x*n-.5,0,n-1),py=clamp(y*n-.5,0,n-1),ix=Math.floor(px),iy=Math.floor(py),fx=px-ix,fy=py-iy;
  const read=(a:number,b:number)=>{const i=b*n+a;return this.mask[i]?this.h[i]:this.fillMl*1e-6/CUP_AREA_M2;};
  return (read(ix,iy)*(1-fx)+read(Math.min(ix+1,n-1),iy)*fx)*(1-fy)+(read(ix,Math.min(iy+1,n-1))*(1-fx)+read(Math.min(ix+1,n-1),Math.min(iy+1,n-1))*fx)*fy;
 }
 /** Separate gas/milk; empirical ballistic penetration, no universal threshold. */
 inject({x,y,jet}:LiquidSource){
  const ml=jet.volumeMl;if(ml<=0)return;
  this.emittedMl+=ml;this.incomingImpulseNs+=jet.massKg*Math.hypot(jet.incoming.x,jet.incoming.y,jet.incoming.z);
  if(Math.hypot(x-.5,y-.5)>=.485){this.missMl+=ml;return;}
  const radius=Math.max(jet.impactRadiusM*1.1,this.dx*1.5);
  const surfaceFraction=clamp(.92/(1+(jet.clearanceM/.012)**2),.025,.92);
  const weights:{i:number;w:number}[]=[];let total=0;
  const n=this.size,r=radius*4/UV_LENGTH_M;
  for(let iy=Math.max(0,Math.floor((y-r)*n));iy<Math.min(n,Math.ceil((y+r)*n));iy++)for(let ix=Math.max(0,Math.floor((x-r)*n));ix<Math.min(n,Math.ceil((x+r)*n));ix++){
   const i=iy*n+ix;if(!this.mask[i])continue;const d2=(((ix+.5)/n-x)*UV_LENGTH_M)**2+(((iy+.5)/n-y)*UV_LENGTH_M)**2,w=Math.exp(-d2/(2*radius*radius));weights.push({i,w});total+=w;
  }
  const foamMl=ml*surfaceFraction*.85;this.injectedFoamMl+=foamMl;this.injectedGasMl+=ml*.25;
  for(const {i,w} of weights){
   const added=ml*1e-6/this.area*w/total;
   // A raised stream transfers part of existing foam to lower milk/aeration.
   const entrainment=.04+3*(1-surfaceFraction)**2;
   const entrained=this.foam[i]*(1-Math.exp(-added/Math.max(this.top(i),1e-6)*entrainment));
   const gasMove=this.foam[i]>0?this.gas[i]*entrained/this.foam[i]:0;
   this.taggedFoam[i]*=1-entrained/Math.max(this.foam[i],1e-30);
   this.foam[i]-=entrained;this.upperMilk[i]-=entrained;this.lowerMilk[i]+=entrained;
   this.gas[i]-=gasMove;this.deepGas[i]+=gasMove;this.entrainedFoamMl+=entrained*this.area*1e6;
   this.h[i]+=added;this.upperMilk[i]+=added*surfaceFraction;this.lowerMilk[i]+=added*(1-surfaceFraction);
   this.foam[i]+=added*surfaceFraction*.85;this.gas[i]+=added*.25*surfaceFraction;this.deepGas[i]+=added*.25*(1-surfaceFraction);
   this.u[i]+=clamp(jet.incoming.x*added/Math.max(this.h[i],1e-6),-.02,.02);this.v[i]+=clamp(jet.incoming.y*added/Math.max(this.h[i],1e-6),-.02,.02);
   this.rebalance(i);
  }
  this.overflow(x,y);
 }
 private overflow(x:number,y:number){
  const fill=this.fillMl,excess=Math.max(0,fill-CAPACITY_ML);if(excess<1e-10)return;
  // Stage A: well-mixed cup withdrawal. Includes coffee; never pure incoming milk.
  const fraction=excess/fill;this.rimSpillMl+=excess;
  this.spilledMilkMl+=this.milkMl*fraction;this.spilledCoffeeMl+=(fill-this.milkMl)*fraction;
  this.spilledFoamMl+=this.sum(this.foam)*fraction;this.spilledGasMl+=(this.sum(this.gas)+this.sum(this.deepGas))*fraction;
  for(const field of this.fields)for(const i of this.cells)field[i]*=1-fraction;
  // Withdrawing volume changes the fixed-depth upper/lower partition, too.
  // Remap both constituents before the next conservative face transport.
  for(const i of this.cells)this.rebalance(i);
  const a=Math.atan2(y-.5,x-.5);this.lastSpill={x:.5+Math.cos(a)*.485,y:.5+Math.sin(a)*.485};
 }
 step(sources:LiquidSource[],dt=1/60){
  const begin=performance.now();
  // Equal stationary packets share one instantaneous source, avoiding repeated
  // nonlinear entrainment solely because the browser subdivided a packet.
  const grouped=new Map<string,LiquidSource>();
  for(const source of sources){const j=source.jet,key=[source.x,source.y,j.clearanceM,j.impactRadiusM,j.incoming.x,j.incoming.y,j.incoming.z,j.stroke].join(',');const old=grouped.get(key);if(old){old.jet.volumeMl+=j.volumeMl;old.jet.massKg+=j.massKg;}else grouped.set(key,{...source,jet:{...j}});}
  for(const source of grouped.values())this.inject(source);
  let maxDepth=.024;for(const i of this.cells)maxDepth=Math.max(maxDepth,this.h[i]);
  const count=Math.max(1,Math.ceil(dt*(Math.sqrt(9.81*maxDepth)+.09)/(this.dx*.36))),sub=dt/count;
  for(let k=0;k<count;k++)this.advance(sub);
  this.steps++;this.substeps=count;this.cpuMs=performance.now()-begin;
 }
 private advance(dt:number){
  const n=this.size,dx=this.dx,decay=Math.exp(-dt*45);
  const drainFraction=1-Math.exp(-.006*dt),riseFraction=1-Math.exp(-.07*dt),gasLoss=1-Math.exp(-.004*dt),deepLoss=1-Math.exp(-.035*dt);
  for(const d of this.changes)d.fill(0);
  for(const i of this.cells){
   if(i%n<n-1&&this.mask[i+1])this.face(i,i+1,this.u,dt,dx,decay);
   else this.u[i]=0;
   if(i+n<n*n&&this.mask[i+n])this.face(i,i+n,this.v,dt,dx,decay);
   else this.v[i]=0;
  }
  for(const i of this.cells){
   for(let f=0;f<this.fields.length;f++)this.fields[f][i]+=this.changes[f][i];
   // Upper/lower capacities change with the occupied column. Transfer, don't fix mass globally.
   this.rebalance(i);
   const drained=this.foam[i]*drainFraction;this.foam[i]-=drained;this.taggedFoam[i]*=1-drainFraction;this.drainedFoamMl+=drained*this.area*1e6;
   // Surviving entrained bubbles recover a dispersed wet foam, not an intact mark.
   const rise=Math.min(this.deepGas[i]*riseFraction,this.lowerMilk[i]*.25);
   const milk=Math.min(rise*3.4,this.lowerMilk[i],Math.max(0,this.top(i)-this.upperMilk[i]));
   const returned=milk/3.4;this.deepGas[i]-=returned;this.gas[i]+=returned;this.lowerMilk[i]-=milk;this.upperMilk[i]+=milk;this.foam[i]+=milk;this.resurfacedFoamMl+=milk*this.area*1e6;
   const lost=this.gas[i]*gasLoss,deepLost=this.deepGas[i]*deepLoss;
   this.gas[i]-=lost;this.deepGas[i]-=deepLost;this.lostGasMl+=(lost+deepLost)*this.area*1e6;
   if(this.surfaceYield){const faded=this.foam[i]*gasLoss;this.foam[i]-=faded;this.taggedFoam[i]*=1-gasLoss;this.bubbleFoamLossMl+=faded*this.area*1e6;}
   // Exchange/foam drainage changes the layer's occupied capacity. Repair the
   // partition before the next face sees it; no concentration may exceed one.
   this.rebalance(i);
  }
 }
 private rebalance(i:number){
  const top=this.top(i);let excess=Math.max(0,this.upperMilk[i]-top);this.upperMilk[i]-=excess;this.lowerMilk[i]+=excess;
  excess=Math.max(0,this.lowerMilk[i]-(this.h[i]-top));this.lowerMilk[i]-=excess;this.upperMilk[i]+=excess;
 }
 private face(a:number,b:number,velocity:Float64Array,dt:number,dx:number,decay:number){
  const avg=(this.h[a]+this.h[b])*.5,top=(this.top(a)+this.top(b))*.5;
  const speed=clamp((velocity[a]-9.81*dt*(this.h[b]-this.h[a])/dx)*decay,-.09,.09);velocity[a]=speed;
  // Reduced gravity of an aerated surface inventory; bounded crowded-foam drag.
  const resistance=1+Math.min(3,(this.foam[a]+this.foam[b])/.001)*.4;
  const drive=-.0045*(this.foam[b]-this.foam[a])/dx/resistance;
  // A bounded, empirical crowded-film yield, never applied to bulk liquid.
  // Active inflow still carries the film; weak foam-pressure creep can arrest.
  const yieldSpeed=this.surfaceYield?.0012*Math.min(1,(this.foam[a]+this.foam[b])/.0016):0;
  const shear=clamp(Math.sign(drive)*Math.max(0,Math.abs(drive)-yieldSpeed),-.012,.012);
  const surfaceSpeed=speed*.22/resistance+shear;
  const qt=top*surfaceSpeed,qb=avg*speed-qt;
  this.transfer(a,b,qt,dt/dx,true);this.transfer(a,b,qb,dt/dx,false);
 }
 private transfer(a:number,b:number,flux:number,scale:number,upper:boolean){
  const from=flux>=0?a:b,to=flux>=0?b:a,layer=upper?this.top(from):this.h[from]-this.top(from);
  const volume=Math.min(Math.abs(flux)*scale,layer*.20);if(volume<=0||layer<=1e-14)return;
  const ratio=volume/layer;this.changes[0][from]-=volume;this.changes[0][to]+=volume;
  if(upper){
   const milk=this.upperMilk[from]*ratio,foam=this.foam[from]*ratio,gas=this.gas[from]*ratio,crema=this.crema[from]*ratio,tag=this.taggedFoam[from]*ratio;
   this.changes[1][from]-=milk;this.changes[1][to]+=milk;
   this.changes[3][from]-=foam;this.changes[3][to]+=foam;
   this.changes[4][from]-=gas;this.changes[4][to]+=gas;
   this.changes[6][from]-=crema;this.changes[6][to]+=crema;
   this.changes[7][from]-=tag;this.changes[7][to]+=tag;
  }else {
   const milk=this.lowerMilk[from]*ratio,gas=this.deepGas[from]*ratio;
   this.changes[2][from]-=milk;this.changes[2][to]+=milk;
   this.changes[5][from]-=gas;this.changes[5][to]+=gas;
  }
 }
 tagFoam(){this.taggedFoam.set(this.foam);}
 metrics(){
  const fill=this.fillMl,milk=this.milkMl,foam=this.sum(this.foam),gas=this.sum(this.gas)+this.sum(this.deepGas);
  let min=Infinity,max=-Infinity,peak=0,invalid=0,negative=0,area=0,cx=0,cy=0,radial=0,wetness=0;
  for(const i of this.cells){min=Math.min(min,this.h[i]);max=Math.max(max,this.h[i]);peak=Math.max(peak,Math.hypot(this.u[i],this.v[i]));for(const f of this.fields){if(!Number.isFinite(f[i]))invalid++;if(f[i]<-1e-12)negative++;}
   const x=(i%this.size+.5)/this.size,y=(Math.floor(i/this.size)+.5)/this.size;
   if(this.foam[i]>.0002)area+=this.area*1e6;cx+=x*this.foam[i];cy+=y*this.foam[i];radial+=((x-.5)**2+(y-.5)**2)*this.foam[i];wetness+=this.foam[i];
  }
  return {mode:this.surfaceYield?COZY_VERSION:'hydrostatic-two-layer-1',grid:this.size,fillMl:fill,milkMl:milk,coffeeMl:fill-milk,emittedMl:this.emittedMl,missMl:this.missMl,rimSpillMl:this.rimSpillMl,spilledMilkMl:this.spilledMilkMl,spilledCoffeeMl:this.spilledCoffeeMl,
   liquidErrorMl:this.initialMilkMl+this.initialCoffeeMl+this.emittedMl-fill-this.rimSpillMl-this.missMl,
   milkErrorMl:this.initialMilkMl+this.emittedMl-this.missMl-milk-this.spilledMilkMl,
   coffeeErrorMl:this.initialCoffeeMl-(fill-milk)-this.spilledCoffeeMl,
   gasMl:gas,gasErrorMl:this.initialGasMl+this.injectedGasMl-gas-this.lostGasMl-this.spilledGasMl,lostGasMl:this.lostGasMl,
   surfaceFoamMl:foam,foamTransportErrorMl:this.injectedFoamMl+this.resurfacedFoamMl-foam-this.entrainedFoamMl-this.drainedFoamMl-this.bubbleFoamLossMl-this.spilledFoamMl,bubbleFoamLossMl:this.bubbleFoamLossMl,
   injectedFoamMl:this.injectedFoamMl,entrainedFoamMl:this.entrainedFoamMl,resurfacedFoamMl:this.resurfacedFoamMl,drainedFoamMl:this.drainedFoamMl,foamWetness:foam/Math.max(foam+this.sum(this.gas),1e-30),
   upperMilkMl:this.sum(this.upperMilk),lowerMilkMl:this.sum(this.lowerMilk),visibleAreaMm2:area,foamCentroid:{x:cx/Math.max(wetness,1e-30),y:cy/Math.max(wetness,1e-30)},foamRmsRadiusMm:Math.sqrt(radial/Math.max(wetness,1e-30))*UV_LENGTH_M*1000,
   minDepthMm:min*1000,maxDepthMm:max*1000,peakSpeedMPS:peak,nonFiniteValues:invalid,negativeInventories:negative,globalCorrectionMl:0,incomingImpulseNs:this.incomingImpulseNs,substeps:this.substeps,cpuMs:this.cpuMs};
 }
}

