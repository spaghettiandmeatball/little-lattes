import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validRecording} from '../src/recording.ts';
import {CozyLiquid} from '../src/cozy-liquid.ts';
import {CAPACITY_ML} from '../src/volume.ts';
import {initialState,InputTimeline,INPUT_BUFFER} from '../src/input.ts';
import {solveJet,UV_LENGTH_M} from '../src/jet.ts';
import {intendedSettings,transitionSettings,padDelivery} from '../src/cozy-controls.ts';
import {pour,rest,centroid,replayRecording} from './cozy-probes.ts';
import {permittedFlow} from '../src/emission.ts';
import {MilkLedger} from '../src/model.ts';
import {equipmentClearance,solveCozyJet} from '../src/equipment.ts';

// Provisional product gates, fixed before calibration. See cozy-verification.md.
const accounting=(s:CozyLiquid)=>{const m=s.metrics();for(const key of ['liquidErrorMl','milkErrorMl','coffeeErrorMl','gasErrorMl','foamTransportErrorMl'] as const)assert.ok(Math.abs(m[key])<1e-7,`${key}: ${m[key]}`);assert.equal(m.nonFiniteValues,0);assert.equal(m.negativeInventories,0);for(const i of s.cells){assert.ok(s.h[i]-s.upperMilk[i]-s.lowerMilk[i]>-1e-10,'local coffee cannot be negative');assert.ok(s.foam[i]<=s.upperMilk[i]+1e-10,'foam is an attribute of existing upper milk');}};
test('prepared free surface is motionless, contains real milk and conserves all inventories',()=>{
 const s=new CozyLiquid(64);const before=s.h.slice();rest(s,1);assert.deepEqual(s.h,before);assert.equal(s.metrics().peakSpeedMPS,0);assert.ok(Math.abs(s.milkMl-8)<1e-9);accounting(s);
});
test('stationary low pool grows across three volume checkpoints and survives ten seconds',()=>{
 const s=new CozyLiquid(64),areas:number[]=[];for(let j=0;j<3;j++){pour(s,.8);areas.push(s.metrics().visibleAreaMm2);accounting(s);}assert.ok(areas[0]>20);assert.ok(areas[2]>areas[0]*1.25,JSON.stringify(areas));assert.ok(areas[2]<3300,'a pool must not whiten the entire cup');
 const before=s.metrics();rest(s,10);const after=s.metrics();assert.ok(after.surfaceFoamMl>before.surfaceFoamMl*.70);assert.ok(after.visibleAreaMm2>before.visibleAreaMm2*.6);accounting(s);
});
test('matched raised liquid reaches the lower layer while low liquid remains visible',()=>{
 const low=new CozyLiquid(64),high=new CozyLiquid(64);pour(low,2);pour(high,2,.55,.045);rest(low,1);rest(high,1);
 const a=low.metrics(),b=high.metrics();assert.ok(b.lowerMilkMl-a.lowerMilkMl>6);assert.ok(a.surfaceFoamMl>b.surfaceFoamMl*3);accounting(low);accounting(high);
});
test('second pour carries identifiable original foam away from impact',()=>{
 const a=new CozyLiquid(64),b=new CozyLiquid(64);pour(a,1.5,.6,.0028,.48);pour(b,1.5,.6,.0028,.48);a.tagFoam();b.tagFoam();
 rest(a,1.5);pour(b,1.5,.6,.0028,.58);const ca=centroid(a),cb=centroid(b),movement=Math.hypot(ca.x-cb.x,ca.y-cb.y)*UV_LENGTH_M*1000;
 assert.ok(movement>.4,`original deposit displacement ${movement} mm`);assert.ok(cb.mass>ca.mass*.8);accounting(b);
});
test('raised reduced-flow cut changes a narrow corridor while preserving surrounding foam',()=>{
 const a=new CozyLiquid(64),b=new CozyLiquid(64);pour(a,1.8,.65);pour(b,1.8,.65);
 for(let k=0;k<72;k++){a.step([]);const state={...initialState(),x:.5,y:.66-k/71*.32,height:Math.sqrt((.026-.002)/.078),flow:.16,pouring:true};b.step([{x:state.x,y:state.y,jet:solveJet(state,.16/60,1/60,{x:0,y:-.32/1.2},true)}]);}
 let corridor=0,outside=0,total=0;for(const i of a.cells){const x=(i%a.size+.5)/a.size;const d=Math.abs(a.foam[i]-b.foam[i]);if(Math.abs(x-.5)<.045)corridor+=d;else outside+=d;total+=a.foam[i];}
 assert.ok(corridor>total*.015,`cut change ${corridor/total}`);assert.ok(outside<total*.4);assert.ok(b.metrics().surfaceFoamMl>a.metrics().surfaceFoamMl*.7);accounting(b);
});
test('real spilling spends incoming milk and withdraws coffee and milk, distinct from misses',()=>{
 const s=new CozyLiquid(48);pour(s,6,1);assert.ok(Math.abs(s.fillMl-CAPACITY_ML)<1e-7);assert.ok(Math.abs(s.emittedMl-72)<1e-7);assert.ok(s.spilledCoffeeMl>1&&s.spilledMilkMl>1);const spill=s.rimSpillMl;pour(s,1,.5,.0028,1.2);assert.ok(Math.abs(s.missMl-6)<1e-7);assert.equal(s.rimSpillMl,spill);accounting(s);
});
test('rim assist, pitcher exhaustion, dry pause and unlimited expenditure use live flow limiting',()=>{
 for(const assist of [false,true])for(const unlimited of [false,true]){
  const s=new CozyLiquid(48),ledger=new MilkLedger();s.reset(true,CAPACITY_ML-.4);ledger.remaining=.6;
  let requested=0;
  for(let k=0;k<15;k++){const dt=1/60,flow=permittedFlow(k<10?1:0,dt,s.fillMl,0,true,assist),quantity=unlimited?flow*dt:ledger.spend(flow,dt);requested+=quantity*12;const state={...initialState(),pouring:quantity>0,flow};s.step([{x:.5,y:.5,jet:solveJet(state,quantity,dt,{x:0,y:0},true)}]);}
  assert.ok(Math.abs(s.emittedMl-requested)<1e-9);assert.ok(s.fillMl<=CAPACITY_ML+1e-7);if(assist)assert.equal(s.rimSpillMl,0);else assert.ok(s.rimSpillMl>0);if(!unlimited&&!assist)assert.equal(ledger.remaining,0);if(unlimited)assert.equal(ledger.remaining,.6);accounting(s);
 }
 assert.equal(permittedFlow(.5,1/60,CAPACITY_ML,0,false,true),.5,'misses still spend milk');
});
test('dry travel adds neither liquid nor force; tiny source tends continuously to zero',()=>{
 const s=new CozyLiquid(48);pour(s,.5);const volume=s.emittedMl,impulse=s.incomingImpulseNs;pour(s,.5,0,.0028,.8);assert.equal(s.emittedMl,volume);assert.equal(s.incomingImpulseNs,impulse);
 const tiny=new CozyLiquid(48);pour(tiny,.5,1e-6);assert.ok(tiny.incomingImpulseNs<impulse*1e-4);accounting(s);accounting(tiny);
});
test('cozy intention envelopes stay bounded, preserve preferred delivery and transition without overshoot',()=>{
 const draw=intendedSettings('draw',.65),finish=intendedSettings('finish',.65);assert.ok(draw.flow>finish.flow&&draw.height<finish.height);
 let current=draw;for(let k=0;k<60;k++){current=transitionSettings(current,finish,1/60);assert.ok(current.flow>=finish.flow&&current.flow<=draw.flow);assert.ok(current.height>=draw.height&&current.height<=finish.height);}assert.ok(Math.abs(current.flow-finish.flow)<.001);
 assert.equal(padDelivery(.4,0,100),.4);assert.equal(padDelivery(1,-10,100),.91);assert.ok(Math.abs(padDelivery(0,10,100)-.09)<1e-12);
});
test('upright rim assist raises a bounded pitcher pose without changing the player landing point',()=>{
 const centre=equipmentClearance(.5,.5,.0125,.65,.0028),rim=equipmentClearance(.94,.5,.0125,.65,.0028);
 assert.ok(!centre.rimConflict&&rim.rimConflict);assert.ok(rim.clearanceM>centre.clearanceM+.01);
 const s=new CozyLiquid(48),state={...initialState(),x:.94,flow:.65,pouring:true};const jet=solveCozyJet(state,.65/60,1/60,{x:0,y:0},s);assert.equal(jet.impact.x,(state.x-.5)*UV_LENGTH_M);assert.ok(jet.accessLimited);assert.ok(jet.spout.z>jet.impact.z+.01);
});
test('source quantities remain conserved under subdivision and near circular walls',()=>{
 const a=new CozyLiquid(48),b=new CozyLiquid(48),state={...initialState(),x:.97,flow:.5,pouring:true};
 for(let k=0;k<60;k++){const source={x:state.x,y:state.y,jet:solveJet(state,.5/60,1/60,{x:0,y:0},true)};a.step([source]);b.step(Array.from({length:4},()=>({...source,jet:solveJet(state,.5/240,1/240,{x:0,y:0},true)})));}
 assert.ok(Math.abs(a.emittedMl-b.emittedMl)<1e-9);assert.ok(Math.abs(a.metrics().surfaceFoamMl-b.metrics().surfaceFoamMl)<1e-6);accounting(a);accounting(b);
});
function cadence(rate:number){const s=new CozyLiquid(48),t=new InputTimeline(),events=Array.from({length:121},(_,k)=>({...initialState(),time:k/120,received:k/120,x:.5+.025*Math.sin(k/120*10),pouring:k<120,stroke:1}));let next=0,clock=0;
 for(let frame=1;frame<=2*rate;frame++){const now=frame/rate;while(next<events.length&&events[next].received<=now)t.push(events[next++]);while(clock+1/60<=now-INPUT_BUFFER+1e-10){const sources=t.consume(clock,clock+1/60).map(slice=>{const x=(slice.a.x+slice.b.x)*.5;return {x,y:.5,jet:solveJet({...slice.b,x},slice.a.pouring?((slice.a.flow+slice.b.flow)/2)*slice.dt:0,slice.dt,{x:0,y:0},true)};});s.step(sources);clock+=1/60;}}
 return s;
}
test('30/60/120 Hz schedules produce identical fields through receipt-gated fixed ticks',()=>{
 const a=cadence(30),b=cadence(60),c=cadence(120);assert.deepEqual(a.foam,b.foam);assert.deepEqual(a.h,c.h);assert.equal(a.emittedMl,c.emittedMl);
});
test('final real browser recording agrees with live fields and replays at 30/60/120 Hz',()=>{
 const recording=JSON.parse(readFileSync(new URL('../docs/cozy-recorded-mouse.json',import.meta.url),'utf8')),live=JSON.parse(readFileSync(new URL('../docs/cozy-mouse-live.json',import.meta.url),'utf8'));assert.ok(validRecording(recording));assert.equal(recording.environment?.solver,'hydrostatic-two-layer-2');
 const reference=replayRecording(recording,60,true);assert.ok(Math.abs(reference.s.emittedMl-live.metrics.emittedMl)<1e-7);assert.ok(Math.abs(reference.ledger.remaining-live.remaining)<1e-7);
 for(const i of reference.s.cells)assert.ok(Math.abs(reference.s.foam[i]-live.fields.foam[i])<1e-8,`live foam differs at ${i}`);
 for(const rate of [30,60,120]){const other=replayRecording(recording,rate);assert.deepEqual(other.s.foam,reference.s.foam);assert.deepEqual(other.s.h,reference.s.h);assert.equal(other.ledger.remaining,reference.ledger.remaining);}accounting(reference.s);
});
