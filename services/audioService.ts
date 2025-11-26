
let audioCtx: AudioContext | null = null;
let sfxVolume = 0.5;
let musicVolume = 0.3;
let isMuted = false;
let previousMusicVol = 0.3;

let musicNodes: AudioNode[] = [];
let ambientNodes: AudioNode[] = [];
let nextNoteTime = 0;
let timerID: number | null = null;
let currentMood: 'MENU' | 'FOCUS' | 'MEMORY' | 'PLAYFUL' | 'SWITCH' = 'MENU';
let isPlaying = false;

// Pentatonic Scale (C Major) for "Ascending Success"
// C4, D4, E4, G4, A4, C5, D5, E5...
const COMBO_SCALE = [
  261.63, 293.66, 329.63, 392.00, 440.00, 
  523.25, 587.33, 659.25, 783.99, 880.00,
  1046.50, 1174.66
];

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

// Explicitly resume audio context
export const resumeAudio = async () => {
  const ctx = initAudio();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
      startAmbientHum(); // Start drone when audio context wakes up
    } catch (e) {
      console.error("Audio resume failed:", e);
    }
  }
  return ctx;
};

export const setSfxVolume = (vol: number) => {
  sfxVolume = Math.max(0, Math.min(1, vol));
};

export const setMusicVolume = (vol: number) => {
  musicVolume = Math.max(0, Math.min(1, vol));
  if (musicVolume > 0) isMuted = false;
  // Update ambient volume dynamically
  if (ambientNodes.length > 0 && audioCtx) {
     const gainNode = ambientNodes[1] as GainNode;
     if(gainNode) gainNode.gain.setTargetAtTime(isMuted ? 0 : 0.05, audioCtx.currentTime, 0.5);
  }
};

export const toggleMute = () => {
  if (isMuted) {
    musicVolume = previousMusicVol > 0 ? previousMusicVol : 0.3;
    isMuted = false;
  } else {
    previousMusicVol = musicVolume;
    musicVolume = 0;
    isMuted = true;
  }
  // Update ambient immediately
  if (ambientNodes.length > 0 && audioCtx) {
      const gainNode = ambientNodes[1] as GainNode;
      if(gainNode) gainNode.gain.setTargetAtTime(isMuted ? 0 : 0.05, audioCtx.currentTime, 0.1);
  }
  return isMuted;
};

export const getIsMuted = () => isMuted;
export const getSfxVolume = () => sfxVolume;
export const getMusicVolume = () => musicVolume;

// --- AMBIENT IMMERSION (Neural Hum) ---
// Uses Brown Noise + LowPass Filter to create a "Server Room" or "Spaceship" drone
const startAmbientHum = () => {
  if (!audioCtx || ambientNodes.length > 0) return;
  
  // Create Brown Noise Buffer
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; 
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 120; // Deep hum

  const gain = audioCtx.createGain();
  gain.gain.value = isMuted ? 0 : 0.05; // Very subtle

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();

  ambientNodes = [noise, gain, filter];
};

// --- 8-BIT SYNTH ENGINE ---

// Noise buffer for percussion/explosions
let noiseBuffer: AudioBuffer | null = null;
const createNoiseBuffer = (ctx: AudioContext) => {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 2; 
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
};

const playOscillator = (freq: number, startTime: number, duration: number, type: OscillatorType, volMultiplier: number, slideTo?: number) => {
  if (!audioCtx || musicVolume <= 0 || freq <= 0) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, startTime + duration);
  }

  // ADSR Envelope
  const attack = 0.02;
  const decay = 0.1;
  const sustain = 0.3;
  const release = 0.05;
  const effectiveDuration = Math.max(duration, attack + decay + release);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(musicVolume * volMultiplier, startTime + attack);
  gain.gain.linearRampToValueAtTime(musicVolume * volMultiplier * sustain, startTime + attack + decay);
  gain.gain.setValueAtTime(musicVolume * volMultiplier * sustain, startTime + effectiveDuration - release);
  gain.gain.linearRampToValueAtTime(0, startTime + effectiveDuration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(startTime);
  osc.stop(startTime + effectiveDuration);

  musicNodes.push(osc);
  musicNodes.push(gain);

  setTimeout(() => {
    try { osc.disconnect(); gain.disconnect(); } catch (e) {}
    const idx = musicNodes.indexOf(osc);
    if (idx > -1) musicNodes.splice(idx, 1);
  }, (effectiveDuration + 1) * 1000);
};

// --- MUSIC PATTERNS ---
const N = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, C6: 1046.50,
  X: 0
};

let step = 0;
const SIXTEENTH_NOTE_TIME = 0.12; 

const scheduler = () => {
  if (!audioCtx) return;
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
      const menuArp = [N.C3, N.G3, N.C4, N.E4, N.G4, N.E4, N.C4, N.G3];
      bassFreq = menuArp[beat16 % 8];
      if (beat16 === 0) melodyFreq = N.C5;
      if (beat16 === 4) melodyFreq = N.G4;
      if (beat16 === 12) melodyFreq = N.C5;
      playOscillator(bassFreq, time, 0.1, 'triangle', 0.6); 
      if (melodyFreq) playOscillator(melodyFreq, time, 0.2, 'square', 0.3); 
      break;

    case 'FOCUS':
      if (beat16 % 2 === 0) bassFreq = N.A3; else bassFreq = N.A3 / 2;
      if (beat16 % 4 === 0) melodyFreq = N.C5;
      if (beat16 % 4 === 2) melodyFreq = N.A4;
      playOscillator(bassFreq, time, 0.1, 'sawtooth', 0.4);
      if (melodyFreq) playOscillator(melodyFreq, time, 0.1, 'square', 0.3);
      break;

    case 'PLAYFUL':
      bassFreq = (beat16 % 4 === 0) ? N.C3 : (beat16 % 4 === 2 ? N.G3 : 0);
      const playMelody = [N.E4, N.G4, N.C5, N.X, N.G4, N.C5, N.E5, N.X];
      melodyFreq = playMelody[beat16 % 8];
      if (bassFreq) playOscillator(bassFreq, time, 0.1, 'square', 0.5);
      if (melodyFreq) playOscillator(melodyFreq, time, 0.1, 'sine', 0.4);
      break;

    case 'MEMORY':
      if (beat16 % 8 === 0) bassFreq = N.D3;
      if (beat16 % 8 === 4) bassFreq = N.A3;
      if (Math.random() > 0.7) melodyFreq = [N.D5, N.F5, N.A5][Math.floor(Math.random()*3)];
      if (bassFreq) playOscillator(bassFreq, time, 0.4, 'sine', 0.6);
      if (melodyFreq) playOscillator(melodyFreq, time, 0.2, 'triangle', 0.3);
      break;
      
    case 'SWITCH':
        bassFreq = N.C3;
        if (beat16 % 2 !== 0) bassFreq = N.F3;
        playOscillator(bassFreq, time, 0.05, 'sawtooth', 0.4);
        break;
  }
};

export const startMusic = async (mood: typeof currentMood) => {
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
};

// --- SFX ENGINE ---

// 1. Dynamic Pitch Combo System (Ascending Gratification)
export const playCombo = async (streak: number) => {
    if (sfxVolume <= 0) return;
    const ctx = initAudio();
    if (!ctx) return;

    // Pick a note from the Pentatonic Scale based on streak
    // Loops back but an octave higher (simulated by clamping for now)
    const noteIndex = Math.min(streak, COMBO_SCALE.length - 1);
    const freq = COMBO_SCALE[noteIndex];

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = streak > 5 ? 'triangle' : 'sine'; // Timbre gets brighter with streak
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.1); // Slight pitch bend up for "Success" feel

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2 * sfxVolume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
};

// 2. Micro-interaction (Hover)
export const playHover = async () => {
    if (sfxVolume <= 0 || !audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Very short, high blip
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.02);
    
    gain.gain.setValueAtTime(0.02 * sfxVolume, now); // Very quiet
    gain.gain.linearRampToValueAtTime(0, now + 0.03);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
};

export const playSound = async (type: 'click' | 'correct' | 'wrong' | 'pop' | 'win' | 'switch') => {
  if (sfxVolume <= 0) return;
  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);

  switch (type) {
    case 'click':
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
      gain.gain.setValueAtTime(0.1 * sfxVolume, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case 'correct':
      // Legacy "correct" - kept for achievement unlocks, general use
      osc.type = 'square';
      osc.frequency.setValueAtTime(987, now);
      gain.gain.setValueAtTime(0.1 * sfxVolume, now);
      gain.gain.setValueAtTime(0.1 * sfxVolume, now + 0.08);
      setTimeout(() => {
          if(ctx.state === 'closed') return;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'square';
          osc2.frequency.setValueAtTime(1318, ctx.currentTime);
          gain2.gain.setValueAtTime(0.1 * sfxVolume, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.4);
      }, 80);
      osc.start(now);
      osc.stop(now + 0.08);
      break;

    case 'wrong':
      // Dissonant low buzz
      const noise = createNoiseBuffer(ctx);
      const source = ctx.createBufferSource();
      source.buffer = noise;
      const noiseGain = ctx.createGain();
      source.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(0.3 * sfxVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      source.start(now);
      source.stop(now + 0.3);
      
      // Add a descending slide
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.2 * sfxVolume, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'pop':
      // Basic fallback
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.2 * sfxVolume, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;

    case 'win':
      const notes = [523.25, 659.25, 783.99, 1046.50]; 
      notes.forEach((freq, i) => {
          const oscW = ctx.createOscillator();
          const gainW = ctx.createGain();
          oscW.type = 'square';
          oscW.frequency.value = freq;
          oscW.connect(gainW);
          gainW.connect(ctx.destination);
          const t = now + i * 0.1;
          gainW.gain.setValueAtTime(0.1 * sfxVolume, t);
          gainW.gain.linearRampToValueAtTime(0, t + 0.4); 
          oscW.start(t);
          oscW.stop(t + 0.4);
      });
      break;

    case 'switch':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.1 * sfxVolume, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
  }
};
