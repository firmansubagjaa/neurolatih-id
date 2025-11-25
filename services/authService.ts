
import { UserProfile, GameResult, DailyStat, Achievement, GameMode, Difficulty } from '../types';

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

// --- CORE USER FUNCTIONS ---

export const getUserProfile = (): UserProfile | null => {
  const stored = localStorage.getItem(PROFILE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const registerUser = (username: string): UserProfile => {
  const newProfile: UserProfile = {
    id: `u_${Date.now()}`,
    username: username,
    joinedAt: Date.now(),
    totalXp: 0,
    level: 1,
    currentStreak: 1,
    lastPlayedDate: new Date().toISOString().split('T')[0],
    bestScores: {},
    unlockedAchievements: []
  };
  
  // Unlock first achievement
  newProfile.unlockedAchievements.push('FIRST_LOGIN');
  
  localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
  return newProfile;
};

// Check streak on login/start
export const checkAndRefreshStreak = (profile: UserProfile): UserProfile => {
  const today = new Date().toISOString().split('T')[0];
  if (profile.lastPlayedDate === today) return profile;

  const last = new Date(profile.lastPlayedDate);
  const now = new Date(today);
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  let newStreak = profile.currentStreak;
  
  if (diffDays === 1) {
    // Consecutive day
    newStreak += 1;
  } else if (diffDays > 1) {
    // Streak broken
    newStreak = 0; // Reset to 0 (will become 1 when they play a game)
  }

  const updated = { ...profile, currentStreak: newStreak, lastPlayedDate: today }; // Update date only when actually playing? 
  // Actually, standard is to update 'lastPlayed' only on game completion for streak, 
  // but for 'daily login' logic, we update here.
  // Let's keep date update for game completion to force playing.
  
  // Actually, let's just return current state, streak logic is best handled on game save to ensure "Active Play"
  return profile;
};

export const saveGameResult = (result: GameResult): { updatedProfile: UserProfile, result: GameResult } => {
  let profile = getUserProfile();
  if (!profile) throw new Error("No profile found");

  const today = new Date().toISOString().split('T')[0];
  const history = getGameHistory();
  
  // 1. STREAK LOGIC
  const lastPlayed = profile.lastPlayedDate;
  let newStreak = profile.currentStreak;
  
  if (lastPlayed !== today) {
     const lastDate = new Date(lastPlayed);
     const nowDate = new Date(today);
     const diffDays = Math.floor((nowDate.getTime() - lastDate.getTime()) / (86400000));
     
     if (diffDays === 1) newStreak++;
     else newStreak = 1;
  }

  // 2. BEST SCORE LOGIC
  const scoreKey = `${result.gameMode}_${result.difficulty}`;
  const currentBest = profile.bestScores[scoreKey] || 0;
  const isNewBest = result.score > currentBest;
  
  const newBestScores = { ...profile.bestScores };
  if (isNewBest) newBestScores[scoreKey] = result.score;

  // 3. XP & LEVEL LOGIC
  // Base XP = Score. Bonus for Hard mode.
  const xpGained = result.score;
  const newTotalXp = profile.totalXp + xpGained;
  const newLevel = Math.floor(newTotalXp / 2000) + 1;

  // 4. ACHIEVEMENT LOGIC
  const newUnlockedIds: string[] = [];
  const currentUnlocked = new Set(profile.unlockedAchievements);

  // Helper to unlock
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

  localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));

  // Save History
  const resultWithMeta: GameResult = {
      ...result,
      timestamp: Date.now(),
      isNewBest,
      xpGained,
      newAchievements: ACHIEVEMENTS_DB.filter(a => newUnlockedIds.includes(a.id))
  };
  
  history.push(resultWithMeta);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  return { updatedProfile, result: resultWithMeta };
};

export const getGameHistory = (): GameResult[] => {
  const str = localStorage.getItem(HISTORY_KEY);
  return str ? JSON.parse(str) : [];
};

export const getWeeklyStats = (): DailyStat[] => {
  const history = getGameHistory();
  const stats: DailyStat[] = [];
  const today = new Date();
  
  // Last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    stats.push({ date: dateStr, score: 0, gamesPlayed: 0 });
  }

  history.forEach(game => {
    if (!game.timestamp) return;
    const dateStr = new Date(game.timestamp).toISOString().split('T')[0];
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
