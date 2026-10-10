import test from 'node:test';
import assert from 'node:assert/strict';
import {detailAim,foamToolSettings} from '../src/tool-controls.ts';
import {LatteFilm} from '../src/latte-film.ts';
test('precision reduces travel and changing gain does not jump the tool',()=>{
 const start={x:.5,y:.5},raw={x:.7,y:.6},precise=detailAim(start,start,raw,true);
 assert.ok(Math.abs(precise.x-.57)<1e-12);assert.ok(Math.abs(precise.y-.535)<1e-12);
 assert.deepEqual(detailAim(precise,raw,raw,false),precise);
 const back=detailAim(precise,raw,start,true);assert.ok(Math.hypot(back.x-.5,back.y-.5)<1e-12);
 assert.ok(Math.hypot(detailAim(start,start,{x:4,y:3},false).x-.5,detailAim(start,start,{x:4,y:3},false).y-.5)<=.465+1e-12);
});
test('precision tool contact is smaller and leaves more nearby folds unchanged',()=>{
 for(const tool of ['pick','spoon'] as const){
  const normal=new LatteFilm(160),precise=new LatteFilm(160);
  for(let y=0;y<160;y++)for(let x=0;x<160;x++){const i=y*160+x;if(normal.mask[i])normal.white[i]=precise.white[i]=x%6<3?.9:.1;}
  const before=normal.white.slice(),from={x:.45,y:.5},to={x:.55,y:.5};normal.etch(from,to,tool);precise.etch(from,to,tool,true);
  const changed=(f:LatteFilm)=>f.white.reduce((sum,v,i)=>sum+(Math.abs(v-before[i])>1e-4?1:0),0);
  assert.ok(changed(precise)>0);assert.ok(changed(precise)<changed(normal)*.8);
  assert.ok(foamToolSettings(tool,true).radius<foamToolSettings(tool).radius);
  assert.ok(precise.white.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
 }
});
