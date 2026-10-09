import test from 'node:test';
import assert from 'node:assert/strict';
import {LatteFilm} from '../src/latte-film.ts';

function seeded(){const film=new LatteFilm(96);for(let y=0;y<96;y++)for(let x=0;x<96;x++){const i=y*96+x;if(film.mask[i]&&Math.hypot((x+.5)/96-.48,(y+.5)/96-.5)<.13)film.white[i]=.9;}return film;}
test('foam tools transport existing art without painting milk onto blank coffee',()=>{
 for(const tool of ['pick','spoon'] as const){const film=new LatteFilm(96);film.etch({x:.4,y:.5},{x:.65,y:.5},tool);assert.ok(film.white.every(v=>v===0));}
});
test('pick deforms foam locally and remains bounded inside the cup',()=>{
 const film=seeded(),before=film.white.slice();film.etch({x:.48,y:.5},{x:.7,y:.5},'pick');
 assert.ok(film.white.some((v,i)=>Math.abs(v-before[i])>.05));
 assert.ok(film.white.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
 for(let i=0;i<film.white.length;i++)if(!film.mask[i])assert.equal(film.white[i],0);
 assert.equal(film.white[48*96+20],before[48*96+20]);
});
test('spoon moves a wider area than pick; stationary and invalid gestures do nothing',()=>{
 const pick=seeded(),spoon=seeded(),before=pick.white.slice();
 pick.etch({x:.48,y:.5},{x:.65,y:.5},'pick');spoon.etch({x:.48,y:.5},{x:.65,y:.5},'spoon');
 const changed=(film:LatteFilm)=>film.white.reduce((n,v,i)=>n+(Math.abs(v-before[i])>.01?1:0),0);
 assert.ok(changed(spoon)>changed(pick));const snapshot=spoon.white.slice();
 spoon.etch({x:.5,y:.5},{x:.5,y:.5},'spoon');spoon.etch({x:NaN,y:.5},{x:.6,y:.5},'spoon');assert.deepEqual(spoon.white,snapshot);
});
