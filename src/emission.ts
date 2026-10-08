import {CAPACITY_ML} from './volume.ts';
/** Requested flow is spent even at a full cup, unless the explicit rim assist is on. */
export function permittedFlow(flow:number,dt:number,fillMl:number,pendingMl:number,inside:boolean,stopAtRim:boolean){
 return stopAtRim&&inside?Math.min(flow,Math.max(0,CAPACITY_ML-fillMl-pendingMl)/(Math.max(dt,1e-9)*12)):flow;
}
