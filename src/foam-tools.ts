import * as T from 'three';

export function createFoamTool(kind:'pick'|'spoon',metal:T.Material,grip:T.Material){
 const root=new T.Group();root.name='foam-'+kind;
 const add=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;root.add(mesh);return mesh;};
 if(kind==='pick'){
  const shaft=add(new T.CylinderGeometry(.011,.008,.64,12),metal,0,.32,.025);shaft.rotation.z=0;
  const handle=add(new T.CylinderGeometry(.025,.025,.25,16),grip,0,.65,.025);handle.rotation.z=0;
  const tip=add(new T.ConeGeometry(.011,.07,12),metal,0,-.025,.025);tip.rotation.z=Math.PI;
 }else{
  const bowlGeometry=new T.SphereGeometry(1,32,16,0,Math.PI*2,Math.PI/2,Math.PI/2);bowlGeometry.rotateX(Math.PI/2);bowlGeometry.scale(.085,.13,.022);const bowlMetal=metal.clone();bowlMetal.side=T.DoubleSide;add(bowlGeometry,bowlMetal,0,0,.035);
  const handle=add(new T.BoxGeometry(.035,.64,.022),metal,0,.43,.036);handle.rotation.z=.03;
 }
 return root;
}
