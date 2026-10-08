import {writeFileSync,readFileSync} from 'node:fs';
import {Surface} from '../src/surface.ts';
import {initialState} from '../src/input.ts';
import {defaults} from '../src/model.ts';
import {replays,stationary,line} from '../src/replays.ts';
import {run} from './replay.ts';
import {clearanceMeters} from '../src/jet.ts';

const baseline=JSON.parse(readFileSync(new URL('../docs/physics-baseline.json',import.meta.url),'utf8'));
const flowImpulse=[0,1e-6,.1,.5,1].map(flow=>{
 const s=new Surface(),a={...initialState(),x:.49,y:.5,height:.8,flow,pouring:true,stroke:1};
 s.step({a,b:{...a,x:.51},dt:1/60},flow/60,defaults.Accessible);return {flow,...s.metrics()};
});
const grid=[];
for(const flow of [.2,.5,.9])for(const height of [0,.15,.3,.5,.75,1]){
 const {metrics}=run(stationary(flow,height,.75));grid.push({flow,height,clearanceMm:clearanceMeters(height)*1000,...metrics});
}
const pictures=[];
for(const name of ['Growing pool','Small rhythmic bands','Three neighboring pours','Heart','Height sweep']){
 const {surface,metrics}=run(replays[name]);pictures.push({name,metrics,size:surface.size,foam:Array.from(surface.foam),mask:Array.from(surface.mask)});
}
const speeds=[.12,.6].map(distance=>({distance,...run(line(distance)).metrics}));
const material=[0,.2,4].map(density=>{
 const s=new Surface();s.foam.forEach((_,i)=>s.foam[i]=s.mask[i]?density:0);
 const a={...initialState(),x:.49,height:.8,flow:.65,pouring:true};s.step({a,b:{...a,x:.51},dt:1/60},.65/60,defaults.Accessible);
 return {initialFoam:density,...s.metrics()};
});
const {surface}=run(stationary(.65)),before=surface.metrics(),a={...initialState(),x:.43,pouring:true};
const newOnly=new Surface();newOnly.vx.set(surface.vx);newOnly.vy.set(surface.vy);
for(let i=0;i<60;i++){surface.step({a,b:a,dt:1/60},.65/60,defaults.Accessible);newOnly.step({a,b:a,dt:1/60},.65/60,defaults.Accessible);}
let oldMass=0,oldX=0;for(let i=0;i<surface.foam.length;i++){const f=surface.foam[i]-newOnly.foam[i];oldMass+=f;oldX+=f*((i%surface.size)+.5)/surface.size;}
const displacement={beforeCenter:before.cx,afterCenter:oldX/oldMass,uv:oldX/oldMass-before.cx,method:'Matching new-only subtraction is approximate because foam-dependent viscosity makes the fields nonlinear.'};
const report={date:'2026-10-07',baselineForce:baseline.forceVsFlow,flowImpulse,heightFlowGrid:grid,equalQuantityPathSpeeds:speeds,material,displacement,examples:pictures.map(({name,metrics})=>({name,metrics}))};
writeFileSync(new URL('../docs/physics-response-results.json',import.meta.url),JSON.stringify(report,null,2));
writeFileSync(new URL('../docs/physics-fields.html',import.meta.url),`<!doctype html><meta charset="utf-8"><title>Little Latte — measured behavior fields</title><style>body{margin:0;padding:24px;background:#263e33;color:#f2e5cc;font:14px system-ui}h1{font:28px Georgia}p{max-width:850px;line-height:1.6;color:#d4ceb9}section{display:flex;flex-wrap:wrap;gap:22px}article{width:300px}canvas{width:300px;height:300px;border-radius:50%;background:#795333}small{display:block;line-height:1.7}h2{font:19px Georgia}</style><h1>Little Latte · physics response set</h1><p>Actual 160² simulation fields after scripted gestures sampled at 120 Hz through the causal input path. Saturating color shows surface milk, not volume. These are numerical illustrations, not a human playtest. Fine striations remain a tuning target.</p><section id="fields"></section><script>const pictures=${JSON.stringify(pictures)};for(const p of pictures){const a=document.createElement('article');a.innerHTML='<h2>'+p.name+'</h2><canvas width="'+p.size+'" height="'+p.size+'"></canvas><small>Surface milk: '+p.metrics.surfaceVolumeMl.toFixed(1)+' ml · mixed: '+p.metrics.bulkVolumeMl.toFixed(1)+' ml<br>Accounting error: '+p.metrics.conservationError.toExponential(2)+'</small>';document.querySelector('#fields').append(a);const c=a.querySelector('canvas').getContext('2d'),im=c.createImageData(p.size,p.size);for(let i=0;i<p.foam.length;i++){const white=1-Math.exp(-p.foam[i]*5),t=Math.max(0,Math.min(1,(white-.04)/.90)),m=t*t*(3-2*t);for(let k=0;k<3;k++)im.data[i*4+k]=[91,49,23][k]*(1-m)+[250,240,214][k]*m;im.data[i*4+3]=p.mask[i]?255:0;}c.putImageData(im,0,0);}</script>`);
console.log(JSON.stringify({gridCases:grid.length,flowImpulse:flowImpulse.map(({flow,maxSpeed,integratedSpeed})=>({flow,maxSpeed,integratedSpeed})),displacement},null,2));
