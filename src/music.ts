export interface Track {
  title: string;
  file?: string;
  artist?: string;
  url?: string;
}

/**
 * Café playlist — add more songs anytime!
 * Drop your .mp3 file into `public/music/` and add an entry below.
 * You can also drag and drop audio files directly onto the radio in your browser!
 */
export const tracks: Track[] = [
  { title: 'Afternoon Rush at Café Veloce', file: 'afternoon-rush-at-cafe-veloce.mp3' },
  { title: 'Raindrop Latte', file: 'raindrop-latte.mp3' },
  { title: 'Rainy Cafe Window', file: 'rainy-cafe-window.mp3' },
  { title: 'After Hours, D Minor', file: 'After Hours, D Minor.mp3' },
  { title: 'After the Lobby Closes', file: 'After the Lobby Closes.mp3' },
  { title: 'Corner Table', file: 'Corner Table.mp3' },
  { title: 'First Light', file: 'First Light.mp3' },
  { title: 'Kyoto 3', file: 'kyoto 3.mp3' },
  { title: 'Lanterns at the Café', file: 'Lanterns at the Café.mp3' },
  { title: 'Midnight Devotion', file: 'Midnight Devotion.mp3' },
  { title: 'Rain on the Window', file: 'Rain on the Window.mp3' },
  { title: 'Slow Sunday', file: 'Slow Sunday.mp3' },
  { title: 'Stolen Glances', file: 'Stolen Glances.mp3' },
  { title: 'Tokyo Café Shuffle', file: 'Tokyo Café Shuffle.mp3' },
  { title: 'Two Sugars, One Secret', file: 'Two Sugars, One Secret.mp3' },
  { title: '雨の窓辺 (Ame no Madobe)', file: '雨の窓辺 (Ame no Madobe).mp3' },
];

export const musicControls = `
<aside class="cafe-radio" id="cafeRadio" aria-label="Café radio player">
  <div class="radio-header">
    <div class="radio-brand">
      <span class="radio-icon" aria-hidden="true">📻</span>
      <span class="radio-title">CAFÉ RADIO</span>
      <div class="radio-eq" id="radioEq" aria-hidden="true" title="Equalizer visualizer">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
    <div class="radio-header-actions">
      <button id="radioShuffleBtn" class="radio-btn-header" title="True Randomize: pick a random track" aria-label="True Randomize">
        <span class="shuffle-icon" aria-hidden="true">🔀</span> <span class="shuffle-label">Random</span>
      </button>
      <button id="radioMiniPlayBtn" class="radio-btn-header radio-mini-play" title="Play or pause" aria-label="Play or pause" style="display:none">▶</button>
      <button id="radioCollapseBtn" class="radio-btn-header radio-collapse-btn" title="Minimize or expand radio" aria-label="Toggle radio view">▾</button>
    </div>
  </div>

  <div class="radio-display">
    <div class="radio-track-info">
      <div class="radio-track-title" id="radioTrackTitle" title="Click to choose a specific track">Afternoon Rush at Café Veloce</div>
      <div class="radio-track-sub" id="radioTrackSub">
        <span id="radioStatus">Press play for music</span> · <span id="radioIndex">Track 1 of ${tracks.length}</span>
      </div>
    </div>
    <select id="radioTrackSelect" class="radio-track-select" aria-label="Select coffee music track">
      ${tracks.map((t, i) => `<option value="${i}">${t.title}</option>`).join('')}
    </select>
  </div>

  <div class="radio-controls" id="radioControls">
    <div class="radio-playback">
      <button id="radioPrevBtn" class="radio-btn" title="Previous track (or rewind)" aria-label="Previous track">⏮</button>
      <button id="radioPlayBtn" class="radio-btn radio-play-btn" title="Play café music" aria-label="Play">▶</button>
      <button id="radioStopBtn" class="radio-btn radio-stop-btn" title="Stop music (reset to beginning)" aria-label="Stop">⏹</button>
      <button id="radioNextBtn" class="radio-btn" title="Next track" aria-label="Next track">⏭</button>
    </div>

    <div class="radio-volume-wrap">
      <button id="radioMuteBtn" class="radio-mute-btn" title="Mute / unmute" aria-label="Toggle mute">🔊</button>
      <input id="radioVolume" class="radio-volume-slider" type="range" min="0" max="1" step="0.01" value="0.35" aria-label="Music volume">
    </div>
  </div>

  <audio id="cafeAudio" preload="none" aria-label="Café music audio"></audio>
</aside>
`;

export function setupMusic() {
  const radioEl = document.getElementById('cafeRadio');
  const playerEl = document.getElementById('cafeAudio');
  if (!(radioEl instanceof HTMLElement) || !(playerEl instanceof HTMLAudioElement)) return;
  const radio = radioEl;
  const player = playerEl;

  const trackTitle = document.getElementById('radioTrackTitle')!;
  const trackStatus = document.getElementById('radioStatus')!;
  const trackIndex = document.getElementById('radioIndex')!;
  const trackSelect = document.getElementById('radioTrackSelect') as HTMLSelectElement;
  const playBtn = document.getElementById('radioPlayBtn') as HTMLButtonElement;
  const miniPlayBtn = document.getElementById('radioMiniPlayBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('radioStopBtn') as HTMLButtonElement;
  const prevBtn = document.getElementById('radioPrevBtn') as HTMLButtonElement;
  const nextBtn = document.getElementById('radioNextBtn') as HTMLButtonElement;
  const shuffleBtn = document.getElementById('radioShuffleBtn') as HTMLButtonElement;
  const collapseBtn = document.getElementById('radioCollapseBtn') as HTMLButtonElement;
  const volumeSlider = document.getElementById('radioVolume') as HTMLInputElement;
  const muteBtn = document.getElementById('radioMuteBtn') as HTMLButtonElement;

  let currentIndex = 0;
  let shuffleMode = true;
  let isCollapsed = matchMedia('(max-width:649px), (max-height:500px)').matches;
  let previousVolume = 0.35;
  let temporaryMessageTimer: ReturnType<typeof setTimeout> | null = null;

  // Restore saved preferences
  try {
    const saved = JSON.parse(localStorage.getItem('little-latte-music') || 'null');
    if (saved) {
      if (Number.isInteger(saved.track) && saved.track >= 0 && saved.track < tracks.length) {
        currentIndex = saved.track;
      }
      if (typeof saved.volume === 'number' && Number.isFinite(saved.volume) && saved.volume >= 0 && saved.volume <= 1) {
        player.volume = saved.volume;
        previousVolume = saved.volume || 0.35;
      }
      if (typeof saved.shuffle === 'boolean') {
        shuffleMode = saved.shuffle;
      }
      if (typeof saved.collapsed === 'boolean' && !matchMedia('(max-width:649px), (max-height:500px)').matches) {
        isCollapsed = saved.collapsed;
      }
    }
  } catch {
    /* Optional preferences */
  }

  volumeSlider.value = String(player.volume);

  function savePreferences() {
    try {
      localStorage.setItem('little-latte-music', JSON.stringify({
        track: currentIndex,
        volume: player.volume,
        shuffle: shuffleMode,
        collapsed: isCollapsed,
      }));
    } catch {
      /* Optional storage */
    }
  }

  function getTrackUrl(track: Track): string {
    if (track.url) return track.url;
    return `${import.meta.env.BASE_URL}music/${encodeURI(track.file || '')}`;
  }

  function rebuildTrackSelect() {
    trackSelect.innerHTML = tracks.map((t, i) => `<option value="${i}">${t.title}</option>`).join('');
    trackSelect.value = String(currentIndex);
  }

  function updateVolumeUI() {
    volumeSlider.value = String(player.volume);
    if (player.volume === 0) {
      muteBtn.textContent = '🔇';
      muteBtn.setAttribute('title', 'Unmute');
    } else if (player.volume < 0.5) {
      muteBtn.textContent = '🔉';
      muteBtn.setAttribute('title', 'Mute');
    } else {
      muteBtn.textContent = '🔊';
      muteBtn.setAttribute('title', 'Mute');
    }
  }

  function showStatus(text: string, durationMs = 0) {
    if (temporaryMessageTimer) clearTimeout(temporaryMessageTimer);
    trackStatus.textContent = text;
    if (durationMs > 0) {
      temporaryMessageTimer = setTimeout(() => {
        const isPlaying = !player.paused && !player.ended;
        trackStatus.textContent = isPlaying ? 'Playing' : (player.currentTime === 0 ? 'Ready to play' : 'Paused');
      }, durationMs);
    }
  }

  function updateUI() {
    const track = tracks[currentIndex];
    trackTitle.textContent = track ? track.title : 'No track selected';
    trackTitle.setAttribute('title', track ? `${track.title}${track.artist ? ` · ${track.artist}` : ''} (Click to change)` : '');
    trackIndex.textContent = `Track ${currentIndex + 1} of ${tracks.length}`;
    trackSelect.value = String(currentIndex);

    const isPlaying = !player.paused && !player.ended;
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    playBtn.setAttribute('title', isPlaying ? 'Pause café music' : 'Play café music');
    miniPlayBtn.textContent = isPlaying ? '⏸' : '▶';

    radio.classList.toggle('playing', isPlaying);
    radio.classList.toggle('paused', !isPlaying && player.currentTime > 0);
    radio.classList.toggle('stopped', !isPlaying && player.currentTime === 0);
    shuffleBtn.classList.toggle('active', shuffleMode);

    updateVolumeUI();
  }

  function applyCollapseState() {
    radio.classList.toggle('collapsed', isCollapsed);
    collapseBtn.textContent = isCollapsed ? '▴' : '▾';
    collapseBtn.setAttribute('title', isCollapsed ? 'Expand radio' : 'Minimize radio');
    miniPlayBtn.style.display = isCollapsed ? 'inline-flex' : 'none';
  }

  function loadTrack(index: number) {
    currentIndex = (index + tracks.length) % tracks.length;
    const track = tracks[currentIndex];
    player.src = getTrackUrl(track);
    savePreferences();
    updateUI();
  }

  function playCurrent() {
    updateUI();
    player.play().catch(() => {
      showStatus('Click ▶ to start audio');
      updateUI();
    });
  }

  // True Randomize function
  function randomizeTrack() {
    if (tracks.length <= 1) {
      loadTrack(0);
      playCurrent();
      showStatus('🔀 Shuffled track', 2500);
      return;
    }
    // Pick a truly random track different from the current one
    let nextIdx = currentIndex;
    while (nextIdx === currentIndex) {
      nextIdx = Math.floor(Math.random() * tracks.length);
    }
    shuffleMode = true;
    loadTrack(nextIdx);
    playCurrent();
    showStatus(`🔀 ${tracks[nextIdx].title}`, 3000);
  }

  function playNext() {
    if (shuffleMode && tracks.length > 1) {
      randomizeTrack();
    } else {
      loadTrack((currentIndex + 1) % tracks.length);
      playCurrent();
    }
  }

  function playPrev() {
    if (player.currentTime > 3) {
      player.currentTime = 0;
      playCurrent();
      showStatus('Restarted track', 2000);
    } else if (shuffleMode && tracks.length > 1) {
      randomizeTrack();
    } else {
      loadTrack((currentIndex - 1 + tracks.length) % tracks.length);
      playCurrent();
    }
  }

  // Initial load
  rebuildTrackSelect();
  loadTrack(currentIndex);
  applyCollapseState();
  updateUI();

  // Play / Pause
  playBtn.onclick = () => {
    if (player.paused) {
      playCurrent();
    } else {
      player.pause();
    }
  };

  miniPlayBtn.onclick = (e) => {
    e.stopPropagation();
    if (player.paused) {
      playCurrent();
    } else {
      player.pause();
    }
  };

  // Stop button (pause and reset to start)
  stopBtn.onclick = () => {
    player.pause();
    player.currentTime = 0;
    showStatus('Stopped', 2500);
    updateUI();
  };

  prevBtn.onclick = playPrev;
  nextBtn.onclick = playNext;

  // True randomize button
  shuffleBtn.onclick = () => {
    randomizeTrack();
  };

  // Track select change
  trackSelect.onchange = () => {
    const selected = Number(trackSelect.value);
    if (!Number.isNaN(selected) && selected >= 0 && selected < tracks.length) {
      loadTrack(selected);
      playCurrent();
    }
  };

  // Volume slider
  volumeSlider.oninput = () => {
    const val = Number(volumeSlider.value);
    player.volume = val;
    if (val > 0) previousVolume = val;
    updateVolumeUI();
    savePreferences();
  };

  // Mute / Unmute toggle
  muteBtn.onclick = () => {
    if (player.volume > 0) {
      previousVolume = player.volume;
      player.volume = 0;
    } else {
      player.volume = previousVolume > 0 ? previousVolume : 0.35;
    }
    updateVolumeUI();
    savePreferences();
  };

  // Collapse / Expand toggle
  collapseBtn.onclick = (e) => {
    e.stopPropagation();
    isCollapsed = !isCollapsed;
    applyCollapseState();
    savePreferences();
  };

  // Audio element events
  player.addEventListener('playing', () => {
    showStatus('Playing');
    updateUI();
  });

  player.addEventListener('pause', () => {
    if (!player.ended && player.currentTime > 0) {
      showStatus('Paused');
    }
    updateUI();
  });

  player.addEventListener('ended', () => {
    playNext();
  });

  player.addEventListener('error', () => {
    showStatus('Track error · trying next', 3000);
    setTimeout(() => {
      playNext();
    }, 1500);
  });

  // Drag-and-drop audio files onto the radio to easily drop in songs!
  radio.addEventListener('dragover', (e) => {
    e.preventDefault();
    radio.classList.add('drag-over');
  });

  radio.addEventListener('dragleave', () => {
    radio.classList.remove('drag-over');
  });

  radio.addEventListener('drop', (e) => {
    e.preventDefault();
    radio.classList.remove('drag-over');
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;

    let addedCount = 0;
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
        const url = URL.createObjectURL(file);
        const title = file.name.replace(/\.[^/.]+$/, '');
        tracks.push({
          title,
          url,
          artist: 'Dropped in',
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      rebuildTrackSelect();
      loadTrack(tracks.length - 1);
      playCurrent();
      showStatus(`Added ${addedCount} song${addedCount > 1 ? 's' : ''}!`, 3000);
    }
  });
}
