import type {createScene} from './scene';
import type {PlacedDecoration} from './room-config';

export function mountWorldControls(view:ReturnType<typeof createScene>,enter:()=>void,leave:()=>void,capture:()=>void,onPlaced:(layout:PlacedDecoration[])=>void){
 const main=document.querySelector('main')!,canvas=view.renderer.domElement;
 let active=false,size=1,turn=0,pinch:{distance:number;size:number}|undefined;
 let decoration:{id:string;x:number;y:number;offsetX:number;offsetY:number}|undefined;
 let contact:{x:number;y:number}|undefined;
 const keys=new Set<string>(),touches=new Map<number,{x:number;y:number}>();
 const bar=document.createElement('nav');bar.className='world-actions';bar.hidden=true;bar.setAttribute('aria-label','Camera view');
 bar.innerHTML='<button id="worldCapture">Take photo</button>';
 const views=document.createElement('nav');views.className='view-switch';views.setAttribute('aria-label','Choose your view');
 views.innerHTML='<button id="cupView" aria-pressed="true">Cup</button><button id="cornerView" aria-pressed="false">Corner</button>';
 const selectView=()=>{views.querySelector('#cupView')!.setAttribute('aria-pressed',String(!active));views.querySelector('#cornerView')!.setAttribute('aria-pressed',String(active));};
 const hint=document.createElement('p');hint.className='world-gesture-hint';hint.hidden=true;
 hint.textContent='Tap objects · drag to look · hold station labels to swap gear';
 main.append(views,bar,hint);
 const update=()=>view.setMug(size,turn*Math.PI/180);
 function finishPlacement(){if(!decoration)return;decoration=undefined;try{onPlaced(view.placements());}catch{hint.textContent='Placement kept for this session; browser storage is unavailable.';}}
 function clearGesture(){finishPlacement();const ids=[...touches.keys()];touches.clear();pinch=undefined;for(const id of ids)if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
 function close(){if(!active)return;clearGesture();keys.clear();active=false;bar.hidden=hint.hidden=true;main.classList.remove('world-open');view.setExplore(false);selectView();leave();}
 function open(){if(active||document.querySelector('dialog[open]'))return;enter();active=true;main.classList.add('world-open');bar.hidden=hint.hidden=false;setTimeout(()=>{hint.hidden=true;},8000);view.setExplore(true);selectView();({size,turn}=view.mugPose());update();}
 views.querySelector<HTMLButtonElement>('#cupView')!.onclick=close;
 views.querySelector<HTMLButtonElement>('#cornerView')!.onclick=open;
 bar.querySelector<HTMLButtonElement>('#worldCapture')!.onclick=()=>{clearGesture();keys.clear();capture();};
 const distance=()=>{const [a,b]=[...touches.values()];return Math.hypot(a.x-b.x,a.y-b.y);};
 // Gestures that begin on the cup own their contacts until release.
 canvas.addEventListener('pointerdown',e=>{
  if(!active||e.button!==0||e.shiftKey)return;
  if(!touches.size){
   if(view.hitStation(e.clientX,e.clientY))return;
   ({size,turn}=view.mugPose());
   if(!view.hitMug(e.clientX,e.clientY)){const picked=view.pickDecoration(e.clientX,e.clientY),point=view.counterPoint(e.clientX,e.clientY);if(!picked||!point)return;decoration={...picked,offsetX:picked.x-point.x,offsetY:picked.y-point.y};}
  }else if(decoration){e.preventDefault();e.stopImmediatePropagation();return;}
  if(!touches.size)contact={x:e.clientX,y:e.clientY};e.preventDefault();e.stopImmediatePropagation();touches.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
  if(touches.size===2)pinch={distance:Math.max(1,distance()),size};
 },true);
 canvas.addEventListener('pointermove',e=>{
  const previous=touches.get(e.pointerId);if(!active||!previous)return;e.preventDefault();e.stopImmediatePropagation();
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(decoration){const point=view.counterPoint(e.clientX,e.clientY);if(point)view.moveDecoration(decoration.id,point.x+decoration.offsetX,point.y+decoration.offsetY);return;}
  if(touches.size>=2&&pinch)size=Math.max(.65,Math.min(1.4,pinch.size*distance()/pinch.distance));
  else turn=((turn+(e.clientX-previous.x)*.6+540)%360)-180;
  update();
 },true);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{
  const pointer=e as PointerEvent,id=pointer.pointerId;if(!touches.has(id))return;e.stopImmediatePropagation();const clicked=type==='pointerup'&&touches.size===1&&contact&&Math.hypot(pointer.clientX-contact.x,pointer.clientY-contact.y)<6;if(clicked)canvas.dispatchEvent(new CustomEvent('counter-interact',{detail:{kind:decoration?'decoration':'cup',id:decoration?.id}}));touches.delete(id);pinch=undefined;if(!touches.size){finishPlacement();contact=undefined;}
  if(touches.size>=2)pinch={distance:Math.max(1,distance()),size};
  if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
 },true);
 canvas.addEventListener('wheel',e=>{
  if(!active||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||!view.hitMug(e.clientX,e.clientY))return;
  e.preventDefault();e.stopImmediatePropagation();({size,turn}=view.mugPose());const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?300:1);
  size=Math.max(.65,Math.min(1.4,size*Math.exp(-Math.max(-120,Math.min(120,pixels))*.0015)));update();
 },{capture:true,passive:false});
 window.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]')||(e.target as HTMLElement).closest('input,select,textarea,[contenteditable]')||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.code==='Escape'){e.preventDefault();if(!e.repeat){if(active)close();else open();}return;}
  if(!active)return;
  if(e.code==='KeyP'&&!e.repeat){e.preventDefault();clearGesture();keys.clear();capture();return;}
  if(e.code==='Home'){e.preventDefault();clearGesture();size=1;turn=0;update();view.resetWorld();return;}
  if(['KeyW','KeyA','KeyS','KeyD','KeyR','KeyF'].includes(e.code)){e.preventDefault();keys.add(e.code);}if(e.key==='Shift')keys.add('Shift');
 });
 window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.key==='Shift')keys.delete('Shift');});
 window.addEventListener('blur',()=>{keys.clear();clearGesture();});
 let previous=performance.now();
 function frame(now:number){const dt=Math.min(.05,(now-previous)/1000);previous=now;if(active&&!document.hidden&&!document.querySelector('dialog[open]')&&keys.size){const step=dt*(keys.has('Shift')?.65:2.3);view.worldStep((Number(keys.has('KeyD'))-Number(keys.has('KeyA')))*step,(Number(keys.has('KeyW'))-Number(keys.has('KeyS')))*step,(Number(keys.has('KeyR'))-Number(keys.has('KeyF')))*step);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
 return {open,close,actions:bar,get active(){return active;}};
}
