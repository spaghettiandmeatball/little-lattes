import {intentions, type ControlScheme} from './cozy-controls.ts';
import type {PourState} from './input.ts';

// Cup XY, Z up. Bearing 0 points toward +Y (away from the player).
// Positive angles turn toward +X. Pitcher-local forward is -Y.
export const wrapBearing=(angle:number)=>Math.atan2(Math.sin(angle),Math.cos(angle));
export const interpolateBearing=(a:number,b:number,t:number)=>wrapBearing(a+wrapBearing(b-a)*t);
export const bearingVector=(angle:number)=>({x:Math.sin(angle),y:Math.cos(angle)});
export const bearingYaw=(angle:number)=>Math.PI-angle;

/** Display units belong to the selected controls, never the recording's scheme. */
export function replayControls(state:PourState,scheme:ControlScheme){
 const intention=state.intention??'draw',envelope=intentions[intention];
 const delivery=state.scheme==='cozy'&&state.delivery!==undefined?state.delivery:
  Math.max(0,Math.min(1,(state.flow*12-envelope.min)/(envelope.max-envelope.min)));
 return {flow:scheme==='cozy'?delivery:state.flow,height:state.height,delivery,intention};
}
