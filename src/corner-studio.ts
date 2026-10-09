import {mountWorldControls} from './world-controls';
import {mountWorldPieces} from './world-pieces';
import {decorationLabels} from './workshop-props';
import type {DecorationKind} from './room-config';
import type * as T from 'three';
import type {createScene} from './scene';
import {defaultRoom,loadRoom,saveRoom,roomCatalog,roomPresets,type RoomConfig} from './room-config';
import {applyRoom} from './room-materials';
import {angleNames,type PhotoSnapshot} from './photo-scene';
import {capturePhoto} from './photo-capture';
import {savePhoto,photoPage,getPhoto,photoCount,type PhotoRecord} from './photo-store';

type Session={sourceModel:string;tick:number;fillMl:number};
export function mountCornerStudio(view:ReturnType<typeof createScene>,suspend:()=>Session,resume:()=>void){
 let room=loadRoom(),draft={...room},snapshot:PhotoSnapshot|undefined,busy=false,angle=0,portrait=false,framing=1,setting='My corner',session:Session;
 let lastRecipe:{angle:number;portrait:boolean;framing:number;setting:string}|undefined;
 let rendered:Awaited<ReturnType<typeof capturePhoto>>|undefined,next:number|null=null,trash=false,activePhoto:PhotoRecord|undefined;
 let customCamera:T.PerspectiveCamera|undefined;
 let mode:'photo'|'gallery'|'decorate'|'equipment'='photo';
 const urls=new Set<string>();
 const objectURL=(blob:Blob)=>{const url=URL.createObjectURL(blob);urls.add(url);return url;};
 const releaseURLs=()=>{urls.forEach(url=>URL.revokeObjectURL(url));urls.clear();};
 view.applyRoom(room);
 const nav=document.createElement('nav');nav.className='corner-nav';nav.setAttribute('aria-label','Your coffee corner');nav.innerHTML='<button id="decorate">Decorate</button><button id="myPours">My pours</button>';document.querySelector('main')!.append(nav);
 const dialog=document.createElement('dialog');dialog.className='corner-studio';dialog.setAttribute('aria-label','Your coffee studio');document.body.append(dialog);
 const q=<E extends HTMLElement>(selector:string)=>dialog.querySelector<E>(selector)!;
 window.addEventListener('counter-model-status',event=>{if(dialog.open&&mode==='decorate')message((event as CustomEvent<string>).detail);});
 const message=(text:string)=>{q('[role=status]').textContent=text;};
 function shell(title:string,subtitle:string){
  releaseURLs();dialog.innerHTML=`<div class="studio-heading"><div><span class="eyebrow">LITTLE LATTE · YOUR CORNER</span><h2>${title}</h2><p>${subtitle}</p></div><button class="studio-close" aria-label="${world.active?'Return to Corner':'Return to Cup'}">✕</button></div><div class="studio-content"></div><p class="studio-message" role="status"></p>`;
  q('.studio-close').onclick=close;
 }
 function close(){if(busy){message('Finishing this shot…');return;}if(mode==='decorate'||mode==='equipment')view.applyRoom(room);snapshot?.dispose();snapshot=undefined;customCamera=undefined;rendered=undefined;releaseURLs();dialog.close();view.setDecorate(false);document.querySelector('main')!.classList.remove('studio-open');if(!world.active)resume();}
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 function open(nextMode:typeof mode){if(!world.active)session=suspend();mode=nextMode;document.querySelector('main')!.classList.add('studio-open');dialog.classList.toggle('decorate-studio',mode==='decorate'||mode==='equipment');dialog.showModal();}
 const download=(blob:Blob,name:string)=>{const url=objectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();};
 async function render(){
  if(busy||!snapshot)return;busy=true;
  const controls=Array.from(dialog.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('.photo-tools button,.photo-tools input,.photo-tools select'));
  controls.forEach(c=>c.disabled=true);message('Composing your cup…');
  try{const result=await capturePhoto(view.renderer,snapshot,angle,portrait,framing,customCamera);releaseURLs();rendered=result;lastRecipe={angle,portrait,framing,setting};q<HTMLImageElement>('.photo-preview').src=objectURL(result.image);message(`${result.width} × ${result.height} · your actual pour, frozen at capture`);}
  catch(error){if(lastRecipe){({angle,portrait,framing,setting}=lastRecipe);q<HTMLSelectElement>('#photoSetting').value=setting;q<HTMLSelectElement>('#photoCrop').value=portrait?'portrait':'square';q<HTMLInputElement>('#photoFrame').value=String(framing);q('#anotherAngle').textContent='Another angle · '+angleNames[angle];applyRoom(snapshot.scene,setting==='My corner'?snapshot.room:roomPresets[setting]);}message(`Could not render: ${error instanceof Error?error.message:String(error)}`);}
  finally{busy=false;controls.forEach(c=>c.disabled=false);q<HTMLButtonElement>('#saveShot').disabled=!rendered;q('#saveShot').textContent='Save shot';q<HTMLButtonElement>('#downloadShot').disabled=!rendered;}
 }
 function photo(fromWorld=false){
  customCamera=fromWorld?view.worldCamera():undefined;
  open('photo');shell('A little moment, made by you.','Compose a keepsake of this cup.');
  try{snapshot=view.snapshot();}catch{message('The graphics connection is unavailable. Return to your cup and try again.');return;}
  angle=0;portrait=false;framing=1;setting='My corner';lastRecipe=undefined;
  q('.studio-content').innerHTML=`<div class="photo-layout"><div class="photo-stage"><img class="photo-preview" alt="Photograph of your captured latte art"></div><div class="photo-tools"><span class="section-label">THE COMPOSITION</span><button id="anotherAngle">Another angle · Art study</button><label>Setting<select id="photoSetting"><option>My corner</option>${Object.keys(roomPresets).map(name=>`<option>${name}</option>`).join('')}</select></label><small>Special settings stage this photo only.</small><label>Crop<select id="photoCrop"><option value="square">Square · 1:1</option><option value="portrait">Portrait · 4:5</option></select></label><label>Framing<input id="photoFrame" type="range" min=".94" max="1.16" step=".02" value="1"></label><label>Title<input id="photoTitle" maxlength="80" placeholder="A quiet little pour"></label><button id="saveShot" class="primary">Save shot</button><button id="downloadShot">Download image</button><small>Saved on this browser. Download favorites to keep a backup.</small></div></div>`;
  q('#anotherAngle').onclick=()=>{angle=(angle+1)%3;q('#anotherAngle').textContent='Another angle · '+angleNames[angle];void render();};
  if(customCamera){q('#anotherAngle').hidden=true;q('.studio-heading p').textContent='Your camera and mug pose, captured exactly. Choose a crop and save your shot.';}
  q<HTMLSelectElement>('#photoSetting').onchange=e=>{setting=(e.target as HTMLSelectElement).value;applyRoom(snapshot!.scene,setting==='My corner'?snapshot!.room:roomPresets[setting]);void render();};
  q<HTMLSelectElement>('#photoCrop').onchange=e=>{portrait=(e.target as HTMLSelectElement).value==='portrait';void render();};
  q<HTMLInputElement>('#photoFrame').onchange=e=>{framing=Number((e.target as HTMLInputElement).value);void render();};
  q('#downloadShot').onclick=()=>{if(rendered)download(rendered.image,'little-latte.png');};
  q('#saveShot').onclick=async()=>{
   if(busy||!rendered||!snapshot)return;busy=true;const button=q<HTMLButtonElement>('#saveShot');button.disabled=true;
   const record:PhotoRecord={...rendered,id:crypto.randomUUID(),title:q<HTMLInputElement>('#photoTitle').value.trim()||'A quiet little pour',createdAt:Date.now(),favorite:false,deleted:false,snapshotId:snapshot.id,room:structuredClone(setting==='My corner'?snapshot.room:roomPresets[setting]),recipe:{version:1,angle,framing,setting,material:'liquid-pbr-r180-v1',...session,...customCamera?{camera:customCamera.toJSON()}: {}}};
   try{await savePhoto(record);message('Saved to My pours. This image will stay exactly as it is.');button.textContent='Saved ✓';}
   catch{message('Storage is unavailable or full. Your preview is safe—download it, or retry saving.');button.disabled=false;}
   finally{busy=false;}
  };
  void render();
 }
 async function gallery(){open('gallery');await galleryContent();}
 async function galleryContent(){
  activePhoto=undefined;shell('My pours','Small rituals. Cups worth keeping.');
  q('.studio-content').innerHTML='<div class="gallery-toolbar"><span id="cupCount"></span><button id="showTrash">'+(trash?'Back to collection':'Recently removed')+'</button></div><div class="pour-grid"></div><button id="morePhotos" hidden>More pours</button>';
  q('#showTrash').onclick=()=>{trash=!trash;void galleryContent();};next=null;
  try{q('#cupCount').textContent=`${await photoCount()} saved shots · private on this browser`;await page();}catch{message('Cannot open storage right now. Your cup is still here.');}
 }
 async function page(){
  const result=await photoPage(next??Infinity,30,trash);next=result.next;
  for(const photo of result.items){const button=document.createElement('button');button.className='pour-tile';button.setAttribute('aria-label',photo.title+(photo.favorite?' · favorite':''));const image=document.createElement('img');image.src=objectURL(photo.thumbnail);image.alt=photo.title;image.loading='lazy';button.append(image);const caption=document.createElement('span');caption.textContent=(photo.favorite?'♥ ':'')+photo.title;button.append(caption);button.onclick=()=>void detail(photo.id);q('.pour-grid').append(button);}
  const more=q<HTMLButtonElement>('#morePhotos');more.hidden=!next;more.onclick=async()=>{more.disabled=true;try{await page();}catch{message('Could not load more photos. Try again.');}finally{more.disabled=false;}};
  if(!q('.pour-grid').children.length)q('.pour-grid').innerHTML='<div class="gallery-empty"><span>☕</span><h3>'+ (trash?'Nothing removed.':'Your first keepsake awaits.')+'</h3><p>'+ (trash?'Removed shots stay here until you restore them.':'Make a pour, then choose Take photo.')+'</p></div>';
 }
 async function detail(id:string){
  try{activePhoto=await getPhoto(id);}catch{message('This photo could not be opened.');return;}
  const photo=activePhoto;shell('A cup to remember',new Date(photo.createdAt).toLocaleDateString(undefined,{dateStyle:'long'}));
  q('.studio-content').innerHTML='<div class="photo-layout"><div class="photo-stage"><img class="photo-preview" alt="Saved latte photograph"></div><div class="photo-tools"><label>Title<input id="savedTitle" maxlength="80"></label><button id="saveTitle">Save title</button><button id="favorite"></button><button id="downloadOriginal">Download original</button><button id="removePhoto"></button><button id="backToGrid">Back to My pours</button></div></div>';
  q<HTMLImageElement>('.photo-preview').src=objectURL(photo.image);q<HTMLInputElement>('#savedTitle').value=photo.title;
  q('#favorite').textContent=photo.favorite?'♥ Favorited':'♡ Favorite';q('#removePhoto').textContent=photo.deleted?'Restore photo':'Remove photo';
  async function update(changes:Partial<PhotoRecord>,success:string){if(busy)return;busy=true;try{await savePhoto({...photo,...changes});Object.assign(photo,changes);message(success);}catch{message('Could not save that change. Please retry.');}finally{busy=false;}}
  q('#saveTitle').onclick=()=>void update({title:q<HTMLInputElement>('#savedTitle').value.trim()||photo.title},'Title saved.');
  q('#favorite').onclick=async()=>{await update({favorite:!photo.favorite},'Updated.');q('#favorite').textContent=photo.favorite?'♥ Favorited':'♡ Favorite';};
  q('#downloadOriginal').onclick=()=>download(photo.image,'little-latte-'+photo.id+'.png');
  q('#removePhoto').onclick=async()=>{await update({deleted:!photo.deleted},photo.deleted?'Restored to My pours.':'Moved to Recently removed. You can restore it any time.');q('#removePhoto').textContent=photo.deleted?'Restore photo':'Remove photo';};
  q('#backToGrid').onclick=()=>{if(!busy)void galleryContent();};
 }
 function decorate(equipmentOnly=false){
  open(equipmentOnly?'equipment':'decorate');view.setDecorate(true);draft=structuredClone(room);shell(equipmentOnly?'Mug & jug':'Your corner',equipmentOnly?'Choose a mug size, your jug, and what you see while pouring.':'Add lights, plants and objects. Drag decorations around the counter after closing this panel.');
  const content=q('.studio-content');
  content.innerHTML='<nav class="workshop-tabs" aria-label="Decoration categories"></nav><div class="room-presets"></div><div class="room-categories"></div><div class="decoration-inventory"></div><div class="decorate-actions"><button class="primary" id="applyRoom">Apply</button><button id="cancelRoom">Cancel</button><button id="resetRoom">Reset room</button></div>';
  const refresh=()=>{view.applyRoom(draft);for(const button of Array.from(dialog.querySelectorAll<HTMLButtonElement>('[data-category]')))button.setAttribute('aria-pressed',String(draft[button.dataset.category as keyof RoomConfig]===button.dataset.choice));};
  for(const [name,config] of Object.entries(roomPresets)){const button=document.createElement('button');button.textContent=name;button.onclick=()=>{draft=structuredClone(config);refresh();};q('.room-presets').append(button);}
  for(const [category,choices] of Object.entries(roomCatalog)){
   if(equipmentOnly&&!['mugSize','jugShape','cup','pitcher'].includes(category))continue;
   const fieldset=document.createElement('fieldset');fieldset.dataset.group=['machine','kettle','mugSize','jugShape','cup','pitcher'].includes(category)?'equipment':'room';const legend=document.createElement('legend');legend.textContent=category==='machine'?'Espresso machine upgrade':category==='kettle'?'Kettle upgrade':category==='objects'?'Personal touches':category==='mugSize'?'Mug size · Corner & photos':category==='jugShape'?'Milk jug shape':category==='fixture'?'Install lighting':category;fieldset.append(legend);
   for(const [id,choice] of Object.entries(choices)){const button=document.createElement('button');button.className='room-choice';button.dataset.category=category;button.dataset.choice=id;button.innerHTML='<i></i><span></span>';button.querySelector('i')!.style.background=choice.color;button.querySelector('span')!.textContent=choice.label;button.onclick=()=>{(draft as unknown as Record<string,string>)[category]=id;refresh();};fieldset.append(button);}q('.room-categories').append(fieldset);
  }
  const jugLabel=document.createElement('label');jugLabel.className='jug-visibility';jugLabel.dataset.group='equipment';jugLabel.innerHTML='<input type="checkbox" id="hideJug"> Hide the jug while pouring';q('.room-categories').append(jugLabel);q<HTMLInputElement>('#hideJug').checked=draft.hideJug;q<HTMLInputElement>('#hideJug').onchange=e=>{draft.hideJug=(e.target as HTMLInputElement).checked;refresh();};
  const note=document.createElement('small');note.dataset.group='equipment';note.textContent='Mug sizes change Corner views and photos. Pouring uses the calibrated cup. The selected jug stays on the counter.';q('.room-categories').append(note);
  const inventory=q('.decoration-inventory');
  if(!equipmentOnly){
   inventory.innerHTML='<span class="section-label">ADD TO YOUR COUNTER</span><div class="inventory-buttons"></div><p id="placementCount"></p><button id="removeLastDecoration">Remove last added object</button><button id="clearKeptCups">Clear finished cups</button>';
   const count=()=>{q('#placementCount').textContent=draft.decorations.length+' / 24 decorations · drag objects in Corner to move them';};
   for(const [kind,label] of Object.entries(decorationLabels)){const button=document.createElement('button');button.textContent='+ '+label;button.onclick=()=>{if(draft.decorations.length>=24){message('The counter has room for 24 placed decorations.');return;}const i=draft.decorations.length;draft.decorations.push({id:'prop-'+crypto.randomUUID(),kind:kind as DecorationKind,x:[-6.4,-3.8,5.8,8][i%4],y:i%2?-.6:.6,rotation:0});refresh();count();message('Added '+label+'. Apply, then drag it into place in Corner.');};q('.inventory-buttons').append(button);}
   const credits=document.createElement('details');credits.innerHTML='<summary>Upgrade model credits</summary><p>Optional models · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></p><p><a href="https://sketchfab.com/3d-models/la-marzocco-coffee-machine-416688442fa04f52b8a8dfe3c6d40314" target="_blank" rel="noopener">La Marzocco Coffee Machine</a> by Akeelah<br><a href="https://sketchfab.com/3d-models/fellow-electric-kettle-e63695bef38d47879798c35b6e38b5ee" target="_blank" rel="noopener">Fellow Electric Kettle</a> by eltayerkebulan<br><a href="https://sketchfab.com/3d-models/free-pothos-potted-plant-money-plant-e9832f38484f4f85b3f9081b51fa3799" target="_blank" rel="noopener">Pothos Potted Plant</a> by AllQuad</p>';inventory.append(credits);
   q('#removeLastDecoration').onclick=()=>{draft.decorations.pop();refresh();count();};
   q('#clearKeptCups').onclick=()=>{view.clearKeptCups();message('Finished cups cleared. Download photos before clearing cups you want to keep.');};count();
  }else q('.room-presets').hidden=true;
  const tabs=q('.workshop-tabs');
  const selectGroup=(group:string)=>{for(const element of Array.from(dialog.querySelectorAll<HTMLElement>('[data-group]')))element.hidden=element.dataset.group!==group;q('.room-presets').hidden=group!=='room';inventory.hidden=group!=='objects';tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===group)));};
  if(!equipmentOnly){const label=document.createElement('label');label.textContent='Customize';const select=document.createElement('select');select.setAttribute('aria-label','Decoration category');for(const [id,name] of [['equipment','Equipment'],['room','Room'],['objects','Objects']]){const option=document.createElement('option');option.value=id;option.textContent=name;select.append(option);}select.onchange=()=>selectGroup(select.value);label.append(select);tabs.append(label);selectGroup('equipment');}else tabs.hidden=true;
  q('#applyRoom').onclick=()=>{try{saveRoom(draft);room={...draft};close();}catch{message('Room storage is unavailable. You can keep previewing, or cancel to restore your saved room.');}};
  q('#cancelRoom').onclick=close;q('#resetRoom').onclick=()=>{draft=structuredClone(defaultRoom);refresh();message('Default room preview. Apply to keep it.');};refresh();
 }
 const world=mountWorldControls(view,()=>{session=suspend();},resume,()=>photo(true),layout=>{room={...room,decorations:layout};saveRoom(room);});
 const mugButton=document.createElement('button');mugButton.textContent='Mug & jug';mugButton.id='mugOptions';mugButton.onclick=()=>decorate(true);world.actions.prepend(mugButton);
 const cupMugButton=document.createElement('button');cupMugButton.textContent='Mug & jug';cupMugButton.onclick=()=>decorate(true);document.querySelector('.actions')!.append(cupMugButton);
 world.actions.prepend(...Array.from(nav.children));nav.remove();
 const more=document.createElement('details');more.className='corner-more';more.innerHTML='<summary>More</summary><div class="corner-more-menu"></div>';const menu=more.querySelector('div')!;menu.append(document.getElementById('myPours')!,mugButton);world.actions.append(more);menu.addEventListener('click',()=>{more.open=false;});
 document.getElementById('finish')!.hidden=true;
 document.getElementById('dockCup')!.textContent='Actions';
 document.getElementById('dockCorner')!.hidden=true;
 document.getElementById('dockCorner')!.onclick=world.open;
 document.getElementById('dockCorner')!.removeAttribute('aria-expanded');
 document.getElementById('takePhoto')!.onclick=()=>photo();document.getElementById('myPours')!.onclick=()=>void gallery();document.getElementById('decorate')!.onclick=()=>decorate();
 mountWorldPieces(view,{active:()=>world.active&&!dialog.open,room:()=>room,apply:next=>{room=next;view.applyRoom(room);try{saveRoom(room);}catch{/* The preview remains usable without storage. */}}});
 return {get active(){return dialog.open||world.active;},get exploring(){return world.active&&!dialog.open;}};
}
