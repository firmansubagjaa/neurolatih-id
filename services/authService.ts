
import { UserProfile, GameResult, DailyStat, Achievement, GameMode, Difficulty } from '../types';
import { encryptData, decryptData, runSecurityUnitTests } from './securityService';

// Run tests on module load
runSecurityUnitTests();

const PROFILE_KEY = 'neuro_user_profile_v1';
const HISTORY_KEY = 'neuro_game_history_v1';

// --- ACHIEVEMENTS DATABASE ---
export const ACHIEVEMENTS_DB: Achievement[] = [
  { id: 'FIRST_LOGIN', title: 'NEURAL LINK ESTABLISHED', description: 'Bergabung dengan sistem.', icon: '🔌' },
  { id: 'FIRST_WIN', title: 'HELLO WORLD', description: 'Menyelesaikan game pertama.', icon: '👋' },
  { id: 'PERFECT_SCORE', title: 'SYNAPTIC PERFECTION', description: 'Akurasi 100% dalam satu sesi.', icon: '🎯' },
  { id: 'STREAK_3', title: 'CONSISTENT MIND', description: 'Bermain 3 hari berturut-turut.', icon: '🔥' },
  { id: 'STREAK_7', title: 'NEURAL MASTER', description: 'Bermain 7 hari berturut-turut.', icon: '👑' },
  { id: 'SCORE_1000', title: 'OVERCLOCKING', description: 'Mencapai skor 1000+ dalam satu game.', icon: '⚡' },
  { id: 'NIGHT_OWL', title: 'NIGHT OWL', description: 'Bermain di atas jam 10 malam.', icon: '🦉' },
];

// --- HELPER: GET LOCAL DATE (YYYY-MM-DD) ---
const getLocalDate = (): string => {
  const now = new Date();
  // 'en-CA' locale gives YYYY-MM-DD format consistently
  return now.toLocaleDateString('en-CA');
};

// --- STORAGE WRAPPERS ---
const saveSecure = (key: string, data: any) => {
  const encrypted = encryptData(data);
  localStorage.setItem(key, encrypted);
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

export const saveGameResult = (result: GameResult): { updatedProfile: UserProfile, result: GameResult } => {
  let profile = getUserProfile();
  
  // Safety check: If profile is null (e.g., due to tamper reset), we might need to re-init or throw
  if (!profile) {
      // Fallback for extreme edge case: Create temp profile or throw
      // Ideally app should redirect to login, but here we throw to let UI handle it
      throw new Error("PROFILE_CORRUPTED");
  }

  const today = getLocalDate();
  const history = getGameHistory();
  
  // 1. STREAK LOGIC (Time Complexity: O(1))
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

  // 2. BEST SCORE LOGIC (Time Complexity: O(1) - Map Lookup)
  const scoreKey = `${result.gameMode}_${result.difficulty}`;
  const currentBest = profile.bestScores[scoreKey] || 0;
  const isNewBest = result.score > currentBest;
  
  const newBestScores = { ...profile.bestScores };
  if (isNewBest) newBestScores[scoreKey] = result.score;

  // 3. XP & LEVEL LOGIC
  const xpGained = result.score;
  const newTotalXp = profile.totalXp + xpGained;
  const newLevel = Math.floor(newTotalXp / 2000) + 1;

  // 4. ACHIEVEMENT LOGIC (Time Complexity: O(M) where M is num achievements)
  const newUnlockedIds: string[] = [];
  const currentUnlocked = new Set(profile.unlockedAchievements);

  const checkUnlock = (id: string, condition: boolean) => {
      if (condition && !currentUnlocked.has(id)) {
          newUnlockedIds.push(id);
          currentUnlocked.add(id);
      }
  };

  checkUnlock('FIRST_WIN', true);
  checkUnlock('PERFECT_SCORE', result.accuracy === 100);
  checkUnlock('SCORE_1000', result.score >= 1000);
  checkUnlock('STREAK_3', newStreak >= 3);
  checkUnlock('STREAK_7', newStreak >= 7);
  
  const hour = new Date().getHours();
  checkUnlock('NIGHT_OWL', hour >= 22 || hour < 4);

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

  // Save History
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
  
  // Last 7 days
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
