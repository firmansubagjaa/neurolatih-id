
import React, { useState, useEffect } from 'react';
import { GameMode, Language } from '../types';
import { Button } from './Shared';
import { Play } from 'lucide-react';

interface GameIntroProps {
  gameMode: GameMode;
  onStart: () => void;
  language?: Language;
}

const FACTS: Record<string, string[]> = {
  [GameMode.SEQUENCE]: [
    "LOGIC PROCESSOR: PATTERN RECOGNITION",
    "ACTIVATING FRONTAL LOBE...",
    "DETECT NUMBER SEQUENCES.",
    "VELOCITY IS KEY."
  ],
  [GameMode.PROBLEM]: [
    "LATERAL THINKING REQUIRED.",
    "ANALYZE DATA. FIND SOLUTION.",
    "IGNORE OBVIOUS PATHS.",
    "CRITICAL THINKING: ACTIVE."
  ],
  [GameMode.WORD]: [
    "SEMANTIC DATABASE: LOADING...",
    "LINK ABSTRACT CONCEPTS.",
    "VERBAL FLUENCY TEST INITIATED.",
    "FIND THE CONNECTION."
  ],
  [GameMode.MEMORY]: [
    "VISUAL BUFFER: FLUSHING...",
    "MAXIMIZE WORKING MEMORY.",
    "USE CHUNKING STRATEGIES.",
    "MAINTAIN PATTERN INTEGRITY."
  ],
  [GameMode.N_BACK]: [
    "WORKING MEMORY UPDATE REQUIRED.",
    "TRACK PAST STIMULI.",
    "FILTER INTERFERENCE.",
    "FLUID INTELLIGENCE: ACTIVE."
  ],
  [GameMode.COLOR_MATCH]: [
    "INHIBITION CONTROL: ONLINE.",
    "SUPPRESS AUTOMATIC READING.",
    "FOCUS ON COLOR PERCEPTION.",
    "STROOP EFFECT DETECTED."
  ],
  [GameMode.MATH_RUSH]: [
    "ARITHMETIC PROCESSOR: OVERCLOCKING...",
    "CALCULATE AT MAX SPEED.",
    "MAINTAIN ACCURACY UNDER PRESSURE.",
    "NEURAL SYNAPSES FIRING."
  ],
  [GameMode.ANAGRAM]: [
    "LINGUISTIC DECRYPTION: STARTED.",
    "REARRANGE CHARACTERS.",
    "ACCESS VOCABULARY BANK.",
    "VERBAL PROCESSING SPEED."
  ],
  [GameMode.VISUAL_SEARCH]: [
    "SCAN VISUAL CORTEX: INITIATED.",
    "ISOLATE ANOMALIES.",
    "SCANNING GRID SECTORS...",
    "SELECTIVE ATTENTION TEST."
  ],
  [GameMode.NAVIGATION]: [
    "SPATIAL ORIENTATION: CALIBRATING...",
    "MAPPING VIRTUAL COORDINATES.",
    "UPDATE DIRECTION VECTORS.",
    "VISUOSPATIAL SKETCHPAD ACTIVE."
  ],
  [GameMode.TASK_SWITCH]: [
    "MULTITASKING PROTOCOL: STARTED.",
    "COGNITIVE FLEXIBILITY REQUIRED.",
    "ADAPT TO RULE CHANGES.",
    "AVOID PERSEVERATION ERRORS."
  ],
  [GameMode.PATHFINDING]: [
    "PATH PLANNING SIMULATION.",
    "VISUALIZE ROUTE IN MEMORY.",
    "AVOID SPATIAL OBSTACLES.",
    "EXECUTE MOTION ALGORITHM."
  ]
};

export const GameIntro: React.FC<GameIntroProps> = ({ gameMode, onStart, language = 'ID' }) => {
  const [countdown, setCountdown] = useState(3);
  const [fact, setFact] = useState("");

  useEffect(() => {
    // Simplified facts for now, defaulting to EN logic/ID keys if simple
    const modeFacts = FACTS[gameMode] || FACTS[GameMode.PROBLEM];
    setFact(modeFacts[Math.floor(Math.random() * modeFacts.length)]);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
      <div className="w-full max-w-md bg-black border-4 border-retro-green p-1 shadow-[0_0_20px_rgba(74,222,128,0.3)]">
        <div className="border-2 border-dashed border-slate-700 p-8 flex flex-col items-center text-center relative overflow-hidden">
            
            {/* Scanline overlay inside card */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>

            <h2 className="text-xl md:text-3xl font-pixel text-white mb-6 uppercase animate-pulse">
                {language === 'ID' ? 'MISSION BRIEF' : 'MISSION BRIEF'}
            </h2>

            <div className="w-full bg-slate-900 border border-slate-600 p-6 mb-8 font-mono text-retro-green min-h-[120px] flex items-center justify-center shadow-inner">
                <p className="typing-effect text-sm md:text-lg leading-relaxed">
                  {">"} {fact}<span className="animate-blink block w-3 h-5 bg-retro-green mx-auto mt-2"></span>
                </p>
            </div>

            <div className="mb-2 w-full">
                {countdown > 0 ? (
                    <div className="text-8xl font-pixel text-retro-yellow animate-ping opacity-80">
                        {countdown}
                    </div>
                ) : (
                    <Button onClick={onStart} className="w-full py-4 text-xl md:text-2xl bg-retro-red border-white hover:bg-white hover:text-retro-red animate-pulse">
                        START <Play className="w-6 h-6 ml-2 fill-current" />
                    </Button>
                )}
            </div>
            
            {countdown > 0 && <div className="text-xs font-mono text-slate-500 mt-8">INITIALIZING NEURAL LINK...</div>}
        </div>
      </div>
    </div>
  );
};
