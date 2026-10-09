import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export type CounterModel='la-marzocco'|'fellow-kettle'|'pothos';
const cache=new Map<CounterModel,Promise<T.Group>>();
// Embedded GLBs are fetched only when an upgrade is chosen. Clones share immutable assets.
export function loadCounterModel(id:CounterModel):Promise<T.Group>{
 let pending=cache.get(id);
 if(!pending){
  pending=new GLTFLoader().loadAsync(`/models/${id}.glb`).then(({scene})=>{
   const model=new T.Group();scene.rotation.x+=Math.PI/2;model.add(scene);model.updateMatrixWorld(true);
   const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
   const scale=id==='la-marzocco'?3/size.x:(id==='fellow-kettle'?.75:1.25)/size.z;
   scene.position.set(-center.x,-center.y,-bounds.min.z);model.scale.setScalar(scale);
   model.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=id!=='fellow-kettle';o.receiveShadow=true;o.userData.importedModel=true;
    for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m instanceof T.MeshStandardMaterial){if(m.map)m.map.anisotropy=8;if(id==='pothos'&&m.transparent){m.alphaTest=.3;m.transparent=false;m.depthWrite=true;}}}
   }});
   return model;
  }).catch(error=>{cache.delete(id);throw error;});cache.set(id,pending);
 }
 return pending.then(model=>model.clone(true));
}

export function reportModel(message:string){window.dispatchEvent(new CustomEvent('counter-model-status',{detail:message}));}
