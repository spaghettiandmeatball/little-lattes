import * as T from 'three';
export function createSteamVFX(){
 const root=new T.Group();root.name='steam-wand-cloud';root.userData.photoHidden=true;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d')!;
 for(let i=0;i<32;i++){const a=i*2.399,r=12+Math.sqrt(i/32)*55,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;const g=ctx.createRadialGradient(x,y,0,x,y,50);g.addColorStop(0,'rgba(244,249,255,.13)');g.addColorStop(1,'rgba(244,249,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);}
 const texture=new T.CanvasTexture(canvas);
 const particles=Array.from({length:84},(_,i)=>{const p=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,opacity:0,rotation:i*2.4,toneMapped:false}));root.add(p);return p;});
 const jet=new T.Mesh(new T.ConeGeometry(.09,.48,20),new T.MeshBasicMaterial({color:'#e4f3ff',transparent:true,opacity:0,depthWrite:false}));jet.rotation.x=Math.PI/2;jet.position.z=-.2;root.add(jet);
 let state:'off'|'purge'|'steam'='off',started=0,ended=-100;
 return {root,set(next:typeof state){if(next!==state){started=performance.now()/1000;if(next==='off')ended=started;state=next;}},animate(now:number){
  const fading=state==='off'?Math.max(0,1-(now-ended)/1.1):1,purge=state==='purge';root.visible=fading>0;
  (jet.material as T.MeshBasicMaterial).opacity=purge?.15:0;
  for(let i=0;i<particles.length;i++){const p=particles[i],life=((now-started)*(purge?1.1:.6)+i/particles.length)%1,spread=(purge?.08:.12)+life*.46;
   p.position.set(Math.sin(i*2.39+life*7)*spread+life*.2,Math.cos(i*1.73+life*5)*spread, purge?-.35+life*1.65:life*1.7);
   p.scale.set(.13+life*.85,.16+life*1.12,1);(p.material as T.SpriteMaterial).opacity=Math.sin(life*Math.PI)*fading*(purge?.38:.24);(p.material as T.SpriteMaterial).rotation=i*2.4+now*.14;
  }
 }};
}
