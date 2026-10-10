import {UV_LENGTH_M,clamp,type JetState} from './jet.ts';
import {foamToolSettings} from './tool-controls.ts';
import type {LiquidSource} from './cozy-liquid.ts';

/** Surface milk purity, a passive optical attribute of the two-layer liquid.
 * Resolved separately so millimetre-wide crema folds survive the bulk grid.
 * This does not own liquid volume. No pattern or brush shape is prescribed. */
export class LatteFilm {
 milkQuality=1;
 response:'legacy'|'local'|'taper'|'fine'='local';
 readonly size:number;readonly white:Float32Array;readonly mask:Uint8Array;
 private forward:Float32Array;private reverse:Float32Array;
 private vx:Float32Array;private vy:Float32Array;private localX:Float32Array;private localY:Float32Array;
 private cells:number[]=[];
 constructor(size=160){this.size=size;const count=size*size;this.white=new Float32Array(count);this.mask=new Uint8Array(count);this.forward=new Float32Array(count);this.reverse=new Float32Array(count);this.vx=new Float32Array(count);this.vy=new Float32Array(count);this.localX=new Float32Array(count);this.localY=new Float32Array(count);for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(Math.hypot((x+.5)/size-.5,(y+.5)/size-.5)<.485){const i=y*size+x;this.mask[i]=1;this.cells.push(i);}}
 reset(){this.white.fill(0);this.vx.fill(0);this.vy.fill(0);}
 /** A dry tool transports existing surface pigment; it never deposits milk. */
 etch(from:{x:number;y:number},to:{x:number;y:number},tool:'pick'|'spoon',precise=false){
  if(![from.x,from.y,to.x,to.y].every(Number.isFinite))return;
  const distance=Math.hypot(to.x-from.x,to.y-from.y),{radius,strength}=foamToolSettings(tool,precise);
  if(distance<1e-7)return;
  const steps=Math.min(160,Math.ceil(distance/(radius*.35))),n=this.size;
  const dx=(to.x-from.x)/steps,dy=(to.y-from.y)/steps;
  for(let step=1;step<=steps;step++){
   const x=from.x+dx*step,y=from.y+dy*step;if(Math.hypot(x-.5,y-.5)>.47)continue;
   // Compact support leaves untouched folds exactly intact. Forward/reverse
   // transport cancels interpolation blur; the donor bounds prevent ringing.
   const nearby:{i:number;sx:number;sy:number;ox:number;oy:number}[]=[];
   this.forward.set(this.white);
   for(const i of this.cells){const px=(i%n+.5)/n,py=(Math.floor(i/n)+.5)/n,r2=(px-x)**2+(py-y)**2;
    if(r2>=radius*radius*9)continue;
    const edge=1-r2/(radius*radius*9),weight=Math.exp(-r2/(2*radius*radius))*edge*edge*strength;
    const sx=(px-dx*weight)*n-.5,sy=(py-dy*weight)*n-.5;
    if(Math.hypot((sx+.5)/n-.5,(sy+.5)/n-.5)>=.48)continue;
    this.forward[i]=this.sample(this.white,sx,sy);
    nearby.push({i,sx,sy,ox:(px+dx*weight)*n-.5,oy:(py+dy*weight)*n-.5});
   }
   for(const {i,sx,sy,ox,oy} of nearby){
    const a=clamp(Math.floor(sx),0,n-2),b=clamp(Math.floor(sy),0,n-2),j=b*n+a;
    const lo=Math.min(this.white[j],this.white[j+1],this.white[j+n],this.white[j+n+1]),hi=Math.max(this.white[j],this.white[j+1],this.white[j+n],this.white[j+n+1]);
    this.reverse[i]=clamp(this.forward[i]+.5*(this.white[i]-this.sample(this.forward,ox,oy)),lo,hi);
   }
   for(const {i} of nearby)this.white[i]=this.reverse[i];
  }
 }
 private sample(field:Float32Array,x:number,y:number){const n=this.size;x=clamp(x,0,n-1);y=clamp(y,0,n-1);const a=Math.floor(x),b=Math.floor(y),fx=x-a,fy=y-b;return field[b*n+a]*(1-fx)*(1-fy)+field[b*n+Math.min(a+1,n-1)]*fx*(1-fy)+field[Math.min(b+1,n-1)*n+a]*(1-fx)*fy+field[Math.min(b+1,n-1)*n+Math.min(a+1,n-1)]*fx*fy;}
 step(sources:LiquidSource[],dt:number,flow?:{size:number;u:Float64Array;v:Float64Array}){
  if(dt<=0)return;
  const n=this.size,dx=UV_LENGTH_M/n,skin=.0004;
  const memory=Math.exp(-dt/.035);
  for(const i of this.cells){this.vx[i]*=memory;this.vy[i]*=memory;}
  for(const {x,y,jet} of sources){
   if(jet.volumeMl<=0||Math.hypot(x-.5,y-.5)>=.485)continue;
   const low=1/(1+(jet.clearanceM/.009)**4),q=jet.volumeMl*1e-6/dt*(.035*low-(this.response==='legacy'?.035:.0035)*(1-low));
   const r0=Math.max(jet.impactRadiusM,.0007);
   for(const i of this.cells){const rx=((i%n+.5)/n-x)*UV_LENGTH_M,ry=((Math.floor(i/n)+.5)/n-y)*UV_LENGTH_M,r2=rx*rx+ry*ry;
    const radial=q/(2*Math.PI*skin*(r2+r0*r0))*Math.exp(-r2/(this.response==='legacy'?.0008:.0008*low+.000018*(1-low)));
    const sweep=Math.exp(-r2/.000045),wake=jet.surfaceSweep??jet.incoming;
    if(this.response==='legacy'){
     this.vx[i]+=(rx*radial+(jet.incoming.x*low*.25+wake.x*(1-low)*.85)*sweep)*(1-memory);this.vy[i]+=(ry*radial+(jet.incoming.y*low*.25+wake.y*(1-low)*.85)*sweep)*(1-memory);
    }else{
     // A 60 Hz tick can contain several coalesced pointer packets. Integrate
     // their occupied time instead of applying a full tick of force per packet.
     const occupied=jet.volumeMl/(Math.max(jet.actualFlowMlS,1e-12)*dt);
     // A local, divergence-free dipole carries the centre of a moving cut.
     // Its return flow lets neighboring milk roll around it instead of
     // compressing the entire pool into a spear. Strength vanishes with Q.
     const travel=Math.hypot(wake.x,wake.y),nx=travel>1e-8?wake.x/travel:0,ny=travel>1e-8?wake.y/travel:0;
     const cutX=rx+nx*.006,cutY=ry+ny*.006;
     const variance=.00002025,local=Math.exp(-(cutX*cutX+cutY*cutY)/(2*variance)),cross=wake.x*cutY-wake.y*cutX;
     const coupling=(1-low)*.65*jet.actualFlowMlS/(jet.actualFlowMlS+1)*occupied;
     const outVariance=.000036,outLocal=Math.exp(-r2/(2*outVariance)),outCross=jet.incoming.x*ry-jet.incoming.y*rx;
     // A stationary low stream develops return eddies; rapid travel prevents
     // their coherent roll-up. Blend continuously, without recognizing art.
     const coherence=1/(1+(Math.hypot(wake.x,wake.y)/.008)**2),outCoupling=.30*jet.actualFlowMlS/(jet.actualFlowMlS+1)*occupied;
     const outletX=jet.incoming.x*(1-coherence)*sweep+coherence*(jet.incoming.x-ry*outCross/outVariance)*outLocal;
     const outletY=jet.incoming.y*(1-coherence)*sweep+coherence*(jet.incoming.y+rx*outCross/outVariance)*outLocal;
     const along=cutX*nx+cutY*ny,across=-cutX*ny+cutY*nx;
     const strain=(1-low)*jet.actualFlowMlS*1e-6/(skin*variance)*(this.response==='fine'?.085:this.response==='taper'?.05:.025)*travel/(travel+.008)*occupied;
     const stretch=strain*along*(1-across*across/variance)*local,pinch=-strain*across*(1-along*along/variance)*local;
     this.vx[i]+=(rx*radial+low*outCoupling*outletX+coupling*(wake.x-cutY*cross/variance)*local+stretch*nx-pinch*ny)*(1-memory);
     this.vy[i]+=(ry*radial+low*outCoupling*outletY+coupling*(wake.y+cutX*cross/variance)*local+stretch*ny+pinch*nx)*(1-memory);
    }
   }
  }
  // Bounded MacCormack advection retains crema filaments without sharpening
  // to a target silhouette. Dry periods have zero drive and keep resting art.
  // Advect the same milk attribute with the coupled surface; thick foam
  // resists motion. Remove this component after transport, not into memory.
  const localX=flow?this.localX:undefined,localY=flow?this.localY:undefined;if(localX&&localY){localX.set(this.vx);localY.set(this.vy);}
  if(flow)for(const i of this.cells){const j=Math.min(flow.size-1,Math.floor((Math.floor(i/n)+.5)/n*flow.size))*flow.size+Math.min(flow.size-1,Math.floor((i%n+.5)/n*flow.size));const mobility=.35/(1+this.white[i]*3);this.vx[i]+=flow.u[j]*mobility;this.vy[i]+=flow.v[j]*mobility;}
  let peak=0;for(const i of this.cells)peak=Math.max(peak,Math.hypot(this.vx[i],this.vy[i]));
  if(peak<1e-7&&sources.every(s=>s.jet.volumeMl<=0)){if(localX&&localY){this.vx.set(localX);this.vy.set(localY);}return;}
  const steps=Math.max(1,Math.ceil(peak*dt/dx/.75)),sub=dt/steps;
  for(let k=0;k<steps;k++){
   for(const i of this.cells){const x=i%n,y=Math.floor(i/n);this.forward[i]=this.sample(this.white,x-this.vx[i]*sub/dx,y-this.vy[i]*sub/dx);}
   for(const i of this.cells){const x=i%n,y=Math.floor(i/n);this.reverse[i]=this.sample(this.forward,x+this.vx[i]*sub/dx,y+this.vy[i]*sub/dx);}
   for(const i of this.cells){const x=i%n-this.vx[i]*sub/dx,y=Math.floor(i/n)-this.vy[i]*sub/dx,a=clamp(Math.floor(x),0,n-2),b=clamp(Math.floor(y),0,n-2),j=b*n+a;const lo=Math.min(this.white[j],this.white[j+1],this.white[j+n],this.white[j+n+1]),hi=Math.max(this.white[j],this.white[j+1],this.white[j+n],this.white[j+n+1]);this.reverse[i]=clamp(this.forward[i]+.5*(this.white[i]-this.reverse[i]),lo,hi);}
   this.white.set(this.reverse);
   for(const {x,y,jet} of sources)this.deposit(x,y,jet,1/steps,skin);
  }
  if(localX&&localY){this.vx.set(localX);this.vy.set(localY);}
 }
 private deposit(x:number,y:number,jet:JetState,fraction:number,skin:number){
  if(jet.volumeMl<=0||Math.hypot(x-.5,y-.5)>=.485)return;
  const n=this.size,dx=UV_LENGTH_M/n,r=Math.max(jet.impactRadiusM,.0007),low=1/(1+(jet.clearanceM/.009)**4),volume=jet.volumeMl*1e-6*fraction;
  const extent=Math.ceil(r*6/dx),cx=Math.floor(x*n),cy=Math.floor(y*n);
  for(let yy=Math.max(0,cy-extent);yy<=Math.min(n-1,cy+extent);yy++)for(let xx=Math.max(0,cx-extent);xx<=Math.min(n-1,cx+extent);xx++){
   const i=yy*n+xx;if(!this.mask[i])continue;const r2=(((xx+.5)/n-x)*UV_LENGTH_M)**2+(((yy+.5)/n-y)*UV_LENGTH_M)**2;
   const amount=volume/(2*Math.PI*r*r*skin);
   // Penetrating milk entrains a wider patch, while its narrower fresh core
   // can still leave a fine pull-through. Height changes these continuously.
   this.white[i]*=Math.exp(-amount*(1-low)*(this.response==='legacy'?.025:.006)/4*Math.exp(-r2/(8*r*r)));
   const width=low+(1-low)*.36;
   const exchange=1-Math.exp(-amount*(low*.035+(1-low)*(this.response==='legacy'?.008:.0005))/width*Math.exp(-r2/(2*r*r*width)));
   this.white[i]+=(1-this.white[i])*exchange*(.35+.65*clamp(this.milkQuality,0,1));
  }
 }
 metrics(){let min=1,max=0,area=0,contrast=0;for(const i of this.cells){const w=this.white[i];min=Math.min(min,w);max=Math.max(max,w);if(w>.5)area++;if(w>.1&&w<.9)contrast++;}return {grid:this.size,minPurity:min,maxPurity:max,whiteAreaMm2:area*(UV_LENGTH_M/this.size)**2*1e6,interfaceCells:contrast};}
}

