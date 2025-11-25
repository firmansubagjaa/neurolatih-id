import { User, GameResult, DailyStat } from '../types';

const USER_KEY = 'neuro_user_session';
const HISTORY_KEY = 'neuro_game_history';

// MOCK Google Auth Implementation
// In a real production app, this would use Firebase Auth or Google Identity Services
export const loginWithGoogle = async (): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUser: User = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: 'Neuro Traveler',
        email: 'user@neurolatih.id',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
      };
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      
      // Seed some initial data for demonstration if empty
      const existingHistory = localStorage.getItem(HISTORY_KEY + '_' + mockUser.id);
      if (!existingHistory) {
        seedInitialData(mockUser.id);
      }
      
      resolve(mockUser);
    }, 1500); // Simulate network delay
  });
};

export const logout = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.removeItem(USER_KEY);
      resolve();
    }, 500);
  });
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveGameResult = (userId: string, result: GameResult) => {
  const key = HISTORY_KEY + '_' + userId;
  const historyStr = localStorage.getItem(key);
  const history: GameResult[] = historyStr ? JSON.parse(historyStr) : [];
  
  const resultWithTime = { ...result, timestamp: Date.now() };
  history.push(resultWithTime);
  
  localStorage.setItem(key, JSON.stringify(history));
};

export const getWeeklyStats = (userId: string): DailyStat[] => {
  const key = HISTORY_KEY + '_' + userId;
  const historyStr = localStorage.getItem(key);
  const history: GameResult[] = historyStr ? JSON.parse(historyStr) : [];
  
  const stats: DailyStat[] = [];
  const today = new Date();
  
  // Initialize last 7 days with 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    stats.push({ date: dateStr, score: 0, gamesPlayed: 0 });
  }

  // Aggregate scores
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

// Helper to make the chart look cool for new users
const seedInitialData = (userId: string) => {
  const history: GameResult[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    // Random activity
    if (Math.random() > 0.3) {
      const gamesCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < gamesCount; j++) {
         history.push({
           score: Math.floor(Math.random() * 500) + 100,
           totalQuestions: 10,
           correctAnswers: 8,
           accuracy: 80,
           duration: 50000,
           difficulty: 'Menengah',
           gameMode: 'MEMORY',
           timestamp: d.getTime()
         } as any);
      }
    }
  }
  
  localStorage.setItem(HISTORY_KEY + '_' + userId, JSON.stringify(history));
};