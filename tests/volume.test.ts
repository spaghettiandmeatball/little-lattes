import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CupVolume,CAPACITY_ML,CUP_DEPTH_M,INITIAL_COFFEE_ML,inCup,foamFraction} from '../src/volume.ts';
import {solveJet,clearanceMeters} from '../src/jet.ts';
import {initialState} from '../src/input.ts';
test('fill rises by actual accepted volume and stops at capacity without spending excess',()=>{
 const cup=new CupVolume();assert.equal(cup.fillMl,INITIAL_COFFEE_ML);const before=cup.surfaceM;
 cup.add(12,true,.6);assert.ok(cup.surfaceM>before);cup.add(4,false,.6);assert.equal(cup.milkMl,12);assert.equal(cup.outsideMl,4);
 const remaining=CAPACITY_ML-cup.fillMl,flow=cup.limitFlow(1,10,true);assert.ok(Math.abs(flow*10*12-remaining)<1e-9);cup.add(flow*10*12,true,.7);
 assert.ok(cup.full);assert.equal(cup.limitFlow(1,1,true),0);assert.ok(Math.abs(cup.depthM-CUP_DEPTH_M)<1e-12);
 assert.ok(Math.abs(cup.emittedMl-cup.milkMl-cup.outsideMl)<1e-9);cup.reset();assert.equal(cup.milkMl,0);
});
test('clearance follows the filled surface and foam partition changes smoothly with impact energy',()=>{
 const state={...initialState(),pouring:true},low=solveJet({...state,height:.05},.55/60,1/60),high=solveJet({...state,height:.8},.55/60,1/60);
 const cup=new CupVolume();cup.add(20,true,high.impactDownMPS);
 const worldSpout=cup.surfaceM+high.spout.z;
 assert.ok(Math.abs(worldSpout-cup.surfaceM-clearanceMeters(.8))<1e-12);
 assert.ok(foamFraction(low.clearanceM,low.impactDownMPS)>foamFraction(high.clearanceM,high.impactDownMPS)*10);
 assert.ok(inCup(.5,.5));assert.ok(!inCup(1,.5));
});
test('quantity-derived momentum vanishes continuously when flow goes to zero',()=>{
 const impulse=(flow:number)=>{const jet=solveJet({...initialState(),pouring:flow>0},flow/60,1/60),cup=new CupVolume();cup.add(jet.volumeMl,true,jet.impactDownMPS);return cup.impulseNs;};
 assert.equal(impulse(0),0);assert.ok(impulse(1e-6)<impulse(.1)*1e-4);assert.ok(impulse(.1)<impulse(1));
});
