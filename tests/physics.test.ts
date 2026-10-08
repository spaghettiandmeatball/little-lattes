import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Surface} from '../src/surface.ts';
import {defaults,MilkLedger} from '../src/model.ts';
import {initialState,InputTimeline,INPUT_BUFFER,type PourEvent} from '../src/input.ts';
import {solveJet,jetPoint,clearanceMeters,UV_LENGTH_M} from '../src/jet.ts';
import {padSettings,wheelHeight,heldFlow} from '../src/controls.ts';
import {sampleScript,replays,type Replay} from '../src/replays.ts';
import {InputRecorder,validRecording} from '../src/recording.ts';
import {readFileSync} from 'node:fs';
import type {Recording} from '../src/recording.ts';

test('relative pickup, saturated edge re-clutch and fine travel preserve settings',()=>{
 const anchor={x:20,y:30,flow:.26,height:.6};
 assert.deepEqual(padSettings(anchor,20,30,100,100),{flow:.26,height:.6});
 const edge=padSettings(anchor,500,-100,100,100);assert.equal(edge.flow,1);assert.equal(edge.height,1);
 assert.deepEqual(padSettings({x:5,y:90,...edge},5,90,100,100),edge);
 assert.ok(Math.abs(padSettings(anchor,30,30,100,100,true).flow-.278)<1e-12);
 assert.ok(Math.abs(heldFlow(1,1/60,true)*60-.06)<1e-12);
 assert.ok(Math.abs(wheelHeight(1,1)-wheelHeight(16,0))<1e-12);
 assert.ok(Math.abs(wheelHeight(10000,0))<=.06);
 assert.ok(Math.abs(wheelHeight(.2,0))<Math.abs(wheelHeight(1,0)));
 assert.ok(clearanceMeters(.1)-clearanceMeters(0)<clearanceMeters(1)-clearanceMeters(.9));
});
test('one ballistic jet supplies physical clearance, area, speed, pose and zero-flow limit',()=>{
 for(const flow of [0,1e-6,.1,.5,1])for(const height of [0,.1,.3,.6,1]){
  const state={...initialState(),flow,height,pouring:true};const j=solveJet(state,flow/60,1/60,{x:.3,y:-.2});
  assert.ok(Math.abs(j.spout.z-j.surface.z-clearanceMeters(height))<1e-12);
  const impact=jetPoint(j,1);assert.ok(Math.hypot(impact.x-j.impact.x,impact.y-j.impact.y,impact.z)<1e-12);
  assert.ok(Math.abs(Math.PI*j.impactRadiusM**2*j.impactDownMPS-j.actualFlowMlS*1e-6)<1e-12);
  assert.ok(j.impactDownMPS>=j.exitDownMPS);
  assert.ok(j.visibleFraction>0&&j.visibleFraction<1);
  if(flow===0){assert.equal(j.impactRadiusM,0);assert.equal(j.massKg,0);assert.equal(j.emitting,false);}
 }
 const fraction=(h:number)=>solveJet({...initialState(),height:h,pouring:true},.5/60,1/60).visibleFraction;
 let prev=1;for(let i=0;i<=100;i++){const f=fraction(i/100);assert.ok(f<=prev);if(i>0)assert.ok(prev-f<.035);prev=f;}
});
function impulse(flow:number,density=0){
 const s=new Surface(80);s.foam.forEach((_,i)=>s.foam[i]=s.mask[i]?density:0);
 const a={...initialState(),x:.49,height:.8,flow,pouring:true,stroke:1};
 s.step({a,b:{...a,x:.51},dt:1/60},flow/60,defaults.Accessible);return s;
}
test('injected momentum and spatial speed integral approach zero with actual emitted mass',()=>{
 const zero=impulse(0).metrics(),tiny=impulse(1e-6).metrics(),low=impulse(.1).metrics(),full=impulse(1).metrics();
 assert.equal(zero.injectedImpulse,0);assert.equal(zero.integratedSpeed,0);
 assert.ok(tiny.integratedSpeed<low.integratedSpeed*.00002);
 assert.ok(low.integratedSpeed<full.integratedSpeed*.15);
 assert.ok(Math.abs(full.directionalImpulseX/low.directionalImpulseX-10)<1e-8);
 assert.ok(tiny.injectedImpulse<full.injectedImpulse*.000002);
});
test('actual budget-limited volume drives the jet; dry repositioning injects nothing',()=>{
 const a={...initialState(),pouring:true,stroke:1};const ledger=new MilkLedger();ledger.remaining=.000008;
 const q=ledger.spend(1,1/60),s=new Surface(80);s.step({a,b:{...a,x:.7},dt:1/60},q,defaults.Accessible);
 assert.ok(s.lastJet!.actualFlowMlS<.0008);assert.equal(ledger.remaining,0);
 const before=s.injectedImpulse;s.step({a:{...a,pouring:false},b:{...a,x:.2,pouring:false},dt:1/60},0,defaults.Accessible);
 assert.equal(s.injectedImpulse,before);
});
test('foam-dependent viscosity changes response without locking or losing material',()=>{
 const base=impulse(.65,0),dense=impulse(.65,4);
 assert.ok(Math.abs(base.metrics().maxSpeed-dense.metrics().maxSpeed)>1e-8);
 assert.ok(dense.metrics().maxSpeed>0&&dense.metrics().maxSpeed<.6);
});
function causal(replay:Replay|Recording,cadence:number,preload=false,size=64){
 const recorded='kind' in replay;
 let clock=recorded?-INPUT_BUFFER:0,next=0;
 const timeline=new InputTimeline(clock),s=new Surface(size),ledger=new MilkLedger();
 if(recorded)timeline.reset(clock,replay.initial);
 const events=[...replay.events].sort((a,b)=>(a.received??a.time)-(b.received??b.time));
 if(preload)events.forEach(e=>timeline.push(e));
 for(let frame=1;frame<=Math.ceil((replay.duration+INPUT_BUFFER)*cadence);frame++){
  const now=frame/cadence;
  if(!preload)while(next<events.length&&(events[next].received??events[next].time)<=now)timeline.push(events[next++]);
  while(clock+1/60<=Math.min(replay.duration,now-INPUT_BUFFER)+1e-9){
   const skip=recorded?replay.skips.find(skip=>clock>=skip.from-1e-8&&clock<skip.to-1e-8):undefined;
   if(skip){const to=Math.min(skip.to,now-INPUT_BUFFER);timeline.consume(clock,to);clock=to;continue;}
   const parts=timeline.consume(clock,clock+1/60).map(slice=>({slice,quantity:ledger.spend(slice.a.pouring?(slice.a.flow+slice.b.flow)/2:0,slice.dt)}));
   s.stepBatch(parts,recorded?replay.recipe:defaults.Accessible);clock+=1/60;
  }
 }return {s,ledger};
}
test('causal receipt deadlines remove preloaded future advantage at 30/60/120 Hz',()=>{
 for(const rate of [30,60,125,240]){
  const events:PourEvent[]=[];
  for(let i=0;i<=rate;i++){const time=i/rate;events.push({...initialState(),time,received:time+(i%3)*.002,x:.5+.04*Math.sin(time*12),y:.5+time*.05,pouring:i<rate,stroke:1});}
  // A short tap with a dry gap; the release position is already supplied wet.
  events.push({...initialState(),time:1.1,received:1.102,pouring:true,stroke:2},{...initialState(),time:1.108,received:1.11,pouring:false,stroke:2});
  const replay={duration:1.5,events},reference=causal(replay,60,true);
  for(const cadence of [30,60,120]){
   const other=causal(replay,cadence);
   assert.ok(Math.abs(other.ledger.remaining-reference.ledger.remaining)<1e-9);
   let l1=0;for(let i=0;i<other.s.foam.length;i++)l1+=Math.abs(other.s.foam[i]-reference.s.foam[i]);
   assert.ok(l1/other.s.foam.length<1e-8,`rate ${rate}, display ${cadence}`);
  }
 }
});
test('actual browser mouse recording keeps its volume and field across display cadences',()=>{
 const recording=JSON.parse(readFileSync(new URL('../docs/recorded-mouse.json',import.meta.url),'utf8'));
 assert.ok(validRecording(recording));
 const a=causal(recording,60,true),live=JSON.parse(readFileSync(new URL('../docs/recorded-mouse-live.json',import.meta.url),'utf8'));
 assert.ok(Math.abs(a.s.metrics().injected-live.injected)<1e-7);
 for(const rate of [30,120]){const b=causal(recording,rate);assert.ok(Math.abs(a.ledger.remaining-b.ledger.remaining)<1e-9);assert.deepEqual(a.s.foam,b.s.foam);}
});
test('recorded cancellation and skipped pause resume dry without replay catch-up',()=>{
 const recorder=new InputRecorder();recorder.begin(0,initialState(),defaults.Accessible,false);
 recorder.add({...initialState(),time:0,received:0,pouring:true,stroke:1});
 recorder.add({...initialState(),time:.5-INPUT_BUFFER,received:.5,pouring:false,stroke:1,reason:'blur'});
 recorder.skip(.45,1-INPUT_BUFFER);
 recorder.add({...initialState(),time:1-INPUT_BUFFER,received:1,pouring:false,stroke:1,reason:'focus'});
 recorder.add({...initialState(),time:1.1,received:1.1,pouring:true,stroke:2});
 recorder.add({...initialState(),time:1.2,received:1.2,pouring:false,stroke:2});recorder.end(1.5);
 const recording=recorder.recording!;assert.ok(validRecording(recording));
 const a=causal(recording,30),b=causal(recording,120,true);assert.deepEqual(a.s.foam,b.s.foam);
 assert.ok(a.s.injected<.4&&a.s.injected>.3,'the paused half-second must not spend milk');
});
test('exported packets and recipe replay through the same causal path',()=>{
 const recorder=new InputRecorder();recorder.begin(10,initialState(),defaults.Accessible,false);
 const script=sampleScript(replays['Fast curve + tap']);for(const e of script.events)recorder.add({...e,time:e.time+10,received:e.time+10+.001});recorder.end(12);
 const recording=JSON.parse(JSON.stringify(recorder.recording));assert.ok(validRecording(recording));
 assert.ok(!validRecording({...recording,events:[{...recording.events[0],received:NaN}]}));
 assert.ok(!validRecording({...recording,skips:[null]}));
 const a=causal(recording,30),b=causal(recording,120,true);assert.deepEqual(a.s.foam,b.s.foam);assert.equal(a.ledger.remaining,b.ledger.remaining);
});
test('millimeter oscillations survive input sampling with bounded buffer phase lag',()=>{
 const events=sampleScript(replays['Small rhythmic bands']).events,t=new InputTimeline();events.forEach(e=>t.push(e));let min=1,max=0,error=0,count=0;
 for(let clock=0;clock<3;clock+=1/60){const slices=t.consume(clock,clock+1/60);for(const s of slices){min=Math.min(min,s.a.x);max=Math.max(max,s.a.x);const midpoint=clock+s.dt/2;const expected=.5+.065*Math.sin(midpoint*Math.PI*3.6);error+=Math.abs((s.a.x+s.b.x)/2-expected);count++;}}
 assert.ok((max-min)*UV_LENGTH_M>.009);
 assert.ok(error/count<.007);
});
test('resting curved boundary retains nonnegative fields and accounted volume',()=>{
 const s=new Surface(64),a={...initialState(),x:.94,pouring:true};
 for(let i=0;i<240;i++)s.step({a,b:a,dt:1/60},i<120?.8/60:0,defaults.Accessible);
 for(let i=0;i<s.foam.length;i++){assert.ok(Number.isFinite(s.vx[i])&&Number.isFinite(s.foam[i])&&s.foam[i]>=0);if(!s.mask[i])assert.equal(s.foam[i],0);}
 const m=s.metrics();assert.ok(Math.abs(m.conservationError)<1e-6);assert.ok(m.maxSpeed<.01);
 assert.ok(Math.abs(m.surfaceVolumeMl+m.bulkVolumeMl+m.outside*12-m.injected*12)<.001);
});
