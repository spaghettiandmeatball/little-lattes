import * as T from 'three';
import {loadCounterModel,reportModel} from './counter-models';
import {createSteamVFX} from './steam-vfx';
export function createBrewingProps(scene:T.Scene){
 const root=new T.Group();root.name='brewing-station';scene.add(root);
 const steel=new T.MeshStandardMaterial({color:'#d4dcda',metalness:1,roughness:.25}),paper=new T.MeshStandardMaterial({color:'#f1e6d0',roughness:.86,side:T.DoubleSide}),glass=new T.MeshPhysicalMaterial({color:'#c8dfd5',transparent:true,opacity:.33,roughness:.08,clearcoat:1,depthWrite:false,side:T.DoubleSide}),coffee=new T.MeshPhysicalMaterial({color:'#4a2411',roughness:.18}),black=new T.MeshStandardMaterial({color:'#293c33',roughness:.65});
 const add=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;};
 const cyl=(r:number,b:number,h:number,m:T.Material,x:number,y:number,z:number)=>{const o=add(new T.CylinderGeometry(r,b,h,48,1,true),m,x,y,z);o.rotation.x=Math.PI/2;return o;};
 add(new T.BoxGeometry(1.35,1.3,.05),black,-6,.3,-.75);
 cyl(.26,.37,.55,glass,-6,.3,-.44);cyl(.32,.095,.4,paper,-6,.3,.02);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const rib=add(new T.CylinderGeometry(.008,.008,.37,6),steel,-6+Math.cos(a)*.2,.3+Math.sin(a)*.2,.005);rib.rotation.set(Math.PI/2+Math.cos(a)*.36,Math.sin(a)*.36,0);}
 const grounds=add(new T.CircleGeometry(.21,40),coffee,-6,.3,.12);
 const carafeCoffee=add(new T.CircleGeometry(.28,40),coffee,-6,.3,-.61);
 const kettle=new T.Group();root.add(kettle);const body=new T.Mesh(new T.SphereGeometry(.32,40,24),steel);body.scale.set(1,1,.8);kettle.add(body);
 const handle=new T.Mesh(new T.TorusGeometry(.23,.035,12,40),black);handle.position.y=.32;handle.rotation.x=Math.PI/2;kettle.add(handle);
 const neck=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.25,0,-.05),new T.Vector3(.52,0,-.12),new T.Vector3(.6,0,.12),new T.Vector3(.75,0,.18)]),32,.025,10,false),steel);kettle.add(neck);
 const water=add(new T.CylinderGeometry(.012,.018,.56,12),new T.MeshPhysicalMaterial({color:'#dce6df',transparent:true,opacity:.65,roughness:.08}),-6,.3,.45);water.rotation.x=Math.PI/2;
 const porcelain=new T.MeshPhysicalMaterial({color:'#e4e0cc',roughness:.25,clearcoat:.55});
 const shotStart=new Set(root.children);
 const shotCoffee=Array.from({length:2},(_,i)=>{const x=3.25+i*.7;cyl(.17,.13,.35,porcelain,x,-.06,-.545);const handle=add(new T.TorusGeometry(.075,.02,10,24),porcelain,x+.19,-.06,-.54);handle.rotation.x=Math.PI/2;const saucer=add(new T.CircleGeometry(.28,40),porcelain,x,-.06,-.745);saucer.castShadow=false;return add(new T.CircleGeometry(.15,40),coffee,x,-.06,-.55);});
 const shots=new T.Group();root.add(shots);for(const part of [...root.children])if(part!==shots&&!shotStart.has(part))shots.attach(part);
 shots.position.z=.695;
 const classicTray=add(new T.BoxGeometry(1.9,.9,.05),steel,3.6,-.05,-.075);classicTray.name='espresso-drip-tray';
 const nozzleStart=new Set(root.children);
 const drips=Array.from({length:2},(_,i)=>{const x=3.25+i*.7;add(new T.BoxGeometry(.1,.34,.06),steel,x,.12,.38);return add(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(x,.29,.38),new T.Vector3(x,-.06,.34),new T.Vector3(x,-.06,.30)]),28,.015,10,false),coffee,0,0,0);});
 const classicNozzles=root.children.filter(part=>!nozzleStart.has(part)&&!drips.some(drip=>drip===part));
 // Small grinder beside the machine, with a clear hopper and coffee beans.
 add(new T.BoxGeometry(.65,.6,.85),black,6.5,.6,-.32);cyl(.25,.21,.42,glass,6.5,.6,.32);
 for(let i=0;i<22;i++){const a=i*2.4,r=.16*Math.sqrt(i/22),bean=add(new T.SphereGeometry(.038,8,6),coffee,6.5+Math.cos(a)*r,.6+Math.sin(a)*r,.2+(i%3)*.04);bean.scale.y=1.5;}
 add(new T.BoxGeometry(.18,.25,.12),steel,6.5,.24,-.05);
 const wand=add(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.3,-.18,-.1),new T.Vector3(.38,-.35,-.65)]),24,.025,10,false),steel,4.65,.05,.7);
 const steam=createSteamVFX();steam.root.position.set(5.03,-.3,.05);root.add(steam.root);
 let fancyKettle:T.Group|undefined,kettleBase:T.Group|undefined,kettleLoading=false,selectedKettle='classic',fancyMachine=false;
 function setKettle(choice:string){
  selectedKettle=choice;kettle.visible=choice==='classic'||!fancyKettle;if(fancyKettle)fancyKettle.visible=choice==='fellow';if(kettleBase)kettleBase.visible=choice==='fellow';
  if(choice!=='fellow'||fancyKettle||kettleLoading)return;kettleLoading=true;reportModel('Loading Fellow kettle…');
  void loadCounterModel('fellow-kettle').then(model=>{
   fancyKettle=new T.Group();fancyKettle.name='fellow-kettle-upgrade';kettleBase=new T.Group();kettleBase.name='fellow-electric-base';
   model.updateMatrixWorld(true);const parts:T.Mesh[]=[];model.traverse(o=>{if(o instanceof T.Mesh)parts.push(o);});
   for(const part of parts){const bounds=new T.Box3().setFromObject(part);(bounds.max.z<.14?kettleBase:fancyKettle).attach(part);}
   kettleBase.position.set(-7.1,.55,-.788);root.add(kettleBase,fancyKettle);setKettle(selectedKettle);reportModel('Fellow kettle ready. Apply to keep it.');
  }).catch(()=>reportModel('The kettle could not load. Classic kettle retained; choose Fellow again to retry.')).finally(()=>{kettleLoading=false;});
 }
 const drain=add(new T.CircleGeometry(.37,40),black,5.03,-.3,-.763);const drainRim=add(new T.TorusGeometry(.35,.018,8,40),steel,5.03,-.3,-.75);
 let operation:'off'|'grind'|'espresso'|'pour-over'|'steam'|'purge'='off',progress=0;
 const proxies=['espresso','pour-over','milk','purge'].map((kind,i)=>{const mesh=add(new T.BoxGeometry(i===0?2.7:i===1?2:.5,i<2?1.6:.55,i<2?1.9:.6),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),i===0?3.6:i===1?-6.65:5.03,i===0?.7:i===1?.3:-.3,i<2?.1:i===2?-.2:.6);mesh.userData.photoHidden=true;mesh.userData.station=kind;return mesh;});
 return {root,proxies,setKettle,setMachine(upgraded:boolean){if(fancyMachine===upgraded)return;fancyMachine=upgraded;proxies[2].position.set(upgraded?5.13:5.03,upgraded?-.8:-.3,-.2);proxies[3].position.set(upgraded?5.13:5.03,upgraded?-.8:-.3,.6);shots.position.set(0,upgraded?-.65:0,upgraded?.55:.695);classicTray.visible=!upgraded;drain.position.set(upgraded?5.13:5.03,upgraded?-.8:-.3,-.763);drainRim.position.set(upgraded?5.13:5.03,upgraded?-.8:-.3,-.75);classicNozzles.forEach(o=>o.visible=!upgraded);drips.forEach((o,i)=>{const x=3.25+i*.7;o.geometry.dispose();o.geometry=new T.TubeGeometry(new T.CatmullRomCurve3(upgraded?[new T.Vector3(x,-.56,.28),new T.Vector3(x,-.71,.22),new T.Vector3(x,-.71,.16)]:[new T.Vector3(x,.29,.38),new T.Vector3(x,-.06,.34),new T.Vector3(x,-.06,.30)]),28,.015,10,false);});wand.position.set(upgraded?4.75:4.65,upgraded?-.45:.05,.7);steam.root.position.set(upgraded?5.13:5.03,upgraded?-.8:-.3,.05);},set(next:typeof operation,p=0){operation=next;progress=p;steam.set(next==='steam'?'steam':next==='purge'?'purge':'off');},animate(now:number){
  steam.animate(now);const pouring=operation==='pour-over';kettle.position.set(pouring?-6.72:-7.1,pouring?.3:.55,pouring?.99:-.42);kettle.rotation.y=pouring?.5:0;
  if(fancyKettle){fancyKettle.position.set(pouring?-6.72:-7.1,pouring?.3:.55,pouring?.45:-.788);fancyKettle.rotation.y=pouring?.5:0;}
  water.visible=pouring;water.scale.x=water.scale.z=1+Math.sin(now*18)*.12;grounds.scale.setScalar(pouring?1+Math.sin(now*4)*.015:1);carafeCoffee.position.z=-.61+(pouring?progress:.9)*.25;
  drips.forEach(d=>{d.visible=operation==='espresso';});wand.visible=true;
  shotCoffee.forEach(c=>{c.position.z=-.55+(operation==='espresso'?progress:1)*.16;});
 }};
}
