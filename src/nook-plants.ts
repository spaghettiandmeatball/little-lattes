import * as T from 'three';

/** Shared curved blades and midribs in authored slots outside the work zone. */
export function addNookPlants(scene:T.Scene){
 const clay=new T.MeshStandardMaterial({color:'#b87859',roughness:.78});clay.name='plant-pot';
 const soil=new T.MeshStandardMaterial({color:'#29251b',roughness:1});
 const leafMats=['#36583d','#597a46','#748e51'].map(color=>new T.MeshPhysicalMaterial({color,roughness:.58,side:T.DoubleSide,clearcoat:.12}));
 const stem=new T.MeshStandardMaterial({color:'#6a7c45',roughness:.85});
 const groups=[new T.Group(),new T.Group()];groups[0].name='shelf-plants';groups[1].name='window-plants';scene.add(...groups);
 function pot(group:T.Group,x:number,y:number,z:number,r:number,h:number){
  const points=[new T.Vector2(r*.65,-h/2),new T.Vector2(r*.73,-h/2+.025),new T.Vector2(r*.97,h/2-.045),new T.Vector2(r,h/2),new T.Vector2(r*.89,h/2+.018),new T.Vector2(r*.83,h/2-.06)];
  const body=new T.Mesh(new T.LatheGeometry(points,32),clay);body.rotation.x=Math.PI/2;body.position.set(x,y,z);body.castShadow=body.receiveShadow=true;group.add(body);
  const top=new T.Mesh(new T.CircleGeometry(r*.85,32),soil);top.position.set(x,y,z+h*.39);group.add(top);
 }
 const geometry=new T.BufferGeometry(),vertices:number[]=[],indices:number[]=[],uvs:number[]=[];
 for(let j=0;j<=12;j++){const t=j/12,width=Math.pow(Math.sin(Math.PI*t),.8);for(let side=-1;side<=1;side++){vertices.push(side*width,t*2,Math.sin(t*Math.PI)*.16-Math.abs(side)*width*.12);uvs.push((side+1)/2,t);}}
 for(let j=0;j<12;j++)for(let k=0;k<2;k++){const a=j*3+k;indices.push(a,a+1,a+3,a+1,a+4,a+3);}
 geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 function blade(group:T.Group,origin:T.Vector3,length:number,width:number,angle:number,tilt:number,index:number){
  const leaf=new T.Group();leaf.position.copy(origin);leaf.rotation.set(tilt,.18*Math.sin(index),angle);group.add(leaf);
  const mesh=new T.Mesh(geometry,leafMats[index%3]);mesh.scale.set(width,length,1);mesh.castShadow=mesh.receiveShadow=true;leaf.add(mesh);
  const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(0,length,.16),new T.Vector3(0,length*2,0)]);
  const vein=new T.Mesh(new T.TubeGeometry(curve,10,.004,4,false),stem);leaf.add(vein);
 }
 function branch(group:T.Group,a:T.Vector3,b:T.Vector3){const path=new T.CatmullRomCurve3([a,a.clone().lerp(b,.5).add(new T.Vector3(0,0,.07)),b]);const mesh=new T.Mesh(new T.TubeGeometry(path,10,.012,5,false),stem);group.add(mesh);}
 pot(groups[0],.91,1.27,4.31,.27,.33);
 for(let i=0;i<13;i++){const a=i*2.399,reach=.22+(i%4)*.1,tip=new T.Vector3(.91+Math.cos(a)*reach,1.27+Math.sin(a)*reach,4.38-(i%4)*.21);branch(groups[0],new T.Vector3(.91,1.27,4.46),tip);blade(groups[0],tip,.16,.095,a,-.35-i%3*.3,i);}
 pot(groups[1],-4.66,1.8,-.54,.42,.68);
 for(let i=0;i<10;i++){const a=i*2.4,tip=new T.Vector3(-4.66+Math.cos(a)*.2,1.8+Math.sin(a)*.2,.1+i%4*.24);branch(groups[1],new T.Vector3(-4.66,1.8,-.25),tip);blade(groups[1],tip,.44,.2,a,.25+i%3*.15,i);}
 pot(groups[1],1.6,1.6,-.53,.23,.35);
 for(let i=0;i<13;i++){const a=i*2.4,tip=new T.Vector3(1.6+Math.cos(a)*.08,1.6+Math.sin(a)*.08,-.29+i%3*.07);branch(groups[1],new T.Vector3(1.6,1.6,-.4),tip);blade(groups[1],tip,.15,.055,a,.5,i);}
}
