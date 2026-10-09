import * as T from 'three';
import {WORLD_PER_METER} from './jet';

export type LiquidMaterial=T.MeshPhysicalMaterial & {uniforms:Record<string,T.IUniform>};
/** Pinned Three r180 PBR extension: the transported field supplies pigment and roughness. */
export function createLiquidMaterial():LiquidMaterial {
 const material=new T.MeshPhysicalMaterial({color:0xffffff,roughness:.2,metalness:0,ior:1.34,clearcoat:.12,clearcoatRoughness:.16,specularIntensity:.75}) as LiquidMaterial;
 material.uniforms={field:{value:null},debug:{value:0},volumeMode:{value:0},freeSurface:{value:0},surfacePurity:{value:0},heightField:{value:null},milkQuality:{value:1},brewStrength:{value:1}};
 material.customProgramCacheKey=()=> 'little-latte-liquid-pbr-r180-v2';
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,material.uniforms);
  shader.vertexShader='varying vec2 latteUv; uniform sampler2D heightField; uniform float freeSurface;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    latteUv=uv;
    if(freeSurface>.5) transformed.z+=texture2D(heightField,uv).r*${WORLD_PER_METER};`);
  shader.fragmentShader=`varying vec2 latteUv;
    uniform sampler2D field,heightField;
    uniform float debug,volumeMode,freeSurface,surfacePurity,milkQuality,brewStrength;
    float latteHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float latteNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(latteHash(i),latteHash(i+vec2(1,0)),f.x),mix(latteHash(i+vec2(0,1)),latteHash(i+vec2(1,1)),f.x),f.y);}
    `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
    if(freeSurface>.5&&length(latteUv-.5)>.485)discard;
    vec4 composition=texture2D(field,latteUv);
    float milk=surfacePurity>.5?smoothstep(.22,.78,composition.b):freeSurface>.5?composition.b:smoothstep(.04,.94,composition.b);
    float edge=smoothstep(.36,.495,length(latteUv-.5));
    float crema=latteNoise(latteUv*31.)*.55+latteNoise(latteUv*83.)*.3+latteNoise(latteUv*193.)*.15;
    vec3 espresso=mix(vec3(.065,.022,.009),vec3(.31,.135,.044),.48+crema*.16+edge*.06);
    espresso=mix(espresso,vec3(.34,.18,.077),clamp(composition.r,0.,1.)*volumeMode*.4);
    espresso*=mix(1.2,.9,brewStrength);
    // Stable, sub-millimeter material detail; never a replacement art mask.
    float micro=latteNoise(latteUv*730.)-.5;
    vec2 bubbleCell=floor(latteUv*210.),bubbleUv=fract(latteUv*210.)-.5;
    float seed=latteHash(bubbleCell),radius=.09+seed*.13;
    float bubble=(1.-smoothstep(radius-.04,radius+.02,length(bubbleUv)))*step(.975,seed);
    float bubbleRim=exp(-pow((length(bubbleUv)-radius)*42.,2.))*step(.975,seed);
    float detail=(micro*.028-bubble*.14+bubbleRim*.1)*(1.-milk*.65);
    diffuseColor.rgb=debug>.5?composition.rgb:mix(espresso,vec3(.94,.88,.76),milk)*(1.+detail+micro*milk*(1.-milkQuality)*.12);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=mix(.15,.36,milk)+micro*.018+bubble*.08;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
    if(freeSurface>.5){
      float d=1./96.;
      vec2 slope=vec2(texture2D(heightField,latteUv+vec2(d,0)).r-texture2D(heightField,latteUv-vec2(d,0)).r,texture2D(heightField,latteUv+vec2(0,d)).r-texture2D(heightField,latteUv-vec2(0,d)).r)/(.082474*d*2.);
      normal=normalize(normal+mat3(viewMatrix)*vec3(-slope,0.));
    }
    if(debug<.5){
      float relief=micro*.00013*(.3+milk*.7)+bubbleRim*.00018;
      vec3 qx=dFdx(vViewPosition),qy=dFdy(vViewPosition);
      vec3 rx=cross(qy,normal),ry=cross(normal,qx);
      float determinant=dot(qx,rx);
      normal=normalize(normal-sign(determinant)*(dFdx(relief)*rx+dFdy(relief)*ry)/max(abs(determinant),.00001));
    }
  `);
 };
 return material;
}
