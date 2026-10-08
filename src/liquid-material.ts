import * as T from 'three';
import {WORLD_PER_METER} from './jet';

export type LiquidMaterial=T.MeshPhysicalMaterial & {uniforms:Record<string,T.IUniform>};
/** Pinned Three r180 PBR extension: the transported field supplies pigment and roughness. */
export function createLiquidMaterial():LiquidMaterial {
 const material=new T.MeshPhysicalMaterial({color:0xffffff,roughness:.24,metalness:0,ior:1.34,clearcoat:.18,clearcoatRoughness:.22}) as LiquidMaterial;
 material.uniforms={field:{value:null},debug:{value:0},volumeMode:{value:0},freeSurface:{value:0},surfacePurity:{value:0},heightField:{value:null}};
 material.customProgramCacheKey=()=> 'little-latte-liquid-pbr-r180-v1';
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,material.uniforms);
  shader.vertexShader='varying vec2 latteUv; uniform sampler2D heightField; uniform float freeSurface;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    latteUv=uv;
    if(freeSurface>.5) transformed.z+=texture2D(heightField,uv).r*${WORLD_PER_METER};`);
  shader.fragmentShader=`varying vec2 latteUv;
    uniform sampler2D field,heightField;
    uniform float debug,volumeMode,freeSurface,surfacePurity;
    `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
    if(freeSurface>.5&&length(latteUv-.5)>.485)discard;
    vec4 composition=texture2D(field,latteUv);
    float milk=surfacePurity>.5?smoothstep(.22,.78,composition.b):freeSurface>.5?composition.b:smoothstep(.04,.94,composition.b);
    float edge=smoothstep(.36,.495,length(latteUv-.5));
    vec3 espresso=mix(vec3(.055,.018,.007),vec3(.22,.091,.028),edge*.48+composition.g*.25);
    espresso=mix(espresso,vec3(.28,.14,.059),clamp(composition.r,0.,1.)*volumeMode*.55);
    // Stable, sub-millimeter material detail; never a replacement art mask.
    float micro=sin(latteUv.x*1763.)*sin(latteUv.y*1597.+sin(latteUv.x*312.));
    diffuseColor.rgb=debug>.5?composition.rgb:mix(espresso,vec3(.88,.82,.68),milk)*(1.+micro*.009);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=mix(.19,.43,milk)+micro*.008;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
    if(freeSurface>.5){
      float d=1./96.;
      vec2 slope=vec2(texture2D(heightField,latteUv+vec2(d,0)).r-texture2D(heightField,latteUv-vec2(d,0)).r,texture2D(heightField,latteUv+vec2(0,d)).r-texture2D(heightField,latteUv-vec2(0,d)).r)/(.082474*d*2.);
      normal=normalize(normal+mat3(viewMatrix)*vec3(-slope,0.));
    }
  `);
 };
 return material;
}
