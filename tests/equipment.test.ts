import test from 'node:test';
import assert from 'node:assert/strict';
import {equipmentClearance,reachablePitcherYaw} from '../src/equipment.ts';
import {intendedSettings} from '../src/cozy-controls.ts';
import {CUP_RADIUS_M} from '../src/jet.ts';

test('assisted Draw stays reachable across the declared drawing area',()=>{
 for(const fillMl of [63,80,95])for(const delivery of [.25,.5,.75]){
  const flow=intendedSettings('draw',delivery).flow;
  const depth=fillMl*1e-6/(Math.PI*CUP_RADIUS_M*CUP_RADIUS_M);
  for(const [x,y] of [[.5,.5],[.5,.25],[.5,.75],[.25,.5],[.75,.5]]){
   const pose=equipmentClearance(x,y,depth,flow,.0028,reachablePitcherYaw(x,y));
   assert.ok(pose.clearanceM>=.0028 && pose.clearanceM<=.006,`${fillMl} ml, ${delivery}, ${x}, ${y}: ${pose.clearanceM}`);
  }
 }
});

test('rim approach changes clearance continuously while legacy replay keeps its old step',()=>{
 const depth=63e-6/(Math.PI*CUP_RADIUS_M*CUP_RADIUS_M);
 let previous=equipmentClearance(.5,.2,depth,.5,.0028,Math.PI).clearanceM;
 let largestStep=0;
 for(let i=1;i<=600;i++){
  const y=.2+i*.001;
  const current=equipmentClearance(.5,y,depth,.5,.0028,Math.PI).clearanceM;
  largestStep=Math.max(largestStep,Math.abs(current-previous));previous=current;
 }
 assert.ok(largestStep<.00025,`adjacent aim step was ${largestStep} m`);
 const old=equipmentClearance(.5,.25,depth,.5,.0028,Math.PI,'rim-binary-1');
 assert.ok(old.clearanceM>.012);
 for(const y of [.3,.4,.49,.6]){
  const left=reachablePitcherYaw(.5-1e-5,y),right=reachablePitcherYaw(.5+1e-5,y);
  assert.ok(Math.abs(left-right)<.002,`yaw jumped across the cup centre at y=${y}`);
 }
});
