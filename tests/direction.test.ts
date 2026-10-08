import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,InputTimeline} from '../src/input.ts';
import {solveLatteJet} from '../src/equipment.ts';
import {bearingVector,interpolateBearing,replayControls} from '../src/pour-pose.ts';
import {sampleScript,heartArtReplay} from '../src/replays.ts';
import {InputRecorder,validRecording} from '../src/recording.ts';
import {defaults} from '../src/model.ts';
import {validateRoom,defaultRoom,roomPresets} from '../src/room-config.ts';

const liquid={fillMl:63,depthAt:()=>.01253};
test('bearing rotates the spout and source momentum together, independently of hand travel',()=>{
 for(const bearing of [0,Math.PI/2,Math.PI,-Math.PI/2,.7])for(const x of [.25,.5,.75]){
  const state={...initialState(),bearing,x,flow:.4,pouring:true};
  const fixed=solveLatteJet(state,.4/60,1/60,{x:0,y:0},liquid),direction=bearingVector(bearing);
  assert.ok(Math.abs(fixed.incoming.x*direction.y-fixed.incoming.y*direction.x)<1e-10);
  assert.ok(fixed.incoming.x*direction.x+fixed.incoming.y*direction.y>0);
  assert.ok(Math.abs(Math.sin(fixed.pitcherYaw!)-direction.x)<1e-10);
  assert.ok(Math.abs(-Math.cos(fixed.pitcherYaw!)-direction.y)<1e-10);
  for(const velocity of [{x:.2,y:-.3},{x:-.2,y:.3}]){
   const moving=solveLatteJet(state,.4/60,1/60,velocity,liquid);
   assert.equal(moving.pitcherYaw,fixed.pitcherYaw);
   assert.equal(Math.sign(moving.surfaceSweep!.y),Math.sign(velocity.y));
   assert.ok(Math.abs(moving.spout.x+moving.incoming.x*moving.flightSeconds-moving.impact.x)<1e-10);
  }
 }
});
test('old inputs keep their fixed-axis impulse; new recordings preserve and validate bearing',()=>{
 const old=solveLatteJet({...initialState(),x:.5,y:.25},.4/60,1/60,{x:0,y:0},liquid);
 assert.equal(old.incoming.x,0);assert.ok(old.incoming.y>0);
 const recorder=new InputRecorder();recorder.begin(0,{...initialState(),bearing:1.2},defaults.Accessible,false);
 recorder.add({...initialState(),bearing:-2.8,pouring:true,time:.1,received:.1});recorder.end(1);
 assert.ok(validRecording(recorder.recording));
 recorder.recording!.initial.bearing=NaN;assert.equal(validRecording(recorder.recording),false);
});
test('angle interpolation takes the short path through the seam at all replay sampling rates',()=>{
 assert.ok(Math.abs(Math.abs(interpolateBearing(179*Math.PI/180,-179*Math.PI/180,.5))-Math.PI)<1e-12);
 for(const rate of [30,60,120]){
  const base={...initialState(),pouring:true,stroke:1};
  const replay=sampleScript({duration:1,events:[{...base,bearing:3.1,time:0},{...base,bearing:-3.1,time:1}]},rate);
  assert.ok(replay.events.every(e=>Math.abs(e.bearing!)>=3.1));
  const timeline=new InputTimeline();for(const e of replay.events)timeline.push(e);
  for(let t=0;t<.98;t+=1/60)for(const slice of timeline.consume(t,t+1/60))assert.ok(Math.abs(slice.b.bearing!)>=3.09);
 }
});
test('demo handoff preserves physical Advanced units and normalized Cozy delivery',()=>{
 const end=heartArtReplay.events.at(-1)!;
 assert.equal(replayControls(end,'advanced').flow,.137);
 assert.equal(replayControls(end,'advanced').height,.555);
 assert.equal(replayControls(end,'cozy').flow,.35);
 const imported={...initialState(),scheme:'advanced' as const,intention:'finish' as const,flow:.2};
 assert.ok(Math.abs(replayControls(imported,'cozy').delivery-2/3)<1e-12);
});
test('room validation accepts stable catalog IDs and rejects paths, unknown versions and inherited keys',()=>{
 assert.deepEqual(validateRoom(null),defaultRoom);
 assert.deepEqual(validateRoom({...roomPresets['Closing time'],version:99}),defaultRoom);
 assert.deepEqual(validateRoom({...defaultRoom,counter:'../../secret',cup:'toString'}),defaultRoom);
 assert.deepEqual(validateRoom(roomPresets['Quiet morning']),roomPresets['Quiet morning']);
});
