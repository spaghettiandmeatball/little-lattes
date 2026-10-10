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

test('repeated spoon passes keep fine crema folds sharper than simple resampling',()=>{
 const sharp=new LatteFilm(160),legacy=new LatteFilm(160),n=160;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(sharp.mask[y*n+x])sharp.white[y*n+x]=legacy.white[y*n+x]=(Math.floor(x/3)%2===0?.95:.05);
 const sample=(a:Float32Array,x:number,y:number)=>{x=Math.max(0,Math.min(n-1,x));y=Math.max(0,Math.min(n-1,y));const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;return a[iy*n+ix]*(1-fx)*(1-fy)+a[iy*n+Math.min(n-1,ix+1)]*fx*(1-fy)+a[Math.min(n-1,iy+1)*n+ix]*(1-fx)*fy+a[Math.min(n-1,iy+1)*n+Math.min(n-1,ix+1)]*fx*fy;};
 const before=sharp.white.slice();
 for(let pass=0;pass<8;pass++){
  const from={x:pass%2?.6:.4,y:.5},to={x:pass%2?.4:.6,y:.5};sharp.etch(from,to,'spoon');
  const radius=.048,steps=Math.ceil(.2/(radius*.35)),dx=(to.x-from.x)/steps;
  for(let k=1;k<=steps;k++){const x=from.x+dx*k,src=legacy.white.slice();for(let i=0;i<src.length;i++){if(!legacy.mask[i])continue;const px=(i%n+.5)/n,py=(Math.floor(i/n)+.5)/n,r2=(px-x)**2+(py-.5)**2;if(r2>radius*radius*9)continue;const w=Math.exp(-r2/(2*radius*radius))*.92;legacy.white[i]=sample(src,(px-dx*w)*n-.5,py*n-.5);}}
 }
 const contrast=(film:LatteFilm)=>{let sum=0;for(let y=76;y<84;y++)for(let x=66;x<94;x++)sum+=Math.abs(film.white[y*n+x+1]-film.white[y*n+x]);return sum;};
 assert.ok(contrast(sharp)>contrast(legacy)*1.25,`${contrast(sharp)} versus blurred ${contrast(legacy)}`);
 assert.equal(sharp.white[40*n+80],before[40*n+80],'folds outside the tool footprint must remain exact');
 assert.ok(sharp.white.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
});
