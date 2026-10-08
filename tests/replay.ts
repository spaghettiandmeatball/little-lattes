import {InputTimeline} from '../src/input.ts';
import {Surface} from '../src/surface.ts';
import {MilkLedger,defaults} from '../src/model.ts';
import type {Replay} from '../src/replays.ts';
import {sampleScript} from '../src/replays.ts';
export function run(replay:Replay,cadence=60){
 const timeline=new InputTimeline(),surface=new Surface(),ledger=new MilkLedger();
 sampleScript(replay).events.forEach(e=>timeline.push(e));let clock=0;
 for(let render=1;render<=Math.ceil(replay.duration*cadence);render++){
  const now=render/cadence;
  while(clock+1/60<=now+1e-10){
   const parts=[];
   for(const slice of timeline.consume(clock,clock+1/60)){
    const flow=slice.a.pouring?(slice.a.flow+slice.b.flow)*.5:0;
    parts.push({slice,quantity:ledger.spend(flow,slice.dt)});
   }surface.stepBatch(parts,defaults.Accessible);clock+=1/60;
  }
 }return {surface,ledger,metrics:surface.metrics()};
}
