import * as T from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {createLiquidMaterial,type LiquidMaterial} from './liquid-material';
import type {RoomConfig} from './room-config';

export type PhotoSnapshot={id:string;scene:T.Scene;room:RoomConfig;capturedAt:number;dispose:()=>void};
/** Copy textures at one synchronous simulation boundary. No live ping-pong references survive. */
export function createPhotoSnapshot(renderer:T.WebGLRenderer,source:T.Scene,room:RoomConfig):PhotoSnapshot{
 const scene=source.clone(true),targets:T.WebGLRenderTarget[]=[],materials=new Set<T.Material>();
 const cloneTexture=(texture:T.Texture|null)=>{
  if(!texture)return null;
  const image=texture.image as {width:number;height:number};
  const target=new T.WebGLRenderTarget(image.width,image.height,{type:T.HalfFloatType,depthBuffer:false});
  const material=new T.ShaderMaterial({uniforms:{source:{value:texture}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'varying vec2 v;uniform sampler2D source;void main(){gl_FragColor=texture2D(source,v);}',toneMapped:false});
  const quad=new FullScreenQuad(material),previous=renderer.getRenderTarget();
  try{renderer.setRenderTarget(target);quad.render(renderer);}finally{renderer.setRenderTarget(previous);quad.dispose();material.dispose();}
  targets.push(target);return target.texture;
 };
 try{
  scene.traverse(o=>{
   if(o.userData.photoHidden)o.visible=false;
   if(o instanceof T.Mesh){
    if(o.name==='latte-liquid'){
     const original=o.material as LiquidMaterial,copy=createLiquidMaterial();
     for(const [key,uniform] of Object.entries(original.uniforms))copy.uniforms[key].value=key==='field'||key==='heightField'?cloneTexture(uniform.value):uniform.value;
     copy.uniforms.debug.value=0;o.material=copy;materials.add(copy);
    }else{
     const clone=(m:T.Material)=>{const copy=m.clone();materials.add(copy);return copy;};
     o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);
    }
   }
  });
 }catch(error){targets.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());throw error;}
 return {id:crypto.randomUUID(),scene,room:structuredClone(room),capturedAt:Date.now(),dispose(){targets.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());scene.traverse(o=>{if(o instanceof T.Light&&'shadow' in o)(o as T.DirectionalLight).shadow?.dispose();});scene.clear();}};
}

export const angleNames=['Art study','Cup portrait','Coffee corner'] as const;
export function photoCamera(angle:number,aspect:number,framing=1){
 const camera=new T.PerspectiveCamera(33,aspect,.1,45);camera.up.set(0,0,1);
 const positions=[[.15,-1.7,7.4],[2.1,-4.1,6.3],[-2.6,-5.1,6.3]];
 const p=positions[angle%positions.length];camera.position.set(p[0],p[1],p[2]).multiplyScalar(framing);
 camera.lookAt(0,0,-.15);camera.updateProjectionMatrix();return camera;
}
