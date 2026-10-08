export const roomCatalog={
 counter:{oak:{label:'Honey oak',color:'#bb9664'},walnut:{label:'Dark walnut',color:'#70503d'},stone:{label:'Pale stone',color:'#d4cdbb'}},
 wall:{cream:{label:'Warm cream',color:'#e0d4bd'},sage:{label:'Muted sage',color:'#99aa92'},clay:{label:'Dusty clay',color:'#c69d88'}},
 cup:{ivory:{label:'Oat glaze',color:'#f3e7d3'},sage:{label:'Sage glaze',color:'#91a892'},ink:{label:'Midnight glaze',color:'#344951'}},
 pitcher:{brushed:{label:'Brushed steel',color:'#becbcf'},polished:{label:'Polished steel',color:'#e4e8e9'},coated:{label:'Cream enamel',color:'#dfd5c1'}},
 plants:{all:{label:'Leafy corner',color:'#537354'},window:{label:'Window garden',color:'#74926c'},shelf:{label:'Trailing shelf',color:'#8eaa73'}},
 pots:{clay:{label:'Terracotta',color:'#b87859'},cream:{label:'Chalk pottery',color:'#dcd0b8'},sage:{label:'Sage pottery',color:'#7b917b'}},
 objects:{journal:{label:'Slow morning',color:'#667866'},linen:{label:'Linen & coffee',color:'#d4c4a6'},pastry:{label:'A little treat',color:'#bb8a4e'}},
 light:{morning:{label:'Soft morning',color:'#dce7e3'},afternoon:{label:'Golden afternoon',color:'#eed2a0'},evening:{label:'Warm evening',color:'#c88b5c'}}
} as const;
export type RoomConfig={version:1;counter:keyof typeof roomCatalog.counter;wall:keyof typeof roomCatalog.wall;cup:keyof typeof roomCatalog.cup;pitcher:keyof typeof roomCatalog.pitcher;plants:keyof typeof roomCatalog.plants;pots:keyof typeof roomCatalog.pots;objects:keyof typeof roomCatalog.objects;light:keyof typeof roomCatalog.light};
export const defaultRoom:RoomConfig={version:1,counter:'oak',wall:'cream',cup:'ivory',pitcher:'brushed',plants:'all',pots:'clay',objects:'linen',light:'afternoon'};
export const roomPresets:Record<string,RoomConfig>={
 'Window seat':{...defaultRoom},
 'Quiet morning':{...defaultRoom,counter:'stone',wall:'sage',cup:'sage',light:'morning',objects:'journal',pots:'cream'},
 'Closing time':{...defaultRoom,counter:'walnut',wall:'clay',cup:'ink',light:'evening',objects:'pastry',pitcher:'polished',pots:'sage'}
};
export function validateRoom(value:unknown):RoomConfig{
 const result={...defaultRoom};
 if(!value||typeof value!=='object'||(value as {version?:number}).version!==1)return result;
 for(const key of Object.keys(roomCatalog) as (keyof typeof roomCatalog)[]){const v=(value as Record<string,unknown>)[key];if(typeof v==='string'&&Object.hasOwn(roomCatalog[key],v))(result as unknown as Record<string,string|number>)[key]=v;}
 return result;
}
export function loadRoom(){try{return validateRoom(JSON.parse(localStorage.getItem('little-latte-room-v1')||'null'));}catch{return {...defaultRoom};}}
export function saveRoom(room:RoomConfig){localStorage.setItem('little-latte-room-v1',JSON.stringify(validateRoom(room)));}
