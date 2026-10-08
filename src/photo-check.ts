import type {createScene} from './scene';
import {capturePhoto,canvasBlob} from './photo-capture';
import {roomPresets} from './room-config';
import {applyRoom} from './room-materials';
import {angleNames} from './photo-scene';

/** Explicit developer-only evidence run; never part of ordinary capture or saves. */
export function mountPhotoCheck(view:ReturnType<typeof createScene>,begin:()=>void,mutateLive:()=>void,end:()=>void){
 const button=document.createElement('button');button.textContent='Verify photo snapshots + contact sheet';document.querySelector('.settings')!.append(button);
 const output=document.createElement('section');output.className='photo-check-result';output.hidden=true;document.body.append(output);
 const urls:string[]=[];
 const hash=async(blob:Blob)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');
 button.onclick=async()=>{
  button.disabled=true;begin();const snapshot=view.snapshot();
  output.hidden=false;output.innerHTML='<p role="status">Checking immutable photo snapshots…</p>';
  try{
   const before=view.renderer.info.memory.textures;
   const baseline=await capturePhoto(view.renderer,snapshot,0,false,1);
   mutateLive();
   const afterReset=await capturePhoto(view.renderer,snapshot,0,false,1);
   const frozen=await hash(baseline.image)===await hash(afterReset.image);
   const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=1320;const context=sheet.getContext('2d')!;
   context.fillStyle='#f5efe3';context.fillRect(0,0,sheet.width,sheet.height);
   const times:number[]=[];let index=0;
   for(const [name,room] of Object.entries(roomPresets))for(let angle=0;angle<3;angle++){
    applyRoom(snapshot.scene,room);const start=performance.now();const result=await capturePhoto(view.renderer,snapshot,angle,false,1);times.push(performance.now()-start);
    const bitmap=await createImageBitmap(result.image),x=index%3*400,y=Math.floor(index/3)*440;
    context.drawImage(bitmap,x+10,y+10,380,380);bitmap.close();context.fillStyle='#354439';context.font='18px Georgia';context.fillText(name+' · '+angleNames[angle],x+14,y+420);index++;
   }
   applyRoom(snapshot.scene,snapshot.room);
   const restored=await capturePhoto(view.renderer,snapshot,0,false,1),unchanged=await hash(baseline.image)===await hash(restored.image);
   const portrait=await capturePhoto(view.renderer,snapshot,1,true,1);
   const report={immutableAfterFreshCup:frozen,identicalAfterNineVariants:unchanged,dimensions:[baseline.width,baseline.height],portrait:[portrait.width,portrait.height],captureMs:times,texturesBefore:before,texturesAfter:view.renderer.info.memory.textures};
   output.innerHTML='<h2>Photo verification</h2><pre></pre><button id="closePhotoCheck">Return to cup</button>';
   output.querySelector('pre')!.textContent=JSON.stringify(report,null,2);
   for(const [blob,name] of [[await canvasBlob(sheet),'photo-contact-sheet.png'],[baseline.image,'photo-window-study.png'],[portrait.image,'photo-portrait.png'],[new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),'photo-verification.json']] as const){const url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=name;a.textContent='Download '+name;output.append(a);}
   const image=document.createElement('img');image.src=urls[0];image.alt='Nine photographs from one immutable latte snapshot';output.append(image);
  }catch(error){output.textContent='Photo verification failed: '+String(error);}
  finally{snapshot.dispose();button.disabled=false;end();}
  output.querySelector('#closePhotoCheck')?.addEventListener('click',()=>{output.hidden=true;urls.forEach(url=>URL.revokeObjectURL(url));urls.length=0;});
 };
}
