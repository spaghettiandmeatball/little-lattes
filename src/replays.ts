import {initialState,type PourEvent} from './input.ts';
import {interpolateBearing} from './pour-pose.ts';
export type Replay={duration:number;events:PourEvent[]};
// Continuous keyframes are authoring data only. Emit declared 120 Hz packets,
// retaining exact transitions/taps before entering the causal live timeline.
export function sampleScript(replay:Replay,rate=120):Replay {
 const events:PourEvent[]=[];
 for(let i=0;i<replay.events.length;i++){
  const a=replay.events[i],b=replay.events[i+1];events.push({...a,received:a.time});
  if(!b||!a.pouring||!b.pouring||a.stroke!==b.stroke)continue;
  for(let time=a.time+1/rate;time<b.time-1e-9;time+=1/rate){
   const t=(time-a.time)/(b.time-a.time);
   events.push({...a,time,received:time,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
    flow:a.flow+(b.flow-a.flow)*t,height:a.height+(b.height-a.height)*t,
    bearing:a.bearing===undefined?undefined:interpolateBearing(a.bearing,b.bearing??a.bearing,t)});
  }
 }
 return {duration:replay.duration,events};
}
const event=(time:number,x:number,y:number,flow=.65,height=.08,pouring=true,stroke=1):PourEvent=>({...initialState(),time,x,y,flow,height,pouring,stroke});
export const heartArtReplay:Replay={duration:3.8,events:[
    event(0,.5,.59,.5,.101),event(2.5,.5,.59,.5,.101),
    event(2.501,.5,.59,.137,.555,false),
    event(2.8,.5,.59,.137,.555,true,2),event(3.48,.5,.91,.137,.555,true,2),
    event(3.481,.5,.91,.137,.555,false,2)]};
heartArtReplay.events=heartArtReplay.events.map(e=>({...e,intention:e.time<2.501?'draw':'finish',scheme:'cozy',delivery:e.time<2.501?.5:.35}));
export const replays:Record<string,Replay>={
  // Retain the original surface-mode demonstration and its regression input.
  Heart:{duration:6,events:[
    event(0,.5,.57,.4,.9),event(.6,.5,.57,.4,.9),event(.61,.5,.59,.8,.04),
    event(1.2,.42,.59,.8,.04),event(1.8,.58,.59,.8,.04),event(2.4,.42,.59,.8,.04),
    event(2.8,.5,.59,.8,.04),event(3.3,.5,.55,.75,.04),
    event(3.31,.5,.55,.75,.04,false),event(3.5,.5,.78,.26,.85,false),
    event(3.6,.5,.78,.26,.85,true,2),event(3.88,.5,.78,.26,.85,true,2),
    event(4.95,.5,.37,.26,.6,true,2),event(4.96,.5,.37,.26,.6,false,2)]},
  'Two pours':{duration:5,events:[event(0,.4,.52,.65),event(1.4,.4,.52,.65),event(1.41,.4,.52,.65,.08,false),event(2,.68,.52,.65,.08,false),event(2.4,.61,.52,.8,.05,true,2),event(3.9,.61,.52,.8,.05,true,2),event(4,.61,.52,.8,.05,false,2)]},
  'Height sweep':{duration:5,events:[event(0,.35,.5,.65,.02),event(1,.42,.5,.65,.02),event(2,.5,.5,.65,.95),event(3,.58,.5,.65,.95),event(4,.65,.5,.65,.02),event(4.01,.65,.5,.65,.02,false)]},
  'Fast curve + tap':{duration:2,events:[event(0,.3,.4),event(.04,.32,.55),event(.08,.4,.64),event(.12,.55,.65),event(.16,.66,.56),event(.2,.7,.4),event(.201,.7,.4,.65,.08,false),event(.4,.5,.35,1,.05,true,2),event(.407,.5,.35,1,.05,false,2)]},
};
replays['Growing pool']=stationary(.7,.08,3);
// Only position, flow and height packets; the surface model produces the art.
replays['Rosetta']={duration:5.4,events:[
 ...Array.from({length:481},(_,i)=>{const t=i/120;return event(t,.5+.05*Math.sin(t*Math.PI*3.6),.66-t*.08,.42,.10,i<480);}),
 event(4.15,.5,.70,.14,.555,false,2),event(4.2,.5,.70,.14,.555,true,2),event(5.2,.5,.30,.14,.555,true,2),event(5.201,.5,.30,.14,.555,false,2),
]};
replays['Rosetta'].events=replays['Rosetta'].events.map(e=>({...e,intention:e.time<4.1?'draw':'finish',scheme:'cozy',delivery:(e.flow*12-(e.time<4.1?2.4:.8))/(e.time<4.1?7.2:2.4)}));
replays['Small rhythmic bands']={duration:5,events:Array.from({length:481},(_,i)=>{
 const time=i/120;return event(time,.5+.065*Math.sin(time*Math.PI*3.6),.72-time*.10,.52,.07,i<480);
})};
replays['Three neighboring pours']={duration:6,events:[event(0,.45,.6,.7),event(1.3,.45,.6,.7),event(1.31,.45,.6,.7,.08,false),event(1.7,.56,.56,.7,.08,true,2),event(3,.56,.56,.7,.08,true,2),event(3.01,.56,.56,.7,.08,false,2),event(3.4,.48,.45,.7,.08,true,3),event(4.7,.48,.45,.7,.08,true,3),event(4.71,.48,.45,.7,.08,false,3)]};
export function stationary(flow:number,height=.08,duration=2):Replay{return {duration:duration+1,events:[event(0,.5,.5,flow,height),event(duration,.5,.5,flow,height),event(duration+1e-6,.5,.5,flow,height,false)]};}
export function line(distance:number):Replay{return {duration:3,events:[event(0,.5-distance/2,.5),event(2,.5+distance/2,.5),event(2.000001,.5+distance/2,.5,.65,.08,false)]};}
