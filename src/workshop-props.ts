import * as T from 'three';
import {loadCounterModel,reportModel} from './counter-models';
import type {RoomConfig,PlacedDecoration,DecorationKind} from './room-config';

export const decorationLabels:Record<DecorationKind,string>={fern:'Fern',monstera:'Broad-leaf plant',flowers:'Flowers in a vase',candle:'Candle',books:'Coffee books',lamp:'Counter lamp',pothos:'Pothos · model upgrade'};
export function createWorkshop(scene:T.Scene){
 const root=new T.Group();root.name='placeable-decorations';scene.add(root);
 const glaze=new T.MeshPhysicalMaterial({color:'#dfcaae',roughness:.3,clearcoat:.7}),clay=new T.MeshStandardMaterial({color:'#ad7052',roughness:.85}),brass=new T.MeshStandardMaterial({color:'#bc9355',roughness:.25,metalness:.8}),dark=new T.MeshStandardMaterial({color:'#344d3f',roughness:.7});
 clay.name='plant-pot';
 const leaves=['#244d35','#427449','#72905a'].map(color=>new T.MeshPhysicalMaterial({color,roughness:.5,side:T.DoubleSide,clearcoat:.18}));
 const mesh=(g:T.Group,geo:T.BufferGeometry,mat:T.Material,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
 const cyl=(g:T.Group,r:number,h:number,mat:T.Material,z:number)=>{const m=mesh(g,new T.CylinderGeometry(r,r,h,40),mat,0,0,z);m.rotation.x=Math.PI/2;return m;};
 const lathe=(g:T.Group,points:number[][],mat:T.Material)=>{const m=mesh(g,new T.LatheGeometry(points.map(([x,y])=>new T.Vector2(x,y)),48),mat);m.rotation.x=Math.PI/2;return m;};
 // Curved double-sided blades with raised midribs; shared meshes avoid per-frame work.
 const leafGeometry=new T.BufferGeometry(),positions:number[]=[],indices:number[]=[];
 for(let j=0;j<=14;j++){const t=j/14,w=Math.sin(t*Math.PI)**.75;for(const side of [-1,0,1])positions.push(side*w,t*2,Math.sin(t*Math.PI)*.22-Math.abs(side)*w*.18);}
 for(let j=0;j<14;j++)for(let k=0;k<2;k++){const a=j*3+k;indices.push(a,a+1,a+3,a+1,a+4,a+3);}
 leafGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));leafGeometry.setIndex(indices);leafGeometry.computeVertexNormals();
 function plant(g:T.Group,broad:boolean){
  lathe(g,[[0,0],[.2,0],[.29,.04],[.36,.49],[.37,.52],[.33,.54],[.31,.48]],clay);mesh(g,new T.CircleGeometry(.31,40),dark,0,0,.47);
  for(let i=0;i<(broad?10:19);i++){
   const a=i*2.399,tip=new T.Vector3(Math.cos(a)*.2,Math.sin(a)*.2,.65+(i%4)*.18),stem=new T.CatmullRomCurve3([new T.Vector3(0,0,.47),tip.clone().multiply(new T.Vector3(1,1,.8)),tip]);
   mesh(g,new T.TubeGeometry(stem,12,.011,5,false),dark);
   const leaf=mesh(g,leafGeometry,leaves[i%3],tip.x,tip.y,tip.z);leaf.rotation.set(.65+(i%3)*.3,.1,a);leaf.scale.set(broad?.22:.085,broad?.4:.39,.9);
  }
 }
 function build(kind:DecorationKind){
  const g=new T.Group();
  if(kind==='pothos'){
   plant(g,true);reportModel('Loading pothos…');
   void loadCounterModel('pothos').then(model=>{if(!g.parent)return;for(const child of [...g.children]){child.traverse(o=>{if(o instanceof T.Mesh&&o.geometry!==leafGeometry)o.geometry.dispose();});child.removeFromParent();}g.add(model);reportModel('Pothos ready. Apply to keep it.');}).catch(()=>reportModel('Pothos could not load. The plant preview is still available; choose it again to retry.'));
  }
  if(kind==='fern'||kind==='monstera')plant(g,kind==='monstera');
  if(kind==='flowers'){
   lathe(g,[[0,0],[.16,0],[.27,.13],[.28,.35],[.15,.52],[.11,.58],[.1,.58],[.13,.5]],glaze);
   const petals=new T.MeshPhysicalMaterial({color:'#cf997f',roughness:.48,side:T.DoubleSide});
   for(let i=0;i<7;i++){const a=i*2.399,x=Math.cos(a)*.17,y=Math.sin(a)*.17,z=.9+(i%3)*.13;mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,0,.4),new T.Vector3(x,y,z)]),8,.008,4,false),dark);for(let k=0;k<6;k++){const angle=k*Math.PI/3,p=mesh(g,new T.SphereGeometry(.08,12,8),petals,x+Math.cos(angle)*.06,y+Math.sin(angle)*.06,z);p.scale.set(1,.65,.42);}mesh(g,new T.SphereGeometry(.037,10,8),brass,x,y,z+.02);}
  }
  if(kind==='candle'){
   cyl(g,.22,.06,brass,.03);cyl(g,.16,.38,glaze,.23);cyl(g,.008,.045,dark,.445);
   const flame=mesh(g,new T.SphereGeometry(.037,12,12),new T.MeshBasicMaterial({color:'#ffd995'}),0,0,.495);flame.scale.set(.6,.6,1.8);
   const light=new T.PointLight('#ffb866',.5,2.4);light.position.z=.55;light.name='decoration-light';g.add(light);
  }
  if(kind==='books')for(let i=0;i<3;i++){
   const cover=new T.MeshStandardMaterial({color:['#526d63','#c49665','#7e5547'][i],roughness:.75});
   mesh(g,new T.BoxGeometry(.82,.57,.025),cover,0,0,.025+i*.11);mesh(g,new T.BoxGeometry(.77,.53,.07),glaze,0,0,.065+i*.11);mesh(g,new T.BoxGeometry(.82,.57,.025),cover,0,0,.11+i*.11);
  }
  if(kind==='lamp'){
   cyl(g,.29,.065,dark,.04);cyl(g,.027,.88,brass,.5);
   lathe(g,[[.38,.91],[.38,.93],[.22,1.25],[.2,1.25],[.35,.93]],new T.MeshPhysicalMaterial({color:'#a3b58e',roughness:.46,side:T.DoubleSide,clearcoat:.35}));
   const bulb=mesh(g,new T.SphereGeometry(.09,16,12),new T.MeshBasicMaterial({color:'#ffe3a6'}),0,0,.99);bulb.castShadow=false;
   const light=new T.PointLight('#ffd197',3,4,2);light.name='decoration-light';light.position.z=.91;g.add(light);
  }
  return g;
 }
 const nodes=new Map<string,T.Group>();
 function update(room:RoomConfig){
  const keep=new Set(room.decorations.map(d=>d.id));
  for(const [id,g] of nodes)if(!keep.has(id)){g.removeFromParent();g.traverse(o=>{if(o instanceof T.Mesh&&o.geometry!==leafGeometry&&!o.userData.importedModel)o.geometry.dispose();});nodes.delete(id);}
  for(const d of room.decorations){let g=nodes.get(d.id);if(!g){g=build(d.kind);g.name='decoration-'+d.id;g.userData.placementId=d.id;nodes.set(d.id,g);root.add(g);}g.position.set(d.x,d.y,-.788);g.rotation.z=d.rotation;g.traverse(o=>{if(o instanceof T.PointLight)o.intensity=(d.kind==='lamp'?3:.5)*(room.light==='evening'?1.4:.7);});}
 }
 const fixtures=new T.Group();fixtures.name='installed-lights';scene.add(fixtures);
 const shadeMat=new T.MeshPhysicalMaterial({color:'#c2a06a',metalness:.35,roughness:.38,side:T.DoubleSide});
 for(const x of [.9,4.8]){
  const pendant=new T.Group();pendant.name='pendant-fixture';pendant.position.set(x,.4,3.25);fixtures.add(pendant);
  cyl(pendant,.018,2.9,dark,1.8);lathe(pendant,[[.5,0],[.5,.04],[.23,.43],[.2,.43],[.46,.04]],shadeMat);
  const bulb=mesh(pendant,new T.SphereGeometry(.09,16,12),new T.MeshBasicMaterial({color:'#ffe5af'}),0,0,.15);bulb.castShadow=false;
  const light=new T.PointLight('#ffd8a0',5,6,2);light.name='fixture-light';light.position.z=-.02;pendant.add(light);
 }
 const task=build('lamp');task.name='task-fixture';task.position.set(-1.8,.65,-.788);fixtures.add(task);
 function lighting(room:RoomConfig){fixtures.children.forEach(g=>{g.visible=g.name==='task-fixture'?room.fixture==='task'||room.fixture==='both':room.fixture==='pendant'||room.fixture==='both';});fixtures.traverse(o=>{if(o instanceof T.PointLight)o.intensity=room.light==='evening'?7:room.light==='morning'?2:4;});}
 return {update(room:RoomConfig){update(room);lighting(room);},root,move(id:string,x:number,y:number){nodes.get(id)?.position.set(x,y,-.788);}};
}
