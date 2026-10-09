export const roomCatalog={
 machine:{classic:{label:'Classic machine',color:'#657b66'},laMarzocco:{label:'La Marzocco',color:'#bac4c4'}},
 kettle:{classic:{label:'Classic kettle',color:'#cbd3d1'},fellow:{label:'Fellow electric',color:'#333b3a'}},
 mugSize:{small:{label:'Small · 85%',color:'#dcc6a5'},standard:{label:'Classic · 100%',color:'#eee0c7'},large:{label:'Large · 125%',color:'#c5d1b9'}},
 jugShape:{classic:{label:'Classic spout',color:'#bbc8c9'},round:{label:'Round belly',color:'#d4c8b2'},tall:{label:'Tall jug',color:'#759189'}},
 fixture:{pendant:{label:'Pendant',color:'#e4bf75'},task:{label:'Counter lamp',color:'#a7b18c'},both:{label:'Both lights',color:'#ecd89d'},none:{label:'Daylight only',color:'#cedce0'}},
 counter:{oak:{label:'Honey oak',color:'#bb9664'},walnut:{label:'Dark walnut',color:'#70503d'},stone:{label:'Pale stone',color:'#d4cdbb'}},
 wall:{cream:{label:'Warm cream',color:'#e0d4bd'},sage:{label:'Muted sage',color:'#99aa92'},clay:{label:'Dusty clay',color:'#c69d88'}},
 cup:{ivory:{label:'Oat glaze',color:'#f3e7d3'},sage:{label:'Sage glaze',color:'#91a892'},ink:{label:'Midnight glaze',color:'#344951'}},
 pitcher:{brushed:{label:'Brushed steel',color:'#becbcf'},polished:{label:'Polished steel',color:'#e4e8e9'},coated:{label:'Cream enamel',color:'#dfd5c1'}},
 plants:{all:{label:'Leafy corner',color:'#537354'},window:{label:'Window garden',color:'#74926c'},shelf:{label:'Trailing shelf',color:'#8eaa73'}},
 pots:{clay:{label:'Terracotta',color:'#b87859'},cream:{label:'Chalk pottery',color:'#dcd0b8'},sage:{label:'Sage pottery',color:'#7b917b'}},
 objects:{journal:{label:'Slow morning',color:'#667866'},linen:{label:'Linen & coffee',color:'#d4c4a6'},pastry:{label:'A little treat',color:'#bb8a4e'}},
 light:{morning:{label:'Soft morning',color:'#dce7e3'},afternoon:{label:'Golden afternoon',color:'#eed2a0'},evening:{label:'Warm evening',color:'#c88b5c'}}
} as const;
export const decorationKinds=['fern','monstera','flowers','candle','books','lamp','pothos'] as const;
export type DecorationKind=typeof decorationKinds[number];
export type PlacedDecoration={id:string;kind:DecorationKind;x:number;y:number;rotation:number};
export const initialDecorations:PlacedDecoration[]=[{id:'fern-left',kind:'fern',x:-3.5,y:-.9,rotation:0},{id:'monstera-right',kind:'monstera',x:4.6,y:-2.1,rotation:.2},{id:'flowers-left',kind:'flowers',x:-2.7,y:1.0,rotation:0},{id:'candle-right',kind:'candle',x:2.6,y:-.3,rotation:0},{id:'books-left',kind:'books',x:-4.5,y:.3,rotation:.1},{id:'lamp-right',kind:'lamp',x:5.6,y:-1.1,rotation:0}];
export type RoomConfig={version:1;machine:keyof typeof roomCatalog.machine;kettle:keyof typeof roomCatalog.kettle;mugSize:keyof typeof roomCatalog.mugSize;jugShape:keyof typeof roomCatalog.jugShape;fixture:keyof typeof roomCatalog.fixture;hideJug:boolean;decorations:PlacedDecoration[];counter:keyof typeof roomCatalog.counter;wall:keyof typeof roomCatalog.wall;cup:keyof typeof roomCatalog.cup;pitcher:keyof typeof roomCatalog.pitcher;plants:keyof typeof roomCatalog.plants;pots:keyof typeof roomCatalog.pots;objects:keyof typeof roomCatalog.objects;light:keyof typeof roomCatalog.light};
export const defaultRoom:RoomConfig={version:1,machine:'classic',kettle:'classic',mugSize:'standard',jugShape:'classic',fixture:'both',hideJug:false,decorations:initialDecorations,counter:'oak',wall:'cream',cup:'ivory',pitcher:'brushed',plants:'all',pots:'clay',objects:'linen',light:'afternoon'};
export const roomPresets:Record<string,RoomConfig>={
 'Window seat':{...defaultRoom},
 'Quiet morning':{...defaultRoom,counter:'stone',wall:'sage',cup:'sage',light:'morning',objects:'journal',pots:'cream'},
 'Closing time':{...defaultRoom,counter:'walnut',wall:'clay',cup:'ink',light:'evening',objects:'pastry',pitcher:'polished',pots:'sage'}
};
export function validateRoom(value:unknown):RoomConfig{
 const result=structuredClone(defaultRoom);
 if(!value||typeof value!=='object'||(value as {version?:number}).version!==1)return result;
 for(const key of Object.keys(roomCatalog) as (keyof typeof roomCatalog)[]){const v=(value as Record<string,unknown>)[key];if(typeof v==='string'&&Object.hasOwn(roomCatalog[key],v))(result as unknown as Record<string,string|number>)[key]=v;}
 const data=value as Record<string,unknown>;
 if(typeof data.hideJug==='boolean')result.hideJug=data.hideJug;
 if(Array.isArray(data.decorations)){
  const ids=new Set<string>();result.decorations=data.decorations.slice(0,24).flatMap(v=>{
   if(!v||typeof v!=='object')return [];const d=v as PlacedDecoration;
   if(typeof d.id!=='string'||!/^[a-z0-9-]{1,60}$/.test(d.id)||ids.has(d.id)||!decorationKinds.includes(d.kind)||![d.x,d.y,d.rotation].every(Number.isFinite))return [];
   ids.add(d.id);return [{id:d.id,kind:d.kind,x:Math.max(-9,Math.min(9,d.x)),y:Math.max(-2.8,Math.min(1.15,d.y)),rotation:Math.abs(d.rotation)<=Math.PI?d.rotation:Math.atan2(Math.sin(d.rotation),Math.cos(d.rotation))}];
  });
 }
 return result;
}
export function loadRoom(){try{return validateRoom(JSON.parse(localStorage.getItem('little-latte-room-v1')||'null'));}catch{return {...defaultRoom};}}
export function saveRoom(room:RoomConfig){localStorage.setItem('little-latte-room-v1',JSON.stringify(validateRoom(room)));}
