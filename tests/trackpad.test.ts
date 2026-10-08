import test from 'node:test';
import assert from 'node:assert/strict';
import {padAim} from '../src/controls.ts';

test('trackpad pickup and re-clutch keep the retained spout position',()=>{
 const aim={x:.37,y:.61};assert.deepEqual(padAim(aim,0,0,140,125),aim);
 const moved=padAim(aim,24,-18,140,125);
 assert.ok(moved.x>aim.x&&moved.y>aim.y);
 assert.deepEqual(padAim(moved,0,0,140,125),moved);
});
test('trackpad motion is isotropic, fine control is slower and edge reversal is immediate',()=>{
 const start={x:.5,y:.5};const normal=padAim(start,10,-10,160,125),fine=padAim(start,10,-10,160,125,true);
 assert.ok(Math.abs(normal.x-normal.y)<1e-12);
 assert.ok(Math.abs((fine.x-.5)/(normal.x-.5)-.2)<1e-12);
 const edge=padAim(start,1000,0,120,140),back=padAim(edge,-1,0,120,140);
 assert.equal(edge.x,1.12);assert.ok(back.x<edge.x);
});
test('coalesced trackpad packets preserve the same path endpoint without changing controls',()=>{
 let aim={x:.5,y:.5};for(let i=0;i<20;i++)aim=padAim(aim,1,-.5,140,125);
 const once=padAim({x:.5,y:.5},20,-10,140,125);
 assert.ok(Math.abs(aim.x-once.x)<1e-12&&Math.abs(aim.y-once.y)<1e-12);
 assert.deepEqual(Object.keys(once).sort(),['x','y']);
});
