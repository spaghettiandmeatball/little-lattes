import * as T from 'three';

type Finish='oak'|'plaster'|'glaze'|'steel';
const maps=new Map<Finish,T.CanvasTexture>();
/** Tileable, deterministic surface detail; color remains controlled by room finishes. */
export function detailTexture(finish:Finish){
 const cached=maps.get(finish);if(cached)return cached;
 const n=512,canvas=document.createElement('canvas');canvas.width=canvas.height=n;
 const ctx=canvas.getContext('2d')!,data=ctx.createImageData(n,n);
 let seed=18421;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const bands=Array.from({length:n},()=>random());
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const noise=random()-.5,u=x/n*Math.PI*2,v=y/n*Math.PI*2;
  const bend=Math.sin(u)*1.4+Math.sin(u*3+v)*.35;
  const grain=Math.sin(v*37+bend)+Math.sin(v*79+bend*2)*.32+Math.sin(v*173+bend*3)*.12;
  const pore=Math.pow(Math.max(0,Math.sin(v*113+bend*4)),18);
  const value=finish==='oak'?221+grain*9-pore*12+noise*6:finish==='steel'?205+bands[y]*34+noise*5:finish==='glaze'?225+noise*12+Math.sin(u*8)*Math.sin(v*7)*3:213+noise*29+Math.sin(u*13)*Math.sin(v*11)*5;
  const i=(y*n+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=value;data.data[i+3]=255;
 }
 ctx.putImageData(data,0,0);const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;texture.repeat.set(finish==='oak'?2:4,finish==='oak'?1:4);maps.set(finish,texture);return texture;
}
export function finishMaterial(material:T.MeshStandardMaterial,finish:Finish){
 const texture=detailTexture(finish);material.bumpMap=texture;material.bumpScale=finish==='plaster'?.012:finish==='oak'?.01:finish==='steel'?.0015:.001;
 material.roughnessMap=texture;
}
