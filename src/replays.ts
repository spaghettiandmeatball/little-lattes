import {initialState,type PourEvent} from './input.ts';
import {heightForClearance} from './cozy-controls.ts';
import {interpolateBearing} from './pour-pose.ts';
export type FoamFinish={tool:'pick'|'spoon';passes?:number;points:{x:number;y:number}[]};
export type Replay={duration:number;events:PourEvent[];finishingStrokes?:FoamFinish[]};
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
 return {...replay,events};
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

/** A barista gesture, not a finished image: pool and tapering wiggle; Classic also lifts and pulls through. */
export function rosettaPour(angle=0):Replay {
 const rotate=(x:number,y:number)=>({x:.5+(x-.5)*Math.cos(angle)-(y-.5)*Math.sin(angle),y:.5+(x-.5)*Math.sin(angle)+(y-.5)*Math.cos(angle)});
 const packet=(time:number,x:number,y:number,flow:number,finish=false,pouring=true,stroke=1):PourEvent=>({
  ...event(time,x,y,flow,heightForClearance(finish?.026:.003),pouring,stroke),...rotate(x,y),bearing:-angle,
  intention:finish?'finish':'draw',scheme:'cozy',delivery:(flow*12-(finish?.8:2.4))/(finish?2.4:7.2),
 });
 const events:PourEvent[]=[],heartBase=Math.abs(angle)>1e-6;
 // Lay the heart down first, tucked beneath the lower leaves. Later leaf
 // flow passes over its upper join rather than pushing a new pool off the end.
 const leafStart=heartBase?1.9:0;
 if(heartBase){
  events.push(packet(0,.325,.60,.38,false,false,1));
  events.push(packet(.1,.325,.60,.38,false,true,1));
  events.push(packet(.7,.325,.60,.38,false,true,1));
  for(let i=1;i<=48;i++){
   const u=i/48,ease=u*u*(3-2*u);
   events.push(packet(.7+u*.4,.325+.11*ease,.60+.035*Math.sin(Math.PI*u),.25+.13*Math.abs(2*u-1),false,true,1));
  }
  events.push(packet(1.7,.435,.60,.38,false,true,1));
  events.push(packet(1.701,.435,.60,.38,false,false,1));
  events.push(packet(1.8,.5,.73,.38,false,false,2));
 }
 // Start with a soft base, then narrow each successive pair of leaves.
 const leafDuration=heartBase?5.5:5,leafTicks=Math.round(leafDuration*120);
 for(let i=0;i<=leafTicks;i++){
  const time=i/120,u=Math.max(0,(time-.65)/(leafDuration-.65));
  const x=.5+(time<.65?0:.085*(1-.25*u)*Math.sin((time-.65)*Math.PI*3.6));
  const y=time<.65?.73:.73-(time-.65)*(heartBase?.12:.105);
  // Ease delivery down through the last few folds to leave a lighter tip.
  const taper=Math.max(0,Math.min(1,(u-.78)/.22)),flow=heartBase?(time<.65?.38:.32*(1-.30*taper*taper*(3-2*taper))):.38;
  events.push(packet(leafStart+time,x,y,flow,false,i<leafTicks,heartBase?2:1));
 }
 // Feather ends with the last fold; keep Classic's original finishing stroke.
 if(heartBase)return {duration:leafStart+leafDuration+.7,events,finishingStrokes:[
  // Round the lower lip, then draw a small crema notch into the outer tip.
  // Both gestures stay on the outline, away from the feather's inner folds.
  {tool:'spoon',passes:3,points:[rotate(.32,.46),rotate(.27,.51),rotate(.22,.57)]},
  {tool:'spoon',passes:2,points:[rotate(.185,.50),rotate(.21,.53),rotate(.235,.555)]},
  {tool:'spoon',passes:2,points:[rotate(.53,.08),rotate(.51,.12),rotate(.48,.16)]},
  {tool:'spoon',passes:2,points:[rotate(.38,.04),rotate(.41,.10),rotate(.43,.13)]},
  {tool:'spoon',passes:2,points:[rotate(.495,.092),rotate(.48,.11),rotate(.465,.132)]},
 ]};
 const finishStart=leafStart+5.3;
 // A gentle return joins the heart to the feather without opening a long split.
 const stroke=2,cutStart=.26,cutFlow=.14;
 events.push(packet(finishStart-.15,.5,cutStart,cutFlow,true,false,stroke));
 events.push(packet(finishStart,.5,cutStart,cutFlow,true,true,stroke));
 events.push(packet(finishStart+1,.5,.78,cutFlow,true,true,stroke));
 events.push(packet(finishStart+1.001,.5,.78,cutFlow,true,false,stroke));
 return {duration:finishStart+1.7,events};
}
replays['Feather rosetta']=rosettaPour(Math.PI/3);
replays['Classic rosetta']=rosettaPour();

/** Decorative adult novelty latte: two rounded pools under a feathered column. */
export function cheekyPour():Replay {
 const packet=(time:number,x:number,y:number,flow=.34,pouring=true,stroke=1):PourEvent=>({
  ...event(time,x,y,flow,heightForClearance(.003),pouring,stroke),bearing:0,
  intention:'draw',scheme:'cozy',delivery:(flow*12-2.4)/7.2,
 });
 const events:PourEvent[]=[];
 for(let i=0;i<=564;i++){
  const t=i/120,u=Math.max(0,(t-.5)/4.2),x=.5+(t<.5?0:.038*(1-.25*u)*Math.sin((t-.5)*Math.PI*4.2)),y=t<.5?.72:.72-(t-.5)*.09;
  events.push(packet(t,x,y,t<.5?.35:.30,i<564,1));
 }
 // Lay the rounded base after the column, joining into its lower milk pool.
 events.push(packet(4.85,.41,.30,.40,false,2),packet(4.95,.41,.30,.40,true,2),packet(5.75,.41,.30,.40,true,2),packet(5.751,.41,.30,.40,false,2));
 events.push(packet(5.9,.59,.30,.40,false,3),packet(6,.59,.30,.40,true,3),packet(6.8,.59,.30,.40,true,3),packet(6.801,.59,.30,.40,false,3));
 return {duration:7.6,events,finishingStrokes:[
  {tool:'pick',points:[{x:.5,y:.16},{x:.5,y:.23},{x:.5,y:.29}]},
  {tool:'pick',points:[{x:.36,y:.70},{x:.41,y:.66},{x:.5,y:.645},{x:.59,y:.66},{x:.64,y:.70}]},
 ]};
}
replays['Cheeky rosetta']=cheekyPour();
