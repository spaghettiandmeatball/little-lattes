import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRoom,defaultRoom} from '../src/room-config.ts';

test('older room saves migrate equipment and placement defaults without losing finishes',()=>{
 const room=validateRoom({version:1,counter:'walnut',wall:'sage',cup:'ink'});
 assert.equal(room.counter,'walnut');assert.equal(room.cup,'ink');assert.equal(room.mugSize,'standard');assert.equal(room.hideJug,false);
 assert.deepEqual(room.decorations,defaultRoom.decorations);
 room.decorations[0].x=8;assert.notEqual(defaultRoom.decorations[0].x,8);
});
test('placement validation rejects bad kinds, IDs, duplicates and non-finite coordinates',()=>{
 const valid={id:'my-fern',kind:'fern',x:90,y:-90,rotation:8};
 const room=validateRoom({...defaultRoom,decorations:[valid,valid,{...valid,id:'../bad'},{...valid,id:'nan',x:NaN},{...valid,id:'unknown',kind:'toString'}]});
 assert.equal(room.decorations.length,1);assert.equal(room.decorations[0].x,9);assert.equal(room.decorations[0].y,-2.8);assert.ok(Math.abs(room.decorations[0].rotation)<=Math.PI);
 const empty=validateRoom({...defaultRoom,decorations:[]});assert.equal(empty.decorations.length,0);
});
test('equipment settings and placed objects survive a storage round trip, bounded to 24',()=>{
 const room=validateRoom(JSON.parse(JSON.stringify({...defaultRoom,mugSize:'large',jugShape:'round',fixture:'task',hideJug:true,decorations:Array.from({length:30},(_,i)=>({id:'plant-'+i,kind:'monstera',x:3,y:-1,rotation:0}))})));
 assert.equal(room.mugSize,'large');assert.equal(room.jugShape,'round');assert.equal(room.fixture,'task');assert.equal(room.hideJug,true);assert.equal(room.decorations.length,24);
 assert.deepEqual(validateRoom(JSON.parse(JSON.stringify(room))),room);
});

test('counter upgrades are optional, migrate old rooms, and survive saved room validation',()=>{
 const legacy=validateRoom({version:1,counter:'walnut'});
 assert.equal(legacy.machine,'classic');assert.equal(legacy.kettle,'classic');assert.ok(!legacy.decorations.some(d=>d.kind==='pothos'));
 const selected=validateRoom({...legacy,machine:'laMarzocco',kettle:'fellow',decorations:[{id:'new-pothos',kind:'pothos',x:4,y:0,rotation:.5}]});
 assert.equal(selected.machine,'laMarzocco');assert.equal(selected.kettle,'fellow');assert.equal(selected.decorations[0].kind,'pothos');
 assert.deepEqual(validateRoom(JSON.parse(JSON.stringify(selected))),selected);
 assert.equal(validateRoom({...selected,machine:'toString',kettle:'unknown'}).machine,'classic');
 assert.equal(validateRoom({...selected,machine:'toString',kettle:'unknown'}).kettle,'classic');
});
