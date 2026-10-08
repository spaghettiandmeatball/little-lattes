import {clamp} from './jet.ts';
export type PadAnchor={x:number;y:number;flow:number;height:number};
export function padSettings(anchor:PadAnchor,x:number,y:number,width:number,height:number,fine=false){
  const gain=fine ? .2 : 1;
  return {flow:clamp(anchor.flow+(x-anchor.x)/Math.max(width,1)*.9*gain,.1,1),
    height:clamp(anchor.height-(y-anchor.y)/Math.max(height,1)*gain,0,1)};
}
// Pixel wheel deltas: 100 px is 0.06 control travel. Lines = 16 px;
// pages = 400 px. Bound each event to 0.06, Shift reduces gain to 20%.
export function wheelHeight(delta:number,mode:number,fine=false){
  return -clamp(delta*(mode===1?16:mode===2?400:1)*.0006,-.06,.06)*(fine ? .2 : 1);
}
export function heldFlow(direction:number,dt:number,fine=false){
  return direction*Math.min(Math.max(dt,0),.05)*.3*(fine ? .2 : 1);
}
