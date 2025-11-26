
import React, { useState, useEffect } from 'react';
import { GameMode, Language } from '../types';
import { Button } from './ui/Button';
import { Play } from 'lucide-react';

interface GameIntroProps {
  gameMode: GameMode;
  onStart: () => void;
  language?: Language;
}

const FACTS: Record<string, string[]> = {
  [GameMode.SEQUENCE]: ["LOGIC PROCESSOR: PATTERN RECOGNITION.", "SCANNING FOR NUMERICAL ANOMALIES...", "OBJECTIVE: PREDICT NEXT SEQUENCE."],
  [GameMode.PROBLEM]: ["LATERAL THINKING MODULE: ENGAGED.", "WARNING: STANDARD LOGIC MAY FAIL.", "OBJECTIVE: THINK OUTSIDE THE BOX."],
  [GameMode.WORD]: ["SEMANTIC DATABASE: INDEXING...", "ESTABLISHING NEURAL ASSOCIATIONS.", "OBJECTIVE: LINK CONCEPTS."],
  [GameMode.MEMORY]: ["VISUAL BUFFER: FLUSHING...", "ENCODING SPATIAL COORDINATES.", "OBJECTIVE: RETAIN PATTERN INTEGRITY."],
  [GameMode.N_BACK]: ["WORKING MEMORY: UPDATING...", "TRACKING TEMPORAL DATA STREAMS.", "OBJECTIVE: FILTER INTERFERENCE."],
  [GameMode.COLOR_MATCH]: ["INHIBITORY CONTROL: ONLINE.", "SUPPRESSING LEXICAL REFLEXES...", "OBJECTIVE: IDENTIFY CHROMATIC DATA."],
  [GameMode.MATH_RUSH]: ["ARITHMETIC PROCESSOR: OVERCLOCKING...", "CALCULATING TRAJECTORIES...", "OBJECTIVE: SPEED CALCULATION."],
  [GameMode.ANAGRAM]: ["LINGUISTIC DECRYPTION: STARTED.", "REARRANGING CHARACTER STRINGS...", "OBJECTIVE: DECODE HIDDEN LEXICONS."],
  [GameMode.VISUAL_SEARCH]: ["VISUAL CORTEX SCANNER: INITIATED.", "FILTERING VISUAL NOISE...", "OBJECTIVE: ISOLATE TARGET ANOMALY."],
  [GameMode.NAVIGATION]: ["SPATIAL ORIENTATION: CALIBRATING...", "MAPPING VIRTUAL COORDINATES.", "OBJECTIVE: UPDATE HEADING."],
  [GameMode.TASK_SWITCH]: ["MULTITASKING PROTOCOL: STARTED.", "RULESET VOLATILITY: HIGH.", "OBJECTIVE: ADAPT TO RULE CHANGES."],
  [GameMode.PATHFINDING]: ["PATH PLANNING SIMULATION.", "COMPUTING OPTIMAL ROUTE...", "OBJECTIVE: NAVIGATE OBSTACLES."]
};

export const GameIntro: React.FC<GameIntroProps> = ({ gameMode, onStart, language = 'ID' }) => {
  const [countdown, setCountdown] = useState(3);
  const [fact, setFact] = useState("");

  useEffect(() => {
    const modeFacts = FACTS[gameMode] || FACTS[GameMode.PROBLEM];
    setFact(modeFacts[Math.floor(Math.random() * modeFacts.length)]);
    const timer = setInterval(() => setCountdown(p => p <= 1 ? 0 : p - 1), 1000);
    return () => clearInterval(timer);
  }, [gameMode]);

  if (countdown === 0) {
      // Auto-start or show button? Let's show button for visceral "Engagement"
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-black border-4 border-retro-green p-1 shadow-[0_0_50px_rgba(74,222,128,0.2)]">
        <div className="border-2 border-dashed border-slate-700 p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>

            <h2 className="text-2xl md:text-3xl font-pixel text-white mb-6 uppercase animate-pulse tracking-widest text-shadow-retro">
                MISSION BRIEF
            </h2>

            <div className="w-full bg-slate-900 border-l-4 border-retro-green p-6 mb-8 font-mono text-retro-green min-h-[120px] flex items-center justify-center shadow-inner relative">
                <p className="typing-effect text-sm md:text-lg leading-relaxed">
                  {">"} {fact}<span className="animate-blink inline-block w-2 h-4 bg-retro-green ml-1"></span>
                </p>
            </div>

            <div className="mb-2 w-full min-h-[80px] flex items-center justify-center">
                {countdown > 0 ? (
                    <div className="text-8xl font-pixel text-retro-yellow animate-ping opacity-80">
                        {countdown}
                    </div>
                ) : (
                    <Button onClick={onStart} className="w-full py-4 text-xl md:text-2xl bg-retro-red border-white hover:bg-white hover:text-retro-red animate-pulse-fast">
                        ENGAGE <Play className="w-6 h-6 ml-2 fill-current" />
                    </Button>
                )}
            </div>
            
            {countdown > 0 && <div className="text-xs font-mono text-slate-500 mt-8">INITIALIZING NEURAL LINK...</div>}
        </div>
      </div>
    </div>
  );
};
