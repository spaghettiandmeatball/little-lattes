import * as T from 'three';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import type {PhotoSnapshot} from './photo-scene';
import {photoCamera} from './photo-scene';

export const canvasBlob=(canvas:HTMLCanvasElement)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Image encoding failed.')),'image/png'));
export async function capturePhoto(renderer:T.WebGLRenderer,snapshot:PhotoSnapshot,angle:number,portrait:boolean,framing:number,customCamera?:T.PerspectiveCamera){
 if(renderer.getContext().isContextLost())throw Error('The graphics connection was lost. Return to the cup and retry.');
 const width=1080,height=portrait?1350:1080;
 const linear=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,samples:4});
 const output=new T.WebGLRenderTarget(width,height,{depthBuffer:false});
 const pass=new OutputPass(),previous=renderer.getRenderTarget();
 const pixels=new Uint8Array(width*height*4);
 try{
  const camera=customCamera?.clone()??photoCamera(angle,width/height,framing);
  if(customCamera){camera.aspect=width/height;camera.zoom=1/framing;camera.updateProjectionMatrix();}
  renderer.shadowMap.needsUpdate=true;renderer.setRenderTarget(linear);renderer.render(snapshot.scene,camera);
  // r180 renders linear HDR to offscreen targets. Apply ACES and sRGB once here.
  pass.render(renderer,output,linear,0,false);renderer.setRenderTarget(previous);
  await renderer.readRenderTargetPixelsAsync(output,0,0,width,height,pixels);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d')!,image=context.createImageData(width,height),stride=width*4;
  for(let y=0;y<height;y++)image.data.set(pixels.subarray((height-1-y)*stride,(height-y)*stride),y*stride);
  context.putImageData(image,0,0);
  const thumbnail=document.createElement('canvas');thumbnail.width=thumbnail.height=300;
  thumbnail.getContext('2d')!.drawImage(canvas,0,(height-width)/2,width,width,0,0,300,300);
  return {image:await canvasBlob(canvas),thumbnail:await canvasBlob(thumbnail),width,height};
 }finally{renderer.shadowMap.needsUpdate=true;renderer.setRenderTarget(previous);pass.dispose();linear.dispose();output.dispose();}
}
