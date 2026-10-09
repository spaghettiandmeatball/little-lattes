type Sound='grinder'|'espresso-brew'|'coffee-machine'|'cafe-machine'|'steam-wand'|'milk-frothing';
export function stationSound(){
 const tracks=new Map<Sound,HTMLAudioElement>();let muted=false;
 const get=(name:Sound)=>{let audio=tracks.get(name);if(!audio){audio=new Audio('/sfx/'+name+'.mp3');audio.preload='none';audio.volume=.3;tracks.set(name,audio);}return audio;};
 const stop=()=>{for(const audio of tracks.values()){audio.pause();audio.currentTime=0;}};
 return {stop,mute(value:boolean){muted=value;if(value)stop();},play(name:Sound,loop=true){stop();if(muted)return;const audio=get(name);audio.loop=loop;void audio.play().catch(()=>{/* Browser/device may disable playback. */});},layer(name:Sound){if(muted)return;const audio=get(name);audio.loop=true;audio.volume=.13;void audio.play().catch(()=>{});}};
}
