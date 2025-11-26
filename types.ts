
export enum GameMode {
  WELCOME = 'WELCOME',
  MENU = 'MENU',
  ABOUT = 'ABOUT', // Scientific Database Screen
  MEMORY = 'MEMORY', // Pattern Recall
  SEQUENCE = 'SEQUENCE', // Logic/Sequences
  PROBLEM = 'PROBLEM', // Riddles/Scenarios
  WORD = 'WORD', // Word Association
  N_BACK = 'N_BACK', // Working Memory
  COLOR_MATCH = 'COLOR_MATCH', // Stroop/Inhibition
  MATH_RUSH = 'MATH_RUSH', // Speed Math (New)
  ANAGRAM = 'ANAGRAM', // Verbal Fluency (New)
  VISUAL_SEARCH = 'VISUAL_SEARCH', // Selective Attention (New)
  NAVIGATION = 'NAVIGATION', // Spatial Orientation (New)
  TASK_SWITCH = 'TASK_SWITCH', // Cognitive Flexibility (Newest)
  PATHFINDING = 'PATHFINDING', // Spatial Planning (Newest)
  RESULT = 'RESULT'
}

export enum Difficulty {
  BEGINNER = 'Pemula',
  INTERMEDIATE = 'Menengah',
  ADVANCED = 'Mahir'
}

export type Language = 'ID' | 'EN';

export type Theme = 'DARK' | 'LIGHT';

export type FontSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or Lucide icon name
  tier: AchievementTier;
  isSecret?: boolean;
  unlockedAt?: number; // Timestamp
}

export interface UserProfile {
  id: string;
  username: string;
  joinedAt: number;
  totalXp: number;
  level: number;
  currentStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  bestScores: Record<string, number>; // Key: "GAMEMODE_DIFFICULTY"
  unlockedAchievements: string[]; // Array of Achievement IDs
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  score: number;
  gamesPlayed: number;
}

export interface GameResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number; // percentage
  duration: number; // milliseconds
  difficulty: Difficulty;
  gameMode: GameMode;
  timestamp?: number;
  mistakePatterns?: string[]; 
  isPractice?: boolean;
  
  // New properties for UI feedback
  isNewBest?: boolean;
  xpGained?: number;
  newAchievements?: Achievement[];
  
  // New: Reaction Time Tracking
  averageReactionTime?: number; // in milliseconds
}

export interface AIQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface WordAssociationQuestion {
  category: string; 
  correctWords: string[]; 
  distractors: string[]; 
  explanation: string;
}

export interface AnagramQuestion {
  scrambled: string;
  original: string;
  hint: string;
}
