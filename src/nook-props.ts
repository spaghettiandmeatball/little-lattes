import * as T from 'three';
export function addPersonalObjects(scene:T.Scene){
 const material=(color:string,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});
 const linen=material('#d5c7ad'),paper=material('#eee1c9'),cover=material('#577365'),pastry=material('#bb7635',.62),plate=material('#e4d6ba',.3);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#a8a8a8';ctx.fillRect(0,0,128,128);for(let i=0;i<128;i+=4){ctx.fillStyle=i%8?'#999':'#bcbcbc';ctx.fillRect(i,0,1,128);ctx.fillRect(0,i,128,1);}const weave=new T.CanvasTexture(canvas);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(5,5);linen.bumpMap=weave;linen.bumpScale=.009;
 function add(group:T.Group,geometry:T.BufferGeometry,mat:T.Material,x:number,y:number,z:number){const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;}
 for(const name of ['linen','journal','pastry']){
  const group=new T.Group();group.name='personal-'+name;group.position.set(-2.15,-.05,-.76);group.rotation.z=-.22;scene.add(group);
  add(group,new T.BoxGeometry(1.2,1.55,.035),linen,0,0,0);
  if(name==='journal'){
   add(group,new T.BoxGeometry(.88,1.2,.085),paper,0,.04,.066);add(group,new T.BoxGeometry(.94,1.26,.025),cover,0,.04,.12);add(group,new T.BoxGeometry(.022,1.26,.009),material('#cdb98a'),.22,.04,.14);
  }else if(name==='pastry'){
   const dish=add(group,new T.CylinderGeometry(.54,.49,.065,48),plate,0,0,.04);dish.rotation.x=Math.PI/2;
   const curve=new T.CatmullRomCurve3([new T.Vector3(-.32,-.08,.13),new T.Vector3(-.2,.15,.17),new T.Vector3(0,.23,.19),new T.Vector3(.2,.15,.17),new T.Vector3(.32,-.08,.13)]);
   add(group,new T.TubeGeometry(curve,28,.115,12,false),pastry,0,0,0);
  }
 }
}
