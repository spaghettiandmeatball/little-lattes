import * as T from 'three';
import {jetPoint,WORLD_PER_METER,GRAVITY,type JetState} from './jet';
import type {CozyView} from './cozy-view';
import {PITCHER} from './vessel';
import {createPitcher} from './pitcher-mesh';
import {addNookPlants} from './nook-plants';
import {addPersonalObjects} from './nook-props';
import {createLiquidMaterial} from './liquid-material';
import {makeWindowEnvironment,applyRoom,makeOutdoorTexture} from './room-materials';
import {defaultRoom,type RoomConfig} from './room-config';
import {createPhotoSnapshot} from './photo-scene';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {addWorldDetails} from './world-details';
import {createWorkshop} from './workshop-props';
import {createBrewEquipment} from './brew-equipment';
import {createFoamTool} from './foam-tools';
import {finishMaterial,detailTexture} from './material-detail';
import {createBrewingProps} from './brewing-props';
import {loadCounterModel,reportModel} from './counter-models';
import type {PlacedDecoration} from './room-config';

// Coffee coordinates remain XY; Z is up in the café.
export function createScene(host: HTMLElement) {
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;host.append(renderer.domElement);
 const gl=renderer.getContext() as WebGL2RenderingContext,timer=gl.getExtension('EXT_disjoint_timer_query_webgl2');const renderQueries:WebGLQuery[]=[],renderGpuTimings:number[]=[];let renderGpuMs:number|null=null;
 const scene=new T.Scene();const environment=makeWindowEnvironment(renderer);scene.environment=environment.texture;scene.background=new T.Color('#b9b29b');scene.fog=new T.Fog('#b9b29b',13,32);
 const camera=new T.OrthographicCamera(-3,3,3,-3,.1,45);camera.up.set(0,0,1);camera.position.set(0,-2,9);camera.lookAt(0,0,0);
 scene.add(new T.HemisphereLight(0xfff4e1,0x82918b,1.15));const sun=new T.DirectionalLight(0xffead0,2.1);sun.position.set(-5,2,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9});sun.shadow.radius=4;sun.shadow.intensity=.38;sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;scene.add(sun);
 const lamp=new T.PointLight(0xffc379,13,7,2);lamp.position.set(2.6,1.37,3.3);scene.add(lamp);
 const mat=(color:T.ColorRepresentation,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const cream=new T.MeshPhysicalMaterial({color:'#f2e7cf',roughness:.24,clearcoat:.65,clearcoatRoughness:.18}),green=mat('#657b66'),dark=mat('#344338'),brass=mat('#ba9051',.3,.65),steel=mat('#d5dedd',.3,1);steel.name='pitcher';const cupGlaze=cream.clone();cupGlaze.name='cup';const jugMetal=steel.clone();jugMetal.name='pitcher';steel.name='';
 finishMaterial(cream,'glaze');finishMaterial(cupGlaze,'glaze');finishMaterial(steel,'steel');finishMaterial(jugMetal,'steel');
 function mesh(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;}
 function box(w:number,d:number,h:number,m:T.Material,x:number,y:number,z:number){return mesh(new T.BoxGeometry(w,d,h),m,x,y,z);}
 function cyl(a:number,b:number,h:number,m:T.Material,x:number,y:number,z:number){const o=mesh(new T.CylinderGeometry(a,b,h,64),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
 const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=512;const ctx=textureCanvas.getContext('2d')!;ctx.fillStyle='#ddceb0';ctx.fillRect(0,0,512,512);
 for(let i=0;i<160;i++){const y=i*512/160;ctx.strokeStyle=`rgba(65,34,13,${.015+(Math.sin(i*19)+1)*.012})`;ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=512;x+=8)ctx.lineTo(x,y+Math.sin(x*.018+i)*2);ctx.stroke();}
 const texture=new T.CanvasTexture(textureCanvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(3,3);const wood=new T.MeshStandardMaterial({map:texture,roughness:.48});const counterMaterial=wood.clone();counterMaterial.name='counter';counterMaterial.bumpMap=texture;counterMaterial.bumpScale=.006;
 wood.map=detailTexture('oak');wood.color.set('#bca17c');finishMaterial(wood,'oak');
 box(22,5.5,.28,counterMaterial,0,-.85,-.93);
 const plaster=mat('#d9d2b8');plaster.name='wall';
 finishMaterial(plaster,'plaster');
 box(7.75,.25,8,plaster,-8.125,2,2.7);box(12.25,.25,8,plaster,5.875,2,2.7);
 box(4,.25,2.38,plaster,-2.25,2,-.11);box(4,.25,1.42,plaster,-2.25,2,5.99);
 box(24,.2,1.8,green,0,1.83,-.2);
 for(let x=-11;x<12;x+=.55)box(.025,.04,1.8,dark,x,1.68,-.2);
 // The glazed opening has actual depth: glass, plaster returns, timber mullions and sill.
 const outdoors=mesh(new T.PlaneGeometry(3.8,4.15),new T.MeshBasicMaterial({map:makeOutdoorTexture()}),-2.25,3.37,3.2);outdoors.rotation.x=Math.PI/2;outdoors.castShadow=false;
 box(3.8,.035,4.15,new T.MeshPhysicalMaterial({color:'#d6e8d7',transparent:true,opacity:.18,roughness:.13,metalness:0,clearcoat:.55,depthWrite:false}),-2.25,1.73,3.2);
 box(4.05,.46,.18,cream,-2.25,1.53,1.08);box(4.05,.46,.18,cream,-2.25,1.53,5.28);
 for(const x of [-4.25,-2.25,-.25])box(.16,.48,4.35,cream,x,1.51,3.2);
 box(4.1,.46,.13,cream,-2.25,1.51,3.18);
 box(4.4,.72,.16,wood,-2.25,1.37,1.02);
 box(3.7,.65,.12,wood,2.5,1.52,2.55);box(3.7,.65,.12,wood,2.5,1.52,4.05);
 const shelfCupGeometry=new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.16,0),new T.Vector2(.185,.025),new T.Vector2(.205,.34),new T.Vector2(.2,.36),new T.Vector2(.18,.36),new T.Vector2(.17,.07),new T.Vector2(0,.07)],40);
 for(let i=0;i<5;i++){
  const x=1.15+i*.65,glaze=i%2?cream:green;
  const shelfCup=mesh(shelfCupGeometry,glaze,x,1.34,2.63);shelfCup.rotation.x=Math.PI/2;
  const handle=mesh(new T.TorusGeometry(.105,.025,12,32),glaze,x+.225,1.34,2.83);handle.rotation.x=Math.PI/2;
  cyl(.14,.14,.46,mat(i%2?'#ab7450':'#ddd2ab'),x,1.34,4.38);
  cyl(.155,.155,.04,wood,x,1.34,4.63);box(.12,.015,.14,cream,x,1.195,4.37);
 }
 const machineStart=new Set(scene.children);
 box(2.65,1.1,.85,green,3.6,.74,-.37);box(1.55,.78,.72,steel,3.6,.62,.39);box(1.72,.88,.1,dark,3.6,.62,.78);for(const x of [3.25,3.95]){cyl(.12,.12,.18,brass,x,.29,.45);box(.09,.35,.09,dark,x,.17,.37);}
 const classicMachine=new T.Group();classicMachine.name='classic-espresso-machine';for(const part of [...scene.children])if(!machineStart.has(part))classicMachine.attach(part);scene.add(classicMachine);
 box(1.45,1.45,.025,mat('#cebea0'),-2.55,.7,-.77).rotation.z=-.14;cyl(.37,.34,.5,green,-2.65,1.65,-.52);cyl(.32,.32,.025,mat('#453724'),-2.65,1.65,-.25);
 cyl(.33,.33,.6,cream,2.6,1.6,-.47);cyl(.35,.35,.06,wood,2.6,1.6,-.13);const spoon=mesh(new T.SphereGeometry(.12,24,16),brass,2,-.1,-.74);spoon.scale.set(1,1.5,.22);box(.07,.65,.025,brass,2,-.5,-.74);
 addNookPlants(scene);addPersonalObjects(scene);addWorldDetails(scene);
 const mug=new T.Group();mug.name='interactive-mug';scene.add(mug);
 const cupStart=new Set(scene.children);
 // Rounded profiles keep the verified inner wall/radius and capacity intact.
 const saucer=mesh(new T.LatheGeometry([new T.Vector2(0,-.77),new T.Vector2(.85,-.77),new T.Vector2(1.2,-.72),new T.Vector2(1.4,-.65),new T.Vector2(1.43,-.62),new T.Vector2(1.41,-.59),new T.Vector2(1.34,-.61),new T.Vector2(1.17,-.67),new T.Vector2(.85,-.7),new T.Vector2(0,-.7)],96),cupGlaze,0,0,0);saucer.rotation.x=Math.PI/2;
 const originalCup=cyl(1.035,.75,.58,cupGlaze,0,0,-.34);
 mesh(new T.TorusGeometry(1.003,.036,24,96),cupGlaze,0,0,0);
 const handleCurve=new T.CatmullRomCurve3([new T.Vector3(.99,0,-.07),new T.Vector3(1.38,0,-.08),new T.Vector3(1.49,0,-.29),new T.Vector3(1.3,0,-.51),new T.Vector3(.98,0,-.46)]);
 mesh(new T.TubeGeometry(handleCurve,48,.075,12,false),cupGlaze,0,0,0);
 const interior=mesh(new T.LatheGeometry([new T.Vector2(0,-.66),new T.Vector2(.78,-.66),new T.Vector2(.91,-.62),new T.Vector2(1.02,-.24),new T.Vector2(1.04,-.05),new T.Vector2(1.035,0),new T.Vector2(.97,0),new T.Vector2(.97,-.024*WORLD_PER_METER),new T.Vector2(0,-.024*WORLD_PER_METER)],96),cupGlaze,0,0,0);interior.rotation.x=Math.PI/2;interior.visible=false;
 const coffeeMaterial=createLiquidMaterial();const coffee=mesh(new T.CircleGeometry(1,96),coffeeMaterial,0,0,.005);coffee.castShadow=false;coffee.name='latte-liquid';
 for(const part of [...scene.children])if(!cupStart.has(part))mug.attach(part);
 const circleGeometry=coffee.geometry,freeGeometry=new T.PlaneGeometry(2,2,64,64);let freeLiquid:CozyView|undefined;
 const puddle=mesh(new T.CircleGeometry(.3,40),new T.MeshBasicMaterial({color:'#aa8964',transparent:true,opacity:.65,depthWrite:false}),0,-1.4,-.775);puddle.visible=false;puddle.castShadow=false;
 const marker=mesh(new T.RingGeometry(.025,.036,32),new T.MeshBasicMaterial({color:'#ffe0a2',transparent:true,opacity:.7}),0,0,.025);marker.castShadow=false;
 let pitcher=createPitcher(jugMetal);scene.add(pitcher);
 const streamGeometry=new T.BufferGeometry(),streamPositions=new Float32Array(13*9*3),streamIndices:number[]=[];
 for(let ring=0;ring<12;ring++)for(let side=0;side<8;side++){const k=ring*9+side;streamIndices.push(k,k+9,k+1,k+1,k+9,k+10);}
 streamGeometry.setAttribute('position',new T.BufferAttribute(streamPositions,3));streamGeometry.setIndex(streamIndices);
 const stream=mesh(streamGeometry,new T.MeshPhysicalMaterial({color:'#f8edda',roughness:.32,clearcoat:.15}),0,0,0);stream.castShadow=false;stream.visible=false;stream.frustumCulled=false;
 const steam=Array.from({length:9},()=>{const p=mesh(new T.SphereGeometry(.08,12,8),new T.MeshBasicMaterial({color:'#fff1dc',transparent:true,opacity:.03,depthWrite:false}),0,0,0);p.castShadow=false;return p;});
 const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,0,1),-.005);
 let surfaceZ=.005;
 const tip=new T.Object3D();tip.position.set(0,PITCHER.tipY,PITCHER.tipZ);pitcher.add(tip);
 const contact=mesh(new T.RingGeometry(.022,.032,32),new T.MeshBasicMaterial({color:'#f7dfb2',transparent:true,opacity:.25,depthWrite:false}),0,0,.018);contact.castShadow=false;
 const work=new T.Group();work.name='pouring-workspace';work.position.y=-1.1;scene.add(work);
 for(const part of [mug,pitcher,puddle,marker,stream,contact,...steam])work.add(part);
 const etchTools={pick:createFoamTool('pick',steel,wood),spoon:createFoamTool('spoon',steel,wood)};
 for(const tool of Object.values(etchTools)){tool.visible=false;tool.userData.photoHidden=true;work.add(tool);}
 let etching=false;
 const workshop=createWorkshop(scene),equipment=createBrewEquipment(scene,jugMetal);
 const brewing=createBrewingProps(scene);
 let fancyMachine:T.Group|undefined,machineLoading=false,selectedMachine:RoomConfig['machine']='classic';
 function upgradeMachine(choice:RoomConfig['machine']){
  selectedMachine=choice;classicMachine.visible=choice==='classic'||!fancyMachine;if(fancyMachine)fancyMachine.visible=choice==='laMarzocco';brewing.setMachine(choice==='laMarzocco'&&!!fancyMachine);equipment.setMachine(choice==='laMarzocco'&&!!fancyMachine);
  if(choice!=='laMarzocco'||fancyMachine||machineLoading)return;machineLoading=true;reportModel('Loading La Marzocco…');
  void loadCounterModel('la-marzocco').then(model=>{fancyMachine=model;model.name='la-marzocco-upgrade';model.position.set(3.6,.2,-.788);scene.add(model);upgradeMachine(selectedMachine);reportModel('La Marzocco ready. Apply to keep it.');}).catch(()=>reportModel('The machine could not load. Classic machine retained; choose La Marzocco again to retry.')).finally(()=>{machineLoading=false;});
 }
 const completed=new T.Group();completed.name='completed-cups';scene.add(completed);
 const kept:ReturnType<typeof createPhotoSnapshot>[]=[];
 let enjoyView=false,decorateView=false,exploreView=false;let room:RoomConfig=structuredClone(defaultRoom),jugShape:RoomConfig['jugShape']='classic';
 const worldCamera=new T.PerspectiveCamera(45,1,.1,60);worldCamera.up.set(0,0,1);
 const orbit=new OrbitControls(worldCamera,renderer.domElement);orbit.enabled=false;orbit.enableDamping=true;orbit.dampingFactor=.12;orbit.minDistance=2.5;orbit.maxDistance=19;orbit.maxPolarAngle=Math.PI*.49;orbit.minPolarAngle=.12;orbit.target.set(0,-1.1,.1);
 let cameraTravel:{position:T.Vector3;target:T.Vector3}|undefined;let lastShadow=0;
 orbit.addEventListener('start',()=>{cameraTravel=undefined;});
 let mugSize=1,mugTurn=0;
 const positionMug=()=>{mug.scale.setScalar(mugSize);mug.rotation.z=mugTurn;mug.position.z=.77*(mugSize-1);};
 const resetWorld=()=>{const narrow=host.getBoundingClientRect().width<650;worldCamera.position.set(4.4,-9.3,6.4).multiplyScalar(narrow?1.18:1);orbit.target.set(0,-.7,narrow?-.4:.15);orbit.update();};resetWorld();
 for(const o of [marker,stream,contact,...steam])o.userData.photoHidden=true;
 const applySettings=(value:RoomConfig)=>{
  renderer.shadowMap.needsUpdate=true;room=structuredClone(value);workshop.update(room);equipment.update(room);upgradeMachine(room.machine);brewing.setKettle(room.kettle);
  if(jugShape!==room.jugShape){pitcher.removeFromParent();pitcher.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});jugShape=room.jugShape;pitcher=createPitcher(jugMetal,jugShape);pitcher.add(tip);work.add(pitcher);}
  mugSize=room.mugSize==='small'?.85:room.mugSize==='large'?1.25:1;if(exploreView)positionMug();applyRoom(scene,room);
 };applySettings(room);
 const resize=()=>{
   const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);
   worldCamera.aspect=width/Math.max(1,height);worldCamera.updateProjectionMatrix();
   if(decorateView){
     const side=width>=650,usableWidth=side?Math.max(220,width-375):width,usableHeight=side?height:height*.46;
     const scale=Math.min(usableWidth/6.5,usableHeight/4.5),offsetX=(width-usableWidth)/(2*scale),offsetY=(usableHeight-height)/(2*scale);
     camera.left=-width/(2*scale)+offsetX;camera.right=width/(2*scale)+offsetX;
     camera.top=height/(2*scale)+offsetY;camera.bottom=-height/(2*scale)+offsetY;
     camera.position.set(2.6,-7.8,7.2);camera.lookAt(0,1.0,.65);camera.updateProjectionMatrix();return;
   }
   if(enjoyView){
     const scale=Math.min(width/9,height/10);
     camera.left=-width/(2*scale);camera.right=width/(2*scale);
     camera.top=height/(2*scale);camera.bottom=-height/(2*scale);
     camera.position.set(3.2,-7.8,6.6);camera.lookAt(0,1.65,1.1);camera.updateProjectionMatrix();return;
   }
   camera.position.set(0,-3.1,9);camera.lookAt(0,-1.1,0);
   const controlHeight=document.querySelector('.controls')?.getBoundingClientRect().height||240;
   document.documentElement.style.setProperty('--controlHeight',`${controlHeight}px`);
   const side=width>=650&&height<=650,top=width<650?60:height<=650?55:85,bottom=side?50:controlHeight+30,available=Math.max(100,height-top-bottom);
   const dockWidth=document.querySelector('.controls')?.getBoundingClientRect().width||304;
   const usableWidth=side?width-dockWidth-28:width,diameter=Math.min(usableWidth*.65,available*.80,400),scale=diameter/2;
   const center=top+available*.52,offset=(center-height/2)/scale,offsetX=(side?(width/2-usableWidth/2)/scale:0)+.07;
   camera.left=-width/(2*scale)+offsetX;camera.right=width/(2*scale)+offsetX;
   camera.top=height/(2*scale)+offset;camera.bottom=-height/(2*scale)+offset;camera.updateProjectionMatrix();
 };
 const observer=new ResizeObserver(resize);observer.observe(host);const controls=document.querySelector('.controls');if(controls)observer.observe(controls);resize();
 return {renderer,coffeeMaterial,
 focusStation(kind:'espresso'|'pour-over'|'milk'){const upgraded=room.machine==='laMarzocco'&&!!fancyMachine,x=kind==='pour-over'?-6:kind==='milk'?(upgraded?5.13:5.03):3.6;cameraTravel={target:new T.Vector3(x,kind==='milk'?-.65:0,kind==='milk'?.15:0),position:new T.Vector3(x+(kind==='milk'?1.2:2),-4.8,kind==='milk'?2.6:3.3)};},
 stationScreen(kind:'espresso'|'pour-over'|'milk'|'purge'){
  const upgraded=room.machine==='laMarzocco'&&!!fancyMachine,p=new T.Vector3(kind==='espresso'?3.6:kind==='pour-over'?-7.1:upgraded?5.13:5.03,kind==='espresso'?-.65:kind==='pour-over'?.55:upgraded?-.8:-.3,kind==='espresso'?1.2:kind==='pour-over'?.35:kind==='purge'?.8:.15).project(worldCamera);
  if(p.z<-1||p.z>1||Math.abs(p.x)>.95||Math.abs(p.y)>.88)return null;return {x:(p.x+1)*host.clientWidth/2,y:(1-p.y)*host.clientHeight/2};
 },
 stationOperation(kind:'off'|'grind'|'espresso'|'pour-over'|'steam'|'purge',progress=0){brewing.set(kind,progress);equipment.steam(kind==='steam');},
 hitStation(x:number,y:number){const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),worldCamera);brewing.root.updateMatrixWorld(true);return ray.intersectObjects(brewing.proxies)[0]?.object.userData.station as 'espresso'|'pour-over'|'milk'|'purge'|undefined;},
 setEtching(kind:'pour'|'pick'|'spoon',point:T.Vector2|null){etching=kind!=='pour';for(const [key,tool] of Object.entries(etchTools)){tool.visible=key===kind&&!!point;if(point){tool.position.set(point.x,point.y,surfaceZ+.025);tool.rotation.set(.35,0,-.65);}}},
 mugPose(){return {size:mugSize,turn:mugTurn};},
 worldPieceScreen(kind:string,id?:string){const object=kind==='cup'?mug:kind==='milk'?equipment.root.getObjectByName('counter-milk-jug'):kind==='tools'?equipment.root:kind==='light'?scene.getObjectByName('task-fixture'):workshop.root.children.find(o=>o.userData.placementId===id);if(!object)return null;object.updateWorldMatrix(true,false);const p=object.getWorldPosition(new T.Vector3());if(kind==='tools'){p.x+=1;p.y-=.65;p.z-=.05;}else p.z+=kind==='cup'?.65:kind==='light'?1.1:.5;p.project(worldCamera);if(p.z<-1||p.z>1||Math.abs(p.x)>.92||Math.abs(p.y)>.85)return null;return {x:(p.x+1)*host.clientWidth/2,y:(1-p.y)*host.clientHeight/2};},
 hitWorldPiece(x:number,y:number){const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),worldCamera);equipment.root.updateMatrixWorld(true);const fixtures=scene.getObjectByName('installed-lights');fixtures?.updateMatrixWorld(true);const hit=ray.intersectObjects([equipment.root,...(fixtures?.children.filter(o=>o.visible)||[])],true)[0];if(!hit)return null;let node:T.Object3D|null=hit.object;while(node){if(node.name==='counter-milk-jug')return 'milk';if(node.name==='task-fixture'||node.name==='pendant-fixture')return 'light';node=node.parent;}return 'tools';},
 refillAnimation(){equipment.refill();},
 setExplore(value:boolean){exploreView=value;orbit.enabled=value;if(value)positionMug();else{mug.scale.setScalar(1);mug.rotation.z=0;mug.position.z=0;}resize();},
 setMug(size:number,turn:number){mugSize=T.MathUtils.clamp(size,.65,1.4);mugTurn=turn;if(exploreView)positionMug();},
 keepCup(){
  if(kept.length>=6)return false;
  const source=new T.Scene();source.add(mug.clone(true));const snapshot=createPhotoSnapshot(renderer,source,room),copy=snapshot.scene.getObjectByName('interactive-mug')!;
  copy.removeFromParent();const scale=.65*mugSize;copy.position.set([-8,-5.2,-2.8,3,5.6,8.2][kept.length],-2.35,.77*(scale-1));copy.scale.setScalar(scale);copy.rotation.z=mugTurn;completed.add(copy);kept.push(snapshot);return true;
 },
 clearKeptCups(){for(const snap of kept)snap.dispose();kept.length=0;completed.clear();},
 placements(){return structuredClone(room.decorations);},
 pickDecoration(x:number,y:number){const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),worldCamera);workshop.root.updateMatrixWorld(true);const hit=ray.intersectObject(workshop.root,true)[0];if(!hit)return null;let object:T.Object3D| null=hit.object;while(object&&!object.userData.placementId)object=object.parent;return object?{id:object.userData.placementId as string,x:object.position.x,y:object.position.y}:null;},
 counterPoint(x:number,y:number){const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),worldCamera);const point=new T.Vector3();return ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,0,1),.788),point)?point:null;},
 moveDecoration(id:string,x:number,y:number){const d=room.decorations.find(d=>d.id===id);if(!d)return;d.x=T.MathUtils.clamp(x,-9,9);d.y=T.MathUtils.clamp(y,-2.8,1.15);if(Math.hypot(d.x,d.y+1.1)<1.9){const a=Math.atan2(d.y+1.1,d.x);d.x=Math.cos(a)*1.9;d.y=-1.1+Math.sin(a)*1.9;d.y=T.MathUtils.clamp(d.y,-2.8,1.15);}workshop.move(id,d.x,d.y);},
 resetWorld,
 worldCamera(){orbit.update();return worldCamera.clone();},
 worldStep(dx:number,dy:number,dz:number){const forward=orbit.target.clone().sub(worldCamera.position);forward.z=0;forward.normalize();const right=new T.Vector3().crossVectors(forward,new T.Vector3(0,0,1));const delta=right.multiplyScalar(dx).addScaledVector(forward,dy);delta.z=dz;const target=orbit.target.clone().add(delta);target.x=T.MathUtils.clamp(target.x,-8,8);target.y=T.MathUtils.clamp(target.y,-3,1.3);target.z=T.MathUtils.clamp(target.z,-.5,4);delta.copy(target).sub(orbit.target);worldCamera.position.add(delta);orbit.target.copy(target);orbit.update();},
 hitMug(x:number,y:number){const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),worldCamera);mug.updateMatrixWorld(true);return ray.intersectObject(mug,true).length>0;},
 setDecorate(value:boolean){decorateView=value;resize();},applyRoom(value:RoomConfig){applySettings(value);},snapshot(){return createPhotoSnapshot(renderer,scene,room);},get renderGpuMs(){return renderGpuMs;},renderGpuTimings(){return renderGpuTimings.slice();},clearTimings(){renderGpuTimings.length=0;},setEnjoy(value:boolean){enjoyView=value;resize();},setFreeSurface(liquid:CozyView|undefined){freeLiquid=liquid;coffee.geometry=liquid?freeGeometry:circleGeometry;coffeeMaterial.uniforms.freeSurface.value=liquid?1:0;coffeeMaterial.uniforms.surfacePurity.value=liquid?.useFilm?1:0;coffeeMaterial.uniforms.heightField.value=liquid?.heightTexture??null;},setSpill(ml:number,point:{x:number;y:number}){puddle.visible=ml>.02;const angle=Math.atan2(point.y-.5,point.x-.5);puddle.position.x=Math.cos(angle)*1.42;puddle.position.y=Math.sin(angle)*1.42;puddle.scale.set(Math.min(2.5,.35+Math.sqrt(ml)*.18),Math.min(1.6,.3+Math.sqrt(ml)*.1),1);},setLiquidLevel(surfaceM:number,experimental:boolean){surfaceZ=.005+surfaceM*WORLD_PER_METER;coffee.position.z=surfaceZ;plane.constant=-surfaceZ;interior.visible=experimental;originalCup.visible=!experimental;coffeeMaterial.uniforms.volumeMode.value=experimental?1:0;},render(jet:JetState,pouring:boolean,finished=false){
   const now=performance.now();
   if(cameraTravel&&exploreView){worldCamera.position.lerp(cameraTravel.position,.12);orbit.target.lerp(cameraTravel.target,.12);if(worldCamera.position.distanceTo(cameraTravel.position)<.01)cameraTravel=undefined;}
   if(now-lastShadow>125){renderer.shadowMap.needsUpdate=true;lastShadow=now;}
   const point=new T.Vector2(jet.impact.x*WORLD_PER_METER,jet.impact.y*WORLD_PER_METER);
   const landingZ=surfaceZ+jet.impact.z*WORLD_PER_METER;
   marker.position.set(point.x,point.y,landingZ+.02);marker.visible=!finished&&!etching;
   pitcher.visible=pouring&&!finished&&!room.hideJug;
   // Solve body translation after tilt so the transformed tip is exactly the
   // shared physical spout. No decorative inertia changes the landing point.
   pitcher.rotation.set(jet.pitcherTilt??(1.15+(pouring?jet.actualFlowMlS/12*.2:0)),0,jet.pitcherYaw??-.7);
   const rotatedTip=tip.position.clone().applyEuler(pitcher.rotation);
   const spoutPosition=new T.Vector3(jet.spout.x,jet.spout.y,jet.spout.z).multiplyScalar(WORLD_PER_METER);
   spoutPosition.z+=surfaceZ;pitcher.position.copy(spoutPosition).sub(rotatedTip);
   pitcher.updateMatrixWorld(true);
   const a=new T.Vector3(point.x,point.y,landingZ);
   stream.visible=pouring&&!finished;
   if(stream.visible){
     for(let ring=0;ring<=12;ring++){
       const t=ring/12,p=jetPoint(jet,t),center=new T.Vector3(p.x,p.y,p.z).multiplyScalar(WORLD_PER_METER);center.z+=surfaceZ;
       const down=jet.exitDownMPS+GRAVITY*jet.flightSeconds*t;
       const tangent=new T.Vector3(jet.incoming.x,jet.incoming.y,-down).normalize(),normal=new T.Vector3().crossVectors(tangent,new T.Vector3(0,1,0)).normalize(),binormal=new T.Vector3().crossVectors(tangent,normal).normalize();
       const radius=Math.sqrt(jet.actualFlowMlS*1e-6/(Math.PI*down))*WORLD_PER_METER;
       for(let side=0;side<=8;side++){const angle=side/8*Math.PI*2,pos=center.clone().addScaledVector(normal,Math.cos(angle)*radius).addScaledVector(binormal,Math.sin(angle)*radius);const k=(ring*9+side)*3;streamPositions[k]=pos.x;streamPositions[k+1]=pos.y;streamPositions[k+2]=pos.z;}
     }streamGeometry.attributes.position.needsUpdate=true;streamGeometry.computeVertexNormals();
   }
   contact.position.copy(a);contact.scale.setScalar(Math.max(.6,jet.impactRadiusM*WORLD_PER_METER/.026));contact.visible=pouring&&point.length()<.97&&!finished;
   const time=now*.00015;steam.forEach((p,i)=>{const phase=(time+i/steam.length)%1;p.position.set(Math.sin(i*5+phase*3)*.35,Math.cos(i*4)*.25,.12+phase*1.2);p.scale.setScalar(.4+phase*2);(p.material as T.MeshBasicMaterial).opacity=Math.sin(phase*Math.PI)*.012;});
   equipment.animate(now/1000);
   brewing.animate(now/1000);
   if(exploreView)orbit.update();
   const query=timer&&renderQueries.length<5?gl.createQuery():null;if(query)gl.beginQuery(timer.TIME_ELAPSED_EXT,query);renderer.render(scene,exploreView?worldCamera:camera);if(query){gl.endQuery(timer.TIME_ELAPSED_EXT);renderQueries.push(query);}
   if(timer&&gl.getParameter(timer.GPU_DISJOINT_EXT)){for(const q of renderQueries)gl.deleteQuery(q);renderQueries.length=0;renderGpuMs=null;}else if(timer)while(renderQueries.length&&gl.getQueryParameter(renderQueries[0],gl.QUERY_RESULT_AVAILABLE)){const q=renderQueries.shift()!;renderGpuMs=gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6;if(renderGpuTimings.length<18000)renderGpuTimings.push(renderGpuMs!);gl.deleteQuery(q);}
 },point(clientX:number,clientY:number){const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2),camera);const hit=new T.Vector3();ray.ray.intersectPlane(plane,hit);if(freeLiquid)for(let i=0;i<3;i++){const depth=freeLiquid.depthAt(hit.x*.5+.5,(hit.y-work.position.y)*.5+.5);ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,0,1),-(.005+(depth-.024)*WORLD_PER_METER)),hit);}return new T.Vector2(hit.x,hit.y-work.position.y);},quality(ratio:number){renderer.setPixelRatio(Math.min(devicePixelRatio,ratio,1.5));resize();}};
}
