import * as T from 'three';
import {PITCHER} from './vessel';
/** Rolled open wall and formed lip, terminating at the equipment model's tip. */
export function createPitcher(material:T.Material,shape:'classic'|'round'|'tall'='classic'){
 const group=new T.Group(),positions:number[]=[],indices:number[]=[],segments=64;
 const rim:T.Vector3[]=[];
 for(let layer=0;layer<4;layer++)for(let i=0;i<=segments;i++){
  const angle=i/segments*Math.PI*2,offset=Math.atan2(Math.sin(angle+Math.PI/2),Math.cos(angle+Math.PI/2)),form=Math.exp(-offset*offset/.10);
  const upper=layer===1||layer===2,inner=layer>=2;
  const bodyRadius=shape==='tall'?.18:PITCHER.bodyRadius,baseRadius=shape==='round'?.205:shape==='tall'?.13:.16;
  const radius=(upper?bodyRadius+(-PITCHER.tipY-bodyRadius)*form:baseRadius)-(inner?.008:0);
  const z=upper?PITCHER.bodyHalfHeight+(PITCHER.tipZ-PITCHER.bodyHalfHeight)*form:-PITCHER.bodyHalfHeight+(inner?.012:0);
  const point=new T.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius,z);positions.push(...point.toArray());
  if(layer===1&&i<segments)rim.push(point);
 }
 for(let layer=0;layer<3;layer++)for(let i=0;i<segments;i++){const a=layer*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const body=new T.Mesh(geometry,material);body.castShadow=true;group.add(body);
 const rolled=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rim,true),128,.006,6,true),material);group.add(rolled);
 const baseRadius=shape==='round'?.2:shape==='tall'?.125:.155;
 const base=new T.Mesh(new T.CylinderGeometry(baseRadius,baseRadius-.002,.012,48),material);base.rotation.x=Math.PI/2;base.position.z=-.234;group.add(base);
 const gripPath=new T.CatmullRomCurve3([new T.Vector3(0,.21,.15),new T.Vector3(0,.37,.13),new T.Vector3(0,.37,-.12),new T.Vector3(0,.18,-.14)]);
 const grip=new T.Mesh(new T.TubeGeometry(gripPath,24,.023,8,false),material);grip.castShadow=true;group.add(grip);
 group.userData.photoHidden=true;return group;
}
