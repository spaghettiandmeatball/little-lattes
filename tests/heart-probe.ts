import {writeFileSync} from 'node:fs';
import {LatteFilm} from '../src/latte-film.ts';
import {initialState} from '../src/input.ts';
import {heightForClearance} from '../src/cozy-controls.ts';
import {solveLatteJet} from '../src/equipment.ts';
import {heartGeometry} from '../src/art-metrics.ts';
export {heartGeometry} from '../src/art-metrics.ts';

export function heartPour(film=new LatteFilm(),speed=.42,flow=.137,start=.59,push=0){
 const liquid={fillMl:55,depthAt(){return this.fillMl*1e-6/(Math.PI*.04**2);}};
 let previous={x:.5,y:.59};
 const feed=(x:number,y:number,f:number,clearance:number)=>{
  const state={...initialState(),x,y,flow:f,height:heightForClearance(clearance),pouring:true};
  const jet=solveLatteJet(state,f/60,1/60,{x:(x-previous.x)*60,y:(y-previous.y)*60},liquid,false);
  film.step([{x,y,jet}],1/60);liquid.fillMl+=jet.volumeMl;previous={x,y};
 };
 for(let k=0;k<150;k++)feed(.5,.59+Math.max(0,k-104)/45*push,.5,.0028);
 const before=film.white.slice();
 // Raise while dry, place just behind the pool and cut toward its far tip.
 for(let k=0;k<20;k++)film.step([],1/60);
 previous={x:.5,y:start};
 for(let k=0;k<Math.ceil(Math.abs((speed<0?.9:.27)-start)/Math.abs(speed)*60);k++)feed(.5,start-k/60*speed,flow,.026);
 for(let k=0;k<30;k++)film.step([],1/60);
 return {film,before,fillMl:liquid.fillMl};
}
export function filmSvg(field:Float32Array,n:number){
 let cells='';for(let i=0;i<field.length;i++){const w=Math.max(0,Math.min(1,(field[i]-.12)/.60));if(w<.01)continue;const rgb=[94,48,23].map((c,j)=>Math.round(c*(1-w)+[253,245,225][j]*w));cells+=`<rect x="${i%n}" y="${n-1-Math.floor(i/n)}" width="1.03" height="1.03" fill="rgb(${rgb})"/>`;}
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}"><rect width="${n}" height="${n}" fill="#5e3017"/>${cells}</svg>`;
}
if(process.argv[1]?.endsWith('heart-probe.ts')){
 let figures='';for(const [response,speed,flow] of [['legacy',-.42,.137],['local',-.42,.137],['local',-.25,.137],['local',-.65,.137],['local',-.42,.08],['local',-.42,.22],['local',.42,.137]] as const){const film=new LatteFilm();film.response=response;const result=heartPour(film,speed,flow,.59),name=response+'-'+speed+'-'+flow;writeFileSync(`docs/heart-probe-${name}.svg`,filmSvg(film.white,film.size));writeFileSync(`docs/heart-probe-${name}-before.svg`,filmSvg(result.before,film.size));figures+=`<figure><img src="heart-probe-${name}.svg"><figcaption>${name}</figcaption></figure>`;const {rows,...geometry}=heartGeometry(film.white,film.size);console.log(name,geometry);}
 writeFileSync('docs/heart-probe.html',`<!doctype html><title>Heart response probe</title><style>body{background:#29382e;color:white;font:18px system-ui}main{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}figure{margin:0}img{width:100%}</style><p>Stationary low pool, then a raised cut: distant start / at the pool</p><main>${figures}</main>`);
}

