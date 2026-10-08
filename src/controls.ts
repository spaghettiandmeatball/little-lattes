import {clamp} from './jet.ts';
export type PadAnchor={x:number;y:number;flow:number;height:number};
/** Relative trackpad pickup: touching a new spot never teleports the spout.
 * Incremental anchors let players re-clutch at an edge; +screen Y is -cup Y. */
export function padAim(aim:{x:number;y:number},dx:number,dy:number,width:number,height:number,fine=false){
 const travel=Math.max(80,Math.min(width,height)),gain=fine?.2:1;
 return {x:clamp(aim.x+dx/travel*.45*gain,-.12,1.12),y:clamp(aim.y-dy/travel*.45*gain,-.12,1.12)};
}
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
