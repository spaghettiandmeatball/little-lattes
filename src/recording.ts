import {initialState, type PourEvent, type PourState} from './input.ts';
import {validPreset, type Preset} from './model.ts';

export type Recording = {
  version:1;
  kind:'recorded-input';
  duration:number;
  initial:PourState;
  recipe:Preset;
  unlimited:boolean;
  events:PourEvent[];
  skips:{from:number;to:number}[];
  environment?:{solver:string;prepared:boolean;initialCoffeeMl:number;initialMilkMl:number;stopAtRim:boolean;scheme:'cozy'|'advanced';intention:'draw'|'finish'|'mix';delivery:number;leftHanded:boolean;rimAccess?:boolean;equipmentModel?:'rim-binary-1'|'adaptive-center-1'|'adaptive-pour-2'|'roomy-pour-3';controlResponse?:'smooth-1'|'dry-ready-1';milkQuality?:number};
};

function validState(s:PourState):boolean {
  return !!s && typeof s==='object' &&
    ['x','y','flow','height','stroke'].every(k=>Number.isFinite(s[k as keyof PourState])) &&
    Math.abs(s.x)<5 && Math.abs(s.y)<5 && s.flow>=0 && s.flow<=1 &&
    s.height>=0 && s.height<=1 && typeof s.pouring==='boolean' &&
    Number.isInteger(s.stroke) && s.stroke>=0 &&
    (s.intention===undefined||['draw','finish','mix'].includes(s.intention)) &&
    (s.scheme===undefined||['cozy','advanced'].includes(s.scheme)) &&
    (s.delivery===undefined||(Number.isFinite(s.delivery)&&s.delivery>=0&&s.delivery<=1)) &&
    (s.bearing===undefined||(Number.isFinite(s.bearing)&&Math.abs(s.bearing)<=Math.PI));
}

export function validRecording(data:unknown):data is Recording {
  if(!data || typeof data!=='object')return false;
  const r=data as Recording;
  if(r.version!==1 || r.kind!=='recorded-input' || !Number.isFinite(r.duration) ||
    r.duration<=0 || r.duration>600 || !validState(r.initial) || r.initial.pouring ||
    !validPreset(r.recipe) || typeof r.unlimited!=='boolean')return false;
  const validSkips=Array.isArray(r.skips) && r.skips.length<=10000 && r.skips.every((s,i)=>
    !!s && Number.isFinite(s.from) && Number.isFinite(s.to) && s.from>=-2/60 &&
    s.to>=s.from && s.to<=r.duration && (i===0 || s.from>=r.skips[i-1].to));
  const validEvents=Array.isArray(r.events) && r.events.length<=600000 && r.events.every(e=>
    validState(e) && Number.isFinite(e.time) && Number.isFinite(e.received) &&
    e.time>=-2/60 && e.received!>=e.time && e.received!<=r.duration+.1);
  const env=r.environment;
  const validEnvironment=!env||(['hydrostatic-two-layer-1','hydrostatic-two-layer-2','hydrostatic-film-3','hydrostatic-film-4','hydrostatic-film-5','gpu-volume','gpu-volume-film-1','gpu-volume-film-2','gpu-volume-film-3','gpu-volume-film-4','existing-surface'].includes(env.solver)&&typeof env.prepared==='boolean'&&Number.isFinite(env.initialCoffeeMl)&&env.initialCoffeeMl>=0&&Number.isFinite(env.initialMilkMl)&&env.initialMilkMl>=0&&typeof env.stopAtRim==='boolean'&&typeof env.leftHanded==='boolean'&&['cozy','advanced'].includes(env.scheme)&&['draw','finish','mix'].includes(env.intention)&&Number.isFinite(env.delivery)&&env.delivery>=0&&env.delivery<=1);
  return (!env||env.milkQuality===undefined||(Number.isFinite(env.milkQuality)&&env.milkQuality>=0&&env.milkQuality<=1)) && validSkips && validEvents && validEnvironment && (!env||env.rimAccess===undefined||typeof env.rimAccess==='boolean') && (!env||env.equipmentModel===undefined||['rim-binary-1','adaptive-center-1','adaptive-pour-2','roomy-pour-3'].includes(env.equipmentModel)) && (!env||env.controlResponse===undefined||['smooth-1','dry-ready-1'].includes(env.controlResponse));
}

export class InputRecorder {
  recording:Recording|null=null;
  private start=0;
  active=false;

  begin(time:number,state:PourState,recipe:Preset,unlimited:boolean){
    this.start=time;this.active=true;
    this.recording={version:1,kind:'recorded-input',duration:0,
      initial:{...initialState(),...state,pouring:false},recipe:{...recipe},unlimited,
      events:[],skips:[]};
  }

  add(event:PourEvent){
    if(!this.active || !this.recording)return;
    this.recording.events.push({...event,time:Math.max(-2/60,event.time-this.start),
      received:Math.max(0,(event.received??event.time)-this.start),
      rawTime:event.rawTime===undefined?undefined:event.rawTime-this.start});
  }

  skip(from:number,to:number){
    if(!this.active || !this.recording || to<=from)return;
    const skips=this.recording.skips,last=skips[skips.length-1];
    const relative={from:Math.max(-2/60,from-this.start),to:Math.max(-2/60,to-this.start)};
    if(last && relative.from<=last.to+1e-8)last.to=Math.max(last.to,relative.to);
    else skips.push(relative);
  }

  end(time:number){
    if(this.recording)this.recording.duration=Math.max(.001,time-this.start);
    this.active=false;
  }
}
