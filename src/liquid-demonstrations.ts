import {initialState,type PourEvent} from './input.ts';
import type {Replay} from './replays';
const e=(time:number,x:number,y:number,flow:number,height:number,pouring=true,stroke=1):PourEvent=>({...initialState(),time,x,y,flow,height,pouring,stroke});
export const liquidDemonstrations:Record<string,Replay>={
 '1 Raised penetration':{duration:4,events:[e(0,.5,.5,.55,.8),e(2.5,.5,.5,.55,.8),e(2.501,.5,.5,.55,.8,false)]},
 '2 Low surface pool':{duration:4,events:[e(0,.5,.5,.55,.05),e(2.5,.5,.5,.55,.05),e(2.501,.5,.5,.55,.05,false)]},
 '3 Millimeter movement':{duration:4,events:Array.from({length:301},(_,i)=>e(i/120,.5+.025*Math.sin(i/120*9),.6-i/120*.04,.5,.05,i<300))},
 '4 Dry move and restart':{duration:5,events:[e(0,.35,.5,.6,.05),e(1.3,.35,.5,.6,.05),e(1.301,.35,.5,.6,.05,false),e(2,.65,.5,.6,.05,false),e(2.4,.65,.5,.6,.05,true,2),e(3.7,.65,.5,.6,.05,true,2),e(3.701,.65,.5,.6,.05,false,2)]},
 '5 Second pour displacement':{duration:5,events:[e(0,.48,.52,.65,.05),e(1.5,.48,.52,.65,.05),e(1.501,.48,.52,.65,.05,false),e(2,.56,.52,.65,.05,false),e(2.2,.56,.52,.65,.05,true,2),e(3.8,.56,.52,.65,.05,true,2),e(3.801,.56,.52,.65,.05,false,2)]},
 '6 Raised finishing stroke':{duration:5,events:[e(0,.5,.55,.65,.05),e(1.5,.5,.55,.65,.05),e(1.501,.5,.55,.65,.05,false),e(2,.5,.72,.22,.7,false),e(2.2,.5,.72,.22,.7,true,2),e(3.4,.5,.35,.22,.7,true,2),e(3.401,.5,.35,.22,.7,false,2)]},
};
