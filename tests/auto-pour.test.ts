import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rosettaPour,cheekyPour,sampleScript} from '../src/replays.ts';
import {InputTimeline} from '../src/input.ts';
import {CozyLiquid} from '../src/cozy-liquid.ts';
import {LatteFilm} from '../src/latte-film.ts';
import {solveLatteJet} from '../src/equipment.ts';
test('auto rosettas produce separated folds through actual pouring, without spilling or losing volume',()=>{
 for(const [name,authored] of [['Classic',rosettaPour()],['Feather',rosettaPour(Math.PI/3)],['Cheeky',cheekyPour()]] as const){
  const replay=sampleScript(authored),timeline=new InputTimeline(),liquid=new CozyLiquid(48),film=new LatteFilm(160);const initialFill=liquid.fillMl;film.response='taper';
  for(const e of replay.events)timeline.push(e);
  let emitted=0,cutChange=0;
  for(let k=0;k<Math.ceil(replay.duration*60);k++)for(const slice of timeline.consume(k/60,(k+1)/60)){
   const a={...slice.a,x:(slice.a.x+slice.b.x)/2,y:(slice.a.y+slice.b.y)/2};
   const amount=a.pouring?a.flow*slice.dt:0;emitted+=amount*12;
   const jet=solveLatteJet(a,amount,slice.dt,{x:(slice.b.x-slice.a.x)/slice.dt,y:(slice.b.y-slice.a.y)/slice.dt},liquid,true,'roomy-pour-3');
   const sources=amount?[{x:a.x,y:a.y,jet}]:[],before=a.intention==='finish'?film.white.slice():undefined;
   liquid.step(sources,slice.dt);film.step(sources,slice.dt);
   if(before)for(let i=0;i<before.length;i++)cutChange+=Math.abs(before[i]-film.white[i]);
  }
  if(replay.finishingStrokes){
   const before=film.white.slice();
   for(const stroke of replay.finishingStrokes)for(let pass=0;pass<(stroke.passes??1);pass++)for(let i=1;i<stroke.points.length;i++)film.etch(stroke.points[i-1],stroke.points[i],stroke.tool);
   let changed=0,untouched=0;for(let i=0;i<before.length;i++){if(before[i]!==film.white[i])changed++;else if(before[i]>.05&&before[i]<.95)untouched++;}
   assert.ok(changed>10,'outline shaping should change the silhouette');assert.ok(untouched>500,'fine interior folds must remain unchanged');
  }
  let folds=0;for(let x=32;x<128;x++){let peaks=0,previous=0;for(let y=20;y<140;y++){const w=film.white[y*160+x];if(w>.6&&previous<=.6)peaks++;previous=w;}folds=Math.max(folds,peaks);}
  assert.ok(folds>=4,`Only ${folds} separated folds in ${name}`);if(name==='Classic')assert.ok(cutChange>20,'Classic finishing stroke must move existing milk');else assert.equal(cutChange,0,'Decorative pour must not emit a finishing milk stroke');assert.ok(emitted>20&&emitted<36);assert.ok(Math.abs(liquid.fillMl-initialFill-emitted)<1e-6);assert.ok(film.white.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
 }
});
test('the dry reposition between leaf pour and pull-through emits no connecting trail',()=>{
 const replay=rosettaPour(),timeline=new InputTimeline();for(const e of replay.events)timeline.push(e);
 for(const slice of timeline.consume(5.001,5.299))assert.equal(slice.a.pouring,false);
 assert.equal(replay.events.at(-1)!.pouring,false);
});
