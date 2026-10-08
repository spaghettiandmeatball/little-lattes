export {};
// Development-only browser probe. Synthetic multi-pointer events exercise the
// actual application listeners; capture is stubbed because synthetic IDs cannot
// acquire browser pointer capture. Real capture is checked separately by mouse.
const results=document.createElement('pre');results.id='controlResults';
const button=document.createElement('button');button.textContent='Run control checks';button.id='checkControls';
document.querySelector('.settings')!.append(button,results);
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const canvas=document.querySelector('canvas')!,pad=document.getElementById('pour')!;
const budget=()=>Number((document.getElementById('budget') as HTMLProgressElement).value);
const reset=()=>document.getElementById('reset')!.click();
const sample=(target:HTMLElement,type:string,id:number,x:number,y:number,pointerType='touch')=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id,pointerType,clientX:x,clientY:y,button:0,buttons:type==='pointerup'?0:1}));
button.onclick=async()=>{
 button.setAttribute('disabled','');results.textContent='Checking actual listeners with synthetic touch events…';
 const report:string[]=[];const check=(name:string,ok:boolean)=>report.push(`${ok?'PASS':'FAIL'} ${name}`);
 const originals=[canvas,pad].map(t=>({target:t,set:t.setPointerCapture,release:t.releasePointerCapture,has:t.hasPointerCapture}));
 for(const t of [canvas,pad]){t.setPointerCapture=()=>{};t.releasePointerCapture=()=>{};t.hasPointerCapture=()=>false;}
 try{
  reset();const c=canvas.getBoundingClientRect(),p=pad.getBoundingClientRect(),x=c.left+c.width*.5,y=c.top+c.height*.4;
  const flow=document.getElementById('flow') as HTMLInputElement,height=document.getElementById('height') as HTMLInputElement;
  const cozy=(document.getElementById('scheme') as HTMLSelectElement).value==='cozy';
  flow.value='.26';height.value='.6';flow.dispatchEvent(new Event('input'));height.dispatchEvent(new Event('input'));
  sample(canvas,'pointerdown',90,x,y);await wait(100);check('aiming alone stays dry',Math.abs(budget()-100)<1e-6);sample(canvas,'pointerup',90,x,y);
  // Pour pad alone uses the retained aim and preferred delivery.
  sample(pad,'pointerdown',2,p.left+p.width*.7,p.top+p.height*.9);await wait(100);
  check('stationary pad pickup preserves flow and height',Number(flow.value)===.26&&Number(height.value)===.6);
  check('pour pad alone uses retained aim',budget()<100);
  sample(canvas,'pointerdown',1,x,y);await wait(250);const low=budget();
  sample(canvas,'pointermove',1,x+45,y-30);sample(pad,'pointermove',2,p.left+p.width*.2,p.top+p.height*.15);await wait(150);
  check('two fingers activate flow',low<100&&budget()<low);
  check(cozy?'cozy pad changes only delivery':'advanced pad changes both axes',Number(flow.value)<.3&&(cozy?Number(height.value)===.6:Number(height.value)>.8));
  sample(pad,'pointerup',2,p.left,p.top);await wait(70);const stopped=budget();
  const retainedFlow=flow.value,retainedHeight=height.value;
  sample(canvas,'pointermove',1,x-65,y+35);await wait(100);check('thumb release and dry reposition spend nothing',Math.abs(budget()-stopped)<1e-6);
  sample(pad,'pointerdown',2,p.left+p.width*.7,p.top+p.height*.9);check('pad re-clutch retains settings',flow.value===retainedFlow&&height.value===retainedHeight);await wait(120);sample(pad,'pointercancel',2,p.left,p.top);sample(canvas,'pointercancel',1,x,y);await wait(70);
  const cancelled=budget();await wait(100);check('independent cancellation stops flow',Math.abs(budget()-cancelled)<1e-6);
  reset();sample(canvas,'pointerdown',3,x,y);sample(pad,'pointerdown',4,p.left+p.width*.7,p.top+p.height*.9);await wait(80);
  window.dispatchEvent(new Event('blur'));const blurred=budget();await wait(150);window.dispatchEvent(new Event('focus'));await wait(100);
  check('blur and resume cause no delayed burst',Math.abs(budget()-blurred)<1e-6);
  reset();sample(canvas,'pointerdown',91,x,y);sample(pad,'pointerdown',92,p.left+p.width*.5,p.top+p.height*.5);await wait(100);sample(canvas,'pointerup',91,x,y);const lifted=budget();await wait(100);check('aim lift retains pouring while pad is held',budget()<lifted);sample(pad,'pointerup',92,p.left,p.top);await wait(80);
  const saturated=flow.value;flow.value='1';flow.dispatchEvent(new Event('input'));sample(pad,'pointerdown',93,p.left+p.width*.5,p.top+p.height*.5);sample(pad,'pointermove',93,p.left+p.width*1.7,p.top+p.height*.5);sample(pad,'pointermove',93,p.left+p.width*1.6,p.top+p.height*.5);check('reverse from saturation responds immediately',Number(flow.value)<1);sample(pad,'pointercancel',93,p.left,p.top);flow.value=saturated;
  reset();sample(pad,'pointerdown',94,p.left+p.width*.5,p.top+p.height*.5);await wait(80);window.dispatchEvent(new Event('resize'));const resized=budget();await wait(100);check('resize cancels the pour and resumes dry',Math.abs(budget()-resized)<1e-6);
  reset();await wait(80);const dryBudget=budget();document.getElementById('finishIntent')!.click();await wait(80);check('intention switch never starts pouring',Math.abs(budget()-dryBudget)<1e-6);document.getElementById('drawIntent')!.click();
  if(!cozy){const drawFlow=flow.value,drawHeight=Number(height.value);document.getElementById('finishIntent')!.click();check('advanced Finish raises and reduces the stream',Number(height.value)>drawHeight&&Number(flow.value)<Number(drawFlow));document.getElementById('drawIntent')!.click();check('advanced intent cycling preserves delivery',flow.value===drawFlow&&Number(height.value)===drawHeight);}
  document.getElementById('finishIntent')!.click();reset();check('Fresh cup returns to Draw',document.getElementById('drawIntent')!.getAttribute('aria-pressed')==='true');
  reset();const before=flow.value;
  flow.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,code:'KeyA'}));check('editing a field does not consume flow shortcuts',flow.value===before);
  flow.value='.65';height.value='.08';flow.dispatchEvent(new Event('input'));height.dispatchEvent(new Event('input'));
  sample(canvas,'pointerdown',5,x,y,'mouse');await wait(8);sample(canvas,'pointerup',5,x,y,'mouse');await wait(80);
  check('sub-frame mouse tap is not lost',budget()<100&&budget()>99);
  document.getElementById('finish')!.click();await wait(80);
  check('finish hides active controls',getComputedStyle(document.getElementById('pourControls')!).display==='none');
  check('finish exposes fresh cup',getComputedStyle(document.getElementById('reset')!).display!=='none');reset();
 }catch(error){report.push(`ERROR ${String(error)}`);}
 finally{for(const o of originals){o.target.setPointerCapture=o.set;o.target.releasePointerCapture=o.release;o.target.hasPointerCapture=o.has;}button.removeAttribute('disabled');results.textContent=report.join('\n');}
};
