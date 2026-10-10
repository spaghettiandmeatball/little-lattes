import './style.css';
import {detailAim} from './tool-controls';
import './mobile.css';
import './world-ui.css';
import './recipe-buttons.css';
import './world-pieces.css';
import './scene-first.css';
import {mountSceneFirstUI} from './scene-first-ui';
import {installRecipeButtons} from './recipe-buttons';
import {milkRecipes,milkRecipeQuality,milkGuide,type MilkRecipe} from './milk-recipes';
import * as T from 'three';
import {createScene} from './scene';
import {Fluid} from './fluid';
import {defaults,MilkLedger,validPreset,type Preset} from './model';
import {InputTimeline,initialState,INPUT_BUFFER,type PourState} from './input';
import {replays,sampleScript,heartArtReplay,type FoamFinish} from './replays';
import {clearanceMeters,solveJet,clamp,type JetState} from './jet';
import {padSettings,padAim,wheelHeight,heldFlow,type PadAnchor} from './controls';
import {InputRecorder,validRecording} from './recording';
import type {SurfaceInput} from './surface';
import {musicControls,setupMusic} from './music';
import {Liquid3D} from './liquid3d';
import {inCup,CAPACITY_ML} from './volume';
import {liquidDemonstrations} from './liquid-demonstrations';
import {CozyView} from './cozy-view';
import {COZY_VERSION} from './cozy-liquid';
import {intendedSettings,advancePhysicalSettings,padDelivery,type Intention,type ControlResponse} from './cozy-controls';
import {permittedFlow} from './emission';
import {solveCozyJet,solveLatteJet,type EquipmentModel} from './equipment';
import {FRESH_CUP,RECOMMENDED_SETTINGS} from './session-config';
import {replayControls,wrapBearing} from './pour-pose';
import {mountCornerStudio} from './corner-studio';
import {mountBrewing} from './brewing-studio';

const defaultAdvanced=intendedSettings(FRESH_CUP.intention,FRESH_CUP.delivery);
document.querySelector('#app')!.innerHTML=`<main>
${musicControls}
<header><span class="eyebrow">THE AFTERNOON POUR</span><h1>Little Latte <span>✦</span></h1></header>
<div id="modeControls"><label>Simulation <select id="mode" aria-describedby="compatibility"><option value="cozy">Free surface · compatibility</option><option value="surface">Original surface · legacy</option><option value="volume" selected>Full 3D · recommended</option></select></label><small id="compatibility">Full liquid depth and latte-art surface</small></div>
<div id="stage" aria-label="Latte art surface"></div>
<div id="aimZone" aria-label="Relative aiming area below the cup">Slide to aim · follow the marker</div>
<aside id="bulkPanel" hidden><span>CUP CROSS-SECTION · live liquid</span><canvas id="bulkSlice" width="256" height="90" aria-label="Milk concentration and circulation through cup depth"></canvas><small id="bulkCaption"></small></aside>
<p id="hint">Hold the cup to pour · wheel: height · A / D: flow</p>
<section class="controls">
<div class="dock-toolbar" aria-label="Pouring dock"><button id="dockAdjust" aria-expanded="false" aria-controls="pourControls"><span>Adjust</span><small id="dockValues">Flow · height</small></button><button id="dockCup" aria-expanded="false">Cup</button><button id="dockCorner" aria-expanded="false">Corner</button><button id="dockRadio" aria-expanded="false" aria-label="Open café radio">♫</button></div>
<div class="milk"><span id="phase">POURING STUDIO</span><strong id="milk">100%</strong></div><progress id="budget" max="100" value="100"></progress>
<div class="surface-tools"><label for="surfaceTool">Surface tool</label><select id="surfaceTool"><option value="pour">Milk pour</option><option value="pick">Foam pick · fine lines</option><option value="spoon">Foam spoon · soft swirls</option></select><button id="toolPrecision" type="button" aria-pressed="true" title="Fine detail: smaller contact, lighter pull, slower movement. Hold Shift for temporary precision.">Fine</button><button id="undoEtch" disabled>Undo stroke</button><small class="etch-caption">Fine gives smaller, gentler strokes · hold Shift for precision · touch tools sit above your finger</small></div>
<details class="milk-recipes"><summary>Milk & pouring tips</summary><div><label>Milk texture<select id="milkTexture"><option value="prepared">My prepared milk</option>${Object.entries(milkRecipes).map(([id,r])=>`<option value="${id}">${r.label}</option>`).join('')}</select></label><p id="milkTip">${milkGuide}</p><small>Practice presets change your milk texture. Steam in Corner to prepare your own jug.</small></div></details>
<div class="intentions" role="group" aria-label="Pour intention"><button id="drawIntent" aria-pressed="true">Draw</button><button id="finishIntent" aria-pressed="false">Finish</button><select id="autoPourStyle" aria-label="Auto-pour pattern"><option value="Feather rosetta">Feather rosetta</option><option value="Classic rosetta">Classic rosetta</option><option value="Heart">Heart</option><option value="Cheeky rosetta">Cheeky rosetta</option></select><button id="showPour" title="Start a fresh cup and watch an automatic pour">Auto pour</button></div>
<div id="pourControls"><div class="adjustments">
<label><span id="deliveryLabel">Flow</span><input id="flow" aria-label="Flow" type="range" min="0.1" max="1" step="0.001" value="${defaultAdvanced.flow}"><output id="flowValue">${(defaultAdvanced.flow*12).toFixed(1)} ml/s</output></label>
<label class="advancedControl">Height <input id="height" type="range" min="0" max="1" step="0.001" value="${defaultAdvanced.height}"><output id="heightValue">${(clearanceMeters(defaultAdvanced.height)*1000).toFixed(1)} mm</output></label>
<div id="clearance" class="advancedControl" aria-label="Spout clearance"><span class="spout-cue">▾</span><span class="surface-cue"></span><small>Prepared canvas</small></div>
<div class="mini"><button id="less" aria-label="Gentler delivery">−</button><span class="deliveryScale">Gentle ↔ generous</span><button id="more" aria-label="More generous delivery">+</button><label class="advancedControl">Feel <select id="preset"><option>Drawing</option><option selected>Accessible</option><option>Technique</option></select></label></div>
</div><button id="pour" aria-label="Hold to pour and slide to move the spout"><span>Hold to pour</span><small>Slide to steer the spout</small><i id="padDot"></i></button></div>
<div class="bearing-control"><button id="bearingLeft" aria-label="Turn pour direction left">↶</button><label><span id="bearingArrow" aria-hidden="true">↑</span> <span class="directionLabel">Direction</span><input id="bearing" aria-label="Pour direction" type="range" min="-180" max="180" step="1" value="0"><output id="bearingValue">0°</output></label><button id="bearingRight" aria-label="Turn pour direction right">↷</button></div>
<div class="row actions"><button id="reset">Fresh cup</button><button id="refill">Steam & refill</button><button id="nextCup">Next cup</button><button id="finish">Enjoy cup</button><button id="takePhoto">Take photo</button></div>
<p id="status" role="status">Pour low to grow a pool. Lift and reduce flow to cut through.</p>
</section>
<details><summary>Studio settings</summary><div class="settings">
<small>Opens ready to pour: Full 3D, High quality, Advanced controls and a pad that steers the spout.</small>
<small style="color:#d4cfb8;padding-bottom:6px;border-bottom:1px solid #ffffff18">Café radio opens from the music button on the mobile dock.</small>
<label>Pour pad <select id="padMode"><option value="aim" selected>Move the spout</option><option value="settings">Adjust flow & height</option></select></label>
<label>Controls <select id="scheme"><option value="cozy">Cozy</option><option value="advanced" selected>Advanced</option></select></label>
<button id="mixIntent">Mix · optional practice</button><label><input id="stopAtRim" type="checkbox"> Stop pouring at the rim</label>
<label><input id="rimAccess" type="checkbox" checked> Assist pitcher clearance at rim</label>
<label><input id="developer" type="checkbox"> Developer measurements</label>
<label><input id="left" type="checkbox"> Left-handed controls</label><label><input id="unlimited" type="checkbox"> Unlimited milk</label><label><input id="sound" type="checkbox"> Pour sound</label>
<label>Visual quality <select id="quality"><option value="1">Standard</option><option value="2" selected>High · recommended</option></select></label>
<label>Field view <select id="field"><option value="milk">Milk</option><option value="velocity">Velocity</option></select></label>
<label>Touch marker offset <input id="offset" type="range" min="0" max="60" value="32"><span>px</span></label>
<label><input id="fine" type="checkbox"> Precision controls (also hold Shift)</label>
<div id="tuning"></div><div class="row"><button id="save">Save preset</button><button id="restore">Reset preset</button><button id="export">Export tuning</button></div>
<label>Import tuning <input id="import" type="file" accept="application/json,.json"></label>
<label>Practice replay <select id="replay">${Object.keys(replays).map(k=>`<option>${k}</option>`).join('')}</select></label><button id="runReplay">Replay pouring actions</button>
<label>Liquid response <select id="liquidDemo">${Object.keys(liquidDemonstrations).map(k=>`<option>${k}</option>`).join('')}</select></label><button id="runLiquidDemo">Run liquid response</button><button id="exportLiquidMetrics">Export liquid measurements</button>
<div class="row"><button id="record">Record fresh pour</button><button id="playRecording">Play recording</button><button id="exportRecording">Export recording</button></div>
<label>Import recording <input id="importRecording" type="file" accept="application/json,.json"></label>
<label id="recordingCopy" hidden>Recording JSON <textarea id="recordingJSON" readonly aria-label="Recording JSON to copy"></textarea></label>
<button id="exportComparison">Export recording comparison</button><label id="comparisonCopy" hidden>Comparison JSON <textarea id="comparisonJSON" readonly aria-label="Recording comparison JSON"></textarea></label>
<small>Recording starts with a fresh cup. Refill, Finish or recipe changes end the recording.</small>
<small>Scripts emit 120 Hz packets. Your recordings preserve event and receipt times. Both use the same 33 ms input buffer.</small><small id="performance"></small><pre id="diagnostics"></pre>
</div></details></main>`;
setupMusic();
document.querySelector('.adjustments')!.append(document.querySelector('.bearing-control')!);
const el=<E extends HTMLElement>(id:string)=>document.getElementById(id) as E;
const range=el<HTMLInputElement>('flow'),heightRange=el<HTMLInputElement>('height'),preset=el<HTMLSelectElement>('preset'),ledger=new MilkLedger();
let presets:Record<string,Preset>=structuredClone(defaults);
try{const saved=JSON.parse(localStorage.getItem('little-latte-presets-v2')||'null');if(saved&&Object.keys(defaults).every(k=>validPreset(saved[k])))presets=saved;}catch{/* Optional storage. */}
const view=createScene(el('stage')),fluid=new Fluid(),canvas=view.renderer.domElement;
let cozy=new CozyView(!!view.renderer.getContext().getExtension('OES_texture_float_linear'));let cozyMode=true,intention:Intention=FRESH_CUP.intention,controlPhysical=intendedSettings(FRESH_CUP.intention,FRESH_CUP.delivery);
let equipmentModel:EquipmentModel='roomy-pour-3';
let milkQuality=1,preparedMilkQuality=1;
el<HTMLSelectElement>('milkTexture').onchange=e=>{const id=(e.target as HTMLSelectElement).value;milkQuality=milkRecipeQuality(id,preparedMilkQuality);el('milkTip').textContent=id==='prepared'?milkGuide:milkRecipes[id as MilkRecipe].tip;el('status').textContent=id==='prepared'?'Using your prepared milk.':'Milk practice preset ready · '+milkRecipes[id as MilkRecipe].label;};
let controlResponse:ControlResponse='dry-ready-1';
const cozyControls=()=>el<HTMLSelectElement>('scheme').value==='cozy';
document.querySelector('.settings')!.prepend(el('modeControls'));document.querySelector('main')!.classList.toggle('cozyControls',cozyControls());
function model(){return cozyMode?cozy:experimental?liquid:undefined;}
function sharedJet(s:PourState,quantity:number,dt:number,velocity={x:0,y:0}){
 if(experimental&&liquid?.useFilm)return solveLatteJet(s,quantity,dt,velocity,liquid,el<HTMLInputElement>('rimAccess').checked,equipmentModel);
 if(cozyMode&&cozy.useFilm)return solveLatteJet(s,quantity,dt,velocity,cozy,el<HTMLInputElement>('rimAccess').checked,equipmentModel);
 if(cozyMode&&cozy.surfaceYield)return solveCozyJet(s,quantity,dt,velocity,cozy,el<HTMLInputElement>('rimAccess').checked,equipmentModel);
 return solveJet(s,quantity,dt,velocity,cozyMode);
}
let liquid:Liquid3D|undefined,experimental=false;
const frameSamples:number[]=[],cpuSamples:number[]=[],gpuSamples:number[]=[];
const renderSamples:number[]=[];
let lastInspection:Record<string,unknown>={};
let state:PourState={...initialState(),bearing:0},cupPointer:number|null=null,flowPointer:number|null=null,mousePour=false,held=false,touch=false,finished=false,paused=document.hidden;
let clock=performance.now()/1000-INPUT_BUFFER,settleUntil=0,replayEnd=0,replayClockEnd=0;
const timeline=new InputTimeline(clock);
const recorder=new InputRecorder();
let recordingStart=0,pendingCapture:{time:number;kind:'live'|'replay'}|null=null;
let liveCapture:unknown=null,replayCapture:unknown=null;
function captureRecording(kind:'live'|'replay'){if(!cozyMode&&!experimental)return;const captured=cozyMode?{metrics:cozy.inspect(),remaining:ledger.remaining,film:cozy.useFilm?Array.from(cozy.film.white):undefined,fields:{height:Array.from(cozy.h),foam:Array.from(cozy.foam),upperMilk:Array.from(cozy.upperMilk),lowerMilk:Array.from(cozy.lowerMilk),gas:Array.from(cozy.gas),deepGas:Array.from(cozy.deepGas),crema:Array.from(cozy.crema)}}:{metrics:liquid!.metrics(),remaining:ledger.remaining,film:liquid!.useFilm?Array.from(liquid!.film.white):undefined};if(kind==='live')liveCapture=captured;else replayCapture=captured;}
let padAnchor:PadAnchor|null=null,shift=false;
let steeringPoint:T.Vector2|null=null;
let surfaceTool:'pour'|'pick'|'spoon'='pour',etchPointer:number|null=null,etchPoint:{x:number;y:number}|null=null;
let etchRaw:{x:number;y:number}|null=null;
let etchUndo:Float32Array|null=null;
const toolPrecise=()=>el('toolPrecision').getAttribute('aria-pressed')==='true'||fine();
let pendingFoamFinish:FoamFinish[]|undefined;
const activeFilm=()=>cozyMode&&cozy.useFilm?cozy.film:experimental&&liquid?.useFilm?liquid.film:null;
function endEtch(){if(etchPointer!==null&&canvas.hasPointerCapture(etchPointer))canvas.releasePointerCapture(etchPointer);etchPointer=null;etchPoint=null;etchRaw=null;view.setEtching(surfaceTool,null);}
el<HTMLSelectElement>('surfaceTool').onchange=()=>{
 sealRecording();stop(true,'surface-tool');endEtch();surfaceTool=el<HTMLSelectElement>('surfaceTool').value as typeof surfaceTool;
 if(surfaceTool!=='pour'&&!activeFilm()){surfaceTool='pour';el<HTMLSelectElement>('surfaceTool').value='pour';el('status').textContent='Foam tools work with Full 3D and Free surface.';return;}
 if(surfaceTool==='pour'){etchUndo=null;el<HTMLButtonElement>('undoEtch').disabled=true;} document.querySelector('main')!.classList.toggle('etching',surfaceTool!=='pour');pour.setAttribute('aria-disabled',String(surfaceTool!=='pour'));
 el('status').textContent=surfaceTool==='pour'?'Ready to pour.':'Drag directly across the coffee to pull existing foam. No milk is added.';view.setEtching(surfaceTool,null);hint();
};
el('toolPrecision').onclick=()=>{const button=el('toolPrecision');button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));};
el('undoEtch').onclick=()=>{const film=activeFilm();if(film&&etchUndo){film.white.set(etchUndo);etchUndo=null;el<HTMLButtonElement>('undoEtch').disabled=true;el('status').textContent='Last foam stroke undone.';}};
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||paused||document.querySelector('main')!.classList.contains('world-open'))return;const kind=view.hitTableTool(e.clientX,e.clientY);if(!kind)return;e.preventDefault();e.stopImmediatePropagation();el<HTMLSelectElement>('surfaceTool').value=kind;el('surfaceTool').dispatchEvent(new Event('change'));},true);
canvas.addEventListener('pointerdown',e=>{
 if(surfaceTool==='pour'||paused||e.button!==0||etchPointer!==null)return;
 e.stopImmediatePropagation();e.preventDefault();sealRecording();stop(true,'etch');shift=e.shiftKey;
 const p=view.point(e.clientX,e.clientY-(e.pointerType==='touch'?48:0)),point={x:p.x*.5+.5,y:p.y*.5+.5};if(Math.hypot(point.x-.5,point.y-.5)>.47)return;
 etchUndo=activeFilm()!.white.slice();el<HTMLButtonElement>('undoEtch').disabled=false;etchPointer=e.pointerId;etchPoint=point;etchRaw=point;canvas.setPointerCapture(e.pointerId);view.setEtching(surfaceTool,p,toolPrecise()||e.shiftKey);
},true);
canvas.addEventListener('pointermove',e=>{
 if(surfaceTool==='pour'||paused)return;e.stopImmediatePropagation();
 const samples=e.getCoalescedEvents?.()||[];
 for(const sample of samples.length?samples:[e]){
  const p=view.point(sample.clientX,sample.clientY-(e.pointerType==='touch'?48:0)),raw={x:p.x*.5+.5,y:p.y*.5+.5};
  if(etchPointer===e.pointerId&&etchPoint&&etchRaw){
   const precise=toolPrecise()||e.shiftKey,next=detailAim(etchPoint,etchRaw,raw,precise);
   activeFilm()?.etch(etchPoint,next,surfaceTool,precise);etchPoint=next;etchRaw=raw;
   view.setEtching(surfaceTool,new T.Vector2((next.x-.5)*2,(next.y-.5)*2),precise);
  }else view.setEtching(surfaceTool,Math.hypot(raw.x-.5,raw.y-.5)<.47?p:null,toolPrecise()||e.shiftKey);
 }
},true);
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if((e as PointerEvent).pointerId===etchPointer){e.stopImmediatePropagation();endEtch();}},true);
const heldKeys=new Set<string>();
const fine=()=>shift||el<HTMLInputElement>('fine').checked;
let currentJet:JetState=solveJet(state,0,1/60);
let playbackSkips:{from:number;to:number}[]=[];
function packet(time:number,reason?:string){const event=timeline.push({...state,time,received:performance.now()/1000,reason});recorder.add(event);}
const unlimited=()=>el<HTMLInputElement>('unlimited').checked;
function emit(time=performance.now()/1000){
 if(replayEnd){
  pendingFoamFinish=undefined;replayEnd=0;state={...renderState,pouring:false};syncReplayControls(state);clock=performance.now()/1000-INPUT_BUFFER;timeline.reset(clock,state);
  el('status').textContent='Replay stopped. Your controls are active.';
 }
 const was=state.pouring;
 const settings=cozyControls()?intendedSettings(intention,Number(range.value)):{flow:Number(range.value),height:Number(heightRange.value)};
 state={...state,...settings,intention,delivery:cozyControls()?Number(range.value):(state.delivery??.35),scheme:cozyControls()?'cozy':'advanced',bearing:Number(el<HTMLInputElement>('bearing').value)*Math.PI/180};
 state.pouring=!finished&&!paused&&(mousePour||held)&&(ledger.remaining>0||unlimited());
 if(!was&&state.pouring)state.stroke++;
 packet(time);
}
function stop(dropHistory=false,reason='stop'){
 pendingFoamFinish=undefined;
 if(replayEnd){state={...renderState,pouring:false};syncReplayControls(state);}
 if(dropHistory&&replayEnd){pendingCapture=null;replayCapture=null;el('status').textContent='Replay interrupted. Play it again to compare.';}
 mousePour=held=false;
 endEtch();
 heldKeys.clear();shift=false;padAnchor=null;steeringPoint=null;
 if(gain&&audio)gain.gain.setTargetAtTime(0,audio.currentTime,.015);
 for(const [target,id] of [[canvas,cupPointer],[el('pour'),flowPointer]] as const)if(id!==null&&target.hasPointerCapture(id))target.releasePointerCapture(id);
 cupPointer=flowPointer=null;state.pouring=false;replayEnd=0;
 const now=performance.now()/1000;
 packet(dropHistory?now-INPUT_BUFFER:now,reason);
 if(dropHistory){recorder.skip(clock,now-INPUT_BUFFER);clock=now-INPUT_BUFFER;timeline.reset(clock,state);}
 playbackSkips=[];
}
function move(e:PointerEvent){const p=view.point(e.clientX,e.clientY-(e.pointerType==='touch'?Number(el<HTMLInputElement>('offset').value):0));if(steeringPoint&&cupPointer===e.pointerId){const gain=(e.shiftKey||fine()) ? .2 : 1;state.x+=(p.x-steeringPoint.x)*.5*gain;state.y+=(p.y-steeringPoint.y)*.5*gain;}else{state.x=p.x*.5+.5;state.y=p.y*.5+.5;}steeringPoint=cupPointer===e.pointerId?p:null;emit(e.timeStamp/1000);}
function hint(){el('app').classList.toggle('touch',touch);el('hint').textContent=touch&&padAiming()?'Hold the pad to pour · slide to steer · lift to stop':touch?(cozyControls()?'Aim below the cup · hold the pad · slide sideways for delivery':'Aim below the cup · hold the pad · sideways: flow · up/down: height'):cozyControls()?intention==='finish'?'Pull through once · release while moving for a fine tip':'Hold to pour · wheel: delivery · choose Finish for the cut':'Hold to pour · wheel: height · A / D: flow · Shift: fine';}
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0||cupPointer!==null||finished||paused)return;
 if(replayEnd)stop(true);touch=e.pointerType==='touch';hint();cupPointer=e.pointerId;steeringPoint=touch?view.point(e.clientX,e.clientY-Number(el<HTMLInputElement>('offset').value)):null;canvas.setPointerCapture(e.pointerId);mousePour=!touch;move(e);
});
canvas.addEventListener('pointermove',e=>{
 if(paused)return;
 if(replayEnd&&cupPointer===null)return;
 if(cupPointer===e.pointerId||e.pointerType==='mouse'&&cupPointer===null&&!finished){
  const samples=e.getCoalescedEvents?.()||[];for(const sample of samples.length?samples:[e])move(sample);
 }
});
canvas.addEventListener('pointerup',e=>{if(e.pointerId===cupPointer){move(e);mousePour=false;cupPointer=null;steeringPoint=null;emit(e.timeStamp/1000);}});
for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if((e as PointerEvent).pointerId===cupPointer)stop();});
canvas.addEventListener('wheel',e=>{if(finished||paused||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();const target=cozyControls()?range:heightRange;target.value=String(clamp(Number(target.value)+wheelHeight(e.deltaY,e.deltaMode,e.shiftKey||fine()),0,1));emit();},{passive:false});
const pour=el('pour');
const padAiming=()=>el<HTMLSelectElement>('padMode').value==='aim';
function updatePadLabel(){pour.setAttribute('aria-label',padAiming()?'Hold to pour and slide to move the spout':cozyControls()?'Hold to pour; drag horizontally to adjust delivery':'Hold to pour; drag horizontally for flow and vertically for height');document.querySelector('#pour small')!.textContent=padAiming()?'Slide to steer the spout':cozyControls()?'← delivery →':'↑ height · flow →';pour.classList.toggle('aim-pad',padAiming());}
el('padMode').onchange=()=>{stop(true,'pad-mode');updatePadLabel();hint();};
function pad(e:PointerEvent){if(!padAnchor)return;const r=pour.getBoundingClientRect();if(padAiming()){Object.assign(state,padAim(state,e.clientX-padAnchor.x,e.clientY-padAnchor.y,r.width,r.height,e.shiftKey||fine()));}else if(cozyControls())range.value=String(padDelivery(Number(range.value),e.clientX-padAnchor.x,r.width,e.shiftKey||fine()));else {const values=padSettings(padAnchor,e.clientX,e.clientY,r.width,r.height,e.shiftKey||fine());range.value=String(values.flow);heightRange.value=String(values.height);}padAnchor={x:e.clientX,y:e.clientY,flow:Number(range.value),height:Number(heightRange.value)};emit(e.timeStamp/1000);}
pour.addEventListener('pointerdown',e=>{if(e.button!==0||flowPointer!==null||finished||surfaceTool!=='pour')return;e.preventDefault();if(replayEnd)stop(true,'pad-interrupt');if(e.pointerType==='touch'){touch=true;hint();}flowPointer=e.pointerId;pour.setPointerCapture(e.pointerId);padAnchor={x:e.clientX,y:e.clientY,flow:Number(range.value),height:Number(heightRange.value)};held=true;emit(e.timeStamp/1000);});
pour.addEventListener('pointermove',e=>{if(e.pointerId===flowPointer){const samples=e.getCoalescedEvents?.()||[];for(const sample of samples.length?samples:[e])pad(sample);}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])pour.addEventListener(event,e=>{if((e as PointerEvent).pointerId===flowPointer){held=false;flowPointer=null;padAnchor=null;emit((e as PointerEvent).timeStamp/1000);}});
pour.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&surfaceTool==='pour'){e.preventDefault();held=true;emit();}});pour.addEventListener('keyup',()=>{held=false;emit();});pour.addEventListener('blur',()=>{held=false;emit();});
range.oninput=heightRange.oninput=()=>emit();
function changeFlow(delta:number){range.value=String(T.MathUtils.clamp(Number(range.value)+delta,cozyControls()?0:.1,1));emit();}
el('less').onclick=()=>changeFlow(-.05);el('more').onclick=()=>changeFlow(.05);
window.addEventListener('keydown',e=>{if(e.key==='Shift')shift=true;if((e.target as HTMLElement).closest('input,select,textarea,[contenteditable]')||e.ctrlKey||e.altKey||e.metaKey||finished||studio?.active)return;if(e.code==='KeyQ'||e.code==='KeyE'){e.preventDefault();changeBearing((e.code==='KeyQ'?-1:1)*(fine()?1:5));}if(e.code==='KeyA'||e.code==='KeyD'){e.preventDefault();if(!e.repeat)heldKeys.add(e.code);}});
window.addEventListener('keyup',e=>{heldKeys.delete(e.code);if(e.key==='Shift')shift=false;});
window.addEventListener('blur',()=>{paused=true;stop(true,'blur');});window.addEventListener('focus',()=>{paused=document.hidden||!!studio?.active;stop(true,'focus');});document.addEventListener('visibilitychange',()=>{paused=document.hidden||!!studio?.active;stop(true,'visibility');});
window.addEventListener('resize',()=>stop(true,'resize'));window.addEventListener('orientationchange',()=>stop(true,'orientation'));
function chooseIntention(next:Intention){intention=next;if(!cozyControls()){const settings=intendedSettings(next,state.delivery??.35);range.value=String(settings.flow);heightRange.value=String(settings.height);}for(const key of ['draw','finish'])el(key+'Intent').setAttribute('aria-pressed',String(next===key));emit();hint();el('status').textContent=next==='finish'?'Pull through in one motion. Release while still moving for a fine tip.':next==='mix'?'Raised pour for mixing. Choose Draw when ready.':'Hold near the centre to grow a pool; small, slow wiggles make bands.';}
el('drawIntent').onclick=()=>chooseIntention('draw');el('finishIntent').onclick=()=>chooseIntention('finish');el('mixIntent').onclick=()=>chooseIntention('mix');
el('scheme').onchange=()=>{stop(true,'scheme');const isCozy=cozyControls();range.min=isCozy?'0':'.1';range.value=String(isCozy?(state.delivery??.65):Math.max(.1,controlPhysical.flow));heightRange.value=String(controlPhysical.height);document.querySelector('main')!.classList.toggle('cozyControls',isCozy);document.querySelector('#pour small')!.textContent=isCozy?'← delivery →':'↑ height · flow →';el('deliveryLabel').textContent=isCozy?'Delivery':'Flow';range.setAttribute('aria-label',isCozy?'Delivery':'Flow');pour.setAttribute('aria-label',isCozy?'Hold to pour; drag horizontally to adjust delivery':'Hold to pour; drag horizontally for flow and vertically for height');updatePadLabel();hint();emit();};
el('stopAtRim').onchange=()=>{sealRecording();cozy.stopAtRim=el<HTMLInputElement>('stopAtRim').checked;};
el('rimAccess').onchange=()=>{sealRecording();stop(true,'rim-assist');};
el('developer').onchange=()=>{document.querySelector('main')!.classList.toggle('developer',el<HTMLInputElement>('developer').checked);el('bulkPanel').hidden=!experimental||!el<HTMLInputElement>('developer').checked;};
function sealRecording(){if(recorder.active){stop(false,'recording-end');recorder.end(performance.now()/1000);el('record').textContent='Record fresh pour';}}
function fresh(){
 etchUndo=null;el<HTMLButtonElement>('undoEtch').disabled=true;
 sealRecording();stop(true);fluid.reset();if(liquid){liquid.useFilm=true;liquid.film.response='taper';liquid.reset();}if(cozy.size!==48){cozy.dispose();cozy=new CozyView(!!view.renderer.getContext().getExtension('OES_texture_float_linear'));}cozy.surfaceYield=true;cozy.useFilm=true;cozy.film.response='taper';cozy.stopAtRim=el<HTMLInputElement>('stopAtRim').checked;cozy.reset();ledger.refill();
 view.setEnjoy(false);
 controlPhysical=cozyControls()?intendedSettings(intention,Number(range.value)):{flow:Number(range.value),height:Number(heightRange.value)};
 state={...state,...controlPhysical,intention,scheme:cozyControls()?'cozy':'advanced',delivery:cozyControls()?Number(range.value):(state.delivery??FRESH_CUP.delivery),bearing:Number(el<HTMLInputElement>('bearing').value)*Math.PI/180};
 timeline.reset(clock,state);currentJet=sharedJet(state,0,1/60);
 frameSamples.length=cpuSamples.length=gpuSamples.length=renderSamples.length=0;view.clearTimings();lastInspection={};
 finished=false;document.querySelector('main')!.classList.remove('finished');el('phase').textContent='POURING STUDIO';
 el('status').textContent='For a heart, grow a pool in place; choose Finish and cut forward through it. Small wiggles make layers.';
 view.setLiquidLevel(cozyMode?cozy.surfaceM:experimental?liquid!.cup.surfaceM:0,cozyMode||experimental);
}
el<HTMLSelectElement>('mode').onchange=()=>{
 stop(true);const requested=el<HTMLSelectElement>('mode').value==='volume';
 cozyMode=el<HTMLSelectElement>('mode').value==='cozy';
 try{if(requested&&!liquid)liquid=new Liquid3D(view.renderer);experimental=requested;if(requested&&liquid)liquid.movingEnabled=new URLSearchParams(location.search).get('liquid')!=='rigid';el('compatibility').textContent=requested?'Recommended · full liquid depth and latte-art surface':'Legacy · original fixed surface for comparison';}
 catch(error){experimental=false;cozyMode=true;el<HTMLSelectElement>('mode').value='cozy';el<HTMLSelectElement>('mode').options[2].disabled=true;el('compatibility').textContent=`3D unavailable on this device (${String(error)}). Using free surface art.`;}
 if(cozyMode&&!requested)el('compatibility').textContent='Compatibility option · moving surface with the same latte-art layer';
 el('bulkPanel').hidden=!experimental||!el<HTMLInputElement>('developer').checked;preset.disabled=experimental||cozyMode;el('tuning').hidden=experimental||cozyMode;document.querySelector('#clearance small')!.textContent=experimental||cozyMode?'Current liquid surface':'Prepared canvas';fresh();
};
function startDrawing(){el<HTMLSelectElement>('surfaceTool').value='pour';el('surfaceTool').dispatchEvent(new Event('change'));sealRecording();equipmentModel='roomy-pour-3';controlResponse='dry-ready-1';el<HTMLInputElement>('rimAccess').checked=FRESH_CUP.rimAccess;el<HTMLInputElement>('stopAtRim').checked=FRESH_CUP.stopAtRim;cozy.stopAtRim=FRESH_CUP.stopAtRim;if(cozyMode||experimental){range.value=String(cozyControls()?FRESH_CUP.delivery:intendedSettings(FRESH_CUP.intention,FRESH_CUP.delivery).flow);state={...initialState(),x:FRESH_CUP.x,y:FRESH_CUP.y,delivery:FRESH_CUP.delivery};chooseIntention(FRESH_CUP.intention);}fresh();}
el('reset').onclick=()=>{fresh();closeDocks();};
el('refill').onclick=()=>{sealRecording();stop(true,'refill');ledger.refill();view.refillAnimation();el('status').textContent='Fresh milk is steaming in your counter jug…';};
el('nextCup').onclick=()=>{sealRecording();stop(true,'next-cup');if(!view.keepCup()){el('status').textContent='Six cups on the counter. Clear finished cups in Corner to make room.';return;}const milk=ledger.remaining;fresh();ledger.remaining=milk;el('status').textContent='Your finished cup stays on the counter. This cup is ready; your milk supply carries over.';};
el('finish').onclick=()=>{sealRecording();stop();finished=true;settleUntil=performance.now()/1000+20;document.querySelector('main')!.classList.add('finished');view.setEnjoy(true);el('phase').textContent='YOUR FINISHED CUP';el('status').textContent='Letting your art settle…';};
function tuning(){el('tuning').innerHTML=Object.entries(presets[preset.value]).map(([key,value])=>`<label>${key}<input data-param="${key}" type="range" min="${key==='radius'?.01:key==='opacity'?.5:0}" max="${key==='radius'?.08:key==='spread'?.25:key==='opacity'?3:1}" step="0.001" value="${value}"></label>`).join('');el('tuning').querySelectorAll<HTMLInputElement>('input').forEach(input=>input.oninput=()=>{sealRecording();presets[preset.value][input.dataset.param as keyof Preset]=Number(input.value);});}
el('unlimited').onchange=()=>sealRecording();
preset.onchange=()=>{fresh();tuning();};tuning();
el('save').onclick=()=>{try{localStorage.setItem('little-latte-presets-v2',JSON.stringify(presets));el('status').textContent='Preset saved on this device.';}catch{el('status').textContent='Storage unavailable. Export your tuning to keep it.';}};
el('restore').onclick=()=>{sealRecording();presets[preset.value]=structuredClone(defaults[preset.value]);tuning();};
el('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(presets,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='latte-presets.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
el<HTMLInputElement>('import').onchange=async e=>{try{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;const data=JSON.parse(await file.text());if(!Object.keys(defaults).every(k=>validPreset(data[k])))throw Error();sealRecording();presets=data;tuning();el('status').textContent='Tuning imported. Save to keep it.';}catch{el('status').textContent='Expected three valid pouring presets.';}};
el<HTMLInputElement>('left').onchange=e=>el('app').classList.toggle('left',(e.target as HTMLInputElement).checked);
el<HTMLSelectElement>('quality').onchange=e=>view.quality(Number((e.target as HTMLSelectElement).value));
el('runReplay').onclick=()=>{
 startDrawing();const name=el<HTMLSelectElement>('replay').value,replay=sampleScript(name==='Heart'&&(cozyMode||experimental)?heartArtReplay:replays[name]);const start=clock;pendingFoamFinish=replay.finishingStrokes;
 for(const event of replay.events)timeline.push({...event,bearing:event.bearing??0,time:event.time+start,received:(event.received??event.time)+start});replayEnd=start+replay.duration+INPUT_BUFFER;replayClockEnd=start+replay.duration;
 el('status').textContent=`Replaying ${el<HTMLSelectElement>('replay').value.toLowerCase()} · position / flow / height actions`;
 (document.querySelector('main>details') as HTMLDetailsElement).open=false;
};
el('showPour').onclick=()=>{if(replayEnd){stop(true,'auto-stop');el('status').textContent='Auto pour stopped. Your cup is ready to continue.';return;}el<HTMLSelectElement>('replay').value=el<HTMLSelectElement>('autoPourStyle').value;el('runReplay').click();el('status').textContent='Fresh cup · watch the pour, or touch the coffee to take over.';};
el('runLiquidDemo').onclick=()=>{
 fresh();const name=el<HTMLSelectElement>('liquidDemo').value,replay=sampleScript(liquidDemonstrations[name]),start=clock;
 for(const event of replay.events)timeline.push({...event,time:event.time+start,received:(event.received??event.time)+start});replayEnd=start+replay.duration+INPUT_BUFFER;replayClockEnd=start+replay.duration;
 el('status').textContent=`Response: ${name}. These are input packets, not a finished pattern.`;(document.querySelector('main>details') as HTMLDetailsElement).open=false;
};
el('exportLiquidMetrics').onclick=()=>exportJSON({date:'2026-10-07',mode:cozyMode?String(cozy.inspect().mode):experimental?String(liquid!.metrics().mode):'existing-surface',metrics:model()?.inspect()??fluid.metrics(),frameMs:frameSamples,cpuSubmitMs:cpuSamples,gpuSimulationMs:gpuSamples,renderSubmitMs:renderSamples,renderGpuMs:view.renderGpuTimings(),readback:lastInspection,device:navigator.userAgent},'latte-liquid-measurements.json');
function exportJSON(data:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function endRecording(){stop(false,'recording-end');recorder.end(performance.now()/1000);pendingCapture={time:recordingStart-INPUT_BUFFER+Math.floor((recorder.recording!.duration+INPUT_BUFFER)*60+1e-8)/60,kind:'live'};el('record').textContent='Record fresh pour';el('status').textContent='Recording ready to play or export.';}
el('record').onclick=()=>{if(recorder.active){endRecording();return;}fresh();const start=performance.now()/1000;recordingStart=start;pendingCapture=null;liveCapture=replayCapture=null;clock=start-INPUT_BUFFER;timeline.reset(clock,state);recorder.begin(start,state,presets[preset.value],unlimited());recorder.recording!.environment={solver:cozyMode?String(cozy.inspect().mode):experimental?String(liquid!.metrics().mode):'existing-surface',prepared:cozyMode,initialCoffeeMl:55,initialMilkMl:cozyMode?8:0,stopAtRim:cozy.stopAtRim,scheme:cozyControls()?'cozy':'advanced',intention,delivery:Number(range.value),leftHanded:el<HTMLInputElement>('left').checked,equipmentModel,controlResponse,milkQuality};el('record').textContent='Stop recording';el('status').textContent='Recording your fresh canvas · pour, stop and restart freely.';};
el('record').addEventListener('click',()=>{if(recorder.active&&recorder.recording?.environment)recorder.recording.environment.rimAccess=el<HTMLInputElement>('rimAccess').checked;});
el('playRecording').onclick=()=>{
 if(recorder.active)endRecording();const recording=recorder.recording;if(!recording){el('status').textContent='Record or import a pour first.';return;}
 const selectedScheme=el<HTMLSelectElement>('scheme').value;
 if(recording.environment){const env=recording.environment;el<HTMLSelectElement>('mode').value=env.solver.startsWith('hydrostatic-')?'cozy':env.solver.startsWith('gpu-volume')?'volume':'surface';el('mode').dispatchEvent(new Event('change'));el<HTMLSelectElement>('scheme').value=selectedScheme;el('scheme').dispatchEvent(new Event('change'));intention=env.intention;range.value=String(env.delivery);cozy.stopAtRim=env.stopAtRim;el<HTMLInputElement>('stopAtRim').checked=env.stopAtRim;el<HTMLInputElement>('left').checked=env.leftHanded;el('app').classList.toggle('left',env.leftHanded);}
 fresh();state={...recording.initial};syncReplayControls(state);renderState={...state};timeline.reset(clock,state);presets[preset.value]={...recording.recipe};tuning();el<HTMLInputElement>('unlimited').checked=recording.unlimited;
 if(recording.environment?.solver?.startsWith('hydrostatic-two-layer')){cozy.dispose();cozy=new CozyView(!!view.renderer.getContext().getExtension('OES_texture_float_linear'),64);}
 cozy.surfaceYield=recording.environment?.solver!=='hydrostatic-two-layer-1';
 cozy.useFilm=recording.environment?.solver?.startsWith('hydrostatic-film-')??false;cozy.film.response=recording.environment?.solver==='hydrostatic-film-3'?'legacy':recording.environment?.solver==='hydrostatic-film-5'?'taper':'local';
 cozy.stopAtRim=recording.environment?.stopAtRim??false;
 if(experimental&&liquid){liquid.useFilm=recording.environment?.solver?.startsWith('gpu-volume-film-')??false;liquid.movingEnabled=recording.environment?.solver==='gpu-volume-film-4';liquid.film.response=recording.environment?.solver==='gpu-volume-film-1'?'legacy':['gpu-volume-film-3','gpu-volume-film-4'].includes(recording.environment?.solver??'')?'taper':'local';}
 el<HTMLInputElement>('rimAccess').checked=recording.environment?.rimAccess!==false;
 equipmentModel=recording.environment?.equipmentModel??'rim-binary-1';
 controlResponse=recording.environment?.controlResponse??'smooth-1';milkQuality=recording.environment?.milkQuality??1;
 controlPhysical={flow:state.flow,height:state.height};
 const start=clock+INPUT_BUFFER;
 pendingCapture={time:clock+Math.floor((recording.duration+INPUT_BUFFER)*60+1e-8)/60,kind:'replay'};
 replayClockEnd=pendingCapture.time;
 playbackSkips=recording.skips.map(skip=>({from:skip.from+start,to:skip.to+start}));
 for(const event of recording.events)timeline.push({...event,time:event.time+start,received:event.received!+start});replayEnd=start+recording.duration+INPUT_BUFFER;
 el('status').textContent='Playing your recorded input';(document.querySelector('main>details') as HTMLDetailsElement).open=false;
};
el('exportRecording').onclick=()=>{if(recorder.active)endRecording();if(recorder.recording){el<HTMLTextAreaElement>('recordingJSON').value=JSON.stringify(recorder.recording,null,2);el('recordingCopy').hidden=false;exportJSON(recorder.recording,'latte-recording.json');el('status').textContent='Recording exported. JSON is also available to copy.';}else el('status').textContent='Record a pour first.';};
el('exportComparison').onclick=()=>{const comparison={recording:recorder.recording,live:liveCapture,replay:replayCapture,frameMs:frameSamples,cpuTickMs:cpuSamples,renderSubmitMs:renderSamples,renderGpuMs:view.renderGpuTimings(),device:navigator.userAgent};el<HTMLTextAreaElement>('comparisonJSON').value=JSON.stringify(comparison);el('comparisonCopy').hidden=false;exportJSON(comparison,'latte-recording-comparison.json');};
el<HTMLInputElement>('importRecording').onchange=async e=>{try{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;const data=JSON.parse(await file.text());if(!validRecording(data))throw Error();if(recorder.active)endRecording();recorder.recording=data;el('status').textContent='Recording imported. Ready to play.';}catch{el('status').textContent='Expected a valid Little Latte recording (up to ten minutes).';}};
let audio:AudioContext|undefined,gain:GainNode|undefined;
el<HTMLInputElement>('sound').onchange=async e=>{if((e.target as HTMLInputElement).checked){try{if(!audio){audio=new AudioContext();const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);const samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=750;gain=audio.createGain();gain.gain.value=0;source.connect(filter).connect(gain).connect(audio.destination);source.start();}await audio.resume();}catch{el('status').textContent='Pour sound unavailable.';}}else if(gain)gain.gain.value=0;};
let lastFieldUpload=0;let last=performance.now()/1000,frames=0,report=last,simMs=0,uploadMs=0,renderMs=0,dropped=0,renderState={...state};
function frame(ms:number){
 cozy.film.milkQuality=milkQuality;if(liquid){liquid.film.milkQuality=milkQuality;liquid.deterministicSampling=recorder.active||!!pendingCapture||!!replayEnd;}view.coffeeMaterial.uniforms.milkQuality.value=milkQuality;
 const now=ms/1000;const elapsed=now-last;last=now;
 if(document.hidden){requestAnimationFrame(frame);return;}
 // Live input drops stale wet history. Authored playback keeps its timeline
 // across shader warm-up / slow frames; the eight-step frame budget bounds catch-up.
 if(elapsed>.15&&!studio?.active){dropped++;if(!replayEnd&&etchPointer===null)stop(true,'stall');}
 if(!paused&&!finished&&!replayEnd&&heldKeys.size)changeFlow(heldFlow((heldKeys.has('KeyD')?1:0)-(heldKeys.has('KeyA')?1:0),elapsed,fine()));
 const begin=performance.now();
 if(!paused){let steps=0;while(clock+1/60<=now-INPUT_BUFFER&&steps++<8){
   const skip=playbackSkips.find(s=>clock>=s.from-1e-8&&clock<s.to-1e-8);
   if(skip){const to=Math.min(skip.to,now-INPUT_BUFFER);timeline.consume(clock,to);clock=to;continue;}
   const slices=timeline.consume(clock,clock+1/60),parts:SurfaceInput[]=[];
  for(const slice of slices){
   renderState={...slice.b};
   const target={flow:(slice.a.flow+slice.b.flow)*.5,height:(slice.a.height+slice.b.height)*.5};
   controlPhysical=slice.a.scheme==='cozy'?advancePhysicalSettings(controlPhysical,target,slice.dt,slice.a.pouring,controlResponse):target;
   const midpoint={x:(slice.a.x+slice.b.x)*.5,y:(slice.a.y+slice.b.y)*.5};
   const flow=slice.a.pouring?controlPhysical.flow:0;
   const capacityStop=experimental||cozyMode&&cozy.stopAtRim;
   const pendingMl=capacityStop?parts.reduce((sum,p)=>sum+(inCup((p.slice.a.x+p.slice.b.x)*.5,(p.slice.a.y+p.slice.b.y)*.5)?p.quantity*12:0),0):0;
   const fill=cozyMode?cozy.fillMl:liquid?.cup.fillMl??0;
   const allowed=permittedFlow(flow,slice.dt,fill,pendingMl,inCup(midpoint.x,midpoint.y),capacityStop);
   const used=(!finished&&allowed>0)?(unlimited()?allowed*slice.dt:ledger.spend(allowed,slice.dt)):0;
   currentJet=sharedJet({...slice.b,x:midpoint.x,y:midpoint.y,flow,height:controlPhysical.height,pouring:used>0},used,slice.dt,{x:(slice.b.x-slice.a.x)/Math.max(slice.dt,1e-6),y:(slice.b.y-slice.a.y)/Math.max(slice.dt,1e-6)});
   parts.push({slice,quantity:used,jet:currentJet});
  }
  if(cozyMode){cozy.stepBatch(parts);if(cpuSamples.length<18000)cpuSamples.push(cozy.cpuMs);}else if(!finished||clock<settleUntil){if(experimental)liquid!.stepBatch(parts);else fluid.stepBatch(parts,presets[preset.value]);}
  clock+=1/60;
  if(pendingCapture&&clock>=pendingCapture.time-1e-8){captureRecording(pendingCapture.kind);pendingCapture=null;}
 }
 }else {recorder.skip(clock,now-INPUT_BUFFER);clock=now-INPUT_BUFFER;}
 simMs+=performance.now()-begin;
 if(replayEnd&&clock>=replayClockEnd-1e-8){const film=activeFilm();if(film&&pendingFoamFinish){etchUndo=film.white.slice();el<HTMLButtonElement>('undoEtch').disabled=false;for(const stroke of pendingFoamFinish)for(let pass=0;pass<(stroke.passes??1);pass++)for(let i=1;i<stroke.points.length;i++)film.etch(stroke.points[i-1],stroke.points[i],stroke.tool);}state={...renderState,pouring:false};syncReplayControls(state);replayEnd=0;stop();el('status').textContent='Replay settled. Try the same gestures with your controls.';}
 if(finished&&now>=settleUntil)el('status').textContent='A cup made by you. Start fresh whenever you like.';
  const visual=renderState,pouring=currentJet.emitting&&!paused&&!finished;
 if(replayEnd&&visual.intention){intention=visual.intention;for(const key of ['draw','finish'])el(key+'Intent').setAttribute('aria-pressed',String(intention===key));}
 if(replayEnd)syncReplayControls(visual);
 const autoButton=el('showPour'),autoLabel=replayEnd?'Stop pour':'Auto pour';if(autoButton.textContent!==autoLabel)autoButton.textContent=autoLabel;autoButton.setAttribute('aria-pressed',String(!!replayEnd));autoButton.title=replayEnd?'Stop the automatic pour and keep this cup':'Start a fresh cup and watch an automatic pour';
 if(gain&&audio)gain.gain.setTargetAtTime(pouring&&el<HTMLInputElement>('sound').checked?visual.flow*.06:0,audio.currentTime,.03);
 const field=el<HTMLSelectElement>('field').value,uploadStart=performance.now();if(!paused||ms-lastFieldUpload>200){lastFieldUpload=ms;if(cozyMode)cozy.sync(field);else if(experimental)liquid!.sync(field);else fluid.sync(field,presets[preset.value].opacity);}view.coffeeMaterial.uniforms.field.value=cozyMode?cozy.fieldTexture:experimental?liquid!.texture:fluid.texture;view.coffeeMaterial.uniforms.debug.value=field==='velocity'?1:0;uploadMs+=performance.now()-uploadStart;
 view.setFreeSurface(cozyMode?cozy:experimental&&liquid?.movingEnabled?liquid:undefined);
 view.coffeeMaterial.uniforms.surfacePurity.value=cozyMode&&cozy.useFilm||experimental&&liquid!.useFilm?1:0;
 view.setLiquidLevel(cozyMode?cozy.surfaceM:experimental?liquid!.cup.surfaceM:0,cozyMode||experimental);
 view.setSpill(cozyMode?cozy.rimSpillMl+cozy.missMl:0,cozy.lastSpill);
 const renderStart=performance.now();if(!studio?.active||studio.exploring||document.querySelector('.decorate-studio[open]'))view.render(currentJet,pouring,finished||!!studio?.active);renderMs+=performance.now()-renderStart;
 if(renderSamples.length<18000)renderSamples.push(performance.now()-renderStart);
 el<HTMLProgressElement>('budget').value=ledger.remaining;el('milk').textContent=unlimited()?'∞':`${Math.ceil(ledger.remaining)}% milk`;
 el('flowValue').textContent=cozyControls()?`${Math.round(Number(range.value)*100)}%`:`${(Number(range.value)*12).toFixed(1)} ml/s`;el('heightValue').textContent=`${(clearanceMeters(controlPhysical.height)*1000).toFixed(1)} mm`;el('dockValues').textContent=cozyControls()?`${Math.round(Number(range.value)*100)}% · ${intention}`:`${(Number(range.value)*12).toFixed(1)} ml/s · ${(clearanceMeters(Number(heightRange.value))*1000).toFixed(0)} mm`;
 el('clearance').style.setProperty('--gap',`${6+Number(heightRange.value)*20}px`);
 el('padDot').style.left=padAiming()?`${Math.max(0,Math.min(1,state.x))*100}%`:`${cozyControls()?Number(range.value)*100:(visual.flow-.1)/.9*100}%`;el('padDot').style.top=padAiming()?`${(1-Math.max(0,Math.min(1,state.y)))*100}%`:cozyControls()?'85%':`${(1-visual.height)*100}%`;
 if(ledger.remaining===0&&!finished&&!unlimited()&&(held||mousePour)){stop();el('status').textContent='Pitcher empty. Refill or enjoy your cup.';}
 if(experimental&&liquid!.cup.full&&(held||mousePour||replayEnd)){stop();el('status').textContent='Cup full. Emission stopped at capacity; fresh cup to continue.';}
 if(cozyMode&&cozy.full&&cozy.stopAtRim&&(held||mousePour)){stop();el('status').textContent='At the rim · pour stopped by your assist.';}
 if(cozyMode&&!finished&&cozy.rimSpillMl>0)el('status').textContent=`${cozy.rimSpillMl.toFixed(1)} ml rim spill · keep drawing or start fresh`;
 else if(cozyMode&&!finished&&cozy.fillMl>CAPACITY_ML*.90)el('status').textContent='Nearly full · Finish your cut when you’re ready.';
 else if(cozyMode&&!finished&&currentJet.accessLimited)el('status').textContent=`Maintaining pitcher clearance · ${(currentJet.clearanceM*1000).toFixed(1)} mm`;
 if((experimental||cozyMode)&&frameSamples.length<18000){frameSamples.push(elapsed*1000);if(experimental)cpuSamples.push(Number(liquid!.metrics().cpuSubmitMs));if(experimental&&liquid!.gpuMs!==null)gpuSamples.push(liquid!.gpuMs!);}
 frames++;if(now-report>1){
   if(experimental&&el<HTMLInputElement>('developer').checked){lastInspection=liquid!.inspect(el<HTMLCanvasElement>('bulkSlice'));el('bulkCaption').textContent=`${liquid!.cup.fillMl.toFixed(1)} / 120.6 ml · ${(liquid!.cup.depthM*1000).toFixed(1)} mm depth · arrows: velocity`;}
  el('performance').textContent=`${Math.round(frames/(now-report))} fps · ${cozyMode?cozy.size+'² bulk'+(cozy.useFilm?' + '+cozy.film.size+'² surface':' two layers'):experimental?'32×32×20 + '+(liquid!.useFilm?'160² art':'256² foam'):fluid.size+'²'} · 60 Hz · ${(simMs/frames).toFixed(1)} ms ${experimental?'CPU submission':'simulation'} · ${(uploadMs/frames).toFixed(1)} ms display · ${(renderMs/frames).toFixed(1)} ms render${experimental?` · GPU ${liquid!.gpuMs?.toFixed(1)??'timer unavailable'} ms/tick`:''}`;
  el('diagnostics').textContent=JSON.stringify({...cozyMode?cozy.inspect():experimental?liquid!.metrics():fluid.metrics(),remaining:ledger.remaining,active:pouring,aimX:visual.x,aimY:visual.y,stroke:visual.stroke,requestedClearanceMm:clearanceMeters(controlPhysical.height)*1000,actualClearanceMm:currentJet.clearanceM*1000,actualFlowMlS:currentJet.actualFlowMlS,pitcherYaw:currentJet.pitcherYaw,fillMl:cozyMode?cozy.fillMl:experimental?liquid!.cup.fillMl:undefined,rimAssistance:el<HTMLInputElement>('rimAccess').checked,equipmentModel,controlResponse,toolPoint:etchPoint,toolPrecision:surfaceTool!=='pour'&&toolPrecise(),bufferMs:INPUT_BUFFER*1000,latePackets:timeline.latePackets,droppedStalls:dropped},null,2);frames=0;simMs=uploadMs=renderMs=0;report=now;
 }requestAnimationFrame(frame);
}
function closeDocks(){for(const [id,name] of [['dockAdjust','dock-adjusting'],['dockCup','dock-cup'],['dockCorner','corner-open'],['dockRadio','radio-open']]){document.querySelector('main')!.classList.remove(name);el(id).setAttribute('aria-expanded','false');}}
for(const [id,name] of [['dockAdjust','dock-adjusting'],['dockCup','dock-cup'],['dockCorner','corner-open'],['dockRadio','radio-open']])el(id).onclick=()=>{const main=document.querySelector('main')!,open=!main.classList.contains(name);stop(true,'dock');closeDocks();main.classList.toggle(name,open);el(id).setAttribute('aria-expanded',String(open));if(id==='dockRadio'&&open&&el('cafeRadio').classList.contains('collapsed'))el('radioCollapseBtn').click();};
function syncReplayControls(visual:PourState){
 const controls=replayControls(visual,cozyControls()?'cozy':'advanced');
 range.value=String(controls.flow);heightRange.value=String(controls.height);intention=controls.intention;
 state.delivery=controls.delivery;
 for(const key of ['draw','finish'])el(key+'Intent').setAttribute('aria-pressed',String(intention===key));
 el<HTMLInputElement>('bearing').value=String((visual.bearing??0)*180/Math.PI);updateBearingCue();
}
function updateBearingCue(){const degrees=Number(el<HTMLInputElement>('bearing').value);el('bearingValue').textContent=Math.round(degrees)+'°';el('bearingArrow').style.transform='rotate('+degrees+'deg)';}
function changeBearing(delta:number){el<HTMLInputElement>('bearing').value=String(wrapBearing((Number(el<HTMLInputElement>('bearing').value)+delta)*Math.PI/180)*180/Math.PI);updateBearingCue();emit();}
el<HTMLInputElement>('bearing').oninput=()=>{updateBearingCue();emit();};
el('bearingLeft').onclick=()=>changeBearing(-15);el('bearingRight').onclick=()=>changeBearing(15);
const studio=mountCornerStudio(view,()=>{
 sealRecording();stop(true,'studio');closeDocks();paused=true;
 // Synchronize display fields at this completed simulation boundary before copying.
 if(cozyMode)cozy.sync();else if(experimental)liquid!.sync();else fluid.sync('milk',presets[preset.value].opacity);
 view.coffeeMaterial.uniforms.field.value=cozyMode?cozy.fieldTexture:experimental?liquid!.texture:fluid.texture;
 view.setFreeSurface(cozyMode?cozy:experimental&&liquid?.movingEnabled?liquid:undefined);view.setLiquidLevel(cozyMode?cozy.surfaceM:experimental?liquid!.cup.surfaceM:0,cozyMode||experimental);
 view.setEnjoy(true);
 return {sourceModel:cozyMode?String(cozy.inspect().mode):experimental?String(liquid!.metrics().mode):'existing-surface',tick:clock,fillMl:cozyMode?cozy.fillMl:experimental?liquid!.cup.fillMl:55};
},()=>{paused=document.hidden;stop(true,'studio-close');view.setEnjoy(finished);});
for(const [id,value] of Object.entries(RECOMMENDED_SETTINGS))el<HTMLSelectElement>(id).value=value;
mountBrewing(view,{exploring:()=>studio.exploring,coffee:(kind,strength)=>{const remaining=ledger.remaining;fresh();ledger.remaining=remaining;view.coffeeMaterial.uniforms.brewStrength.value=kind==='pour-over'?strength*.65:strength;el('status').textContent='Fresh '+kind+' prepared. Your milk supply carries over.';},milk:quality=>{preparedMilkQuality=milkQuality=quality;el<HTMLSelectElement>('milkTexture').value='prepared';el('milkTip').textContent=milkGuide;ledger.refill();el('status').textContent='Your steamed milk is ready to pour.';}});
el<HTMLInputElement>('rimAccess').checked=FRESH_CUP.rimAccess;
el<HTMLInputElement>('stopAtRim').checked=FRESH_CUP.stopAtRim;
const requestedMode=new URLSearchParams(location.search).get('mode');
if(requestedMode==='cozy'||requestedMode==='surface'||requestedMode==='volume')el<HTMLSelectElement>('mode').value=requestedMode;
el('scheme').dispatchEvent(new Event('change'));
el('quality').dispatchEvent(new Event('change'));
el<HTMLSelectElement>('mode').dispatchEvent(new Event('change'));
hint();requestAnimationFrame(frame);
el('dockCup').textContent='Cup actions';
el('dockRadio').textContent='Café radio';
document.querySelector('.actions')!.append(el('dockRadio'));
const cornerPhoto=document.createElement('button');cornerPhoto.textContent='Take photo';cornerPhoto.onclick=()=>el('worldCapture').click();document.querySelector('.corner-more-menu')!.prepend(cornerPhoto);
mountSceneFirstUI(()=>stop(true,'menu'));
installRecipeButtons();
if(new URLSearchParams(location.search).has('verify'))import('./control-check');
if(new URLSearchParams(location.search).has('verify'))import('./liquid-check').then(({mountLiquidChecks})=>mountLiquidChecks({get:()=>experimental?liquid:undefined,recording:()=>recorder.recording,begin:()=>{fresh();paused=true;},end:()=>{paused=document.hidden;stop(true);},picture:(jet)=>{liquid!.sync();view.coffeeMaterial.uniforms.field.value=liquid!.texture;view.setLiquidLevel(liquid!.cup.surfaceM,true);view.render(jet,false,true);return canvas.toDataURL('image/jpeg',.85);}}));
if(new URLSearchParams(location.search).has('verify'))import('./photo-check').then(({mountPhotoCheck})=>mountPhotoCheck(view,()=>{sealRecording();stop(true);paused=true;},()=>{fluid.reset();cozy.reset();liquid?.reset();if(cozyMode)cozy.sync();else if(experimental)liquid!.sync();else fluid.sync('milk',presets[preset.value].opacity);},()=>{paused=document.hidden;stop(true);}));
