import type {Preset} from './model.ts';
import type {PourSlice} from './input.ts';
import {solveJet, UV_LENGTH_M, clamp, type JetState} from './jet.ts';

export const SURFACE_SIZE=160;
export type SurfaceInput={slice:PourSlice;quantity:number;jet?:JetState};
type Source={x:number;y:number;volume:number;radius:number;jet:JetState;stroke:number};
const FOAM_SCALE=.045, DEPTH_M=.012, WAVE_SPEED=.16;
const minmod=(a:number,b:number)=>a*b<=0?0:Math.sign(a)*Math.min(Math.abs(a),Math.abs(b));

export class Surface {
  readonly size:number;
  foam:Float32Array; private next:Float32Array;
  readonly vx:Float32Array; readonly vy:Float32Array; readonly mask:Uint8Array; readonly pixels:Uint8Array;
  private ux:Float32Array; private uy:Float32Array;
  private eta:Float32Array; private etaNext:Float32Array;
  private forceX:Float32Array; private forceY:Float32Array;
  private deposit:Float32Array; private sink:Float32Array;
  injected=0; visibleInjected=0; mixed=0; outside=0; foamSunk=0; transportPasses=0;
  injectedImpulse=0; directionalImpulseX=0; directionalImpulseY=0; substeps=0;
  lastJet:JetState|null=null;
  constructor(size=SURFACE_SIZE){
    this.size=size;const n=size*size;
    this.foam=new Float32Array(n);this.next=new Float32Array(n);
    this.vx=new Float32Array(n);this.vy=new Float32Array(n);
    this.ux=new Float32Array(n);this.uy=new Float32Array(n);
    this.eta=new Float32Array(n);this.etaNext=new Float32Array(n);
    this.forceX=new Float32Array(n);this.forceY=new Float32Array(n);
    this.deposit=new Float32Array(n);this.sink=new Float32Array(n);
    this.mask=new Uint8Array(n);this.pixels=new Uint8Array(n*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)this.mask[y*size+x]=Math.hypot((x+.5)/size-.5,(y+.5)/size-.5)<.485?1:0;
  }
  reset(){
    for(const a of [this.foam,this.next,this.vx,this.vy,this.eta,this.etaNext])a.fill(0);
    this.injected=this.visibleInjected=this.mixed=this.outside=this.foamSunk=this.transportPasses=0;
    this.injectedImpulse=this.directionalImpulseX=this.directionalImpulseY=this.substeps=0;this.lastJet=null;
  }
  step(slice:PourSlice,quantity:number,p:Preset){this.stepBatch([{slice,quantity}],p);}
  stepBatch(parts:SurfaceInput[],p:Preset){
    const dt=parts.reduce((sum,part)=>sum+part.slice.dt,0),n=this.size;
    if(dt<=0)return;
    this.deposit.fill(0);this.sink.fill(0);this.forceX.fill(0);this.forceY.fill(0);
    const sources:Source[]=[];
    for(const {slice,quantity,jet:sharedJet} of parts){
      this.injected+=quantity;if(quantity<=0)continue;
      const {a,b,dt:duration}=slice;
      const state={...a,x:(a.x+b.x)*.5,y:(a.y+b.y)*.5,height:(a.height+b.height)*.5};
      const velocity={x:(b.x-a.x)/Math.max(duration,1e-6),y:(b.y-a.y)/Math.max(duration,1e-6)};
      const jet=sharedJet??solveJet(state,quantity,duration,velocity);this.lastJet=jet;
      const radius=Math.max(.008,jet.impactRadiusM/UV_LENGTH_M*1.2)*(p.radius/.034);
      const samples=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/(radius*.65)));
      let visibleQuantity=0,insideQuantity=0;
      for(let s=0;s<samples;s++){
        const t=(s+.5)/samples,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
        if(Math.hypot(x-.5,y-.5)>=.485)continue;
        insideQuantity+=quantity/samples;
        const reach=radius*3;let sum=0;const cells:[number,number][]=[];
        for(let iy=Math.floor((y-reach)*n);iy<=Math.ceil((y+reach)*n);iy++)for(let ix=Math.floor((x-reach)*n);ix<=Math.ceil((x+reach)*n);ix++){
          const d2=(((ix+.5)/n-x)**2+((iy+.5)/n-y)**2)/(radius*radius);
          if(d2>9)continue;const w=Math.exp(-d2*2);sum+=w;
          if(ix>=0&&iy>=0&&ix<n&&iy<n&&this.mask[iy*n+ix])cells.push([iy*n+ix,w]);
        }
        for(const [i,w] of cells){
          const volume=quantity/samples*w/sum;
          const visible=volume*jet.visibleFraction;
          this.deposit[i]+=visible*FOAM_SCALE*n*n;visibleQuantity+=visible;
          this.sink[i]+=volume*jet.mixingStrength**2*n*n*.065/(1+Math.hypot(velocity.x,velocity.y)*8);
        }
      }
      // Summed quadrature weights can exceed the source by round-off alone.
      insideQuantity=Math.min(quantity,insideQuantity);
      this.outside+=quantity-insideQuantity;
      this.visibleInjected+=visibleQuantity*FOAM_SCALE;
      this.mixed+=insideQuantity-visibleQuantity;
      if(insideQuantity>0){
        // Log incoming momentum before source merging: opposite directions
        // must not cancel the accumulated magnitude diagnostic.
        const mass=insideQuantity*.012;
        this.injectedImpulse+=mass*Math.hypot(jet.incoming.x,jet.incoming.y,jet.incoming.z);
        this.directionalImpulseX+=mass*jet.incoming.x;this.directionalImpulseY+=mass*jet.incoming.y;
        sources.push({x:state.x,y:state.y,volume:insideQuantity,radius,jet,stroke:a.stroke});
      }
    }
    // Close force quadrature is merged by volume; deposit keeps every vertex.
    // Separate strokes are never joined or discarded.
    while(sources.length>4){
      let index=-1,distance=Infinity;
      for(let i=0;i<sources.length-1;i++)if(sources[i].stroke===sources[i+1].stroke){
        const d=Math.hypot(sources[i].x-sources[i+1].x,sources[i].y-sources[i+1].y);
        if(d<distance){index=i;distance=d;}
      }
      if(index<0)break;
      const a=sources[index],b=sources[index+1],total=a.volume+b.volume,t=b.volume/total;
      for(const key of ['x','y','radius'] as const)a[key]+=(b[key]-a[key])*t;
      a.jet={...a.jet,incoming:{x:a.jet.incoming.x+(b.jet.incoming.x-a.jet.incoming.x)*t,y:a.jet.incoming.y+(b.jet.incoming.y-a.jet.incoming.y)*t,z:a.jet.incoming.z+(b.jet.incoming.z-a.jet.incoming.z)*t},visibleFraction:a.jet.visibleFraction+(b.jet.visibleFraction-a.jet.visibleFraction)*t};
      a.volume=total;sources.splice(index+1,1);
    }
    const cellMass=1000*DEPTH_M*(UV_LENGTH_M/n)**2;
    for(const source of sources){
      const {jet}=source,reach=Math.max(.09,source.radius*3.5);
      let weightSum=0;
      const cells:[number,number,number,number][]=[];
      for(let y=Math.max(0,Math.floor((source.y-reach*3)*n));y<Math.min(n,Math.ceil((source.y+reach*3)*n));y++)for(let x=Math.max(0,Math.floor((source.x-reach*3)*n));x<Math.min(n,Math.ceil((source.x+reach*3)*n));x++){
        const i=y*n+x;if(!this.mask[i])continue;
        const dx=(x+.5)/n-source.x,dy=(y+.5)/n-source.y,d=Math.hypot(dx,dy);
        const w=Math.exp(-d*d/(reach*reach));weightSum+=w;cells.push([i,w,dx/reach,dy/reach]);
      }
      const mass=source.volume*.012;
      for(const [i,w,dx,dy] of cells){
        const impulse=mass*w/weightSum/cellMass/UV_LENGTH_M;
        const radial=-jet.incoming.z*.025*(.6+.8*p.drift)*jet.visibleFraction;
        this.forceX[i]+=impulse*(jet.incoming.x*.06+dx*radial);
        this.forceY[i]+=impulse*(jet.incoming.y*.06+dy*radial);
        this.eta[i]+=source.volume*12e-6*w/weightSum/(UV_LENGTH_M/n)**2/UV_LENGTH_M*.008;
      }
    }
    let peak=0;
    for(let i=0;i<this.vx.length;i++)if(this.mask[i]){
      this.vx[i]+=this.forceX[i];this.vy[i]+=this.forceY[i];
      const speed=Math.hypot(this.vx[i],this.vy[i]);
      if(speed>.6){this.vx[i]*=.6/speed;this.vy[i]*=.6/speed;}
      peak=Math.max(peak,Math.min(speed,.6));
    }
    const steps=Math.max(1,Math.ceil(dt*n*(WAVE_SPEED+peak)/.45),Math.ceil(dt*.00002*n*n/.2));
    const h=dt/steps;
    this.transportPasses++;this.substeps+=steps;
    for(let k=0;k<steps;k++)this.transport(h,p);
    for(let i=0;i<this.foam.length;i++)if(this.mask[i]){
      const retention=Math.exp(-this.sink[i]);
      this.foamSunk+=this.foam[i]*(1-retention)/(n*n);
      this.foam[i]=this.foam[i]*retention+this.deposit[i];
    }
  }
  private neighbor(field:Float32Array,x:number,y:number,origin:number){
    const i=x>=0&&y>=0&&x<this.size&&y<this.size?y*this.size+x:-1;
    return i>=0&&this.mask[i]?field[i]:field[origin];
  }
  private sample(field:Float32Array,x:number,y:number,origin:number){
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
    return this.neighbor(field,ix,iy,origin)*(1-fx)*(1-fy)+this.neighbor(field,ix+1,iy,origin)*fx*(1-fy)+this.neighbor(field,ix,iy+1,origin)*(1-fx)*fy+this.neighbor(field,ix+1,iy+1,origin)*fx*fy;
  }
  private transport(dt:number,p:Preset){
    const n=this.size,damping=Math.exp(-dt*2.8),depth=DEPTH_M/UV_LENGTH_M;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=y*n+x;if(!this.mask[i])continue;
      const bx=x-this.vx[i]*dt*n,by=y-this.vy[i]*dt*n;
      let u=this.sample(this.vx,bx,by,i),v=this.sample(this.vy,bx,by,i);
      const viscosity=.000004*(1+Math.min(4,this.foam[i])*.6)*(1+p.spread);
      const alpha=viscosity*dt*n*n;
      u+=alpha*(this.neighbor(this.vx,x-1,y,i)+this.neighbor(this.vx,x+1,y,i)+this.neighbor(this.vx,x,y-1,i)+this.neighbor(this.vx,x,y+1,i)-4*this.vx[i]);
      v+=alpha*(this.neighbor(this.vy,x-1,y,i)+this.neighbor(this.vy,x+1,y,i)+this.neighbor(this.vy,x,y-1,i)+this.neighbor(this.vy,x,y+1,i)-4*this.vy[i]);
      const pressure=WAVE_SPEED**2/depth;
      u-=dt*pressure*(this.neighbor(this.eta,x+1,y,i)-this.neighbor(this.eta,x-1,y,i))*n*.5;
      v-=dt*pressure*(this.neighbor(this.eta,x,y+1,i)-this.neighbor(this.eta,x,y-1,i))*n*.5;
      const qx=(x+.5)/n-.5,qy=(y+.5)/n-.5,wall=Math.hypot(qx,qy);
      if(wall>.485-2/n){const out=(u*qx+v*qy)/wall;u-=out*qx/wall;v-=out*qy/wall;}
      const speed=Math.hypot(u,v),scale=speed>.6?.6/speed:1;
      this.ux[i]=u*damping*scale;this.uy[i]=v*damping*scale;
    }
    // Symplectic pressure update uses the new velocity in continuity. Using
    // old velocity here gives an unstable explicit-Euler acoustic system.
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=y*n+x;if(!this.mask[i])continue;
      const divergence=(this.neighbor(this.ux,x+1,y,i)-this.neighbor(this.ux,x-1,y,i)+this.neighbor(this.uy,x,y+1,i)-this.neighbor(this.uy,x,y-1,i))*n*.5;
      const bx=x-this.ux[i]*dt*n,by=y-this.uy[i]*dt*n;
      const smoothing=Math.min(.15,.000012*dt*n*n)*(this.neighbor(this.eta,x+1,y,i)+this.neighbor(this.eta,x-1,y,i)+this.neighbor(this.eta,x,y+1,i)+this.neighbor(this.eta,x,y-1,i)-4*this.eta[i]);
      this.etaNext[i]=clamp((this.sample(this.eta,bx,by,i)+smoothing-depth*divergence*dt)*Math.exp(-dt*4),-.04,.04);
    }
    this.vx.set(this.ux);this.vy.set(this.uy);[this.eta,this.etaNext]=[this.etaNext,this.eta];
    // Limited finite-volume transport preserves thin bands better than repeated
    // bilinear forward splats. Equal/opposite face fluxes conserve scalar mass.
    // Force buffers can be reused after their impulse has entered velocity.
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=y*n+x;if(!this.mask[i])continue;
      this.forceX[i]=minmod(this.foam[i]-this.neighbor(this.foam,x-1,y,i),this.neighbor(this.foam,x+1,y,i)-this.foam[i]);
      this.forceY[i]=minmod(this.foam[i]-this.neighbor(this.foam,x,y-1,i),this.neighbor(this.foam,x,y+1,i)-this.foam[i]);
    }
    this.ux.fill(0);this.uy.fill(0);this.etaNext.fill(0);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=y*n+x;if(!this.mask[i])continue;
      if(x+1<n&&this.mask[i+1]){
        const u=(this.vx[i]+this.vx[i+1])*.5;
        const flux=u*dt*n*(u>=0?this.foam[i]+this.forceX[i]*.5:this.foam[i+1]-this.forceX[i+1]*.5);
        this.ux[i]=flux;this.etaNext[flux>=0?i:i+1]+=Math.abs(flux);
      }
      if(y+1<n&&this.mask[i+n]){
        const v=(this.vy[i]+this.vy[i+n])*.5;
        const flux=v*dt*n*(v>=0?this.foam[i]+this.forceY[i]*.5:this.foam[i+n]-this.forceY[i+n]*.5);
        this.uy[i]=flux;this.etaNext[flux>=0?i:i+n]+=Math.abs(flux);
      }
    }
    for(let i=0;i<this.foam.length;i++)this.etaNext[i]=this.etaNext[i]>this.foam[i]?this.foam[i]/this.etaNext[i]:1;
    this.next.set(this.foam);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=y*n+x;if(!this.mask[i])continue;
      const fx=this.ux[i]*this.etaNext[this.ux[i]>=0?i:i+1],fy=this.uy[i]*this.etaNext[this.uy[i]>=0?i:i+n];
      if(x+1<n&&this.mask[i+1]){this.next[i]-=fx;this.next[i+1]+=fx;}
      if(y+1<n&&this.mask[i+n]){this.next[i]-=fy;this.next[i+n]+=fy;}
      if(this.next[i]<0&&this.next[i]>-1e-6)this.next[i]=0;
    }
    [this.foam,this.next]=[this.next,this.foam];
  }
  upload(mode='milk',opacity=1.5){
    for(let i=0;i<this.foam.length;i++){
      const m=1-Math.exp(-this.foam[i]*5*opacity/1.5),j=i*4;
      this.pixels[j]=clamp(128+this.vx[i]*400,0,255);this.pixels[j+1]=clamp(128+this.vy[i]*400,0,255);
      this.pixels[j+2]=mode==='velocity'?128:Math.round(m*255);this.pixels[j+3]=255;
    }return this.pixels;
  }
  metrics(){
    let mass=0,area=0,maxSpeed=0,cx=0,cy=0,integratedSpeed=0;
    for(let i=0;i<this.foam.length;i++){
      const v=this.foam[i];mass+=v;if(v>.35)area++;cx+=v*((i%this.size)+.5)/this.size;cy+=v*(Math.floor(i/this.size)+.5)/this.size;
      const speed=Math.hypot(this.vx[i],this.vy[i]);maxSpeed=Math.max(maxSpeed,speed);integratedSpeed+=speed;
    }
    return {mass:mass/this.size**2,area:area/this.size**2,cx:mass?cx/mass:.5,cy:mass?cy/mass:.5,maxSpeed,
      injected:this.injected,visibleInjected:this.visibleInjected,mixed:this.mixed,outside:this.outside,foamSunk:this.foamSunk,
      conservationError:mass/this.size**2+this.foamSunk-this.visibleInjected,
      surfaceVolumeMl:mass/this.size**2/FOAM_SCALE*12,bulkVolumeMl:(this.mixed+this.foamSunk/FOAM_SCALE)*12,
      integratedSpeed:integratedSpeed/this.size**2,injectedImpulse:this.injectedImpulse,
      directionalImpulseX:this.directionalImpulseX,directionalImpulseY:this.directionalImpulseY,
      transportPasses:this.transportPasses,substeps:this.substeps};
  }
}
