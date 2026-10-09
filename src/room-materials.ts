import * as T from 'three';
import {roomCatalog,type RoomConfig} from './room-config';
import {detailTexture} from './material-detail';

let grain:T.Texture|null=null,stone:T.CanvasTexture|undefined;
function stoneTexture(){
 if(stone)return stone;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const context=canvas.getContext('2d')!;
 const image=context.createImageData(256,256);let seed=8291;
 for(let i=0;i<image.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const value=211+(seed%24);image.data[i]=image.data[i+1]=image.data[i+2]=value;image.data[i+3]=255;}
 context.putImageData(image,0,0);stone=new T.CanvasTexture(canvas);stone.colorSpace=T.SRGBColorSpace;stone.wrapS=stone.wrapT=T.RepeatWrapping;stone.repeat.set(3,3);return stone;
}

export function makeOutdoorTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const context=canvas.getContext('2d')!;
 const sky=context.createLinearGradient(0,0,0,512);sky.addColorStop(0,'#c3d4c6');sky.addColorStop(1,'#e4ddbc');context.fillStyle=sky;context.fillRect(0,0,512,512);
 let seed=247;context.filter='blur(5px)';
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<260;i++){const x=random()*590-40,y=170+random()*390,r=8+random()*42;context.fillStyle=['#57754b66','#6f8b5555','#a1b77b88','#8d9c6377'][i%4];context.beginPath();context.ellipse(x,y,r,r*.65,random()*3,0,Math.PI*2);context.fill();}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
}

export function makeWindowEnvironment(renderer:T.WebGLRenderer){
 const studio=new T.Scene();studio.background=new T.Color('#66655d');
 const panel=(w:number,h:number,color:number,intensity:number,x:number,y:number,z:number)=>{
  const material=new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity),side:T.DoubleSide});
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);mesh.position.set(x,y,z);mesh.lookAt(0,0,0);studio.add(mesh);
 };
 // Broad window to the same upper-left side as the room's actual opening.
 panel(5,7,0xffedcf,3.2,-5,3,6);panel(8,3,0xcad9db,.6,4,-5,3);panel(2,2,0xffbc73,1,4,2,2);
 const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromScene(studio,.03,.1,30);
 studio.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});pmrem.dispose();return target;
}
export function applyRoom(scene:T.Scene,room:RoomConfig){
 scene.traverse(o=>{
  if(o instanceof T.Mesh){
   const materials=Array.isArray(o.material)?o.material:[o.material];
   for(const m of materials){if(!(m instanceof T.MeshStandardMaterial))continue;
    if(m.name==='counter'){grain??=detailTexture('oak');m.color.set(roomCatalog.counter[room.counter].color);m.roughness=room.counter==='stone'?.55:.38;m.map=room.counter==='stone'?stoneTexture():grain;m.bumpMap=m.map;m.roughnessMap=m.map;m.bumpScale=room.counter==='stone'?.004:.01;}
    if(m.name==='wall')m.color.set(roomCatalog.wall[room.wall].color);
    if(m.name==='cup')m.color.set(roomCatalog.cup[room.cup].color);
    if(m.name==='pitcher'){m.color.set(roomCatalog.pitcher[room.pitcher].color);m.metalness=room.pitcher==='coated'?.12:1;m.roughness=room.pitcher==='polished'?.13:room.pitcher==='brushed'?.3:.28;}
    if(m.name==='plant-pot')m.color.set(roomCatalog.pots[room.pots].color);
   }
  }
  if(o.name==='window-plants')o.visible=room.plants!=='shelf';
  if(o.name==='shelf-plants')o.visible=room.plants!=='window';
  if(o.name.startsWith('personal-'))o.visible=o.name==='personal-'+room.objects;
  if(o instanceof T.DirectionalLight){o.color.set(room.light==='morning'?'#f1f7ff':room.light==='evening'?'#ffd5a0':'#ffebcd');o.intensity=room.light==='evening'?.85:room.light==='morning'?2:2.25;}
  if(o instanceof T.HemisphereLight)o.intensity=room.light==='evening'?.65:1.15;
  if(o instanceof T.PointLight&&!o.name)o.intensity=room.light==='evening'?22:7;
 });
 scene.environmentIntensity=room.light==='evening'?.4:.65;
}
