export type BrewKind='espresso'|'pour-over';
export function steamedMilk(seconds:number){
 const t=Math.max(0,Math.min(20,Number.isFinite(seconds)?seconds:0));
 const quality=t<5?.2+t*.12:t<=9?1:Math.max(.15,1-(t-9)*.085);
 return {seconds:t,temperature:Math.round(18+t*4),quality,label:t<3?'Cold · thin':t<5?'Warming · light foam':t<=9?'Silky microfoam':t<13?'Thick foam':'Overheated · coarse foam'};
}
export function brewResult(kind:BrewKind,seconds:number){
 const duration=kind==='espresso'?9:12,progress=Math.max(0,Math.min(1,seconds/duration));
 return {progress,strength:.35+.65*progress,label:progress<.35?'Light extraction':progress<.75?'Gentle extraction':'Ready to serve'};
}
