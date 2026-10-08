import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LatteFilm} from '../src/latte-film.ts';
import {heartPour,heartGeometry} from './heart-probe.ts';
import {initialState} from '../src/input.ts';
import {heightForClearance} from '../src/cozy-controls.ts';
import {solveLatteJet} from '../src/equipment.ts';
import {advancePhysicalSettings,intendedSettings} from '../src/cozy-controls.ts';

test('a forward raised cut keeps both heart lobes, a visible notch, and a narrower tip across normal speeds',()=>{
 for(const speed of [.25,.42,.65]){
  const s=heartPour(new LatteFilm(),-speed),a=heartGeometry(s.before,s.film.size),b=heartGeometry(s.film.white,s.film.size);
  assert.ok(b.notchCells>=8,`missing heart cleft at ${speed}`);
  assert.ok(b.retainedLeft>a.retainedLeft*.85&&b.retainedRight>a.retainedRight*.85,'cut destroyed a lobe');
  assert.ok(b.tipWidthCells<b.peakWidthCells*.45,`blunt tip at ${speed}`);
  assert.ok(b.lengthCells>a.lengthCells+3,'cut did not extend the tip');
 }
});

test('coalescing identical wet packets does not multiply directional force',()=>{
 const a=new LatteFilm(),b=new LatteFilm(),liquid={fillMl:55,depthAt:()=>.011};
 for(let k=0;k<150;k++){
  const state={...initialState(),x:.5,y:.59,pouring:true,flow:.5,height:heightForClearance(.0028)},jet=solveLatteJet(state,.5/60,1/60,{x:0,y:0},liquid,false);
  a.step([{x:.5,y:.59,jet}],1/60);
  b.step(Array.from({length:4},()=>({x:.5,y:.59,jet:{...jet,volumeMl:jet.volumeMl/4}})),1/60);
 }
 let sum=0,mass=0;for(let i=0;i<a.white.length;i++){sum+=Math.abs(a.white[i]-b.white[i]);mass+=a.white[i];}
 assert.ok(sum/mass<.001,`packet splitting changes film by ${sum/mass}`);
});

test('near-zero moving delivery approaches zero surface impulse',()=>{
 const s=heartPour(),before=s.film.white.slice(),liquid={fillMl:s.fillMl,depthAt:()=>.014};
 for(let k=0;k<60;k++){const state={...initialState(),x:.5,y:.5+k/60*.25,flow:1e-9,height:heightForClearance(.026),pouring:true},jet=solveLatteJet(state,1e-9/60,1/60,{x:0,y:.25},liquid,false);s.film.step([{x:state.x,y:state.y,jet}],1/60);}
 let error=0;for(let i=0;i<before.length;i++)error+=Math.abs(before[i]-s.film.white[i]);assert.ok(error<.001,`tiny flow moves existing art by ${error}`);
});

test('new moving cut narrows the heart tail without losing its lobes',()=>{
 const oldFilm=new LatteFilm(),newFilm=new LatteFilm();newFilm.response='taper';
 const old=heartPour(oldFilm,-.42),fresh=heartPour(newFilm,-.42);
 const a=heartGeometry(old.film.white,old.film.size),b=heartGeometry(fresh.film.white,fresh.film.size);
 assert.ok(b.tipWidthCells<=a.tipWidthCells*.75,`tip stayed ${b.tipWidthCells} cells wide`);
 assert.ok(b.retainedLeft>=a.retainedLeft*.98&&b.retainedRight>=a.retainedRight*.98);
 assert.ok(b.notchCells>=8&&b.lengthCells>a.lengthCells);
});

test('a dry switch to Finish is ready before the next wet stroke',()=>{
 const draw=intendedSettings('draw',.35),finish=intendedSettings('finish',.35);
 assert.deepEqual(advancePhysicalSettings(draw,finish,1/60,false,'dry-ready-1'),finish);
 const wet=advancePhysicalSettings(draw,finish,1/60,true,'dry-ready-1');
 assert.ok(wet.height>draw.height&&wet.height<finish.height);
 assert.ok(advancePhysicalSettings(draw,finish,1/60,false,'smooth-1').height<finish.height);
});
