import * as T from 'three';
import {UV_LENGTH_M,solveJet,type JetState} from './jet';
import {CupVolume,inCup,foamFraction} from './volume';
import type {SurfaceInput} from './surface';
import {LatteFilm} from './latte-film';
import {MovingSurface} from './moving-surface';
export const VOLUME_ART_VERSION='gpu-volume-film-2';
export const VOLUME_TAPER_VERSION='gpu-volume-film-4';

const N=32,Z=20,S=256,ITERATIONS=24;
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const common=`
varying vec2 vUv;
uniform sampler2D stateTex,pressureTex,divTex,foamTex,totalsTex,movingTex;
uniform float movingEnabled;
uniform float dt,depth,meanMilk,cellVolume,activeCells;
uniform vec4 source[8],impulse[8],foamSource[8];
uniform int sources;
const float N=32.,Z=20.,L=${UV_LENGTH_M};
vec3 cell(){return vec3(mod(floor(gl_FragCoord.x),N),floor(gl_FragCoord.y),floor(gl_FragCoord.x/N));}
bool inside(vec3 c){return c.z>=0.&&c.z<Z&&length((c.xy+.5)/N-.5)<.485;}
vec2 atlas(vec3 c){c=clamp(c,vec3(0),vec3(N-1.,N-1.,Z-1.));return vec2(c.x+N*c.z+.5,c.y+.5)/vec2(N*Z,N);}
vec4 at(sampler2D tex,vec3 c){return texture2D(tex,atlas(c));}
vec4 sample3(sampler2D tex,vec3 c){
 c=clamp(c,vec3(0),vec3(N-1.,N-1.,Z-1.));vec3 a=floor(c),f=fract(c);
 return mix(mix(mix(at(tex,a),at(tex,a+vec3(1,0,0)),f.x),mix(at(tex,a+vec3(0,1,0)),at(tex,a+vec3(1,1,0)),f.x),f.y),
 mix(mix(at(tex,a+vec3(0,0,1)),at(tex,a+vec3(1,0,1)),f.x),mix(at(tex,a+vec3(0,1,1)),at(tex,a+vec3(1,1,1)),f.x),f.y),f.z);
}
vec3 h(){return vec3(L/N,L/N,depth/Z);}
vec3 wall(vec3 c,vec3 v){
 if(!inside(c+vec3(1,0,0)))v.x=0.;if(!inside(c+vec3(0,1,0)))v.y=0.;if(!inside(c+vec3(0,0,1)))v.z=0.;return v;
}
vec3 vel(vec3 c){return inside(c)?at(stateTex,c).xyz:vec3(0);}
float p(vec3 c,vec3 origin){return at(pressureTex,inside(c)?c:origin).x;}
float gaussian(vec3 c,vec4 s){vec3 pos=vec3(((c.xy+.5)/N-.5)*L,(c.z+.5)/Z*depth);return exp(-dot(pos-s.xyz,pos-s.xyz)/(2.*s.w*s.w));}
`;
const advect=`void main(){vec3 c=cell();if(!inside(c)){gl_FragColor=vec4(0);return;}
 vec4 old=at(stateTex,c);vec3 hc=h();vec3 back=c-old.xyz*dt/hc;
 vec2 radial=(back.xy+.5)/N-.5;float r=length(radial);if(r>.482)back.xy=(radial*.482/r+.5)*N-.5;
 vec4 a=sample3(stateTex,back);vec3 lap=vec3(0);
 lap+=(vel(c+vec3(1,0,0))+vel(c-vec3(1,0,0))-2.*old.xyz)/(hc.x*hc.x);
 lap+=(vel(c+vec3(0,1,0))+vel(c-vec3(0,1,0))-2.*old.xyz)/(hc.y*hc.y);
 lap+=(vel(c+vec3(0,0,1))+vel(c-vec3(0,0,1))-2.*old.xyz)/(hc.z*hc.z);
 a.xyz+=lap*min(.0000015, .12*hc.z*hc.z/max(dt,.000001))*dt;
 a.xyz*=exp(-dt*.35);
 if(movingEnabled>.5){vec2 uv=(c.xy+.5)/N;float e=1./32.;vec2 slope=vec2(texture2D(movingTex,uv+vec2(e,0)).r-texture2D(movingTex,uv-vec2(e,0)).r,texture2D(movingTex,uv+vec2(0,e)).r-texture2D(movingTex,uv-vec2(0,e)).r)/(2.*e*L);a.xy-=9.81*slope*dt*smoothstep(.55,1.,c.z/Z);}

 for(int i=0;i<8;i++){if(i>=sources)break;float w=gaussian(c,source[i]);a.xyz+=impulse[i].xyz*w; a.w+=impulse[i].w*w*(1.-a.w);}
 // Buoyancy of the fixed wet-foam recipe. Hydrostatic gravity is pressure-balanced.
 a.z+=a.w*.18*dt;
 float speed=length(a.xyz);if(speed>.65)a.xyz*=.65/speed;
 gl_FragColor=vec4(wall(c,a.xyz),clamp(a.w,0.,1.));}`;
const divergence=`void main(){vec3 c=cell();if(!inside(c)){gl_FragColor=vec4(0);return;}
 vec3 v=vel(c),hc=h();float d=(v.x-vel(c-vec3(1,0,0)).x)/hc.x+(v.y-vel(c-vec3(0,1,0)).y)/hc.y+(v.z-vel(c-vec3(0,0,1)).z)/hc.z;
 gl_FragColor=vec4(d,0,0,1);}`;
const pressure=`void main(){vec3 c=cell();if(!inside(c)){gl_FragColor=vec4(0);return;}
 vec3 w=1./(h()*h());float sum=(p(c+vec3(1,0,0),c)+p(c-vec3(1,0,0),c))*w.x+(p(c+vec3(0,1,0),c)+p(c-vec3(0,1,0),c))*w.y+(p(c+vec3(0,0,1),c)+p(c-vec3(0,0,1),c))*w.z;
 gl_FragColor=vec4((sum-at(divTex,c).x)/(2.*(w.x+w.y+w.z)),0,0,1);}`;
const project=`void main(){vec3 c=cell();if(!inside(c)){gl_FragColor=vec4(0);return;}
 vec4 a=at(stateTex,c);float pc=p(c,c);vec3 grad=vec3(p(c+vec3(1,0,0),c)-pc,p(c+vec3(0,1,0),c)-pc,p(c+vec3(0,0,1),c)-pc)/h();
 gl_FragColor=vec4(wall(c,a.xyz-grad),a.w);}`;
const reduceFirst=`void main(){vec3 c=cell();float valid=inside(c)?1.:0.;float milk=at(stateTex,c).w*valid;gl_FragColor=vec4(milk,valid-milk,valid,0);}`;
const reduce=`uniform vec2 inputSize;void main(){vec2 base=floor(gl_FragCoord.xy)*2.;vec4 sum=vec4(0);for(int y=0;y<2;y++)for(int x=0;x<2;x++){vec2 px=base+vec2(float(x),float(y));if(px.x<inputSize.x&&px.y<inputSize.y)sum+=texture2D(stateTex,(px+.5)/inputSize);}gl_FragColor=sum;}`;
const correct=`void main(){vec3 c=cell();if(!inside(c)){gl_FragColor=vec4(0);return;}vec4 a=at(stateTex,c),s=texture2D(totalsTex,vec2(.5));float target=meanMilk*s.z;
 a.w=target>=s.x?a.w+(1.-a.w)*(target-s.x)/max(s.y,.00001):a.w*target/max(s.x,.00001);gl_FragColor=a;}`;
const surface=`
vec4 foam(vec2 uv){return texture2D(foamTex,clamp(uv,vec2(.002),vec2(.998)));}
float minmod(float a,float b){return a*b<=0.?0.:sign(a)*min(abs(a),abs(b));}
float amount(vec2 uv,vec2 origin,int channel){vec4 f=foam(length(uv-.5)<.485?uv:origin);return channel==0?f.x:f.w;}
float faceFlux(vec2 a,vec2 b,int axis,int channel){
 if(length(a-.5)>=.485||length(b-.5)>=.485)return 0.;
 vec2 middle=(a+b)*.5;vec2 v=sample3(stateTex,vec3(middle*N-.5,Z-1.)).xy;
 if(movingEnabled>.5)v+=texture2D(movingTex,middle).gb*.35;
 v/=1.+min(foam(middle).x/.0003,3.)*.18;
 v*=min(1.,.045/max(abs(v.x)+abs(v.y),.000001));
 float speed=axis==0?v.x:v.y;vec2 d=b-a;
 float fa=amount(a,a,channel),fb=amount(b,b,channel);
 float sa=minmod(fa-amount(a-d,a,channel),fb-fa),sb=minmod(fb-fa,amount(b+d,b,channel)-fb);
 return speed*(speed>=0.?fa+.5*sa:fb-.5*sb);
}
void main(){vec2 uv=vUv;if(length(uv-.5)>.485){gl_FragColor=vec4(0);return;}
 vec3 c=vec3(uv*N-.5,Z-1.);vec4 bulk=sample3(stateTex,c);vec4 old=foam(uv);
 vec2 dx=vec2(1./256.,0),dy=dx.yx;
 float thickness=max(0.,old.x-dt/(L/256.)*(faceFlux(uv,uv+dx,0,0)-faceFlux(uv-dx,uv,0,0)+faceFlux(uv,uv+dy,1,0)-faceFlux(uv-dy,uv,1,0)));
 float crema=max(0.,old.w-dt/(L/256.)*(faceFlux(uv,uv+dx,0,1)-faceFlux(uv-dx,uv,0,1)+faceFlux(uv,uv+dy,1,1)-faceFlux(uv-dy,uv,1,1)));
 // Entrainment is caused by solved downward liquid motion. Drainage is reported.
 vec4 below=sample3(stateTex,c-vec3(0,0,1));float loss=1.-exp(-dt*(.006+max(0.,-below.z)*28.));
 float removed=thickness*loss;thickness-=removed;crema*=1.-loss;
 for(int i=0;i<8;i++){if(i>=sources)break;vec2 delta=(uv-.5)*L-source[i].xy;thickness+=foamSource[i].x/8.*exp(-dot(delta,delta)/(2.*foamSource[i].y*foamSource[i].y));}
 gl_FragColor=vec4(max(0.,thickness),bulk.w,old.z+removed,crema);}`;
const initFoam=`void main(){gl_FragColor=vec4(0,0,0,length(vUv-.5)<.485?1.:0.);}`;
const display=`uniform float debug,artFilm;uniform sampler2D filmTex;void main(){vec4 f=texture2D(foamTex,vUv);vec4 b=sample3(stateTex,vec3(vUv*N-.5,Z-1.));float white=artFilm>.5?texture2D(filmTex,vUv).r:1.-exp(-f.x/.00024);gl_FragColor=debug>.5?vec4(.5+b.x*6.,.5+b.y*6.,.5+b.z*6.,1):vec4(f.y,clamp(f.w,0.,2.)*.5,white,1);}`;

const topFlow=`void main(){gl_FragColor=sample3(stateTex,vec3(vUv*N-.5,Z-2.));}`;
export class Liquid3D {
 readonly moving=new MovingSurface();movingEnabled=true;
 private heightData=new Float32Array(32*32*4);
 readonly heightTexture=new T.DataTexture(this.heightData,32,32,T.RGBAFormat,T.FloatType);
 private flowTarget:T.WebGLRenderTarget;private flowReadbackMs=0;
 deterministicSampling=false;private flowPending:Promise<void>|undefined;
 private generation=0;private disposed=false;
 async waitForSurfaceSample(){await this.flowPending;}

 readonly cup=new CupVolume(); readonly size=S;
 readonly film=new LatteFilm();useFilm=true;
 private filmData=new Float32Array(this.film.size*this.film.size*4);
 private filmTexture=new T.DataTexture(this.filmData,this.film.size,this.film.size,T.RGBAFormat,T.FloatType);
 get fillMl(){return this.cup.fillMl;}
 depthAt(x:number,y:number){return this.movingEnabled?this.moving.depthAt(x,y):this.cup.depthM;}
 private scene=new T.Scene();private camera=new T.Camera();private quad=new T.Mesh(new T.PlaneGeometry(2,2));
 private state:[T.WebGLRenderTarget,T.WebGLRenderTarget];private pressure:[T.WebGLRenderTarget,T.WebGLRenderTarget];
 private foam:[T.WebGLRenderTarget,T.WebGLRenderTarget];private div:T.WebGLRenderTarget;private output:T.WebGLRenderTarget;
 private reduction:T.WebGLRenderTarget[]=[];private materials:Record<string,T.ShaderMaterial>={};
 private uniforms:Record<string,T.IUniform>;private targets:T.WebGLRenderTarget[]=[];
 private timerExt:any;private queries:WebGLQuery[]=[];gpuMs:number|null=null;private cpuMs=0;steps=0;
 foamInjectedMl=0;private snapshotData:Record<string,number>={};
 constructor(private renderer:T.WebGLRenderer){
  const gl=renderer.getContext() as WebGL2RenderingContext;
  if(!gl.getExtension('EXT_color_buffer_float'))throw Error('3D liquid requires WebGL2 floating-point render targets.');
  this.filmTexture.minFilter=this.filmTexture.magFilter=gl.getExtension('OES_texture_float_linear')?T.LinearFilter:T.NearestFilter;
  this.filmTexture.needsUpdate=true;
  this.timerExt=gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const target=(w:number,h:number)=>{const t=new T.WebGLRenderTarget(w,h,{type:T.FloatType,format:T.RGBAFormat,minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false,stencilBuffer:false});this.targets.push(t);return t;};
  this.state=[target(N*Z,N),target(N*Z,N)];this.pressure=[target(N*Z,N),target(N*Z,N)];this.foam=[target(S,S),target(S,S)];
  this.flowTarget=target(N,N);
  this.heightTexture.minFilter=this.heightTexture.magFilter=gl.getExtension('OES_texture_float_linear')?T.LinearFilter:T.NearestFilter;
  this.div=target(N*Z,N);this.output=target(S,S);
  if(gl.getExtension('OES_texture_float_linear'))this.output.texture.minFilter=this.output.texture.magFilter=T.LinearFilter;
  for(let w=N*Z,h=N;;w=Math.ceil(w/2),h=Math.ceil(h/2)){this.reduction.push(target(w,h));if(w===1&&h===1)break;}
  this.uniforms={stateTex:{value:null},pressureTex:{value:null},divTex:{value:this.div.texture},foamTex:{value:null},totalsTex:{value:null},dt:{value:1/60},depth:{value:this.cup.depthM},meanMilk:{value:0},cellVolume:{value:0},activeCells:{value:0},sources:{value:0},source:{value:Array.from({length:8},()=>new T.Vector4())},impulse:{value:Array.from({length:8},()=>new T.Vector4())},foamSource:{value:Array.from({length:8},()=>new T.Vector4())},inputSize:{value:new T.Vector2()},debug:{value:0}};
  this.uniforms.movingTex={value:this.heightTexture};this.uniforms.movingEnabled={value:1};
  for(const [key,code] of Object.entries({advect,divergence,pressure,project,reduceFirst,reduce,correct,surface,display,initFoam,topFlow}))this.materials[key]=new T.ShaderMaterial({uniforms:this.uniforms,vertexShader:vertex,fragmentShader:common+code,depthTest:false,depthWrite:false});
  this.uniforms.artFilm={value:1};this.uniforms.filmTex={value:this.filmTexture};
  this.scene.add(this.quad);
  try{
   this.reset();renderer.setRenderTarget(this.output);
   if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Float framebuffer is incomplete.');
   renderer.setRenderTarget(null);this.sync();const probe=new Float32Array(4);renderer.readRenderTargetPixels(this.output,0,0,1,1,probe);
   if(gl.getError()!==gl.NO_ERROR||!Number.isFinite(probe[0])||probe[3]!==1)throw Error('Float shader/readback probe failed.');
  }catch(error){this.dispose();renderer.setRenderTarget(null);throw error;}
 }
 get texture(){return this.output.texture;}
 private pass(key:string,out:T.WebGLRenderTarget){this.quad.material=this.materials[key];this.renderer.setRenderTarget(out);this.renderer.render(this.scene,this.camera);}
 private swap(pair:[T.WebGLRenderTarget,T.WebGLRenderTarget]){[pair[0],pair[1]]=[pair[1],pair[0]];}
 reset(){
  this.generation++;this.moving.reset();this.heightData.fill(0);this.heightTexture.needsUpdate=true;this.flowReadbackMs=0;
  this.cup.reset();this.steps=0;this.foamInjectedMl=0;this.snapshotData={};
  this.film.reset();this.filmData.fill(0);this.filmTexture.needsUpdate=true;
  const color=this.renderer.getClearColor(new T.Color()),alpha=this.renderer.getClearAlpha();
  this.renderer.setClearColor(0,0);for(const t of this.targets){this.renderer.setRenderTarget(t);this.renderer.clear();}for(const t of this.foam)this.pass('initFoam',t);this.renderer.setRenderTarget(null);this.renderer.setClearColor(color,alpha);
 }
 private configureSources(parts:SurfaceInput[]){
  let count=0;
  const deposits:{x:number;y:number;accepted:number;jet:JetState}[]=[];
  for(const part of parts){
   const jet=part.jet??solveJet(part.slice.b,part.quantity,part.slice.dt);
   const x=(part.slice.a.x+part.slice.b.x)*.5,y=(part.slice.a.y+part.slice.b.y)*.5;
   const accepted=this.cup.add(jet.volumeMl,inCup(x,y),Math.hypot(jet.incoming.x,jet.incoming.y,jet.incoming.z));
   if(accepted<=0)continue;
   deposits.push({x,y,accepted,jet});
  }
  // The existing GPU inventory accepts each packet first. The fine surface
  // attribute receives precisely that accepted amount, before bulk coalescing.
  const sources=deposits.map(p=>({x:p.x,y:p.y,jet:{...p.jet,volumeMl:p.accepted}})),dt=parts.reduce((sum,p)=>sum+p.slice.dt,0);
  if(this.movingEnabled){this.moving.step(sources,dt,this.cup.fillMl,this.useFilm?this.film.white:undefined,this.film.size);this.syncHeight();}
  if(this.useFilm)this.film.step(sources,dt,this.movingEnabled?this.moving:undefined);
  // High-rate coalesced packets can create more than eight quadrature sources.
  // Merge nearest wet samples by volume, never make a segment across a dry gap.
  while(deposits.length>8){
   let ai=0,bi=1,best=Infinity;
   for(let i=0;i<deposits.length;i++)for(let j=i+1;j<deposits.length;j++){const a=deposits[i],b=deposits[j],d=Math.hypot(a.x-b.x,a.y-b.y)+(a.jet.stroke===b.jet.stroke?0:10);if(d<best){best=d;ai=i;bi=j;}}
   const a=deposits[ai],b=deposits[bi],total=a.accepted+b.accepted,t=b.accepted/total;
   a.x+=(b.x-a.x)*t;a.y+=(b.y-a.y)*t;a.accepted=total;
   a.jet={...a.jet,clearanceM:a.jet.clearanceM+(b.jet.clearanceM-a.jet.clearanceM)*t,impactDownMPS:a.jet.impactDownMPS+(b.jet.impactDownMPS-a.jet.impactDownMPS)*t,incoming:{x:a.jet.incoming.x+(b.jet.incoming.x-a.jet.incoming.x)*t,y:a.jet.incoming.y+(b.jet.incoming.y-a.jet.incoming.y)*t,z:a.jet.incoming.z+(b.jet.incoming.z-a.jet.incoming.z)*t}};
   deposits.splice(bi,1);
  }
  for(const {x,y,accepted,jet} of deposits){
   const radius=.0035, sx=(x-.5)*UV_LENGTH_M,sy=(y-.5)*UV_LENGTH_M,sz=this.cup.depthM-.002;
   const depth=this.cup.depthM;let sum=0,surfaceSum=0,active=0;
   for(let iy=0;iy<N;iy++)for(let ix=0;ix<N;ix++)if(inCup((ix+.5)/N,(iy+.5)/N)){
    active+=Z;const d2=(((ix+.5)/N-.5)*UV_LENGTH_M-sx)**2+(((iy+.5)/N-.5)*UV_LENGTH_M-sy)**2;
    for(let iz=0;iz<Z;iz++)sum+=Math.exp(-(d2+((iz+.5)/Z*depth-sz)**2)/(2*radius**2));
   }
   const fraction=foamFraction(jet.clearanceM,jet.impactDownMPS),foamRadius=Math.max(.0018,jet.impactRadiusM*1.25);
   for(let iy=Math.max(0,Math.floor((y-foamRadius*4/UV_LENGTH_M)*S));iy<Math.min(S,Math.ceil((y+foamRadius*4/UV_LENGTH_M)*S));iy++)for(let ix=Math.max(0,Math.floor((x-foamRadius*4/UV_LENGTH_M)*S));ix<Math.min(S,Math.ceil((x+foamRadius*4/UV_LENGTH_M)*S));ix++)if(inCup((ix+.5)/S,(iy+.5)/S))surfaceSum+=Math.exp(-((((ix+.5)/S-x)*UV_LENGTH_M)**2+(((iy+.5)/S-y)*UV_LENGTH_M)**2)/(2*foamRadius**2));
   // Cylindrical active voxel volume represents the analytic liquid volume.
   const cellVolume=this.cup.fillMl*1e-6/active,ratio=accepted*1e-6/(cellVolume*sum);
   (this.uniforms.source.value as T.Vector4[])[count].set(sx,sy,sz,radius);
   (this.uniforms.impulse.value as T.Vector4[])[count].set(jet.incoming.x*ratio,jet.incoming.y*ratio,jet.incoming.z*ratio,ratio);
   (this.uniforms.foamSource.value as T.Vector4[])[count].set(accepted*1e-6*fraction/Math.max(surfaceSum,1)/(UV_LENGTH_M/S)**2,foamRadius,0,0);
   this.foamInjectedMl+=accepted*fraction;count++;
  }
  this.uniforms.sources.value=count;
 }
 stepBatch(parts:SurfaceInput[]){
  const dt=parts.reduce((s,p)=>s+p.slice.dt,0);if(dt<=0)return;
  const start=performance.now(),gl=this.renderer.getContext() as WebGL2RenderingContext,ext=this.timerExt;
  let query:WebGLQuery|null=null;
  if(ext&&this.queries.length<4){query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,query!);}
  const oldTarget=this.renderer.getRenderTarget();const shadows=this.renderer.shadowMap.autoUpdate;this.renderer.shadowMap.autoUpdate=false;
  try{
   this.uniforms.movingEnabled.value=this.movingEnabled?1:0;
   this.configureSources(parts);this.uniforms.dt.value=dt;this.uniforms.depth.value=this.cup.depthM;this.uniforms.meanMilk.value=this.cup.milkMl/this.cup.fillMl;
   this.uniforms.stateTex.value=this.state[0].texture;this.pass('advect',this.state[1]);this.swap(this.state);
   this.uniforms.stateTex.value=this.state[0].texture;this.pass('divergence',this.div);
   for(let i=0;i<ITERATIONS;i++){this.uniforms.pressureTex.value=this.pressure[0].texture;this.pass('pressure',this.pressure[1]);this.swap(this.pressure);}
   this.uniforms.pressureTex.value=this.pressure[0].texture;this.pass('project',this.state[1]);this.swap(this.state);
   this.uniforms.stateTex.value=this.state[0].texture;this.pass('reduceFirst',this.reduction[0]);
   for(let i=1;i<this.reduction.length;i++){const prev=this.reduction[i-1];this.uniforms.stateTex.value=prev.texture;this.uniforms.inputSize.value.set(prev.width,prev.height);this.pass('reduce',this.reduction[i]);}
   this.uniforms.totalsTex.value=this.reduction.at(-1)!.texture;this.uniforms.stateTex.value=this.state[0].texture;this.pass('correct',this.state[1]);this.swap(this.state);
   this.uniforms.stateTex.value=this.state[0].texture;
   // Play samples without stalling the GPU. Developer recordings use fixed
   // synchronous samples for reproducibility; latency is reported explicitly.
   if(this.movingEnabled&&this.steps%4===0&&!this.flowPending){
    const begin=performance.now();this.pass('topFlow',this.flowTarget);
    if(this.deterministicSampling){this.renderer.readRenderTargetPixels(this.flowTarget,0,0,N,N,this.moving.bulk);this.flowReadbackMs=performance.now()-begin;}
    else {const data=new Float32Array(N*N*4),epoch=this.generation;
     this.flowPending=this.renderer.readRenderTargetPixelsAsync(this.flowTarget,0,0,N,N,data).then(()=>{if(!this.disposed&&epoch===this.generation&&!this.deterministicSampling){this.moving.bulk.set(data);this.flowReadbackMs=performance.now()-begin;}}).catch(()=>{if(epoch===this.generation)this.moving.bulk.fill(0);}).finally(()=>{this.flowPending=undefined;});
    }
   }
   this.uniforms.dt.value=dt/8;
   for(let i=0;i<8;i++){this.uniforms.foamTex.value=this.foam[0].texture;this.pass('surface',this.foam[1]);this.swap(this.foam);}this.steps++;
  }finally{this.renderer.shadowMap.autoUpdate=shadows;this.renderer.setRenderTarget(oldTarget);if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);this.queries.push(query);}this.cpuMs=performance.now()-start;}
 }
 private syncHeight(){for(let i=0;i<this.moving.height.length;i++){this.heightData[i*4]=this.moving.height[i];this.heightData[i*4+1]=this.moving.u[i];this.heightData[i*4+2]=this.moving.v[i];this.heightData[i*4+3]=1;}this.heightTexture.needsUpdate=true;}
 sync(mode='milk'){
  if(this.useFilm){for(let i=0;i<this.film.white.length;i++)this.filmData[i*4]=this.film.white[i];this.filmTexture.needsUpdate=true;}
  this.uniforms.artFilm.value=this.useFilm?1:0;
  this.uniforms.stateTex.value=this.state[0].texture;this.uniforms.foamTex.value=this.foam[0].texture;this.uniforms.debug.value=mode==='velocity'?1:0;
  const target=this.renderer.getRenderTarget();this.pass('display',this.output);this.renderer.setRenderTarget(target);
  const gl=this.renderer.getContext() as WebGL2RenderingContext,ext=this.timerExt;
  if(ext&&gl.getParameter(ext.GPU_DISJOINT_EXT)){for(const q of this.queries)gl.deleteQuery(q);this.queries=[];this.gpuMs=null;}
  else if(ext)while(this.queries.length&&gl.getQueryParameter(this.queries[0],gl.QUERY_RESULT_AVAILABLE)){const q=this.queries.shift()!;this.gpuMs=gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6;gl.deleteQuery(q);}
 }
 inspect(canvas?:HTMLCanvasElement){
  // Development telemetry only: synchronous readback cost is measured separately.
  const begin=performance.now(),bulk=new Float32Array(N*N*Z*4),foam=new Float32Array(S*S*4);
  this.renderer.readRenderTargetPixels(this.state[0],0,0,N*Z,N,bulk);this.renderer.readRenderTargetPixels(this.foam[0],0,0,S,S,foam);
  let milk=0,active=0,peak=0,deepMilk=0,div2=0,foamVolume=0,sunk=0,invalid=0;
  const idx=(x:number,y:number,z:number)=>((y*N*Z)+(z*N)+x)*4;
  const velocity=(x:number,y:number,z:number,axis:number)=>x>=0&&y>=0&&z>=0&&x<N&&y<N&&z<Z&&inCup((x+.5)/N,(y+.5)/N)?bulk[idx(x,y,z)+axis]:0;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)for(let z=0;z<Z;z++)if(inCup((x+.5)/N,(y+.5)/N)){
   const i=idx(x,y,z);for(let c=0;c<4;c++)if(!Number.isFinite(bulk[i+c]))invalid++;
   active++;milk+=bulk[i+3];peak=Math.max(peak,Math.hypot(bulk[i],bulk[i+1],bulk[i+2]));if(z<Z/2)deepMilk+=bulk[i+3];
   const d=(bulk[i]-velocity(x-1,y,z,0))/(UV_LENGTH_M/N)+(bulk[i+1]-velocity(x,y-1,z,1))/(UV_LENGTH_M/N)+(bulk[i+2]-velocity(x,y,z-1,2))/(this.cup.depthM/Z);div2+=d*d;
  }
  for(let i=0;i<foam.length;i+=4){foamVolume+=foam[i];sunk+=foam[i+2];if(!Number.isFinite(foam[i]))invalid++;}
  foamVolume*=(UV_LENGTH_M/S)**2*1e6;sunk*=(UV_LENGTH_M/S)**2*1e6;
  const representedMilk=milk/active*this.cup.fillMl;
  this.snapshotData={representedMilkMl:representedMilk,milkErrorMl:representedMilk-this.cup.milkMl,deepMilkMl:deepMilk/active*this.cup.fillMl,peakSpeedMPS:peak,divergenceRMS:Math.sqrt(div2/active),surfaceFoamMl:foamVolume,foamEntrainedMl:sunk,foamTransportErrorMl:foamVolume+sunk-this.foamInjectedMl,nonFiniteValues:invalid};
  if(canvas){const ctx=canvas.getContext('2d')!,w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#172b22';ctx.fillRect(0,0,w,h);const top=h*(1-this.cup.depthM/.024),ch=(h-top)/Z;
   // Cross-section follows the landing Y; it is sampled state, not an illustration.
   const sliceY=Math.round((this.uniforms.source.value[0]?.y/UV_LENGTH_M+.5)*N-.5),sy=Math.max(1,Math.min(N-2,sliceY));
   for(let z=0;z<Z;z++)for(let x=0;x<N;x++){if(!inCup((x+.5)/N,(sy+.5)/N))continue;const i=idx(x,sy,z),m=bulk[i+3];ctx.fillStyle=`rgb(${Math.round(67+165*m)} ${Math.round(31+183*m)} ${Math.round(14+173*m)})`;ctx.fillRect(x*w/N,h-(z+1)*ch,w/N+1,ch+1);if(x%3===0&&z%3===0){ctx.strokeStyle='#f8d197';ctx.beginPath();const px=(x+.5)*w/N,py=h-(z+.5)*ch;ctx.moveTo(px,py);ctx.lineTo(px+bulk[i]*150,py-bulk[i+2]*150);ctx.stroke();}}
   ctx.strokeStyle='#ffe0aa';ctx.beginPath();ctx.moveTo(0,top);ctx.lineTo(w,top);ctx.stroke();
  }
  return {...this.metrics(),readbackMs:performance.now()-begin};
 }
 metrics(){return {...this.movingEnabled?this.moving.metrics():{},surfaceFlowReadbackMs:this.flowReadbackMs,surfaceSampling:this.deterministicSampling?'fixed-tick':'asynchronous',movingSurface:this.movingEnabled,mode:this.useFilm?(this.film.response==='legacy'?'gpu-volume-film-1':this.film.response==='taper'?(this.movingEnabled?VOLUME_TAPER_VERSION:'gpu-volume-film-3'):VOLUME_ART_VERSION):'gpu-volume',film:this.useFilm?this.film.metrics():undefined,bulkGrid:`${N}×${N}×${Z}`,surfaceGrid:`${S}²`,pressureIterations:ITERATIONS,simulationHz:60,steps:this.steps,fillMl:this.cup.fillMl,milkMl:this.cup.milkMl,emittedMl:this.cup.emittedMl,outsideMl:this.cup.outsideMl,capacityMl:Math.PI*.04**2*.024*1e6,depthMm:this.cup.depthM*1000,incomingImpulseNs:this.cup.impulseNs,foamInjectedMl:this.foamInjectedMl,cpuSubmitMs:this.cpuMs,gpuSimulationMs:this.gpuMs,...this.snapshotData};}
 capture(){this.inspect();const bulk=new Float32Array(N*N*Z*4),foam=new Float32Array(S*S*4);this.renderer.readRenderTargetPixels(this.state[0],0,0,N*Z,N,bulk);this.renderer.readRenderTargetPixels(this.foam[0],0,0,S,S,foam);return {bulk,foam};}
 dispose(){this.disposed=true;this.generation++;this.heightTexture.dispose();this.filmTexture.dispose();for(const t of this.targets)t.dispose();for(const m of Object.values(this.materials))m.dispose();this.quad.geometry.dispose();const gl=this.renderer.getContext() as WebGL2RenderingContext;for(const q of this.queries)gl.deleteQuery(q);}
}


