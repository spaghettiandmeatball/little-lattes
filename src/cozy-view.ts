import * as T from 'three';
import {CozyLiquid} from './cozy-liquid.ts';
import type {SurfaceInput} from './surface';
import {solveJet} from './jet.ts';
import {LatteFilm} from './latte-film.ts';
export const LATTE_VERSION='hydrostatic-film-4';
export const TAPER_VERSION='hydrostatic-film-5';
export class CozyView extends CozyLiquid {
 readonly film=new LatteFilm();useFilm=true;
 private filmData=new Float32Array(this.film.size*this.film.size*4);
 readonly filmTexture=new T.DataTexture(this.filmData,this.film.size,this.film.size,T.RGBAFormat,T.FloatType);
 get fieldTexture(){return this.useFilm?this.filmTexture:this.texture;}
 private data:Float32Array;readonly texture:T.DataTexture;
 private heightData:Float32Array;readonly heightTexture:T.DataTexture;
 constructor(linear=true,size=48){super(size);this.data=new Float32Array(this.size*this.size*4);this.heightData=new Float32Array(this.size*this.size*4);this.texture=new T.DataTexture(this.data,this.size,this.size,T.RGBAFormat,T.FloatType);this.heightTexture=new T.DataTexture(this.heightData,this.size,this.size,T.RGBAFormat,T.FloatType);for(const texture of [this.texture,this.heightTexture,this.filmTexture]){texture.minFilter=texture.magFilter=linear?T.LinearFilter:T.NearestFilter;texture.needsUpdate=true;}this.sync();}
 stepBatch(parts:SurfaceInput[]){const sources=parts.map(p=>({x:(p.slice.a.x+p.slice.b.x)*.5,y:(p.slice.a.y+p.slice.b.y)*.5,jet:p.jet??solveJet(p.slice.b,p.quantity,p.slice.dt)})),dt=parts.reduce((s,p)=>s+p.slice.dt,0);const start=performance.now();this.step(sources,dt);if(this.useFilm)this.film.step(sources,dt);this.cpuMs=performance.now()-start;}
 reset(prepared=true,fillMl=prepared?63:55){super.reset(prepared,fillMl);this.film?.reset();}
 dispose(){this.texture.dispose();this.heightTexture.dispose();this.filmTexture.dispose();}
 sync(mode='milk'){
  const mean=this.fillMl*1e-6/(Math.PI*.04**2);
  for(let i=0;i<this.h.length;i++){
   const j=i*4;
   if(mode==='velocity'){this.data[j]=.5+this.u[i]*8;this.data[j+1]=.5+this.v[i]*8;this.data[j+2]=.5;}
   else {this.data[j]=(this.upperMilk[i]+this.lowerMilk[i])/Math.max(this.h[i],1e-9);this.data[j+1]=Math.min(1,this.crema[i]/.00002)*.5;this.data[j+2]=(1-Math.exp(-this.foam[i]/.00028))*Math.min(1,this.gas[i]/Math.max(this.foam[i]*.25,1e-12));}
   this.data[j+3]=1;this.heightData[j]=this.mask[i]?this.h[i]-mean:0;this.heightData[j+3]=1;
  }
  if(this.useFilm){const n=this.film.size;for(let i=0;i<this.film.white.length;i++){const b=Math.floor((i%n+.5)/n*this.size)+Math.floor((Math.floor(i/n)+.5)/n*this.size)*this.size,j=i*4;this.filmData[j]=this.data[b*4];this.filmData[j+1]=this.data[b*4+1];this.filmData[j+2]=mode==='velocity'?this.data[b*4+2]:this.film.white[i];this.filmData[j+3]=1;}this.filmTexture.needsUpdate=true;}
  this.texture.needsUpdate=this.heightTexture.needsUpdate=true;
 }
 inspect(){return {...this.metrics(),mode:this.useFilm?(this.film.response==='legacy'?'hydrostatic-film-3':this.film.response==='taper'?TAPER_VERSION:LATTE_VERSION):this.metrics().mode,...this.useFilm?{film:this.film.metrics()}: {}};}
}

