import {CozyLiquid} from '../src/cozy-liquid.ts';
import {solveJet} from '../src/jet.ts';
import {initialState,InputTimeline,INPUT_BUFFER,type PourState} from '../src/input.ts';
import {heightForClearance,advancePhysicalSettings} from '../src/cozy-controls.ts';
import {solveCozyJet,solveLatteJet} from '../src/equipment.ts';
import {CozyView,LATTE_VERSION} from '../src/cozy-view.ts';
import {permittedFlow} from '../src/emission.ts';
import {MilkLedger} from '../src/model.ts';
import type {Recording} from '../src/recording.ts';
export function pour(liquid:CozyLiquid,seconds:number,flow=.55,clearance=.0028,x=.5,y=.5,wiggle=0,frequency=2){
 for(let k=0;k<Math.round(seconds*60);k++){
  const state={...initialState(),pouring:flow>0,flow,height:heightForClearance(clearance),x:x+wiggle*Math.sin(k/60*Math.PI*2*frequency),y};
  liquid.step([{x:state.x,y:state.y,jet:solveJet(state,flow/60,1/60,{x:0,y:0},true)}]);
 }
}
export function rest(liquid:CozyLiquid,seconds:number){for(let k=0;k<Math.round(seconds*60);k++)liquid.step([]);}
export function scripted(liquid:CozyLiquid,states:PourState[]){for(const state of states)liquid.step([{x:state.x,y:state.y,jet:solveJet(state,state.pouring?state.flow/60:0,1/60,{x:0,y:0},true)}]);}
export function centroid(liquid:CozyLiquid,field=liquid.taggedFoam){let mass=0,x=0,y=0;for(const i of liquid.cells){mass+=field[i];x+=(i%liquid.size+.5)/liquid.size*field[i];y+=(Math.floor(i/liquid.size)+.5)/liquid.size*field[i];}return {x:x/Math.max(mass,1e-30),y:y/Math.max(mass,1e-30),mass};}
export function replayRecording(recording:Recording,rate:number,preload=false){
 const s=recording.environment?.solver.startsWith('hydrostatic-film-')?new CozyView():new CozyLiquid(),ledger=new MilkLedger(),t=new InputTimeline(-INPUT_BUFFER);t.reset(-INPUT_BUFFER,recording.initial);s.surfaceYield=recording.environment?.solver!=='hydrostatic-two-layer-1';if(s instanceof CozyView)s.film.response=recording.environment?.solver==='hydrostatic-film-3'?'legacy':recording.environment?.solver==='hydrostatic-film-5'?'taper':'local';
 let clock=-INPUT_BUFFER,next=0,settings={flow:recording.initial.flow,height:recording.initial.height};
 if(preload){for(const e of recording.events)t.push(e);next=recording.events.length;}
 for(let frame=1;frame<=Math.ceil((recording.duration+INPUT_BUFFER)*rate);frame++){
  const now=frame/rate;while(next<recording.events.length&&(recording.events[next].received??recording.events[next].time)<=now)t.push(recording.events[next++]);
  while(clock+1/60<=Math.min(recording.duration,now-INPUT_BUFFER)+1e-10){
   const skip=recording.skips.find(v=>clock>=v.from-1e-8&&clock<v.to-1e-8);if(skip){const to=Math.min(skip.to,now-INPUT_BUFFER);t.consume(clock,to);clock=to;continue;}
   let pending=0;
   const sources=t.consume(clock,clock+1/60).map(slice=>{
    const target={flow:(slice.a.flow+slice.b.flow)*.5,height:(slice.a.height+slice.b.height)*.5};settings=slice.a.scheme==='cozy'?advancePhysicalSettings(settings,target,slice.dt,slice.a.pouring,recording.environment?.controlResponse??'smooth-1'):target;
    const x=(slice.a.x+slice.b.x)*.5,y=(slice.a.y+slice.b.y)*.5,inside=Math.hypot(x-.5,y-.5)<.485;
    const flow=permittedFlow(slice.a.pouring?settings.flow:0,slice.dt,s.fillMl,pending,inside,recording.environment?.stopAtRim??false),quantity=recording.unlimited?flow*slice.dt:ledger.spend(flow,slice.dt);if(inside)pending+=quantity*12;
    const state={...slice.b,x,y,...settings},velocity={x:(slice.b.x-slice.a.x)/Math.max(slice.dt,1e-6),y:(slice.b.y-slice.a.y)/Math.max(slice.dt,1e-6)};
    return {x,y,dt:slice.dt,jet:s instanceof CozyView?solveLatteJet(state,quantity,slice.dt,velocity,s,recording.environment?.rimAccess!==false,recording.environment?.equipmentModel??'rim-binary-1'):s.surfaceYield?solveCozyJet(state,quantity,slice.dt,velocity,s,recording.environment?.rimAccess!==false,recording.environment?.equipmentModel??'rim-binary-1'):solveJet(state,quantity,slice.dt,velocity,true)};
   });s.step(sources);if(s instanceof CozyView)s.film.step(sources,sources.reduce((sum,p)=>sum+p.dt,0));clock+=1/60;
  }
 }return {s,ledger};
}
