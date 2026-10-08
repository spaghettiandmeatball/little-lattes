import {writeFileSync} from 'node:fs';
import {LatteFilm} from '../src/latte-film.ts';
import {initialState} from '../src/input.ts';
import {solveLatteJet} from '../src/equipment.ts';
import {heightForClearance} from '../src/cozy-controls.ts';
import {orientedHeartGeometry,canonicalField} from '../src/art-metrics.ts';
import {filmSvg} from './heart-probe.ts';

const results:unknown[]=[];
for(const size of [160,240])for(const bearing of [0,Math.PI/4,Math.PI/2]){
 const film=new LatteFilm(size);film.response='fine';const c=Math.cos(bearing),s=Math.sin(bearing);
 const liquid={fillMl:63,depthAt(){return this.fillMl*1e-6/(Math.PI*.04**2);}};
 let last={x:.5+s*.09,y:.5+c*.09};const start=performance.now();
 function tick(v:number,flow:number,height:number){
  const x=.5+v*s,y=.5+v*c,state={...initialState(),bearing,x,y,flow,height:heightForClearance(height),pouring:flow>0};
  const jet=solveLatteJet(state,flow/60,1/60,{x:(x-last.x)*60,y:(y-last.y)*60},liquid,true);
  film.step([{x,y,jet}],1/60);liquid.fillMl+=jet.volumeMl;last={x,y};
 }
 for(let i=0;i<150;i++)tick(.09,.5,.0028);
 for(let i=0;i<18;i++)tick(.09,0,.026);
 for(let i=0;i<46;i++)tick(.09+i/60*.42,.137,.026);
 for(let i=0;i<600;i++)film.step([],1/60);
 const {rows,...metrics}=orientedHeartGeometry(film.white,size,bearing);
 const name=`direction-fine-${size}-${Math.round(bearing*180/Math.PI)}`;
 writeFileSync(`docs/${name}.svg`,filmSvg(canonicalField(film.white,size,bearing),size));
 results.push({size,bearingDegrees:bearing*180/Math.PI,elapsedMs:performance.now()-start,fillMl:liquid.fillMl,...metrics,...film.metrics()});
}
writeFileSync('docs/direction-fine-evidence.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
