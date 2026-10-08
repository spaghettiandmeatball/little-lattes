const tracks = [
 {title:'Afternoon Rush at Café Veloce',file:'afternoon-rush-at-cafe-veloce.mp3'},
 {title:'Raindrop Latte',file:'raindrop-latte.mp3'},
 {title:'Rainy Cafe Window',file:'rainy-cafe-window.mp3'},
];

export const musicControls = `<section class="music" aria-label="Café music">
 <label>Music <select id="musicTrack">${tracks.map((track,index)=>`<option value="${index}">${track.title}</option>`).join('')}</select></label>
 <audio id="musicPlayer" controls preload="none" aria-label="Music playback"></audio>
 <small id="musicStatus" role="status">Press play for café music. The three tracks play in order.</small>
</section>`;

export function setupMusic(){
 const select=document.getElementById('musicTrack') as HTMLSelectElement;
 const player=document.getElementById('musicPlayer') as HTMLAudioElement;
 const status=document.getElementById('musicStatus')!;
 player.volume=.35;
 try{
  const saved=JSON.parse(localStorage.getItem('little-latte-music')||'null');
  if(saved&&Number.isInteger(saved.track)&&saved.track>=0&&saved.track<tracks.length)select.value=String(saved.track);
  if(saved&&typeof saved.volume==='number'&&Number.isFinite(saved.volume)&&saved.volume>=0&&saved.volume<=1)player.volume=saved.volume;
 }catch{/* Music preferences are optional. */}
 const remember=()=>{try{localStorage.setItem('little-latte-music',JSON.stringify({track:Number(select.value),volume:player.volume}));}catch{/* Optional storage. */}};
 const load=()=>{player.src=`${import.meta.env.BASE_URL}music/${tracks[Number(select.value)].file}`;};
 const play=()=>{void player.play().catch(()=>{status.textContent='Press play to start the selected track.';});};
 load();
 select.onchange=()=>{
  const wasPlaying=!player.paused;
  load();remember();status.textContent=`Selected: ${tracks[Number(select.value)].title}`;
  if(wasPlaying)play();
 };
 player.addEventListener('playing',()=>{status.textContent=`Playing: ${tracks[Number(select.value)].title}`;});
 player.addEventListener('pause',()=>{if(!player.ended)status.textContent='Music paused. Press play to resume.';});
 player.addEventListener('ended',()=>{select.value=String((Number(select.value)+1)%tracks.length);load();remember();play();});
 player.addEventListener('volumechange',remember);
 player.addEventListener('error',()=>{status.textContent='This track could not load. Try another track.';});
}
