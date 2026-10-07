import * as T from 'three';
import type { Preset } from './model';
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
// RG is encoded velocity; B is foam concentration. Bounded semi-Lagrangian transport.
const fragment = `varying vec2 vUv;
uniform sampler2D field; uniform vec2 start,end; uniform float flow,dt,radius,spread,drift,opacity,high,texel;
float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/max(dot(d,d),.000001),0.,1.));}
void main(){
 vec2 q=vUv-.5; if(length(q)>.485){gl_FragColor=vec4(.5,.5,0.,1.);return;}
 vec4 old=texture2D(field,vUv); vec2 vel=(old.rg-.5)*.12;
 vec2 source=vUv-vel*dt; if(length(source-.5)>.48)source=vUv;
 float milk=texture2D(field,source).b;
 float neighbors=(texture2D(field,source+vec2(texel,0.)).b+texture2D(field,source-vec2(texel,0.)).b+texture2D(field,source+vec2(0.,texel)).b+texture2D(field,source-vec2(0.,texel)).b)*.25;
 milk=mix(milk,neighbors,spread*dt*18.);
 float r=radius*(.65+flow*.65)*(1.-high*.35);
 float deposit=exp(-pow(segment(vUv,start,end)/max(r,.001),2.)*2.);
 milk=clamp(milk+deposit*flow*dt*opacity*5.*(1.-high*.72),0.,1.);
 vec2 push=normalize(vUv-end+vec2(.00001))*exp(-pow(length(vUv-end)/max(r*3.,.001),2.))*flow*drift*.018;
 vel=vel*exp(-dt*3.)+push*dt*8.;
 if(length(q)>.465)vel-=normalize(q)*max(0.,dot(vel,normalize(q)));
 gl_FragColor=vec4(clamp(vel/.12+.5,0.,1.),milk,1.);
}`;
export class Fluid {
  private targets: T.WebGLRenderTarget[];
  private scene = new T.Scene();
  private camera = new T.Camera();
  private material: T.ShaderMaterial;
  private index = 0;
  constructor(private renderer: T.WebGLRenderer, public size = 256) {
    this.targets = [0,1].map(() => new T.WebGLRenderTarget(size,size,{depthBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter}));
    this.material = new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{field:{value:null},start:{value:new T.Vector2(.5,.5)},end:{value:new T.Vector2(.5,.5)},flow:{value:0},dt:{value:1/60},radius:{value:.03},spread:{value:0},drift:{value:0},opacity:{value:1},high:{value:0},texel:{value:1/size}}});
    this.scene.add(new T.Mesh(new T.PlaneGeometry(2,2),this.material)); this.reset();
  }
  get texture() { return this.targets[this.index].texture; }
  reset() {
    const color = this.renderer.getClearColor(new T.Color()); const alpha=this.renderer.getClearAlpha();
    this.renderer.setClearColor(new T.Color(.5,.5,0),1);
    for(const target of this.targets){this.renderer.setRenderTarget(target);this.renderer.clear();}
    this.renderer.setRenderTarget(null);this.renderer.setClearColor(color,alpha);
  }
  step(a:T.Vector2,b:T.Vector2,flow:number,dt:number,p:Preset,high:boolean) {
    const u=this.material.uniforms; u.field.value=this.texture;u.start.value.copy(a);u.end.value.copy(b);u.flow.value=flow;u.dt.value=dt;
    for(const key of ['radius','spread','drift','opacity'] as const)u[key].value=p[key];u.high.value=high?1:0;
    const next=1-this.index;this.renderer.setRenderTarget(this.targets[next]);this.renderer.render(this.scene,this.camera);this.renderer.setRenderTarget(null);this.index=next;
  }
  dispose(){this.targets.forEach(t=>t.dispose());this.material.dispose();(this.scene.children[0] as T.Mesh).geometry.dispose();}
}
