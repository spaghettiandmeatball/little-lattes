import {InputTimeline,INPUT_BUFFER,initialState,type PourEvent} from './input';
import {MilkLedger,defaults} from './model';
import {sampleScript,type Replay} from './replays';
import {solveJet,type JetState} from './jet';
import {CAPACITY_ML,inCup} from './volume';
import {liquidDemonstrations} from './liquid-demonstrations';
import type {Liquid3D} from './liquid3d';
import type {SurfaceInput} from './surface';
import {Surface} from './surface';
import type {Recording} from './recording';
import {replays,heartArtReplay} from './replays';
import {solveLatteJet} from './equipment';
import {transitionSettings} from './cozy-controls';
import {heartGeometry} from './art-metrics';

export function mountLiquidChecks(context:{get:()=>Liquid3D|undefined;recording:()=>Recording|null;begin:()=>void;end:()=>void;picture:(jet:JetState)=>string}){
 const button=document.createElement('button');button.id='checkLiquid';button.textContent='Run GPU feasibility checks';
 const results=document.createElement('pre');results.id='liquidResults';const gallery=document.createElement('div');gallery.id='liquidEvidence';
 document.querySelector('.settings')!.append(button,results,gallery);
 const artButton=document.createElement('button');artButton.textContent='Check 3D art and pull-through';artButton.id='checkVolumeArt';document.querySelector('.settings')!.append(artButton);
 const heartButton=document.createElement('button');heartButton.id='checkVolumeHeart';heartButton.textContent='Check 3D heart';document.querySelector('.settings')!.append(heartButton);
 artButton.onclick=()=>runArt(false);heartButton.onclick=()=>runArt(true);
 async function runArt(heart:boolean){
  const liquid=context.get();if(!liquid){results.textContent='Select 3D latte art first.';return;}
  artButton.disabled=heartButton.disabled=true;context.begin();liquid.useFilm=true;liquid.film.response='local';liquid.reset();gallery.replaceChildren();
  const timeline=new InputTimeline(),script=sampleScript(heart?heartArtReplay:replays.Rosetta);let next=0,settings={flow:.41,height:.1};
  let beforeShape:ReturnType<typeof heartGeometry>|undefined;
  let before:ReturnType<typeof liquid.film.metrics>|undefined,bandCount=0,lastJet=solveJet(initialState(),0,1/60);
  const rows:number[]=[],counts=()=>{let best=0;const f=liquid.film,n=f.size;for(let x=Math.floor(n*.35);x<n*.65;x++){let peaks=0,prev=0;for(let y=Math.floor(n*.2);y<n*.8;y++){const c=f.white[y*n+x];if(c>.55&&prev<=.55)peaks++;prev=c;}best=Math.max(best,peaks);}return best;};
  try{
   for(let k=0;k<Math.ceil(script.duration*60);k++){
    const from=k/60,to=(k+1)/60;
    while(next<script.events.length&&script.events[next].time<=to+INPUT_BUFFER)timeline.push(script.events[next++]);
    const parts:SurfaceInput[]=[];
    for(const slice of timeline.consume(from,to)){
     const target={flow:(slice.a.flow+slice.b.flow)*.5,height:(slice.a.height+slice.b.height)*.5};settings=transitionSettings(settings,target,slice.dt);
     const x=(slice.a.x+slice.b.x)*.5,y=(slice.a.y+slice.b.y)*.5,quantity=slice.a.pouring?settings.flow*slice.dt:0;
     lastJet=solveLatteJet({...slice.b,x,y,...settings},quantity,slice.dt,{x:(slice.b.x-slice.a.x)/slice.dt,y:(slice.b.y-slice.a.y)/slice.dt},liquid);
     parts.push({slice,quantity,jet:lastJet});
    }
    liquid.stepBatch(parts);liquid.sync();rows.push(liquid.film.metrics().whiteAreaMm2);
    if(k===(heart?149:239)){before=liquid.film.metrics();beforeShape=heartGeometry(liquid.film.white,liquid.film.size);bandCount=counts();const img=document.createElement('img');img.alt=heart?'3D heart before cut':'3D bands before pull-through';img.src=context.picture(lastJet);img.style.width='100%';gallery.append(img);}
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
   }
   const after=liquid.film.metrics(),metrics:Record<string,unknown>=liquid.inspect(),img=document.createElement('img');img.alt='3D bands retained after pull-through';img.src=context.picture(lastJet);img.style.width='100%';gallery.append(img);
   const checks={separatedBands:bandCount>=3,pullThroughRetainsMilk:!!before&&after.whiteAreaMm2>before.whiteAreaMm2*.3,boundedFilm:after.minPurity>=0&&after.maxPurity<=1,finiteGPU:Number(metrics.nonFiniteValues)===0,milkAccounting:Math.abs(Number(metrics.milkErrorMl))<.002};
   const afterShape=heartGeometry(liquid.film.white,liquid.film.size);
   const heartChecks={twoLobesRetained:!!beforeShape&&afterShape.retainedLeft>beforeShape.retainedLeft*.85&&afterShape.retainedRight>beforeShape.retainedRight*.85,visibleNotch:afterShape.notchCells>=8,narrowTip:afterShape.tipWidthCells<afterShape.peakWidthCells*.45,tipExtended:!!beforeShape&&afterShape.lengthCells>beforeShape.lengthCells+3};
   results.textContent=JSON.stringify({completed:true,checks:heart?{...heartChecks,boundedFilm:checks.boundedFilm,finiteGPU:checks.finiteGPU,milkAccounting:checks.milkAccounting}:checks,bandsBeforeCut:bandCount,before,after,beforeShape,afterShape,metrics,whiteAreaByTick:rows},null,2);
  }catch(error){results.textContent=JSON.stringify({completed:false,error:String(error)});}
  finally{context.end();artButton.disabled=heartButton.disabled=false;}
 }
 button.onclick=async()=>{
  const liquid=context.get();if(!liquid){results.textContent='Select Experimental 3D liquid first.';return;}
  const recorded=context.recording();button.disabled=true;context.begin();gallery.replaceChildren();
  const report:Record<string,unknown>={device:navigator.userAgent,checks:[],responses:{}};
  const checks=report.checks as string[],responses=report.responses as Record<string,unknown>;
  const check=(name:string,ok:boolean)=>checks.push(`${ok?'PASS':'FAIL'} ${name}`);
  const nextFrame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  const summary=(values:number[])=>{const a=[...values].sort((x,y)=>x-y);return {mean:a.reduce((s,v)=>s+v,0)/Math.max(a.length,1),p95:a[Math.floor(a.length*.95)]??0};};
  async function run(name:string,replay:Replay,pictures=true,packets?:PourEvent[],preload=false){
   liquid!.reset();const timeline=new InputTimeline(),events=packets??sampleScript(replay).events,ledger=new MilkLedger(),baseline=new Surface();let cursor=0,lastJet=solveJet(initialState(),0,1/60);
   if(recorded&&packets)timeline.reset(0,recorded.initial);
   if(preload){for(const event of events)timeline.push(event);cursor=events.length;}
   const times:number[]=[],gpus:number[]=[],frames:number[]=[],snapshots:Record<string,unknown>[]=[];const inputTrace:string[]=[];let last=performance.now();
   for(let tick=0;tick<Math.ceil(replay.duration*60);tick++){
    const from=tick/60,to=(tick+1)/60,deadline=to+INPUT_BUFFER;
    // Events are released at their receipt deadline, without access to later inputs.
    while(cursor<events.length&&(events[cursor].received??events[cursor].time)<=deadline)timeline.push(events[cursor++]);
    const parts:SurfaceInput[]=[];
    for(const slice of timeline.consume(from,to)){
     const x=(slice.a.x+slice.b.x)*.5,y=(slice.a.y+slice.b.y)*.5,inside=inCup(x,y),pending=parts.reduce((s,p)=>s+(inCup((p.slice.a.x+p.slice.b.x)*.5,(p.slice.a.y+p.slice.b.y)*.5)?p.quantity*12:0),0);
     const desired=slice.a.pouring?(slice.a.flow+slice.b.flow)*.5:0,flow=inside?Math.min(desired,Math.max(0,CAPACITY_ML-liquid!.cup.fillMl-pending)/(Math.max(slice.dt,1e-9)*12)):desired;
     const quantity=ledger.spend(flow,slice.dt);lastJet=solveJet({...slice.b,x,y},quantity,slice.dt,{x:(slice.b.x-slice.a.x)/Math.max(slice.dt,1e-6),y:(slice.b.y-slice.a.y)/Math.max(slice.dt,1e-6)});parts.push({slice,quantity,jet:lastJet});
    }
    if(packets)inputTrace.push(JSON.stringify(parts));
    const begin=performance.now();liquid!.stepBatch(parts);times.push(performance.now()-begin);liquid!.sync();if(liquid!.gpuMs!==null)gpus.push(liquid!.gpuMs!);
    baseline.stepBatch(parts,defaults.Accessible);
    if(tick%60===59)snapshots.push({time:to,...liquid!.inspect()});
    await nextFrame();const now=performance.now();frames.push(now-last);last=now;
   }
   const metrics:Record<string,unknown>=liquid!.inspect(),state=liquid!.capture();responses[name]={metrics,baseline:baseline.metrics(),cpuSubmitMs:summary(times),gpuMs:summary(gpus),harnessFrameMs:summary(frames),snapshots};
   check(`${name}: finite GPU fields`,Number(metrics.nonFiniteValues)===0);check(`${name}: milk accounting`,Math.abs(Number(metrics.milkErrorMl))<.002);
   check(`${name}: foam transport ledger`,Math.abs(Number(metrics.foamTransportErrorMl))<.02);
   check(`${name}: pitcher ledger`,Math.abs(liquid!.cup.emittedMl-(100-ledger.remaining)*1.5)<1e-6);
   if(pictures){const image=document.createElement('img');image.src=context.picture(lastJet);image.alt=name;image.style.width='100%';const caption=document.createElement('p');caption.textContent=name;gallery.append(caption,image);}
   return {metrics,state,snapshots,inputTrace};
  }
  try{
   const states:Record<string,Awaited<ReturnType<typeof run>>>={};
   for(const [name,replay] of Object.entries(liquidDemonstrations)){results.textContent=`Checking ${name}…`;states[name]=await run(name,replay);}
   const names=Object.keys(liquidDemonstrations),raised=states[names[0]],low=states[names[1]];
   check('raised pour reaches lower half',Number(raised.metrics.deepMilkMl)>1);
   check('low pour retains more visible foam than raised',Number(low.metrics.surfaceFoamMl)>Number(raised.metrics.surfaceFoamMl)*4);
   const movement=states[names[2]];let difference=0;for(let i=0;i<low.state.foam.length;i+=4)difference+=Math.abs(low.state.foam[i]-movement.state.foam[i]);check('small movements change the surface field',difference>.1);
   const dry=states[names[3]].snapshots;check('dry gap adds no milk',Math.abs(Number(dry[1].milkMl)-Number(dry[0].milkMl)-.3*12*.6)<.02);
   const firstOnly={...liquidDemonstrations[names[4]],events:liquidDemonstrations[names[4]].events.map(event=>event.stroke===2?{...event,pouring:false}:event)};
   const control=await run('First pour without second',firstOnly,false),second=states[names[4]];let awayChange=0;
   for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(Math.hypot((x+.5)/256-.56,(y+.5)/256-.52)>.10)awayChange+=Math.abs(control.state.foam[(y*256+x)*4]-second.state.foam[(y*256+x)*4]);
   responses['Second pour effect away from impact']={fieldL1:awayChange};check('second pour changes existing foam away from its source',awayChange>1e-5);
   if(recorded&&recorded.skips.length===0){
    const replay={duration:recorded.duration,events:recorded.events};const causal=await run('Actual recording released causally',replay,false,recorded.events),queued=await run('Actual recording queued with receipt deadlines',replay,false,recorded.events,true);
    let error=0,l1=0,mass=0,foamError=0;for(let i=0;i<causal.state.foam.length;i++){const d=Math.abs(causal.state.foam[i]-queued.state.foam[i]);error=Math.max(error,d);l1+=d;mass+=Math.abs(causal.state.foam[i]);if(i%4===0)foamError=Math.max(foamError,d);}
    const identicalInputs=JSON.stringify(causal.inputTrace)===JSON.stringify(queued.inputTrace),relativeL1=l1/Math.max(mass,1e-20);
    responses['Actual recording equivalence']={events:recorded.events.length,identicalInputs,maximumSurfaceError:error,maximumFoamThicknessErrorM:foamError,relativeSurfaceL1:relativeL1,milkDifferenceMl:Number(causal.metrics.milkMl)-Number(queued.metrics.milkMl)};
    // FP32 pressure/film iterations need a relative tolerance, not bit identity.
    check('actual recording has no preloaded future advantage',identicalInputs&&relativeL1<1e-5&&foamError<1e-7);
   }
   // Independent rest/near-zero probes test causality and the zero-force limit.
   const make=(flow:number):Replay=>({duration:1,events:[{...initialState(),flow,height:.8,pouring:flow>0,time:0,stroke:1},{...initialState(),flow,height:.8,pouring:false,time:.5,stroke:1}]});
   const zero=await run('Zero flow',make(0),false),tiny=await run('Near-zero flow',make(1e-6),false),normal=await run('Normal flow',make(.5),false);
   check('zero flow stays still and dry',Number(zero.metrics.peakSpeedMPS)===0&&Number(zero.metrics.milkMl)===0);
   check('near-zero source approaches zero momentum',Number(tiny.metrics.incomingImpulseNs)<Number(normal.metrics.incomingImpulseNs)*1e-4&&Number(tiny.metrics.peakSpeedMPS)<Number(normal.metrics.peakSpeedMPS)*.001);
   const full:Replay={duration:7,events:[{...initialState(),flow:1,pouring:true,time:0,stroke:1},{...initialState(),flow:1,pouring:false,time:6.9,stroke:1}]};
   const capacity=await run('Capacity stop',full,false);check('capacity exact without overspending',Math.abs(Number(capacity.metrics.fillMl)-CAPACITY_ML)<1e-6&&Number(capacity.metrics.outsideMl)<1e-6);
   const result={...report,completed:true};results.textContent=JSON.stringify(result,null,2);
  }catch(error){results.textContent=JSON.stringify({...report,error:String(error)},null,2);}
  finally{context.end();button.disabled=false;}
 };
}

