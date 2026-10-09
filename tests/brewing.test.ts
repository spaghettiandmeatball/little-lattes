import test from 'node:test';
import assert from 'node:assert/strict';
import {steamedMilk,brewResult} from '../src/brewing-model.ts';
import {LatteFilm} from '../src/latte-film.ts';
import {solveJet} from '../src/jet.ts';
import {initialState} from '../src/input.ts';
import {validRecording,type Recording} from '../src/recording.ts';
import {defaults} from '../src/model.ts';
test('steaming moves from thin to silky to overheated, with bounded quality',()=>{
 assert.ok(steamedMilk(1).quality<steamedMilk(6).quality);assert.equal(steamedMilk(6).label,'Silky microfoam');assert.ok(steamedMilk(16).quality<steamedMilk(6).quality);
 for(const t of [-1,0,4,5,9,12,16,20,999,NaN]){const m=steamedMilk(t);assert.ok(m.quality>=0&&m.quality<=1);assert.ok(Number.isFinite(m.temperature));}
});
test('brew completion and early serving remain bounded for both methods',()=>{
 for(const kind of ['espresso','pour-over'] as const){assert.equal(brewResult(kind,0).progress,0);assert.equal(brewResult(kind,100).progress,1);assert.ok(brewResult(kind,3).strength<brewResult(kind,100).strength);}
});
test('milk preparation changes surface foam without creating dry deposits',()=>{
 const thin=new LatteFilm(64),silky=new LatteFilm(64);thin.milkQuality=.2;
 const jet=solveJet({...initialState(),height:0,flow:.5,pouring:true},.01,1/60);
 for(let i=0;i<15;i++){thin.step([{x:.5,y:.5,jet}],1/60);silky.step([{x:.5,y:.5,jet}],1/60);}
 assert.ok(silky.metrics().maxPurity>thin.metrics().maxPurity);
 const empty=new LatteFilm(64);empty.milkQuality=.2;empty.step([],1/60);assert.equal(empty.metrics().maxPurity,0);
});
test('recorded milk texture round trips and rejects invalid preparation values',()=>{
 const recording:Recording={version:1,kind:'recorded-input',duration:1,initial:initialState(),recipe:defaults.Accessible,unlimited:false,events:[],skips:[],environment:{solver:'gpu-volume-film-3',prepared:true,initialCoffeeMl:55,initialMilkMl:0,stopAtRim:true,scheme:'advanced',intention:'draw',delivery:.35,leftHanded:false,milkQuality:.55}};
 assert.ok(validRecording(JSON.parse(JSON.stringify(recording))));
 for(const value of [-1,1.2,NaN]){recording.environment!.milkQuality=value;assert.equal(validRecording(recording),false);}
 delete recording.environment!.milkQuality;assert.ok(validRecording(recording));
});
