import {interpolateBearing} from './pour-pose.ts';
export type PourState = { x:number; y:number; flow:number; height:number; pouring:boolean; stroke:number; intention?:'draw'|'finish'|'mix'; delivery?:number; scheme?:'cozy'|'advanced'; bearing?:number };
export type PourEvent = PourState & { time:number; received?:number; rawTime?:number; reason?:string };
export const INPUT_BUFFER=2/60;
export type PourSlice = { a:PourState; b:PourState; dt:number };
export const initialState = ():PourState => ({x:.5,y:.5,flow:.65,height:.08,pouring:false,stroke:0});

// Controls and replays share this timeline. Transitions split integration;
// dry repositioning is never interpolated into a wet stroke.
export class InputTimeline {
  private events:PourEvent[]=[];
  private base:PourEvent;
  private cursor:number;
  latePackets=0;
  constructor(time=0){this.base={...initialState(),time};this.cursor=time;}
  push(event:PourEvent){
    const received=event.received??event.time;
    const time=Math.max(Math.min(event.time,received),received-INPUT_BUFFER,this.cursor);
    if(time>event.time+1e-8)this.latePackets++;
    const applied={...event,received,rawTime:event.rawTime??event.time,time};
    if(!this.events.length||this.events[this.events.length-1].time<=time)this.events.push(applied);
    else {
      let low=0,high=this.events.length;
      while(low<high){const mid=(low+high)>>1;if(this.events[mid].time<=time)low=mid+1;else high=mid;}
      this.events.splice(low,0,applied);
    }
    return applied;
  }
  reset(time:number,state=initialState()){this.events=[];this.base={...state,pouring:false,time};this.cursor=time;this.latePackets=0;}
  private at(time:number,deadline:number):PourState {
    let prev=this.base,next:PourEvent|undefined;
    for(const e of this.events){
      if(e.time>deadline)break;
      if((e.received??e.time)>deadline)continue;
      if(e.time<=time)prev=e;else{next=e;break;}
    }
    if(!next||!prev.pouring||!next.pouring||prev.stroke!==next.stroke)return {...prev};
    const t=(time-prev.time)/(next.time-prev.time);
    return {...prev,x:prev.x+(next.x-prev.x)*t,y:prev.y+(next.y-prev.y)*t,
      flow:prev.flow+(next.flow-prev.flow)*t,height:prev.height+(next.height-prev.height)*t,
      bearing:prev.bearing===undefined?undefined:interpolateBearing(prev.bearing,next.bearing??prev.bearing,t)};
  }
  consume(from:number,to:number):PourSlice[]{
    const deadline=to+INPUT_BUFFER;
    const cuts=[from];
    for(const e of this.events){if(e.time>=to)break;if(e.time>from&&(e.received??e.time)<=deadline)cuts.push(e.time);}
    cuts.push(to);
    const slices:PourSlice[]=[];
    for(let i=1;i<cuts.length;i++){
      const a=this.at(cuts[i-1],deadline),b=this.at(cuts[i]-1e-10,deadline);
      if(cuts[i]>cuts[i-1])slices.push({a,b,dt:cuts[i]-cuts[i-1]});
    }
    let consumed=0;
    while(consumed<this.events.length&&this.events[consumed].time<=to&&(this.events[consumed].received??this.events[consumed].time)<=deadline)this.base=this.events[consumed++];
    if(consumed)this.events.splice(0,consumed);this.cursor=to;
    return slices;
  }
}
