
import { GameMode, UserProfile } from '../types';

export interface NeuroStats {
  memory: number;
  logic: number;
  speed: number;
  focus: number;
  verbal: number;
  archetype: string;
  totalIndex: number;
}

// Map games to cognitive domains
const DOMAIN_MAPPING: Record<string, GameMode[]> = {
  memory: [GameMode.MEMORY, GameMode.N_BACK],
  logic: [GameMode.SEQUENCE, GameMode.PROBLEM, GameMode.PATHFINDING],
  speed: [GameMode.MATH_RUSH, GameMode.TASK_SWITCH],
  focus: [GameMode.COLOR_MATCH, GameMode.VISUAL_SEARCH, GameMode.NAVIGATION],
  verbal: [GameMode.WORD, GameMode.ANAGRAM]
};

// Hypothetical "Max Score" for normalization (to get 0-100 scale)
// Assumes ~1200 is a very high score for a single game mode
const MAX_SCORE_REF = 1200;

export const calculateNeuroStats = (profile: UserProfile | null): NeuroStats => {
  if (!profile || !profile.bestScores) {
    return { memory: 0, logic: 0, speed: 0, focus: 0, verbal: 0, archetype: "UNRANKED", totalIndex: 0 };
  }

  const scores = profile.bestScores;

  const calculateDomainScore = (modes: GameMode[]) => {
    let total = 0;
    let count = 0;
    modes.forEach(mode => {
      // Check for scores in different difficulties if recorded, 
      // but simplistic approach: check keys like "GAME_DIFFICULTY"
      // We'll iterate all keys in bestScores and match the GameMode
      Object.keys(scores).forEach(key => {
        if (key.startsWith(mode)) {
          total += scores[key];
          count++;
        }
      });
    });
    
    // Normalize: If played multiple difficulties, average them, then normalize to 100
    const rawAverage = count > 0 ? total / count : 0;
    return Math.min(100, Math.round((rawAverage / MAX_SCORE_REF) * 100));
  };

  const stats = {
    memory: calculateDomainScore(DOMAIN_MAPPING.memory),
    logic: calculateDomainScore(DOMAIN_MAPPING.logic),
    speed: calculateDomainScore(DOMAIN_MAPPING.speed),
    focus: calculateDomainScore(DOMAIN_MAPPING.focus),
    verbal: calculateDomainScore(DOMAIN_MAPPING.verbal),
  };

  // Determine Archetype
  const values = [
    { k: 'MEMORY', v: stats.memory },
    { k: 'LOGIC', v: stats.logic },
    { k: 'SPEED', v: stats.speed },
    { k: 'FOCUS', v: stats.focus },
    { k: 'VERBAL', v: stats.verbal }
  ];

  // Sort by value descending
  values.sort((a, b) => b.v - a.v);

  let archetype = "NEURAL INITIATE";
  const max = values[0];
  const totalIndex = Math.round((stats.memory + stats.logic + stats.speed + stats.focus + stats.verbal) / 5);

  if (totalIndex === 0) {
      archetype = "CALIBRATING...";
  } else if (values.every(x => Math.abs(x.v - totalIndex) < 15) && totalIndex > 40) {
      archetype = "BALANCED MIND";
  } else {
      switch (max.k) {
          case 'MEMORY': archetype = "HIPPOCAMPUS KEEPER"; break;
          case 'LOGIC': archetype = "LOGIC ARCHITECT"; break;
          case 'SPEED': archetype = "SYNAPTIC RACER"; break;
          case 'FOCUS': archetype = "PRECISION OPERATOR"; break;
          case 'VERBAL': archetype = "LEXICON MASTER"; break;
      }
  }

  return {
    ...stats,
    archetype,
    totalIndex
  };
};
