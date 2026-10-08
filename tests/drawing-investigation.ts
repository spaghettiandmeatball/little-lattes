import {writeFileSync} from 'node:fs';
import {CozyLiquid} from '../src/cozy-liquid.ts';
import {LatteFilm} from '../src/latte-film.ts';
import {initialState,type PourState} from '../src/input.ts';
import {heightForClearance} from '../src/cozy-controls.ts';
import {solveLatteJet} from '../src/equipment.ts';
export function drawingState(k:number,kind='bands',flow=.42,speed=.08):PourState {
 const t=k/60;
 if(kind==='heart')return {...initialState(),x:.5+.035*Math.sin(t*2*Math.PI*1.8)*Math.max(0,1-t/2.3),y:.55,flow:.5,height:heightForClearance(.003),pouring:k<138};
 return {...initialState(),x:.5+.05*Math.sin(t*2*Math.PI*1.8),y:.66-t*speed,flow,height:heightForClearance(.003),pouring:true};
}
export function drawingRun(kind='bands',flow=.42,speed=.08,size=160){
 const liquid=new CozyLiquid(48),film=new LatteFilm(size);let previous=drawingState(0,kind,flow,speed);
 for(let k=0;k<(kind==='heart'?138:240);k++){const state=drawingState(k,kind,flow,speed),velocity={x:(state.x-previous.x)*60,y:(state.y-previous.y)*60},jet=solveLatteJet(state,state.flow/60,1/60,velocity,liquid,true,'rim-binary-1'),sources=[{x:state.x,y:state.y,jet}];liquid.step(sources);film.step(sources,1/60);previous=state;}
 return {liquid,film};
}
export function cut(liquid:CozyLiquid,film:LatteFilm){
 for(let k=0;k<60;k++){const state={...initialState(),x:.5,y:.70-k/59*.4,flow:.14,height:heightForClearance(.026),pouring:true},jet=solveLatteJet(state,.14/60,1/60,{x:0,y:-.4},liquid,true,'rim-binary-1'),sources=[{x:state.x,y:state.y,jet}];liquid.step(sources);film.step(sources,1/60);}
}
export function restFilm(film:LatteFilm,seconds=10){for(let k=0;k<seconds*60;k++)film.step([],1/60);}
export function bands(film:LatteFilm){let peaks=0;const x=Math.round(film.size*.54);let previous=0;for(let y=Math.round(film.size*.27);y<film.size*.8;y++){const w=film.white[y*film.size+x];if(w>.6&&previous<=.6)peaks++;previous=w;}return peaks;}
function capture(film:LatteFilm,name:string){let cells='';const n=film.size;for(let i=0;i<film.white.length;i++){if(!film.mask[i])continue;const white=film.white[i],rgb=[80,39,16].map((c,j)=>Math.round(c*(1-white)+[250,240,218][j]*white));cells+=`<rect x="${i%n}" y="${n-1-Math.floor(i/n)}" width="1" height="1" fill="rgb(${rgb})"/>`;}
 writeFileSync(new URL(`../docs/film-${name}.svg`,import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}"><rect width="${n}" height="${n}" fill="#23382d"/>${cells}</svg>`);
}
if(process.argv[1]?.endsWith('drawing-investigation.ts')){
 const report:unknown[]=[],gallery:string[]=[];
 for(const [kind,flow,speed] of [['bands',.42,.08],['heart',.5,0],['bands-fast',.42,.14],['bands-generous',.75,.08]] as const){const s=drawingRun(kind,flow,speed);capture(s.film,kind);const before={...s.film.metrics(),bands:bands(s.film)};cut(s.liquid,s.film);capture(s.film,kind+'-cut');restFilm(s.film);capture(s.film,kind+'-rest');report.push({kind,flow,speed,before,after:{...s.film.metrics(),bands:bands(s.film)},liquid:s.liquid.metrics()});for(const phase of ['', '-cut','-rest'])gallery.push(`<figure><img src="film-${kind+phase}.svg"><figcaption>${kind+phase}</figcaption></figure>`);console.log(kind,before,s.film.metrics());}
 writeFileSync(new URL('../docs/film-results.json',import.meta.url),JSON.stringify(report,null,2));
 writeFileSync(new URL('../docs/film-evidence.html',import.meta.url),`<!doctype html><title>Latte pour evidence</title><style>body{background:#23382d;color:#f4e6cc;font:16px system-ui}main{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}img{width:100%}figure{margin:0}</style><h1>Pour, raised cut, then ten seconds resting</h1><p>Actual flow, clearance and pointer motion through the live model. No shape stamps.</p><main>${gallery.join('')}</main>`);
}

