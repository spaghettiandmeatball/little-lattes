import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MilkLedger,validPreset,defaults} from '../src/model.ts';
test('milk accounting is independent of render cadence',()=>{const a=new MilkLedger(),b=new MilkLedger();for(let i=0;i<600;i++)a.spend(.6,1/60);for(let i=0;i<300;i++)b.spend(.6,1/30);assert.ok(Math.abs(a.remaining-b.remaining)<1e-9);});
test('an empty pitcher cannot overspend and refill restores volume',()=>{const milk=new MilkLedger();assert.equal(milk.spend(1,100),12.5);assert.equal(milk.remaining,0);assert.equal(milk.spend(1,1),0);milk.refill();assert.equal(milk.remaining,100);});
test('reject unsafe imported tuning',()=>{assert.ok(validPreset(defaults.Drawing));assert.equal(validPreset({...defaults.Drawing,radius:-1}),false);assert.equal(validPreset({...defaults.Drawing,opacity:NaN}),false);assert.equal(validPreset(null),false);});
