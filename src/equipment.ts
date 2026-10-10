import {solveJet,clearanceMeters,CUP_RADIUS_M,UV_LENGTH_M,WORLD_PER_METER,type Position} from './jet.ts';
import {heightForClearance} from './cozy-controls.ts';
import type {PourState} from './input.ts';
import type {CozyLiquid} from './cozy-liquid.ts';
import {PITCHER,POUR_ACCESS_SCALE} from './vessel.ts';
import {bearingYaw,bearingVector,interpolateBearing} from './pour-pose.ts';
export type EquipmentModel='rim-binary-1'|'adaptive-center-1'|'adaptive-pour-2'|'roomy-pour-3';

/** Conservative bound of the illustrated cylinder, posed about its actual tip.
 * The rim response grows with overlap instead of switching at first contact. */
export function equipmentClearance(x:number,y:number,depthM:number,flow:number,requestedM:number,yaw=-.7,model:EquipmentModel='adaptive-center-1'){
 const tilt=1.15+Math.max(0,Math.min(1,flow))*.2,c=Math.cos(tilt),s=Math.sin(tilt);
 const ty=PITCHER.tipY*c-PITCHER.tipZ*s,tz=PITCHER.tipY*s+PITCHER.tipZ*c;
 const centerX=(x-.5)*UV_LENGTH_M+ty*Math.sin(yaw)/WORLD_PER_METER;
 const centerY=(y-.5)*UV_LENGTH_M-ty*Math.cos(yaw)/WORLD_PER_METER;
 const bound=Math.hypot(PITCHER.bodyHalfHeight,PITCHER.handleReach)/WORLD_PER_METER;
 const bottom=(-tz-(PITCHER.bodyHalfHeight*c+PITCHER.bodyRadius*s))/WORLD_PER_METER;
 const accessRadius=CUP_RADIUS_M*(model==='roomy-pour-3'?POUR_ACCESS_SCALE:1);
 const overlap=Math.hypot(centerX,centerY)+bound-accessRadius;
 const t=Math.max(0,Math.min(1,overlap/PITCHER.accessBlendM));
 const rimWeight=model==='rim-binary-1'?(overlap>0?1:0):t*t*(3-2*t);
 const minimum=Math.max(0,-bottom+PITCHER.rimAllowanceM)+rimWeight*Math.max(0,PITCHER.rimHeadroomM-depthM);
 return {clearanceM:Math.max(requestedM,minimum),limited:minimum>requestedM+.0005,tilt,rimConflict:overlap>0,rimWeight};
}
/** Rotate the pitcher body toward the open center as the aim approaches the rim. */
export function reachablePitcherYaw(x:number,y:number){
 const forward=.5-y;
 const centered=Math.PI-2*(x-.5);
 if(forward<=.02)return centered;
 const towardCenter=Math.atan2(x-.5,forward);
 const blend=Math.max(0,Math.min(1,(forward-.02)/.18));
 // Upper reaches use one continuous turn from the centered pose.
 return centered+(towardCenter-centered)*blend;
}
/** The forward outlet speed depends on delivery; gravity steepens the stream
 * as clearance increases. Keep its ballistic endpoint and rendered tip shared. */
export function solveLatteJet(state:PourState,quantity:number,dt:number,velocity:{x:number;y:number},liquid:{fillMl:number;depthAt:(x:number,y:number)=>number},assist=true,model:EquipmentModel='adaptive-center-1'){
 const depth=liquid.depthAt(state.x,state.y),requested=clearanceMeters(state.height);
 let yaw=state.bearing!==undefined?bearingYaw(state.bearing):assist&&model==='adaptive-center-1'?reachablePitcherYaw(state.x,state.y):Math.PI;
 let access=equipmentClearance(state.x,state.y,depth,state.flow,requested,yaw,model);
 if(assist&&model==='adaptive-pour-2'){
  // Bring the body over the open cup before raising the spout. The previous
  // fixed bearing lifted a low pour by ~13 mm over much of the back half.
  const inward=Math.atan2(state.x-.5,.5-state.y),candidate=equipmentClearance(state.x,state.y,depth,state.flow,requested,inward,model);
  const improvement=access.clearanceM-candidate.clearanceM;
  const t=Math.max(0,Math.min(1,(improvement-.0003)/.003));
  yaw=interpolateBearing(yaw,inward,t*t*(3-2*t));access=equipmentClearance(state.x,state.y,depth,state.flow,requested,yaw,model);
 }

 const setting=assist?{...state,height:heightForClearance(access.clearanceM)}:state;
 const jet=solveJet(setting,quantity,dt,velocity,true);
 // Missing bearing is the historical fixed-axis recording contract.
 const forward=bearingVector(model==='adaptive-pour-2'&&assist?Math.PI-yaw:state.bearing??0),speed=.055+.095*Math.sqrt(Math.max(0,Math.min(1,jet.actualFlowMlS/12)));
 jet.incoming.x+=forward.x*speed;jet.incoming.y+=forward.y*speed;
 jet.surfaceSweep={x:Math.max(-.12,Math.min(.12,velocity.x*UV_LENGTH_M)),y:Math.max(-.12,Math.min(.12,velocity.y*UV_LENGTH_M))};
 jet.spout.x=jet.impact.x-jet.incoming.x*jet.flightSeconds;jet.spout.y=jet.impact.y-jet.incoming.y*jet.flightSeconds;
 const delta=depth-liquid.fillMl*1e-6/(Math.PI*CUP_RADIUS_M**2);
 jet.impact.z=jet.surface.z=delta;jet.spout.z+=delta;jet.pitcherTilt=access.tilt;jet.pitcherYaw=yaw;jet.accessLimited=assist&&access.limited;
 return jet;
}
export function solveCozyJet(state:PourState,quantity:number,dt:number,velocity:{x:number;y:number},liquid:CozyLiquid,assist=true,model:EquipmentModel='adaptive-center-1'){
 const depth=liquid.depthAt(state.x,state.y),access=equipmentClearance(state.x,state.y,depth,state.flow,clearanceMeters(state.height),-.7,model);
 const setting=assist?{...state,height:heightForClearance(access.clearanceM)}:state;
 const jet=solveJet(setting,quantity,dt,velocity,true);
 const delta=depth-liquid.fillMl*1e-6/(Math.PI*CUP_RADIUS_M**2);
 jet.impact.z=jet.surface.z=delta;jet.spout.z+=delta;jet.pitcherTilt=access.tilt;jet.accessLimited=assist&&access.limited;
 return jet;
}
