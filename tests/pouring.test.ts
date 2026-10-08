import {test} from 'node:test';
import assert from 'node:assert/strict';
import {InputTimeline,initialState} from '../src/input.ts';
import {Surface} from '../src/surface.ts';
import {defaults} from '../src/model.ts';
import {replays,stationary,line} from '../src/replays.ts';
import {run} from './replay.ts';

test('stationary pools grow with flow and spend the requested quantity',()=>{
 const low=run(stationary(.3)),high=run(stationary(.8));
 assert.ok(high.metrics.area>low.metrics.area*1.5);
 assert.ok(Math.abs(low.metrics.injected-.6000003)<1e-6);
 assert.ok(Math.abs(high.ledger.remaining-87.1999936)<1e-5);
 const center=high.surface.foam[80*160+80];assert.ok(center>.35,'a stopped impact must not excavate a coffee hole');
});
test('slow and fast trajectories inject the same normalized quantity',()=>{
 const slow=run(line(.12)),fast=run(line(.6));
 assert.ok(Math.abs(slow.metrics.injected-fast.metrics.injected)<1e-9);
 assert.ok(Math.abs(slow.metrics.visibleInjected-fast.metrics.visibleInjected)<1e-8);
 for(const result of [slow,fast])assert.ok(Math.abs(result.metrics.mass+result.metrics.foamSunk-result.metrics.visibleInjected)<1e-6);
 const extent=(s:Surface)=>{let moment=0,total=0;for(let i=0;i<s.foam.length;i++){moment+=s.foam[i]*(((i%s.size)+.5)/s.size-.5)**2;total+=s.foam[i];}return moment/total;};
 assert.ok(extent(fast.surface)>extent(slow.surface)*2);
 assert.ok(Math.max(...fast.surface.foam)<Math.max(...slow.surface.foam));
});
test('height changes mixing, concentration and transport',()=>{
 const low=run(stationary(.65,.02)),high=run(stationary(.65,.95));
 assert.ok(high.metrics.mixed>low.metrics.mixed*5);
 assert.ok(low.metrics.area>high.metrics.area*3);
 assert.ok(Math.abs(low.metrics.injected-high.metrics.injected)<1e-9);
});
test('dry gap and new stroke never interpolate deposition',()=>{
 const timeline=new InputTimeline(),s=initialState();
 timeline.push({...s,time:0,x:.2,pouring:true,stroke:1});
 timeline.push({...s,time:.1,x:.2,pouring:false,stroke:1});
 timeline.push({...s,time:.2,x:.8,pouring:false,stroke:1});
 timeline.push({...s,time:.3,x:.8,pouring:true,stroke:2});
 timeline.push({...s,time:.4,x:.8,pouring:false,stroke:2});
 const slices=timeline.consume(0,.5),wet=slices.filter(s=>s.a.pouring);
 assert.equal(wet.length,2);assert.equal(wet[0].b.x,.2);assert.equal(wet[1].a.x,.8);
 assert.ok(Math.abs(wet.reduce((a,s)=>a+s.dt,0)-.2)<1e-9);
});
test('short taps and intermediate curve events survive 30 Hz frames',()=>{
 const result=run(replays['Fast curve + tap'],30);
 assert.ok(Math.abs(result.metrics.injected-(.201*.65+.007))<1e-8);
 assert.ok(result.metrics.mass>.004);
 const timeline=new InputTimeline();replays['Fast curve + tap'].events.forEach(e=>timeline.push(e));
 const slices=timeline.consume(0,.2);assert.ok(slices.some(s=>s.b.y>.63));
});
test('1000 Hz curved input retains quantity with only 60 transport passes per second',()=>{
 const events=[];for(let i=0;i<=1000;i++)events.push({...initialState(),time:i/1000,x:.5+.15*Math.sin(i/1000*6),y:.5+.15*Math.cos(i/1000*6),pouring:i<1000,stroke:1});
 const {surface:s,metrics,ledger}=run({duration:1,events},30);
 assert.equal(s.transportPasses,60);assert.ok(Math.abs(metrics.injected-.65)<1e-8);
 assert.ok(Math.abs(ledger.remaining-94.8)<1e-6);
 assert.ok(Math.abs(metrics.mass+metrics.foamSunk-metrics.visibleInjected)<1e-6);
});
test('same event stream yields the same field at 30, 60 and 120 rendering Hz',()=>{
 const base=run(replays.Heart,60);
 for(const cadence of [30,120]){
  const other=run(replays.Heart,cadence);
  assert.ok(Math.abs(base.ledger.remaining-other.ledger.remaining)<1e-9);
  let l1=0;for(let i=0;i<base.surface.foam.length;i++)l1+=Math.abs(base.surface.foam[i]-other.surface.foam[i]);
  assert.ok(l1/base.surface.foam.length<1e-7);
  assert.ok(Math.abs(base.metrics.area-other.metrics.area)<1e-7);
 }
 console.log('heart baseline',JSON.stringify(base.metrics));
});
test('pool and raised finishing gesture retain artwork with accounted mixing',()=>{
 // The earlier exact heart pixels depended on unscaled pointer drag. Keep the
 // behavioral regression; do not distort a mass-driven jet to match those pixels.
 const {surface:s,metrics}=run(replays.Heart);
 assert.ok(metrics.area>.02&&metrics.mass>.05);
 assert.ok(metrics.foamSunk>0&&metrics.foamSunk<metrics.visibleInjected*.3);
 assert.ok(Math.abs(metrics.conservationError)<1e-6);
 assert.ok(s.foam.every(v=>Number.isFinite(v)&&v>=0));
});
test('rest has zero drift; settling preserves quantity and readable artwork',()=>{
 const empty=new Surface(),a=initialState();for(let i=0;i<120;i++)empty.step({a,b:a,dt:1/60},0,defaults.Accessible);
 assert.equal(empty.metrics().maxSpeed,0);assert.equal(empty.metrics().mass,0);
 const result=run(stationary(.65)),before=result.surface.metrics();
 for(let i=0;i<180;i++)result.surface.step({a,b:a,dt:1/60},0,defaults.Accessible);
 const after=result.surface.metrics();
 assert.ok(Math.abs(after.mass-before.mass)/before.mass<1e-5);
 assert.ok(Math.abs(after.cx-before.cx)<.001&&Math.abs(after.cy-before.cy)<.001);
 assert.ok(after.maxSpeed<.000001);assert.ok(after.area>before.area*.9);
 const peak=Math.max(...result.surface.foam);
 for(let i=0;i<7200;i++)result.surface.step({a,b:a,dt:1/60},0,defaults.Accessible);
 assert.ok(Math.max(...result.surface.foam)>peak*.7,'a two-minute rest must preserve the pool rather than dissolving it into fog');
});
test('off-cup milk spends budget without painting the wall; transport stays bounded',()=>{
 const replay=stationary(1);replay.events.forEach(e=>{e.x=1.1;});const result=run(replay);
 assert.equal(result.metrics.mass,0);assert.ok(result.ledger.remaining<100);assert.equal(result.metrics.outside,result.metrics.injected);
 const rim=stationary(.8);rim.events.forEach(e=>e.x=.95);const bounded=run(rim);
 assert.ok(bounded.metrics.mass>0);
 for(let i=0;i<bounded.surface.foam.length;i++)if(!bounded.surface.mask[i])assert.equal(bounded.surface.foam[i],0);
});
test('later pour displaces existing material rather than overwriting it',()=>{
 const {surface}=run(stationary(.65)),before=surface.metrics(),a={...initialState(),x:.43,y:.5,pouring:true};
 const fresh=new Surface();fresh.vx.set(surface.vx);fresh.vy.set(surface.vy);
 for(let i=0;i<60;i++){surface.step({a,b:a,dt:1/60},.65/60,defaults.Accessible);fresh.step({a,b:a,dt:1/60},.65/60,defaults.Accessible);}
 assert.ok(surface.metrics().mass>before.mass);
 // Subtract a matching new-only pour to isolate transport of existing foam.
 let oldMass=0,oldX=0;for(let i=0;i<surface.foam.length;i++){const density=surface.foam[i]-fresh.foam[i];oldMass+=density;oldX+=density*((i%surface.size)+.5)/surface.size;}
 assert.ok(oldX/oldMass>before.cx+.01,'the neighbouring source should displace the existing pool');
});
test('cancel/resume clears queued pouring and cannot burst or go negative',()=>{
 const timeline=new InputTimeline(),a=initialState();timeline.push({...a,time:0,pouring:true});timeline.reset(10,a);
 assert.ok(timeline.consume(10,10.1).every(s=>!s.a.pouring));
 const replay=stationary(1,0,30),result=run(replay);assert.equal(result.ledger.remaining,0);assert.ok(Math.abs(result.metrics.injected-12.5)<1e-6);
});
