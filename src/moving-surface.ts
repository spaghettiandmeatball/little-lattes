import {UV_LENGTH_M,CUP_RADIUS_M,clamp} from './jet.ts';
import type {LiquidSource} from './cozy-liquid.ts';

/** Reduced free boundary coupled to bulk horizontal flow. Height is relative to
 * the authoritative cup ledger; every internal face exchanges equal volume.
 * This is a hydrostatic approximation, not a resolved 3D moving-boundary solve. */
export class MovingSurface {
 readonly height:Float64Array;readonly u:Float64Array;readonly v:Float64Array;
 readonly mask:Uint8Array;readonly bulk:Float32Array;
 private fx:Float64Array;private fy:Float64Array;private head:Float64Array;
 private cells:number[]=[];private weights:Float64Array;
 readonly size:number;private meanDepth=55e-6/(Math.PI*CUP_RADIUS_M**2);
 constructor(size=32){this.size=size;const n=size*size;this.height=new Float64Array(n);this.u=new Float64Array(n);this.v=new Float64Array(n);this.bulk=new Float32Array(n*4);this.mask=new Uint8Array(n);this.fx=new Float64Array(n);this.fy=new Float64Array(n);this.head=new Float64Array(n);this.weights=new Float64Array(n);for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(Math.hypot((x+.5)/size-.5,(y+.5)/size-.5)<.485){const i=y*size+x;this.mask[i]=1;this.cells.push(i);}}
 reset(){this.meanDepth=55e-6/(Math.PI*CUP_RADIUS_M**2);for(const a of [this.height,this.u,this.v,this.bulk,this.fx,this.fy,this.head])a.fill(0);}
 depthAt(x:number,y:number){const i=clamp(Math.floor(y*this.size),0,this.size-1)*this.size+clamp(Math.floor(x*this.size),0,this.size-1);return this.meanDepth+(this.mask[i]?this.height[i]:0);}
 step(sources:LiquidSource[],dt:number,fillMl:number,foam?:Float32Array,foamSize=0){
  if(!(dt>0)||!Number.isFinite(dt))return;
  const n=this.size,dx=UV_LENGTH_M/n,area=Math.PI*CUP_RADIUS_M**2/this.cells.length;
  this.meanDepth=fillMl*1e-6/(Math.PI*CUP_RADIUS_M**2);this.head.fill(0);
  for(const {x,y,jet} of sources){if(jet.volumeMl<=0||Math.hypot(x-.5,y-.5)>=.485)continue;
   const r=Math.max(dx*1.25,jet.impactRadiusM*1.8);let sum=0;
   for(const i of this.cells){const d2=(((i%n+.5)/n-x)*UV_LENGTH_M)**2+(((Math.floor(i/n)+.5)/n-y)*UV_LENGTH_M)**2;sum+=this.weights[i]=Math.exp(-d2/(2*r*r));}
   const rise=jet.volumeMl*1e-6/area/Math.max(sum,1e-12),mean=jet.volumeMl*1e-6/(Math.PI*CUP_RADIUS_M**2);
   // Impact head pushes the surface down locally; gravity creates its return.
   const impact=clamp(jet.actualFlowMlS/12*jet.impactDownMPS**2*.0012,0,.0012);
   for(const i of this.cells){this.height[i]+=rise*this.weights[i]-mean;this.head[i]+=impact*this.weights[i];}
  }
  const steps=Math.max(1,Math.ceil(dt*Math.sqrt(9.81*this.meanDepth)/dx/.22)),sub=dt/steps;
  for(let k=0;k<steps;k++){
   for(const i of this.cells){const x=i%n,y=Math.floor(i/n),right=x<n-1&&this.mask[i+1],up=y<n-1&&this.mask[i+n];
    const fi=foam&&foamSize?clamp(Math.floor((y+.5)/n*foamSize),0,foamSize-1)*foamSize+clamp(Math.floor((x+.5)/n*foamSize),0,foamSize-1):0;
    const white=foam?foam[fi]:0,damping=8+white*16;
    const bx=clamp(this.bulk[i*4],-.06,.06),by=clamp(this.bulk[i*4+1],-.06,.06);
    this.fx[i]=right?clamp((this.fx[i]-9.81*(this.height[i+1]+this.head[i+1]-this.height[i]-this.head[i])/dx*sub+bx*2*sub)*Math.exp(-damping*sub),-.045,.045):0;
    this.fy[i]=up?clamp((this.fy[i]-9.81*(this.height[i+n]+this.head[i+n]-this.height[i]-this.head[i])/dx*sub+by*2*sub)*Math.exp(-damping*sub),-.045,.045):0;
   }
   for(const i of this.cells){const x=i%n,y=Math.floor(i/n);this.height[i]-=this.meanDepth*sub/dx*(this.fx[i]-(x?this.fx[i-1]:0)+this.fy[i]-(y?this.fy[i-n]:0));}
  }
  // At the capacity limit there is no headroom for a raised local column.
  // Scale the zero-mean disturbance, preserving the authoritative inventory.
  let positive=0,negative=0;for(const i of this.cells){positive=Math.max(positive,this.height[i]);negative=Math.max(negative,-this.height[i]);}
  const bound=Math.min(1,Math.max(0,.024-this.meanDepth)/Math.max(positive,1e-12),this.meanDepth*.5/Math.max(negative,1e-12));
  if(bound<1)for(const i of this.cells)this.height[i]*=bound;
  for(const i of this.cells){const x=i%n,y=Math.floor(i/n);this.u[i]=(this.fx[i]+(x?this.fx[i-1]:0))*.5;this.v[i]=(this.fy[i]+(y?this.fy[i-n]:0))*.5;}
 }
 metrics(){let mean=0,peak=0,speed=0;for(const i of this.cells){mean+=this.height[i];peak=Math.max(peak,Math.abs(this.height[i]));speed=Math.max(speed,Math.hypot(this.u[i],this.v[i]));}return {surfaceModel:'coupled-hydrostatic-1',surfacePeakMm:peak*1000,surfaceMeanErrorMm:mean/this.cells.length*1000,surfaceSpeedMmS:speed*1000};}
}
