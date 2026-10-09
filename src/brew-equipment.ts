import * as T from 'three';
import {createPitcher} from './pitcher-mesh';
import type {RoomConfig} from './room-config';
import {createFoamTool} from './foam-tools';

export function createBrewEquipment(scene:T.Scene,metal:T.Material){
 const root=new T.Group();root.name='counter-espresso-tools';root.position.set(2.55,-1.4,-.785);scene.add(root);
 const rubber=new T.MeshStandardMaterial({color:'#33483f',roughness:.92}),wood=new T.MeshStandardMaterial({color:'#94734f',roughness:.5}),brass=new T.MeshStandardMaterial({color:'#b99968',roughness:.28,metalness:.8});
 const add=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;};
 add(new T.BoxGeometry(1.8,1.3,.035),rubber,.35,.08,.02);
 const steamingJug=new T.Group();root.add(steamingJug);
 let parked=createPitcher(metal);parked.userData.photoHidden=false;parked.name='counter-milk-jug';parked.position.set(0,0,.52);parked.scale.setScalar(2.1);parked.rotation.z=-.35;steamingJug.add(parked);
 const milk=add(new T.CircleGeometry(.165,48),new T.MeshPhysicalMaterial({color:'#f7edda',roughness:.35,clearcoat:.3}),0,0,.85);milk.scale.setScalar(2.1);steamingJug.add(milk);
 const bubbles=Array.from({length:18},(_,i)=>{const bubble=new T.Mesh(new T.SphereGeometry(.009+(i%4)*.004,12,8),new T.MeshPhysicalMaterial({color:'#f7edda',roughness:.18,clearcoat:.6}));bubble.scale.z=.35;steamingJug.add(bubble);return bubble;});
 const tamper=add(new T.CylinderGeometry(.18,.2,.07,48),metal,.77,.2,.07);tamper.rotation.x=Math.PI/2;
 const grip=add(new T.SphereGeometry(.13,24,16),wood,.77,.2,.24);grip.scale.z=1.5;
 const filter=add(new T.CylinderGeometry(.24,.21,.07,48),metal,.87,-.4,.09);filter.rotation.x=Math.PI/2;
 add(new T.BoxGeometry(.12,.58,.09),wood,.87,-.8,.09);
 for(let i=0;i<24;i++){const a=i*2.399,r=.16*Math.sqrt(i/24);const hole=add(new T.CircleGeometry(.009,6),rubber,.87+Math.cos(a)*r,-.4+Math.sin(a)*r,.127);hole.castShadow=false;}
 const brush=add(new T.BoxGeometry(.08,.5,.05),wood,-.56,.28,.09);brush.rotation.z=-.3;
 for(let i=0;i<9;i++)add(new T.BoxGeometry(.012,.12,.04),brass,-.6+i*.012,.58,.085);
 for(const [i,kind] of (['pick','spoon'] as const).entries()){const tool=createFoamTool(kind,metal,wood);tool.position.set(-.85-i*.24,-.45,.05);tool.rotation.z=-.15;root.add(tool);}
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!,gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,249,231,.8)');gradient.addColorStop(.35,'rgba(255,249,231,.35)');gradient.addColorStop(1,'rgba(255,249,231,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const texture=new T.CanvasTexture(c),plumes=Array.from({length:22},()=>{const s=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));s.userData.photoHidden=true;steamingJug.add(s);return s;});
 const heat=new T.PointLight('#ffc67f',0,2.2);heat.name='refill-light';heat.position.set(0,0,.5);steamingJug.add(heat);
 let upgradedMachine=false;let manualSteam=false;let refillAt=-10,shape:RoomConfig['jugShape']='classic';
 return {root,setMachine(value:boolean){upgradedMachine=value;},steam(value:boolean){manualSteam=value;},refill(){refillAt=performance.now()/1000;},update(room:RoomConfig){if(shape!==room.jugShape){parked.removeFromParent();parked.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});shape=room.jugShape;parked=createPitcher(metal,shape);parked.name='counter-milk-jug';parked.userData.photoHidden=false;parked.position.set(0,0,.52);parked.scale.setScalar(2.1);parked.rotation.z=-.35;steamingJug.add(parked);}},animate(now:number){const duration=5.5,elapsed=now-refillAt,heating=manualSteam||(elapsed>=0&&elapsed<duration);const lift=heating?Math.min(1,elapsed/.45,(duration-elapsed)/.55):0;steamingJug.position.lerp(new T.Vector3(manualSteam?(upgradedMachine?2.58:2.48):-1.65*lift,manualSteam?(upgradedMachine?.6:1.1):-.45*lift,manualSteam?.2:.45*lift),.14);heat.intensity=manualSteam?1.3:heating?Math.sin(elapsed/duration*Math.PI)*2:0;parked.rotation.z=-.35+(heating?Math.sin(elapsed*9)*.025:0);milk.position.z=heating?.63+Math.min(1,elapsed/1.2)*.22:.85;bubbles.forEach((b,i)=>{b.visible=manualSteam;const a=now*2+i*2.399,r=.07+Math.sqrt(i/18)*.21;b.position.set(Math.cos(a)*r,Math.sin(a)*r,.85+Math.sin(now*5+i)*.005);});for(let i=0;i<plumes.length;i++){const s=plumes[i],phase=(elapsed*.5+i/plumes.length)%1;s.visible=heating&&!manualSteam;s.position.set(Math.sin(i*2.4+phase*5)*(.07+phase*.17),Math.cos(i*1.9+phase*3)*.12,.87+phase*1.25);s.scale.setScalar(.13+phase*.62);(s.material as T.SpriteMaterial).opacity=heating?Math.sin(phase*Math.PI)*.22*Math.min(1,(duration-elapsed)*1.8):0;}}};
}
