import {clamp,clearanceMeters} from './jet.ts';
export type Intention='draw'|'finish'|'mix';
export type ControlScheme='cozy'|'advanced';
export const intentions:Record<Intention,{min:number;max:number;clearance:number}>={
 draw:{min:2.4,max:9.6,clearance:.0028},
 finish:{min:.8,max:3.2,clearance:.026},
 mix:{min:2.4,max:6,clearance:.045},
};
export const heightForClearance=(m:number)=>Math.sqrt(clamp((m-.002)/.078,0,1));
export function intendedSettings(intention:Intention,delivery:number){
 const config=intentions[intention],t=clamp(delivery,0,1);
 return {flow:(config.min+t*(config.max-config.min))/12,height:heightForClearance(config.clearance)};
}
export function transitionSettings(current:{flow:number;height:number},target:{flow:number;height:number},dt:number){
 const t=1-Math.exp(-Math.max(dt,0)/.12);
 return {flow:current.flow+(target.flow-current.flow)*t,height:current.height+(target.height-current.height)*t};
}
export type ControlResponse='smooth-1'|'dry-ready-1';
export function advancePhysicalSettings(current:{flow:number;height:number},target:{flow:number;height:number},dt:number,wet:boolean,response:ControlResponse){
 return response==='dry-ready-1'&&!wet?target:transitionSettings(current,target,dt);
}
// Incremental pickup absorbs saturation, so reversing at an edge responds now.
export function padDelivery(current:number,dx:number,width:number,fine=false){return clamp(current+dx/Math.max(width,1)*(fine?.18:.9),0,1);}
export const settingsClearance=(height:number)=>clearanceMeters(height);
