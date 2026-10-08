import type {PourState} from './input.ts';

export const CUP_RADIUS_M = .04;
export const UV_LENGTH_M = 2 * CUP_RADIUS_M / .97;
export const WORLD_PER_METER = .97 / CUP_RADIUS_M;
export const ML_PER_QUANTITY = 12;
export const MAX_FLOW_ML_S = 12;
export const GRAVITY = 9.81;
export const clamp = (v:number, a:number, b:number) => Math.max(a, Math.min(b, v));
export const clearanceMeters = (height:number) => .002 + .078 * clamp(height,0,1) ** 2;
export type Position = {x:number;y:number;z:number};
export type JetState = {
  actualFlowMlS:number; volumeMl:number; massKg:number; clearanceM:number;
  surface:Position; spout:Position; impact:Position; incoming:Position;
  exitDownMPS:number; impactDownMPS:number; exitRadiusM:number; impactRadiusM:number;
  flightSeconds:number; visibleFraction:number; mixingStrength:number;
  emitting:boolean; stroke:number;
  pitcherTilt?:number;pitcherYaw?:number;accessLimited?:boolean;
  surfaceSweep?:{x:number;y:number};
};

export function solveJet(state:PourState, quantity:number, dt:number, velocity={x:0,y:0},fixedExit=false):JetState {
  const volumeMl=Math.max(0,quantity)*ML_PER_QUANTITY;
  const actualFlowMlS=dt>0?volumeMl/dt:0;
  const flow=actualFlowMlS/MAX_FLOW_ML_S, clearanceM=clearanceMeters(state.height);
  // Exit speed is calibrated; the corresponding open spout area follows Q/v.
  const exitDownMPS=fixedExit?.28:.20+.35*Math.sqrt(flow);
  const impactDownMPS=Math.sqrt(exitDownMPS**2+2*GRAVITY*clearanceM);
  const flightSeconds=2*clearanceM/(exitDownMPS+impactDownMPS);
  const incoming={x:clamp(velocity.x*UV_LENGTH_M*.35,-.08,.08),y:clamp(velocity.y*UV_LENGTH_M*.35,-.08,.08),z:-impactDownMPS};
  const impact={x:(state.x-.5)*UV_LENGTH_M,y:(state.y-.5)*UV_LENGTH_M,z:0};
  const spout={x:impact.x-incoming.x*flightSeconds,y:impact.y-incoming.y*flightSeconds,z:clearanceM};
  const q=actualFlowMlS*1e-6;
  const exitRadiusM=Math.sqrt(q/(Math.PI*exitDownMPS));
  const impactRadiusM=Math.sqrt(q/(Math.PI*impactDownMPS));
  // Empirical inverted-fountain partition: energy above the low-pour exit
  // calibration increases penetration. This is not a measured Froude fit.
  const penetration=(2*GRAVITY*clearanceM+.12*exitDownMPS**2)/.32;
  const visibleFraction=.015+.985/(1+penetration**2);
  return {actualFlowMlS,volumeMl,massKg:volumeMl*.001,clearanceM,surface:{...impact},spout,impact,incoming,
    exitDownMPS,impactDownMPS,exitRadiusM,impactRadiusM,flightSeconds,visibleFraction,
    mixingStrength:1-visibleFraction,emitting:volumeMl>0&&state.pouring,stroke:state.stroke};
}

export function jetPoint(jet:JetState, fraction:number):Position {
  const t=jet.flightSeconds*clamp(fraction,0,1);
  return {x:jet.spout.x+jet.incoming.x*t,y:jet.spout.y+jet.incoming.y*t,
    z:jet.spout.z-jet.exitDownMPS*t-.5*GRAVITY*t*t};
}
