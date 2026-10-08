import {CUP_RADIUS_M, MAX_FLOW_ML_S, clamp} from './jet.ts';

export const CUP_DEPTH_M=.024;
export const INITIAL_COFFEE_ML=55;
export const CUP_AREA_M2=Math.PI*CUP_RADIUS_M**2;
export const CAPACITY_ML=CUP_AREA_M2*CUP_DEPTH_M*1e6;
// The liquid grid stretches vertically with the rising mean level. This is
// a rigid-lid bulk model, not a free-surface particle simulation.
export class CupVolume {
  milkMl=0; outsideMl=0; emittedMl=0; impulseNs=0;
  get fillMl(){return INITIAL_COFFEE_ML+this.milkMl;}
  get depthM(){return this.fillMl*1e-6/CUP_AREA_M2;}
  get surfaceM(){return this.depthM-CUP_DEPTH_M;}
  get full(){return this.fillMl>=CAPACITY_ML-1e-7;}
  limitFlow(flow:number,dt:number,inside:boolean){return inside?Math.min(flow,Math.max(0,CAPACITY_ML-this.fillMl)/(Math.max(dt,1e-9)*MAX_FLOW_ML_S)):flow;}
  add(volumeMl:number,inside:boolean,speed:number){
    this.emittedMl+=volumeMl;
    if(inside){const accepted=Math.min(volumeMl,CAPACITY_ML-this.fillMl);this.milkMl+=accepted;this.outsideMl+=volumeMl-accepted;this.impulseNs+=accepted*.001*speed;return accepted;}
    this.outsideMl+=volumeMl;return 0;
  }
  reset(){this.milkMl=this.outsideMl=this.emittedMl=this.impulseNs=0;}
}
export const inCup=(x:number,y:number)=>Math.hypot(x-.5,y-.5)<.485;
export const foamFraction=(clearanceM:number,speed:number)=>clamp(.9/(1+(clearanceM/.011)**2+(speed/.95)**4),0,.9);
