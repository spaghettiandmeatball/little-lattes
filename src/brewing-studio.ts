import type {createScene} from './scene';
import {brewResult,steamedMilk,type BrewKind} from './brewing-model';
import {stationSound} from './station-sound';

type Station='espresso'|'pour-over'|'milk'|'purge';
type Operation='off'|'grind'|'espresso'|'pour-over'|'steam'|'purge';
export function mountBrewing(view:ReturnType<typeof createScene>,hooks:{coffee:(kind:BrewKind,strength:number)=>void;milk:(quality:number)=>void;exploring:()=>boolean}){
 const main=document.querySelector('main')!,canvas=view.renderer.domElement,sound=stationSound();
 const targets=document.createElement('nav');targets.className='station-targets';targets.setAttribute('aria-label','Equipment in your corner');
 const labels:Record<Station,string>={espresso:'Brew espresso','pour-over':'Pour coffee',milk:'Steam milk',purge:'Purge wand'};
 const buttons=new Map<Station,HTMLButtonElement>();
 const hud=document.createElement('section');hud.className='station-hud';hud.hidden=true;hud.setAttribute('aria-label','Coffee preparation');
 hud.innerHTML='<div><span id="stationName"></span><output id="stationReadout" role="status" aria-live="polite"></output><progress id="stationProgress" max="1" value="0"></progress></div><button id="stopStation">Stop</button><button id="dismissStation" aria-label="Dismiss preparation status">×</button>';
 main.append(targets,hud);const name=hud.querySelector('#stationName')!,readout=hud.querySelector<HTMLOutputElement>('#stationReadout')!,progress=hud.querySelector<HTMLProgressElement>('#stationProgress')!,stopButton=hud.querySelector<HTMLButtonElement>('#stopStation')!,dismiss=hud.querySelector<HTMLButtonElement>('#dismissStation')!;
 stopButton.hidden=true;
 let operation:Operation='off',started=0,focused:Station='espresso',lastUI=0,lastProject=0,noticeUntil=0;let milkAfterPurge='';
 function stop(){operation='off';main.classList.remove('station-working');view.stationOperation('off');sound.stop();stopButton.hidden=true;dismiss.hidden=false;}
 function notice(text:string){readout.setAttribute('aria-live','polite');hud.hidden=false;readout.textContent=text;noticeUntil=performance.now()+6000;}
 function finish(){const current=operation,elapsed=performance.now()/1000-started;stop();progress.value=1;
  if(current==='steam'){const result=steamedMilk(elapsed);hooks.milk(result.quality);milkAfterPurge=result.label+' · milk ready in Cup';focused='purge';start('purge');readout.textContent=result.label+' · automatically purging the wand';return;}
  else if(current==='espresso'||current==='pour-over'){const result=brewResult(current,elapsed);hooks.coffee(current,result.strength);notice('Fresh '+(current==='espresso'?'espresso':'pour-over')+' ready in Cup');}
  else if(current==='purge'){notice(milkAfterPurge||'Wand purged · ready for milk');milkAfterPurge='';focused='milk';}else notice('Grinding stopped');
 }
 function start(next:Operation){main.classList.add('station-working');readout.setAttribute('aria-live','off');operation=next;started=performance.now()/1000;hud.hidden=false;stopButton.hidden=next==='purge';dismiss.hidden=true;noticeUntil=0;progress.value=0;view.stationOperation(next);
  name.textContent=next==='steam'?'MILK AT THE WAND':next==='pour-over'?'POUR-OVER':next==='purge'?'STEAM WAND':'ESPRESSO';readout.textContent=next==='grind'?'Grinding fresh beans…':next==='steam'?'Stop at 5–9 s for silky milk':next==='purge'?'Purging…':'Blooming the grounds…';
  stopButton.textContent=next==='steam'?'Stop steaming':'Stop & serve';sound.play(next==='steam'||next==='purge'?'steam-wand':next==='grind'?'grinder':next==='espresso'?'espresso-brew':'cafe-machine');if(next==='steam')sound.layer('milk-frothing');if(next==='espresso')sound.layer('coffee-machine');
 }
 function interact(station:Station){if(!hooks.exploring())return;
  if(operation!=='off'){if(station===focused&&operation!=='purge')finish();return;}
  focused=station;view.focusStation(station==='purge'?'milk':station);start(station==='espresso'?'grind':station==='milk'?'steam':station);
 }
 for(const station of Object.keys(labels) as Station[]){const button=document.createElement('button');button.className='station-target';button.dataset.station=station;button.textContent=labels[station];let hold:ReturnType<typeof setTimeout>|undefined,held=false;const customize=()=>canvas.dispatchEvent(new CustomEvent('counter-interact',{detail:{kind:station==='milk'||station==='purge'?'milk':station}}));button.title='Tap to use · hold or right-click to customize';button.oncontextmenu=e=>{e.preventDefault();customize();};button.onpointerdown=()=>{held=false;hold=setTimeout(()=>{held=true;customize();},550);};button.onpointerup=button.onpointercancel=()=>clearTimeout(hold);button.onclick=()=>{if(!held)interact(station);};targets.append(button);buttons.set(station,button);}
 stopButton.onclick=finish;dismiss.onclick=()=>{hud.hidden=true;};
 const close=()=>{stop();hud.hidden=true;};
 const open=(next:Station='espresso')=>{document.getElementById('cornerView')!.click();if(!hooks.exploring())return;if(operation==='purge')return;if(operation!=='off'){const steaming=operation==='steam';finish();if(steaming)return;}focused=next;name.textContent='AT THE '+(next==='milk'?'STEAM WAND':next==='pour-over'?'KETTLE':'MACHINE');progress.value=0;view.focusStation(next==='purge'?'milk':next);notice('Tap the '+(next==='milk'?'wand to steam milk':next==='pour-over'?'kettle to pour coffee':'machine to brew espresso'));};
 const menu=document.querySelector('.corner-more-menu')!;for(const [kind,label] of [['espresso','Go to machine'],['pour-over','Go to kettle'],['milk','Go to wand']] as const){const button=document.createElement('button');button.textContent=label;button.onclick=()=>open(kind);menu.append(button);}
 document.getElementById('refill')!.textContent='Steam milk';document.getElementById('refill')!.onclick=()=>open('milk');
 const go=document.createElement('button');go.textContent='Coffee station';go.onclick=()=>open();document.querySelector('.actions')!.append(go);
 document.getElementById('cupView')!.addEventListener('click',close);
 window.addEventListener('blur',()=>{if(operation!=='off'){stop();notice('Paused · tap the equipment to begin again');}});document.addEventListener('visibilitychange',()=>{if(document.hidden)close();});
 let hoverAt=0;canvas.addEventListener('pointermove',e=>{if(e.buttons||operation!=='off'||!hooks.exploring()||performance.now()-hoverAt<80)return;hoverAt=performance.now();const station=view.hitStation(e.clientX,e.clientY);if(station)focused=station;});
 let down:{x:number;y:number;station:Station}|undefined;
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!hooks.exploring())return;const station=view.hitStation(e.clientX,e.clientY);if(station)down={x:e.clientX,y:e.clientY,station};},true);
 canvas.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7&&hooks.exploring())interact(down.station);down=undefined;},true);canvas.addEventListener('pointercancel',()=>{down=undefined;},true);
 window.addEventListener('keydown',e=>{if(e.code!=='KeyE'||e.repeat||!hooks.exploring()||(e.target as HTMLElement).closest('input,select,textarea,[contenteditable]'))return;e.preventDefault();interact(focused);});
 function frame(ms:number){requestAnimationFrame(frame);if(document.hidden)return;
  const active=hooks.exploring();targets.hidden=!active||operation!=='off';
  if(!active){if(operation!=='off')close();hud.hidden=true;return;}
  if(ms-lastProject>100){lastProject=ms;
   for(const [station,button] of buttons){const point=view.stationScreen(station);button.hidden=!point||(station==='purge'&&focused!=='milk'&&focused!=='purge');if(point){button.style.left=point.x+'px';button.style.top=point.y+'px';}button.disabled=operation!=='off'&&(station!==focused||operation==='purge');button.classList.toggle('running',station===focused&&operation!=='off');const label=station===focused&&operation!=='off'&&operation!=='purge'?'Stop · '+labels[station]:labels[station];if(button.textContent!==label)button.textContent=label;

   }
  }
  if(operation==='off'){if(noticeUntil&&ms>noticeUntil)hud.hidden=true;return;}
  const elapsed=ms/1000-started;
  if(operation==='grind'&&elapsed>=2.8){start('espresso');return;}
  if(operation==='purge'&&elapsed>=2.5){finish();return;}
  if(operation==='steam'){view.stationOperation('steam',Math.min(1,elapsed/16));if(elapsed>=16){finish();return;}}
  if(operation==='espresso'||operation==='pour-over'){const result=brewResult(operation,elapsed);view.stationOperation(operation,result.progress);if(result.progress>=1){finish();return;}}
  if(ms-lastUI<100)return;lastUI=ms;
  if(operation==='steam'){const milk=steamedMilk(elapsed);progress.value=elapsed/16;readout.textContent=milk.temperature+'° · '+elapsed.toFixed(1)+' s · '+milk.label+(elapsed<5?' · aim for 5–9 s':elapsed<=9?' · best for latte art':' · stop now');}
  else if(operation==='espresso'||operation==='pour-over'){const result=brewResult(operation,elapsed);progress.value=result.progress;readout.textContent=operation==='pour-over'&&elapsed<3?'Blooming the grounds…':Math.round(result.progress*100)+'% · '+result.label;}
  else {progress.value=elapsed/(operation==='purge'?2.5:2.8);}
 }
 requestAnimationFrame(frame);return {open,close};
}
