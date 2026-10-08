import {writeFileSync,readFileSync,existsSync} from 'node:fs';
import {CozyLiquid} from '../src/cozy-liquid.ts';
import {solveJet,UV_LENGTH_M} from '../src/jet.ts';
import {InputTimeline,initialState,INPUT_BUFFER} from '../src/input.ts';
import {MilkLedger} from '../src/model.ts';
import {sampleScript,replays,type Replay} from '../src/replays.ts';
import {liquidDemonstrations} from '../src/liquid-demonstrations.ts';
import {transitionSettings} from '../src/cozy-controls.ts';
import {CAPACITY_ML} from '../src/volume.ts';
import {solveCozyJet} from '../src/equipment.ts';
import {pour,rest,centroid} from './cozy-probes.ts';
import type {Recording} from '../src/recording.ts';
const report:Record<string,unknown>={date:'2026-10-07',kind:'Node solver evidence; not browser/phone frame timings',scenarios:{},matrix:[],recordings:{}};
const scenarios=report.scenarios as Record<string,unknown>;
const gallery:string[]=[];
function picture(s:CozyLiquid,name:string){
 const n=s.size;let pixels='';
 for(const i of s.cells){const white=(1-Math.exp(-s.foam[i]/.00028))*Math.min(1,s.gas[i]/Math.max(s.foam[i]*.25,1e-12)),milk=(s.upperMilk[i]+s.lowerMilk[i])/s.h[i],crema=Math.min(1,s.crema[i]/.00002);const coffee=[67+milk*100+crema*20,30+milk*88+crema*18,10+milk*60+crema*14],rgb=coffee.map((c,j)=>Math.round(c*(1-white)+[250,240,214][j]*white));pixels+=`<rect x="${i%n}" y="${n-1-Math.floor(i/n)}" width="1" height="1" fill="rgb(${rgb.join(',')})"/>`;}
 const filename=`cozy-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.svg`;
 writeFileSync(new URL('../docs/'+filename,import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${n+8} ${n+8}" width="440" height="440"><rect x="-4" y="-4" width="${n+8}" height="${n+8}" fill="#293e34"/><circle cx="${n/2}" cy="${n/2}" r="${n*.495}" fill="#efe6d3"/>${pixels}</svg>`);
 gallery.push(`<figure><img src="${filename}" alt="${name}"><figcaption>${name}</figcaption></figure>`);
}
function run(replay:Replay|Recording,size=64,rate=60,preload=false){
 const recorded='kind' in replay,s=new CozyLiquid(size),ledger=new MilkLedger(),t=new InputTimeline(recorded?-INPUT_BUFFER:0);let clock=recorded?-INPUT_BUFFER:0,next=0;
 if(recorded)t.reset(clock,replay.initial);
 if(recorded)s.surfaceYield=replay.environment?.solver!=='hydrostatic-two-layer-1';
 const events=recorded?replay.events:sampleScript(replay).events;let settings=recorded?{flow:replay.initial.flow,height:replay.initial.height}:{flow:.65,height:.08};
 if(preload){for(const e of events)t.push(e);next=events.length;}
 const times:number[]=[];let snapshots:unknown[]=[];
 for(let frame=1;frame<=Math.ceil((replay.duration+INPUT_BUFFER)*rate);frame++){
  const now=frame/rate;
  while(next<events.length&&(events[next].received??events[next].time)<=now)t.push(events[next++]);
  while(clock+1/60<=Math.min(replay.duration,now-INPUT_BUFFER)+1e-10){
   const skip=recorded?replay.skips.find(v=>clock>=v.from-1e-8&&clock<v.to-1e-8):undefined;
   if(skip){const to=Math.min(skip.to,now-INPUT_BUFFER);t.consume(clock,to);clock=to;continue;}
   let pending=0;
   const sources=t.consume(clock,clock+1/60).map(slice=>{
    const target={flow:(slice.a.flow+slice.b.flow)*.5,height:(slice.a.height+slice.b.height)*.5};settings=slice.a.scheme==='cozy'?transitionSettings(settings,target,slice.dt):target;
    let flow=slice.a.pouring?settings.flow:0;const x=(slice.a.x+slice.b.x)*.5,y=(slice.a.y+slice.b.y)*.5;
    const inside=Math.hypot(x-.5,y-.5)<.485;
    if(recorded&&replay.environment?.stopAtRim&&inside)flow=Math.min(flow,Math.max(0,CAPACITY_ML-s.fillMl-pending)/(slice.dt*12));
    const quantity=recorded&&replay.unlimited?flow*slice.dt:ledger.spend(flow,slice.dt);if(inside)pending+=quantity*12;
    const state={...slice.b,x,y,height:settings.height,flow:settings.flow},velocity={x:(slice.b.x-slice.a.x)/Math.max(slice.dt,1e-6),y:(slice.b.y-slice.a.y)/Math.max(slice.dt,1e-6)};
    return {x,y,jet:s.surfaceYield?solveCozyJet(state,quantity,slice.dt,velocity,s,!recorded||replay.environment?.rimAccess!==false):solveJet(state,quantity,slice.dt,velocity,true)};
   });s.step(sources);times.push(s.cpuMs);clock+=1/60;
   if(s.steps%60===0)snapshots.push({seconds:clock,...s.metrics()});
  }
 }
 const sorted=times.slice().sort((a,b)=>a-b);
 return {s,ledger,timing:{mean:times.reduce((a,b)=>a+b,0)/times.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],p99:sorted[Math.floor(sorted.length*.99)]},snapshots};
}
for(const [name,replay] of Object.entries(liquidDemonstrations)){
 const result=run(replay);scenarios[name]={...result.s.metrics(),cpuTickMs:result.timing,snapshots:result.snapshots};picture(result.s,name);console.log(name,JSON.stringify(result.s.metrics()));
}
const pool=new CozyLiquid(64),checkpoints=[];
for(let i=0;i<3;i++){pour(pool,.8);checkpoints.push(pool.metrics());picture(pool,'pool-checkpoint-'+(i+1));}
const before=pool.metrics();rest(pool,10);scenarios.persistence={before,after:pool.metrics(),checkpoints};picture(pool,'pool-after-ten-seconds');
const first=new CozyLiquid(64),second=new CozyLiquid(64);for(const s of [first,second]){pour(s,1.5,.6,.0028,.48);s.tagFoam();}rest(first,1.5);pour(second,1.5,.6,.0028,.58);scenarios.taggedDisplacement={control:centroid(first),second:centroid(second),millimeters:Math.hypot(centroid(first).x-centroid(second).x,centroid(first).y-centroid(second).y)*UV_LENGTH_M*1000};picture(first,'first-deposit-control');picture(second,'tagged-neighboring-pour');
for(const frequency of [1.4,2,2.8]){
 const events=Array.from({length:361},(_,k)=>({...initialState(),time:k/120,received:k/120,flow:.45,height:.07,x:.5+.03*Math.sin(k/120*Math.PI*2*frequency),y:.68-k/120*.1,pouring:k<360,stroke:1}));
 const result=run({duration:4,events});scenarios['wiggles '+frequency]={...result.s.metrics(),cpuTickMs:result.timing};picture(result.s,'wiggles-'+frequency);
}
for(const fill of [63,95])for(const clearance of [.002,.004,.006])for(const flow of [.25,.5,.75]){
 const s=new CozyLiquid(64);s.reset(true,fill);pour(s,1.5,flow,clearance);rest(s,.5);(report.matrix as unknown[]).push({fill,clearance,flow,...s.metrics()});
}
const sensitivity=[];for(const grid of [64,80]){const result=run(liquidDemonstrations['2 Low surface pool'],grid);sensitivity.push({grid,...result.s.metrics(),cpuTickMs:result.timing});}report.resolutionSensitivity=sensitivity;
const file=new URL('../docs/cozy-recorded-mouse.json',import.meta.url);
if(existsSync(file)){
 const recording=JSON.parse(readFileSync(file,'utf8')) as Recording,reference=run(recording,64,60,true),others=[];
 for(const rate of [30,60,120]){const result=run(recording,64,rate);let maximum=0,l1=0;for(const i of result.s.cells){maximum=Math.max(maximum,Math.abs(reference.s.foam[i]-result.s.foam[i]));l1+=Math.abs(reference.s.foam[i]-result.s.foam[i]);}others.push({rate,foamMaxErrorM:maximum,foamL1:l1,emittedDifferenceMl:reference.s.emittedMl-result.s.emittedMl});}
 (report.recordings as Record<string,unknown>).actualMouse={packets:recording.events.length,skips:recording.skips,metrics:reference.s.metrics(),comparisons:others};picture(reference.s,'actual-mouse-replay');
}
writeFileSync(new URL('../docs/cozy-results.json',import.meta.url),JSON.stringify(report,null,2));
writeFileSync(new URL('../docs/cozy-evidence.html',import.meta.url),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Cozy liquid behavior evidence</title><style>body{background:#23382d;color:#f4e6cc;font:15px system-ui;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}figure{margin:0}img{width:100%;max-width:440px}figcaption{padding:10px}a{color:#e8c58d}</style><h1>Cozy free-surface checkpoint</h1><p>Images reconstructed directly from transported milk/foam/crema inventories. No target shapes. These field captures are separate from browser screenshots.</p><p><a href="liquid-3d-evidence.html">Preserved rigid-lid baseline</a> · <a href="cozy-results.json">Quantitative results</a></p><main>${gallery.join('')}</main></html>`);
console.log('Saved cozy-results.json and cozy-evidence.html');
