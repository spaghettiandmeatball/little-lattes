import * as T from 'three';
import {Surface} from './surface';
export class Fluid extends Surface {
  readonly texture:T.DataTexture;
  constructor(){super();this.texture=new T.DataTexture(this.pixels,this.size,this.size,T.RGBAFormat,T.UnsignedByteType);this.texture.minFilter=this.texture.magFilter=T.LinearFilter;this.texture.needsUpdate=true;}
  sync(mode='milk',opacity=1.5){this.upload(mode,opacity);this.texture.needsUpdate=true;}
  dispose(){this.texture.dispose();}
}
