export type ToolPoint={x:number;y:number};
/** Incremental precision steering: no delayed smoothing or jump when toggled. */
export function detailAim(point:ToolPoint,previous:ToolPoint,next:ToolPoint,precise:boolean):ToolPoint {
 const gain=precise?.35:1,x=point.x+(next.x-previous.x)*gain,y=point.y+(next.y-previous.y)*gain;
 const dx=x-.5,dy=y-.5,r=Math.hypot(dx,dy),scale=r>.465?.465/r:1;
 return {x:.5+dx*scale,y:.5+dy*scale};
}
export function foamToolSettings(tool:'pick'|'spoon',precise=false){return {radius:(tool==='pick'?.012:.032)*(precise?.6:1),strength:precise?.42:.72};}
