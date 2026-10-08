// Development shape measurements. These observe fields and never change them.
import {UV_LENGTH_M} from './jet.ts';
/** Resample only for measurement: cup-centred origin and commanded +Y design axis. */
export function canonicalField(field:Float32Array,n:number,bearing=0,origin={x:.5,y:.5}){
 const out=new Float32Array(field.length),c=Math.cos(bearing),s=Math.sin(bearing);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const u=(x+.5)/n-.5,v=(y+.5)/n-.5;
  const px=(origin.x+u*c+v*s)*n-.5,py=(origin.y-u*s+v*c)*n-.5;
  const a=Math.floor(px),b=Math.floor(py),fx=px-a,fy=py-b;
  const at=(xx:number,yy:number)=>xx>=0&&yy>=0&&xx<n&&yy<n?field[yy*n+xx]:0;
  out[y*n+x]=at(a,b)*(1-fx)*(1-fy)+at(a+1,b)*fx*(1-fy)+at(a,b+1)*(1-fx)*fy+at(a+1,b+1)*fx*fy;
 }return out;
}
export function orientedHeartGeometry(field:Float32Array,n:number,bearing=0,origin={x:.5,y:.5}){
 const canonical=canonicalField(field,n,bearing,origin),legacy=heartGeometry(canonical,n),mm=UV_LENGTH_M*1000/n;
 const occupied=legacy.rows.map((width,y)=>({width,y})).filter(row=>row.width>0);
 if(!occupied.length)return {...legacy,apexWidthMm:0,lastMillimeterWidthMm:0,areaMm2:0};
 const last=occupied.at(-1)!,terminal=occupied.filter(row=>(last.y-row.y)*mm<=1);
 return {...legacy,apexWidthMm:last.width*mm,lastMillimeterWidthMm:Math.max(...terminal.map(row=>row.width))*mm,areaMm2:legacy.area*mm*mm};
}
export function heartGeometry(field:Float32Array,n:number){
 const rows:number[]=[],left:number[]=[],right:number[]=[],middle:number[]=[];
 let area=0,retainedLeft=0,retainedRight=0;
 for(let y=0;y<n;y++){let width=0;for(let x=0;x<n;x++)if(field[y*n+x]>.5){width++;area++;if(x<n/2)retainedLeft++;else retainedRight++;if(x<n*.47)left.push(y);if(x>n*.53)right.push(y);if(Math.abs(x-n/2)<2)middle.push(y);}rows[y]=width;}
 const low=Math.min(...left,...right),high=Math.max(...left,...right,...middle),peak=Math.max(...rows),centreLow=Math.min(...middle);
 const topRows=rows.slice(Math.floor(high-(high-low)*.15),high+1);
 return {area,retainedLeft,retainedRight,notchCells:centreLow-low,lengthCells:high-low,peakWidthCells:peak,tipWidthCells:Math.max(...topRows),rows};
}
