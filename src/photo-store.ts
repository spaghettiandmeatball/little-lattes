import type {RoomConfig} from './room-config';
export type PhotoRecord={id:string;image:Blob;thumbnail:Blob;title:string;createdAt:number;width:number;height:number;favorite:boolean;deleted:boolean;snapshotId:string;room:RoomConfig;recipe:{version:1;angle:number;framing:number;setting:string;material:'liquid-pbr-r180-v1';sourceModel:string;tick:number;fillMl:number};};
export type PhotoSummary=Omit<PhotoRecord,'image'>;
let database:Promise<IDBDatabase>|undefined;
function open(){
 return database??=new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open('little-latte-photos',1);
  request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('photos',{keyPath:'id'});const summaries=db.createObjectStore('summaries',{keyPath:'id'});summaries.createIndex('createdAt','createdAt');};
  request.onerror=()=>{database=undefined;reject(request.error);};
  request.onblocked=()=>{database=undefined;reject(Error('Close other Little Latte tabs and retry.'));};
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();database=undefined;};resolve(db);};
 });
}
export async function savePhoto(photo:PhotoRecord){
 const db=await open();
 return new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(['photos','summaries'],'readwrite');const {image,...summary}=photo;
  tx.objectStore('photos').put(photo);tx.objectStore('summaries').put(summary);
  tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error??Error('Could not save this shot.'));
 });
}
export async function photoPage(before=Infinity,limit=30,trash=false){
 const db=await open();return new Promise<{items:PhotoSummary[];next:number|null}>((resolve,reject)=>{
  const tx=db.transaction('summaries'),items:PhotoSummary[]=[];
  const request=tx.objectStore('summaries').index('createdAt').openCursor(before===Infinity?null:IDBKeyRange.upperBound(before,true),'prev');
  let next:number|null=null;
  request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;const value=cursor.value as PhotoSummary;if(value.deleted===trash)items.push(value);if(items.length===limit){next=value.createdAt;return;}cursor.continue();};
  tx.oncomplete=()=>resolve({items,next});tx.onerror=()=>reject(tx.error);
 });
}
export async function getPhoto(id:string){const db=await open();return new Promise<PhotoRecord>((resolve,reject)=>{const request=db.transaction('photos').objectStore('photos').get(id);request.onsuccess=()=>request.result?resolve(request.result):reject(Error('Photo unavailable.'));request.onerror=()=>reject(request.error);});}
export async function photoCount(){const db=await open();return new Promise<number>((resolve,reject)=>{let count=0;const tx=db.transaction('summaries'),r=tx.objectStore('summaries').openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(!c.value.deleted)count++;c.continue();}};tx.oncomplete=()=>resolve(count);tx.onerror=()=>reject(tx.error);});}
