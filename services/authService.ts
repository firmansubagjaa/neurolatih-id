
import { UserProfile, GameResult, DailyStat, Achievement, GameMode, Difficulty } from '../types';
import { encryptData, decryptData, runSecurityUnitTests } from './securityService';

// Run tests on module load
runSecurityUnitTests();

const PROFILE_KEY = 'neuro_user_profile_v1';
const HISTORY_KEY = 'neuro_game_history_v1';

// --- ACHIEVEMENTS DATABASE (Tiered & Psychological) ---
export const ACHIEVEMENTS_DB: Achievement[] = [
  // --- TIER 1: ONBOARDING (BRONZE) ---
  { id: 'FIRST_LOGIN', title: 'NEURAL LINK', description: 'Bergabung dengan sistem.', icon: '🔌', tier: 'BRONZE' },
  { id: 'FIRST_WIN', title: 'HELLO WORLD', description: 'Menyelesaikan game pertama.', icon: '👋', tier: 'BRONZE' },
  { id: 'ROOKIE_SCORE', title: 'POTENTIAL DETECTED', description: 'Mencapai skor 500+.', icon: '🌱', tier: 'BRONZE' },

  // --- TIER 2: CONSISTENCY (SILVER) ---
  { id: 'STREAK_3', title: 'CONSISTENT MIND', description: 'Bermain 3 hari berturut-turut.', icon: '🔥', tier: 'SILVER' },
  { id: 'ACCURACY_90', title: 'SHARP SHOOTER', description: 'Menyelesaikan game dengan akurasi > 90%.', icon: '🎯', tier: 'SILVER' },
  { id: 'LEVEL_5', title: 'UPGRADE COMPLETE', description: 'Mencapai Level Profil 5.', icon: '⬆️', tier: 'SILVER' },

  // --- TIER 3: MASTERY (GOLD) ---
  { id: 'STREAK_7', title: 'NEURAL MASTER', description: 'Bermain 7 hari berturut-turut.', icon: '👑', tier: 'GOLD' },
  { id: 'SCORE_1000', title: 'OVERCLOCKING', description: 'Mencapai skor 1000+ dalam satu game.', icon: '⚡', tier: 'GOLD' },
  { id: 'PERFECT_HARD', title: 'GODLIKE', description: 'Sempurna (100%) di mode MAHIR (Advanced).', icon: '💎', tier: 'GOLD' },
  
  // --- TIER 4: SPECIALIST (PLATINUM) ---
  { id: 'MEM_WIZARD', title: 'HIPPOCAMPUS HACKER', description: 'Skor 800+ di Memory Game.', icon: '🧠', tier: 'PLATINUM' },
  { id: 'LOGIC_LORD', title: 'PREFRONTAL POWER', description: 'Skor 800+ di Logic Sequence.', icon: '📐', tier: 'PLATINUM' },
  { id: 'SPEED_DEMON', title: 'SYNAPTIC SPEED', description: 'Math Rush Advanced: Akurasi 100%.', icon: '🚀', tier: 'PLATINUM' },

  // --- HIDDEN / EASTER EGGS ---
  { id: 'NIGHT_OWL', title: 'NIGHT OWL', description: 'Bermain di atas jam 10 malam.', icon: '🦉', tier: 'SILVER', isSecret: true },
  { id: 'EARLY_BIRD', title: 'EARLY BIRD', description: 'Bermain sebelum jam 6 pagi.', icon: '🌅', tier: 'SILVER', isSecret: true },
  { id: 'PERSISTENCE', title: 'NEVER GIVE UP', description: 'Gagal (Game Over) 3x berturut-turut tapi main lagi.', icon: '❤️', tier: 'BRONZE', isSecret: true },
];

// --- XP & RANK SYSTEM UTILITIES ---

export const getRankTitle = (level: number): string => {
  if (level <= 3) return "NEURAL INITIATE";
  if (level <= 7) return "SYNAPSE SEEKER";
  if (level <= 12) return "CORTEX COMMANDER";
  if (level <= 18) return "MIND ARCHITECT";
  if (level <= 25) return "COGNITIVE ELITE";
  if (level <= 35) return "NEURO-TRANSCENDENT";
  return "SINGULARITY";
};

// Quadratic Formula: XP required increases with level
// XP = (Level * 10)^2. 
// Lv 1 = 0 XP
// Lv 2 = 100 XP (Total)
// Lv 3 = 400 XP (Total)
// Lv 10 = 10,000 XP
export const calculateLevelFromXP = (xp: number): number => {
  if (xp < 100) return 1;
  return Math.floor(Math.sqrt(xp) / 10) + 1;
};

export const calculateXPForNextLevel = (level: number): number => {
  return Math.pow(level * 10, 2);
};

export const calculateXPForCurrentLevel = (level: number): number => {
  return Math.pow((level - 1) * 10, 2);
};

// --- HELPER: GET LOCAL DATE (YYYY-MM-DD) ---
const getLocalDate = (): string => {
  const now = new Date();
  // 'en-CA' locale gives YYYY-MM-DD format consistently
  return now.toLocaleDateString('en-CA');
};

// --- STORAGE WRAPPERS ---
const saveSecure = (key: string, data: any) => {
  try {
    const encrypted = encryptData(data);
    localStorage.setItem(key, encrypted);
  } catch (e) {
    console.error("Storage Save Failed", e);
  }
};

const loadSecure = <T>(key: string): T | null => {
  const item = localStorage.getItem(key);
  if (!item) return null;
  
  const decrypted = decryptData<T>(item);
  
  // Auto-Migration: If data was plain JSON (decrypted successfully by fallback)
  // but storage string didn't start with prefix, we should re-save it securely now.
  if (decrypted && !item.startsWith("NEURO_SEC_")) {
      console.log(`[MIGRATION] Securing data for ${key}...`);
      saveSecure(key, decrypted);
  }
  
  return decrypted;
};

// --- CORE USER FUNCTIONS ---

export const getUserProfile = (): UserProfile | null => {
  return loadSecure<UserProfile>(PROFILE_KEY);
};

export const registerUser = (username: string): UserProfile => {
  const newProfile: UserProfile = {
    id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Better ID
    username: username,
    joinedAt: Date.now(),
    totalXp: 0,
    level: 1,
    currentStreak: 1,
    lastPlayedDate: getLocalDate(),
    bestScores: {},
    unlockedAchievements: []
  };
  
  // Unlock first achievement
  newProfile.unlockedAchievements.push('FIRST_LOGIN');
  
  saveSecure(PROFILE_KEY, newProfile);
  return newProfile;
};

// --- PERSISTENCE LOGIC ---
export const saveGameResult = (result: GameResult): { updatedProfile: UserProfile, result: GameResult } => {
  let profile = getUserProfile();
  
  // Safety check: If profile is null (e.g., due to tamper reset), we might need to re-init or throw
  if (!profile) {
      throw new Error("PROFILE_CORRUPTED");
  }

  const today = getLocalDate();
  const history = getGameHistory();
  
  // 1. STREAK LOGIC
  const lastPlayed = profile.lastPlayedDate;
  let newStreak = profile.currentStreak;
  
  if (lastPlayed !== today) {
     const lastDate = new Date(lastPlayed);
     const nowDate = new Date(today);
     const diffTime = Math.abs(nowDate.getTime() - lastDate.getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
     
     if (diffDays === 1) {
         newStreak++;
     } else {
         newStreak = 1; // Reset if skipped a day
     }
  }

  // 2. BEST SCORE PERSISTENCE LOGIC
  if (!profile.bestScores) profile.bestScores = {};

  const scoreKey = `${result.gameMode}_${result.difficulty}`;
  const currentBest = profile.bestScores[scoreKey] || 0;
  const isNewBest = result.score > currentBest;
  
  const newBestScores = { ...profile.bestScores };
  if (isNewBest) {
      newBestScores[scoreKey] = result.score;
  }

  // 3. XP & LEVEL LOGIC (UPDATED QUADRATIC)
  const xpGained = result.score;
  const newTotalXp = profile.totalXp + xpGained;
  const newLevel = calculateLevelFromXP(newTotalXp);

  // 4. ACHIEVEMENT LOGIC (Expanded)
  const newUnlockedIds: string[] = [];
  const currentUnlocked = new Set(profile.unlockedAchievements);

  const checkUnlock = (id: string, condition: boolean) => {
      if (condition && !currentUnlocked.has(id)) {
          newUnlockedIds.push(id);
          currentUnlocked.add(id);
      }
  };

  // General Checks
  checkUnlock('FIRST_WIN', true);
  checkUnlock('ROOKIE_SCORE', result.score >= 500);
  checkUnlock('SCORE_1000', result.score >= 1000);
  checkUnlock('ACCURACY_90', result.accuracy >= 90);
  checkUnlock('PERFECT_HARD', result.accuracy === 100 && result.difficulty === Difficulty.ADVANCED);
  
  // Streak Checks
  checkUnlock('STREAK_3', newStreak >= 3);
  checkUnlock('STREAK_7', newStreak >= 7);
  
  // Level Checks
  checkUnlock('LEVEL_5', newLevel >= 5);

  // Specialist Checks
  if (result.gameMode === GameMode.MEMORY) checkUnlock('MEM_WIZARD', result.score >= 800);
  if (result.gameMode === GameMode.SEQUENCE) checkUnlock('LOGIC_LORD', result.score >= 800);
  if (result.gameMode === GameMode.MATH_RUSH && result.difficulty === Difficulty.ADVANCED) checkUnlock('SPEED_DEMON', result.accuracy === 100);

  // Secret Checks
  const hour = new Date().getHours();
  checkUnlock('NIGHT_OWL', hour >= 22 || hour < 4);
  checkUnlock('EARLY_BIRD', hour >= 5 && hour < 8);

  // Persistence Check (Hidden) - Requires history analysis
  // Logic: Check if last 2 games were failures (low score/accuracy) and this one exists
  if (history.length >= 2) {
      const g1 = history[history.length - 1];
      const g2 = history[history.length - 2];
      // Define "Failure" as very low accuracy/score
      const isFail = (g: GameResult) => g.accuracy < 30; 
      if (isFail(g1) && isFail(g2)) {
          checkUnlock('PERSISTENCE', true);
      }
  }

  // 5. SAVE UPDATES
  const updatedProfile: UserProfile = {
      ...profile,
      totalXp: newTotalXp,
      level: newLevel,
      currentStreak: newStreak,
      lastPlayedDate: today,
      bestScores: newBestScores,
      unlockedAchievements: Array.from(currentUnlocked)
  };

  saveSecure(PROFILE_KEY, updatedProfile);

  const resultWithMeta: GameResult = {
      ...result,
      timestamp: Date.now(),
      isNewBest,
      xpGained,
      newAchievements: ACHIEVEMENTS_DB.filter(a => newUnlockedIds.includes(a.id))
  };
  
  history.push(resultWithMeta);
  saveSecure(HISTORY_KEY, history);

  return { updatedProfile, result: resultWithMeta };
};

export const getGameHistory = (): GameResult[] => {
  return loadSecure<GameResult[]>(HISTORY_KEY) || [];
};

export const getWeeklyStats = (): DailyStat[] => {
  const history = getGameHistory();
  const stats: DailyStat[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA');
    stats.push({ date: dateStr, score: 0, gamesPlayed: 0 });
  }

  history.forEach(game => {
    if (!game.timestamp) return;
    const dateStr = new Date(game.timestamp).toLocaleDateString('en-CA');
    const statIndex = stats.findIndex(s => s.date === dateStr);
    
    if (statIndex !== -1) {
      stats[statIndex].score += game.score;
      stats[statIndex].gamesPlayed += 1;
    }
  });

  return stats;
};

export const getUnlockedAchievements = (ids: string[]): Achievement[] => {
    return ACHIEVEMENTS_DB.filter(a => ids.includes(a.id));
};
