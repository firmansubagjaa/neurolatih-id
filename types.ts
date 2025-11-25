export enum GameMode {
  WELCOME = 'WELCOME',
  MENU = 'MENU',
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
  RESULT = 'RESULT'
}

export enum Difficulty {
  BEGINNER = 'Pemula',
  INTERMEDIATE = 'Menengah',
  ADVANCED = 'Mahir'
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
  mistakePatterns?: string[]; // New: List specific error types (e.g., "Impulsive Click", "Stroop Interference")
  isPractice?: boolean; // New: Flag for practice mode
}

export interface AIQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface WordAssociationQuestion {
  category: string; // The hint
  correctWords: string[]; // 3 words
  distractors: string[]; // 3 words
  explanation: string;
}

export interface AnagramQuestion {
  scrambled: string;
  original: string;
  hint: string;
}