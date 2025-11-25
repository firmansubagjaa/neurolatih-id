
let audioCtx: AudioContext | null = null;
let sfxVolume = 0.5;
let musicVolume = 0.3;
let musicNodes: AudioNode[] = [];
let nextNoteTime = 0;
let timerID: number | null = null;
let currentMood: 'MENU' | 'FOCUS' | 'MEMORY' | 'PLAYFUL' = 'MENU';
let isPlaying = false;

// Initialize Audio Context lazily
export const initAudio = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

// Explicitly resume audio context (Browser Autoplay Policy)
export const resumeAudio = async () => {
  const ctx = initAudio();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (e) {
      console.error("Gagal mengaktifkan audio:", e);
    }
  }
  return ctx;
};

export const setSfxVolume = (vol: number) => {
  sfxVolume = Math.max(0, Math.min(1, vol));
};

export const setMusicVolume = (vol: number) => {
  musicVolume = Math.max(0, Math.min(1, vol));
};

export const getSfxVolume = () => sfxVolume;
export const getMusicVolume = () => musicVolume;

// --- 8-BIT RETRO MUSIC ENGINE (ARCADE STYLE) ---

// Frequencies
const N = {
  // Octave 2
  E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, Ash2: 116.54, B2: 123.47,
  
  // Octave 3
  C3: 130.81, D3: 146.83, Dsh3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Ash3: 233.08, B3: 246.94,
  
  // Octave 4
  C4: 261.63, Csh4: 277.18, D4: 293.66, Dsh4: 311.13, E4: 329.63, F4: 349.23, Fsh4: 369.99, G4: 392.00, Gsh4: 415.30, A4: 440.00, Ash4: 466.16, B4: 493.88,
  
  // Octave 5
  C5: 523.25, D5: 587.33, Dsh5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  
  // Octave 6
  C6: 1046.50, E6: 1318.51,
  
  X: 0 // Rest/Silence
};

// Envelope helper for punchy 8-bit sounds
const playOscillator = (freq: number, startTime: number, duration: number, type: OscillatorType, volMultiplier: number) => {
  if (!audioCtx || musicVolume <= 0 || freq <= 0) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  // Staccato envelope (Short, punchy)
  // Attack: very fast, Decay: slight, Sustain: held, Release: fast
  const attack = 0.01;
  const release = 0.05;
  const hold = duration - attack - release;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(musicVolume * volMultiplier, startTime + attack);
  gain.gain.setValueAtTime(musicVolume * volMultiplier, startTime + attack + hold);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);

  musicNodes.push(osc);
  musicNodes.push(gain);

  // Garbage collection
  setTimeout(() => {
    try { osc.disconnect(); gain.disconnect(); } catch (e) {}
    const idx = musicNodes.indexOf(osc);
    if (idx > -1) musicNodes.splice(idx, 1);
  }, (duration + 1) * 1000);
};

// --- MUSIC PATTERNS ---
let step = 0;
// Higher BPM for energetic feel (approx 150-160 BPM)
const SIXTEENTH_NOTE_TIME = 0.10; 

const scheduler = () => {
  if (!audioCtx) return;

  // Schedule ahead
  while (nextNoteTime < audioCtx.currentTime + 0.15) {
    scheduleStep(step, nextNoteTime);
    step++;
    nextNoteTime += SIXTEENTH_NOTE_TIME;
  }
  
  if (isPlaying) {
    timerID = window.setTimeout(scheduler, 50);
  }
};

const scheduleStep = (currentStep: number, time: number) => {
  const beat16 = currentStep % 16; 
  
  let bassFreq = 0;
  let melodyFreq = 0;

  switch (currentMood) {
    case 'MENU': 
      // Funky Arcade Title (Syncopated Bass)
      // Bass: C - G - Bb - F Pattern
      const menuBass = [N.C3, N.X, N.C3, N.G2,  N.Ash2, N.Ash2, N.F2, N.G2,  N.C3, N.X, N.C3, N.G2, N.F2, N.F2, N.Ash2, N.B2];
      bassFreq = menuBass[beat16] || 0;
      
      // Melody: Catchy Arpeggio
      if (beat16 === 0) melodyFreq = N.C5;
      if (beat16 === 2) melodyFreq = N.G4;
      if (beat16 === 4) melodyFreq = N.Ash4;
      if (beat16 === 6) melodyFreq = N.C5;
      if (beat16 === 12) melodyFreq = N.E5;
      if (beat16 === 14) melodyFreq = N.C5;
      
      playOscillator(bassFreq, time, 0.08, 'square', 0.4); 
      if (melodyFreq) playOscillator(melodyFreq, time, 0.06, 'square', 0.2); 
      break;

    case 'FOCUS':
      // "Hurry Up" style (Logic, Math, Task Switch)
      // Fast walking bass (sawtooth for intensity)
      const focusBass = [N.A2, N.E3, N.A2, N.E3, N.G2, N.D3, N.G2, N.D3,  N.F2, N.C3, N.F2, N.C3, N.E2, N.B2, N.E2, N.B2];
      bassFreq = focusBass[beat16] || 0;

      // Urgent high melody
      if (beat16 % 2 === 0) melodyFreq = N.A4; 
      if (beat16 % 4 === 2) melodyFreq = N.C5;
      if (beat16 % 8 === 6) melodyFreq = N.E5;

      playOscillator(bassFreq, time, 0.09, 'sawtooth', 0.35);
      if (melodyFreq) playOscillator(melodyFreq, time, 0.05, 'square', 0.15);
      break;

    case 'PLAYFUL':
      // "Overworld" style (Word, Color, Anagram)
      // Major scale, bouncy
      // Bass: 1-5-1-5 pattern
      if (beat16 % 4 === 0) bassFreq = N.C3;
      if (beat16 % 4 === 2) bassFreq = N.G2;
      
      // Melody: Happy run
      const playfulMelody = [N.C5, N.G4, N.E4, N.C4,  N.G4, N.C5, N.E5, N.G5,  N.C6, N.X, N.G5, N.X,  N.E5, N.C5, N.G4, N.E4];
      melodyFreq = playfulMelody[beat16] || 0;
      
      playOscillator(bassFreq, time, 0.08, 'triangle', 0.5);
      if (melodyFreq) playOscillator(melodyFreq, time, 0.07, 'square', 0.25);
      break;

    case 'MEMORY':
      // Rhythmic & Mysterious (N-Back, Memory)
      // Bass: Driving 8th notes
      if (beat16 % 2 === 0) bassFreq = N.D3;
      if (beat16 % 8 === 6) bassFreq = N.A2;
      
      // Melody: Question and Answer
      const memoryMelody = [N.D5, N.X, N.A4, N.X,  N.D5, N.X, N.X, N.X,  N.F5, N.X, N.D5, N.X,  N.A5, N.X, N.F5, N.X];
      melodyFreq = memoryMelody[beat16] || 0;

      playOscillator(bassFreq, time, 0.05, 'triangle', 0.4);
      if (melodyFreq) playOscillator(melodyFreq, time, 0.08, 'sine', 0.3);
      break;
  }
};

export const startMusic = async (mood: 'MENU' | 'FOCUS' | 'MEMORY' | 'PLAYFUL') => {
  const ctx = await resumeAudio(); 
  if (!ctx) return;
  
  if (currentMood !== mood || !isPlaying) {
      currentMood = mood;
      if (!isPlaying) {
        step = 0;
        isPlaying = true;
        nextNoteTime = ctx.currentTime + 0.1;
        scheduler();
      }
  }
};

export const stopMusic = () => {
  isPlaying = false;
  if (timerID !== null) {
    clearTimeout(timerID);
    timerID = null;
  }
  musicNodes.forEach(node => {
    try { node.disconnect(); } catch (e) {}
  });
  musicNodes = [];
};

export const playSound = async (type: 'click' | 'correct' | 'wrong' | 'pop' | 'win') => {
  if (sfxVolume <= 0) return;
  
  const ctx = initAudio();
  if (ctx && ctx.state === 'suspended') ctx.resume();
  
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  switch (type) {
    case 'click':
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      gain.gain.setValueAtTime(0.1 * sfxVolume, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case 'correct':
      // Classic 1-Up / Coin sound
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.15 * sfxVolume, now);
      gain.gain.setValueAtTime(0.15 * sfxVolume, now + 0.08);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;

    case 'wrong':
      // Retro damage noise
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.25 * sfxVolume, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'win':
      // Level clear fanfare
      osc.type = 'square';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      osc.frequency.setValueAtTime(1318.51, now + 0.4); // E6
      gain.gain.setValueAtTime(0.2 * sfxVolume, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
      break;
      
    case 'pop':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.2 * sfxVolume, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
  }
  
  setTimeout(() => {
      try { osc.disconnect(); gain.disconnect(); } catch(e) {}
  }, 1000);
};
