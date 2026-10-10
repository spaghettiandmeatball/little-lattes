import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MovingSurface} from '../src/moving-surface.ts';
import {LatteFilm} from '../src/latte-film.ts';
import {initialState} from '../src/input.ts';
import {solveJet} from '../src/jet.ts';
const dt=1/60;
const source=(x=.5,y=.5)=>({x,y,jet:solveJet({...initialState(),x,y,pouring:true,height:.2},.4*dt,dt)});
test('prepared 3D surface stays still without emission or bulk motion',()=>{const s=new MovingSurface();for(let k=0;k<600;k++)s.step([],dt,55);assert.equal(s.metrics().surfacePeakMm,0);assert.equal(s.metrics().surfaceSpeedMmS,0);});
test('pouring changes local height without inventing additional cup volume, then settles',()=>{const s=new MovingSurface();let fill=55;for(let k=0;k<60;k++){const p=source();fill+=p.jet.volumeMl;s.step([p],dt,fill);}const active=s.metrics();assert.ok(active.surfacePeakMm>.02);assert.ok(Math.abs(active.surfaceMeanErrorMm)<1e-8);for(let k=0;k<600;k++)s.step([],dt,fill);assert.ok(s.metrics().surfacePeakMm<active.surfacePeakMm*.05);assert.ok(s.metrics().surfaceSpeedMmS<.01);});
test('rim deposits stay finite and exchange no volume through the cup wall',()=>{const s=new MovingSurface();let fill=55;for(let k=0;k<240;k++){const p=source(.965,.5);fill+=p.jet.volumeMl;s.step([p],dt,fill);}assert.ok(Math.abs(s.metrics().surfaceMeanErrorMm)<1e-7);for(const h of s.height)assert.ok(Number.isFinite(h));assert.ok(s.metrics().surfaceSpeedMmS<65);});
test('thicker foam damps the liquid response',()=>{const a=new MovingSurface(),b=new MovingSurface(),foam=new Float32Array(32*32).fill(1);let fill=55;for(let k=0;k<60;k++){const p=source();fill+=p.jet.volumeMl;a.step([p],dt,fill);b.step([p],dt,fill,foam,32);}for(let k=0;k<15;k++){a.step([],dt,fill);b.step([],dt,fill,foam,32);}assert.ok(b.metrics().surfaceSpeedMmS<a.metrics().surfaceSpeedMmS);});
test('bulk motion drives the surface and transports existing milk without a new pour',()=>{const s=new MovingSurface(),f=new LatteFilm(64);for(let i=0;i<s.mask.length;i++)if(s.mask[i]){s.bulk[i*4]=-(Math.floor(i/32)/32-.5)*.1;s.bulk[i*4+1]=(i%32/32-.5)*.1;}for(let k=0;k<10;k++)s.step([],dt,55);assert.ok(s.metrics().surfaceSpeedMmS>0);for(let y=27;y<36;y++)for(let x=24;x<29;x++)f.white[y*64+x]=1;const before=f.white.slice();for(let k=0;k<30;k++)f.step([],dt,s);let change=0;for(let i=0;i<f.white.length;i++){assert.ok(f.white[i]>=0&&f.white[i]<=1);change+=Math.abs(f.white[i]-before[i]);}assert.ok(change>1);});

test('a full cup keeps every column within the rim and does not invent volume',()=>{const s=new MovingSurface(),fill=Math.PI*.04**2*.024*1e6;for(let k=0;k<30;k++)s.step([source()],dt,fill);for(let y=0;y<s.size;y++)for(let x=0;x<s.size;x++)if(s.mask[y*s.size+x])assert.ok(s.depthAt((x+.5)/s.size,(y+.5)/s.size)<=.024+1e-9);assert.ok(Math.abs(s.metrics().surfaceMeanErrorMm)<1e-9);});

import {solveLatteJet} from '../src/equipment.ts';
import {validRecording} from '../src/recording.ts';
import {defaults} from '../src/model.ts';
test('rim assist turns the jug into the cup before lifting a low pour across the surface',()=>{const liquid={fillMl:55,depthAt:()=>55e-6/(Math.PI*.04**2)};for(let k=0;k<24;k++){const x=.5+.4*Math.cos(k*Math.PI/12),y=.5+.4*Math.sin(k*Math.PI/12),state={...initialState(),x,y,flow:.4,height:.1,pouring:true,bearing:0};const j=solveLatteJet(state,.4/60,dt,{x:0,y:0},liquid,true,'adaptive-pour-2');assert.ok(j.clearanceM<.005,`${x},${y}: ${j.clearanceM}`);assert.ok(Math.hypot(j.spout.x+j.incoming.x*j.flightSeconds-j.impact.x,j.spout.y+j.incoming.y*j.flightSeconds-j.impact.y)<1e-9);}});
test('the new surface and access model round trip in recorded pours',()=>{assert.ok(validRecording({version:1,kind:'recorded-input',duration:1,initial:initialState(),recipe:defaults.Accessible,unlimited:false,events:[],skips:[],environment:{solver:'gpu-volume-film-4',prepared:false,initialCoffeeMl:55,initialMilkMl:0,stopAtRim:true,leftHanded:false,scheme:'advanced',intention:'draw',delivery:.4,equipmentModel:'adaptive-pour-2'}}));});
