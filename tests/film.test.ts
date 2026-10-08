import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CozyLiquid} from '../src/cozy-liquid.ts';
import {LatteFilm} from '../src/latte-film.ts';
import {CozyView,LATTE_VERSION} from '../src/cozy-view.ts';
import {solveLatteJet} from '../src/equipment.ts';
import {jetPoint} from '../src/jet.ts';
import {heightForClearance} from '../src/cozy-controls.ts';
import {initialState} from '../src/input.ts';
import {drawingRun,cut,restFilm} from './drawing-investigation.ts';
import {readFileSync} from 'node:fs';
import {replayRecording} from './cozy-probes.ts';
import {validRecording} from '../src/recording.ts';
function area(f:LatteFilm){return f.metrics().whiteAreaMm2;}
test('height changes surface mixing at matched liquid expenditure; tilted stream lands at the shared endpoint',()=>{
 const a=new LatteFilm(),b=new LatteFilm(),liquid=new CozyLiquid(48);
 for(let k=0;k<90;k++)for(const [f,clearance] of [[a,.003],[b,.045]] as const){const state={...initialState(),height:heightForClearance(clearance),pouring:true},jet=solveLatteJet(state,.5/60,1/60,{x:0,y:0},liquid,false);f.step([{x:.5,y:.5,jet}],1/60);const end=jetPoint(jet,1);assert.ok(Math.hypot(end.x-jet.impact.x,end.y-jet.impact.y,end.z-jet.impact.z)<1e-12);}
 assert.ok(area(a)>area(b)*4);assert.ok(a.metrics().maxPurity>b.metrics().maxPurity);
});
test('wiggling produces alternating milk and crema bands, then a raised cut pulls existing milk toward a point',()=>{
 const {film,liquid}=drawingRun('bands-fast',.42,.14);let maximum=0;
 for(let x=Math.floor(film.size*.35);x<film.size*.65;x++){let peaks=0,previous=0;for(let y=Math.floor(film.size*.2);y<film.size*.8;y++){const c=film.white[y*film.size+x];if(c>.6&&previous<=.6)peaks++;previous=c;}maximum=Math.max(maximum,peaks);}
 assert.ok(maximum>=4,`only ${maximum} separated bands`);const before=film.white.slice(),whiteArea=area(film);cut(liquid,film);let change=0;for(let i=0;i<before.length;i++)change+=Math.abs(before[i]-film.white[i]);assert.ok(change>20);assert.ok(area(film)>whiteArea*.6);assert.ok(Math.abs(liquid.metrics().milkErrorMl)<1e-7);
 restFilm(film,.5);const settled=film.white.slice();restFilm(film,10);let drift=0;for(let i=0;i<settled.length;i++){assert.ok(Number.isFinite(film.white[i])&&film.white[i]>=0&&film.white[i]<=1);drift+=Math.abs(settled[i]-film.white[i]);}assert.ok(drift<.01,'rest must not smear the pattern');
});
test('delivery and travel speed change the surface result without changing accounting',()=>{
 const gentle=drawingRun('bands',.25,.08),generous=drawingRun('bands',.65,.08),fast=drawingRun('bands',.25,.14);
 assert.ok(area(generous.film)>area(gentle.film)*1.3);assert.ok(area(gentle.film)>area(fast.film)*1.1);
 for(const s of [gentle,generous,fast])assert.ok(Math.abs(s.liquid.metrics().liquidErrorMl)<1e-7);
});
test('fresh resets both the bulk and surface; dry and off-cup motion cannot deposit milk',()=>{
 const s=new CozyView();const state={...initialState(),pouring:true};const slice={a:state,b:state,dt:1/60};for(let k=0;k<30;k++)s.stepBatch([{slice,quantity:.5/60,jet:solveLatteJet(state,.5/60,1/60,{x:0,y:0},s,false)}]);assert.equal(s.inspect().mode,LATTE_VERSION);assert.ok(area(s.film)>0);s.reset();assert.equal(area(s.film),0);assert.equal(s.emittedMl,0);const jet=solveLatteJet({...state,x:1.2},.5/60,1/60,{x:1,y:1},s,false);s.film.step([{x:1.2,y:.5,jet}],1/60);assert.equal(area(s.film),0);s.dispose();
});
test('actual mouse recording reproduces live milk and surface at 30, 60 and 120 Hz',()=>{
 const recording=JSON.parse(readFileSync(new URL('../docs/film-recorded-mouse.json',import.meta.url),'utf8')),live=JSON.parse(readFileSync(new URL('../docs/film-mouse-live.json',import.meta.url),'utf8'));assert.ok(validRecording(recording));
 const reference=replayRecording(recording,60,true);assert.ok(reference.s instanceof CozyView);assert.ok(Math.abs(reference.s.emittedMl-live.metrics.emittedMl)<1e-7);let difference=0;for(let i=0;i<live.film.length;i++)difference=Math.max(difference,Math.abs(live.film[i]-reference.s.film.white[i]));assert.ok(difference<5e-5,`live film discrepancy ${difference}`);
 for(const rate of [30,120]){const replay=replayRecording(recording,rate);assert.ok(replay.s instanceof CozyView);assert.deepEqual(replay.s.film.white,reference.s.film.white);assert.equal(replay.s.emittedMl,reference.s.emittedMl);assert.equal(replay.ledger.remaining,reference.ledger.remaining);replay.s.dispose();}reference.s.dispose();
});
