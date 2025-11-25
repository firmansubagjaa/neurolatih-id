import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, GameMode, Difficulty } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Toggle } from '../ui/Toggle';
import { WeeklyStats } from '../WeeklyStats';
import { LogOut, User as UserIcon, Flame, Award, Settings, Grid, BrainCircuit, Network, Lightbulb, BookOpen, RotateCcw, Eye, Calculator, Type, Scan, Compass, Shuffle, Map, Timer } from 'lucide-react';

interface MenuScreenProps {
  profile: UserProfile | null;
  onGameSelect: (id: GameMode) => void;
  onLogout: () => void;
  onAchievementsOpen: () => void;
  t: (key: string) => string;
  difficulty: Difficulty;
  isQuickMode: boolean;
  setIsQuickMode: (val: boolean) => void;
  isPracticeMode: boolean;
  setIsPracticeMode: (val: boolean) => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  profile,
  onGameSelect,
  onLogout,
  onAchievementsOpen,
  t,
  difficulty,
  isQuickMode,
  setIsQuickMode,
  isPracticeMode,
  setIsPracticeMode
}) => {
  
  const [uptime, setUptime] = useState("00:00:00");
  // Track today's date to auto-reset stats at midnight
  const [currentDateCheck, setCurrentDateCheck] = useState(new Date().getDate());
  const [forceStatsUpdate, setForceStatsUpdate] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      // 1. Update Uptime Timer
      const diff = Date.now() - startTime;
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setUptime(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );

      // 2. Check for Midnight Reset (Day change)
      const nowDay = new Date().getDate();
      if (nowDay !== currentDateCheck) {
          setCurrentDateCheck(nowDay);
          setForceStatsUpdate(prev => prev + 1); // Force re-render of WeeklyStats
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [currentDateCheck]);

  const games = [
    { id: GameMode.MEMORY, name: "PATTERN", desc: "MEM", icon: <BrainCircuit />, color: "text-retro-pink border-retro-pink" },
    { id: GameMode.SEQUENCE, name: "SEQUENCE", desc: "LOGIC", icon: <Network />, color: "text-retro-green border-retro-green" },
    { id: GameMode.PROBLEM, name: "RIDDLES", desc: "LATERAL", icon: <Lightbulb />, color: "text-retro-yellow border-retro-yellow" },
    { id: GameMode.WORD, name: "LINK", desc: "VERBAL", icon: <BookOpen />, color: "text-retro-cyan border-retro-cyan" },
    { id: GameMode.N_BACK, name: "N-BACK", desc: "WORK MEM", icon: <RotateCcw />, color: "text-retro-purple border-retro-purple" },
    { id: GameMode.COLOR_MATCH, name: "STROOP", desc: "FOCUS", icon: <Eye />, color: "text-retro-red border-retro-red" },
    { id: GameMode.MATH_RUSH, name: "MATH", desc: "CALC", icon: <Calculator />, color: "text-retro-cyan border-retro-cyan" },
    { id: GameMode.ANAGRAM, name: "ANAGRAM", desc: "WORD", icon: <Type />, color: "text-retro-yellow border-retro-yellow" },
    { id: GameMode.VISUAL_SEARCH, name: "SEARCH", desc: "SCAN", icon: <Scan />, color: "text-retro-green border-retro-green" },
    { id: GameMode.NAVIGATION, name: "NAV", desc: "SPACE", icon: <Compass />, color: "text-retro-purple border-retro-purple" },
    { id: GameMode.TASK_SWITCH, name: "SWITCH", desc: "FLEX", icon: <Shuffle />, color: "text-retro-pink border-retro-pink" },
    { id: GameMode.PATHFINDING, name: "BOT", desc: "PLAN", icon: <Map />, color: "text-retro-yellow border-retro-yellow" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="mt-24 md:mt-16 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* User Profile */}
              <div className="flex-1 bg-slate-900 border-2 border-slate-600 p-3 shadow-retro flex items-center gap-4 relative overflow-hidden group">
                  <div className="w-16 h-16 bg-retro-green border-2 border-white flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)] relative">
                        <UserIcon className="w-8 h-8 text-black" />
                        <div className="absolute -bottom-2 -right-2 bg-black text-white text-[10px] font-pixel px-1 border border-white">
                          LV.{profile?.level}
                        </div>
                  </div>
                  
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                          <span className="text-[10px] text-retro-cyan font-pixel uppercase tracking-widest">OPERATOR</span>
                          {profile && (
                              <div className="flex items-center gap-1 text-retro-red bg-black/50 px-2 rounded border border-retro-red/30 whitespace-nowrap">
                                  <Flame className="w-3 h-3 fill-current animate-pulse" />
                                  <span className="text-[10px] md:text-xs font-pixel">{profile.currentStreak} DAY STREAK</span>
                              </div>
                          )}
                        </div>
                        <span className="text-xl text-white font-bold font-mono tracking-wide truncate">
                            {profile?.username || 'GUEST'}
                        </span>
                        <div className="w-full h-3 bg-black border border-slate-600 mt-2 relative">
                            <div 
                              className="h-full bg-gradient-to-r from-retro-cyan to-blue-500 transition-all duration-1000"
                              style={{ width: `${((profile?.totalXp || 0) % 2000) / 20}%` }}
                            ></div>
                            <span className="absolute top-0 right-1 text-[8px] text-white leading-3 font-pixel z-10">
                                {profile?.totalXp} XP
                            </span>
                        </div>
                  </div>
              </div>

              {/* System Stats */}
              <div className="flex-1 flex gap-4">
                  <div className="flex-1 bg-black border-2 border-slate-700 p-3 shadow-retro flex flex-col justify-center items-center hover:border-retro-yellow cursor-pointer group transition-colors" onClick={onAchievementsOpen}>
                        <Award className="w-8 h-8 text-retro-yellow mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-white font-pixel">ACHIEVEMENTS</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                            {profile?.unlockedAchievements.length} UNLOCKED
                        </span>
                  </div>
                  <div className="flex-1 bg-black border-2 border-slate-700 p-3 shadow-retro flex flex-col justify-center items-center relative overflow-hidden">
                        <span className="text-[10px] text-slate-400 font-pixel uppercase flex items-center gap-1">
                            <Timer className="w-3 h-3" /> SESSION UPTIME
                        </span>
                        <span className="text-xl text-retro-green font-mono tracking-widest relative z-10">
                            {uptime}
                        </span>
                        {/* Background anim */}
                        <div className="absolute inset-0 bg-retro-green/5 animate-pulse pointer-events-none"></div>
                  </div>
              </div>
          </div>

          <div className="relative border-b-4 border-white mb-6 pb-2 flex justify-between items-end">
                <h1 className="text-4xl md:text-6xl font-pixel text-white text-shadow-retro leading-none tracking-tight">
                  {t('mainMenu')}
                </h1>
                <span className="text-xs font-mono text-slate-500 bg-black px-2 pb-1">V.8.1.1</span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 h-full">
              <Card className="h-full bg-slate-900/80 border-slate-600 relative overflow-hidden group min-h-[220px]">
                {/* Passing forceUpdate key forces re-render when day changes */}
                <WeeklyStats key={forceStatsUpdate} user={profile || undefined} />
              </Card>
          </div>
          <Card className="flex flex-col gap-4 bg-slate-900/80 border-slate-600 h-full">
              <div className="flex items-center gap-2 border-b-2 border-slate-700 pb-2">
                  <Settings className="w-4 h-4 text-retro-cyan" />
                  <span className="font-pixel text-xs text-white">{t('missionConfig')}</span>
              </div>
              <div className="space-y-4">
                  <Toggle checked={isQuickMode} onChange={setIsQuickMode} label={t('turboMode')} />
                  <Toggle checked={isPracticeMode} onChange={setIsPracticeMode} label={t('practiceMode')} />
              </div>
          </Card>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
          <Grid className="w-5 h-5 text-retro-pink" />
          <h2 className="text-lg font-pixel text-white uppercase tracking-wider">{t('selectModule')}</h2>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {games.map((game) => (
          <div 
            key={game.id} 
            onClick={() => onGameSelect(game.id)} 
            className={`group relative flex flex-col p-4 bg-black border-4 hover:-translate-y-2 transition-transform cursor-pointer shadow-retro ${game.color.split(' ')[1]}`}
          >
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-800 opacity-50"></div>
              
              <div className="flex justify-between items-start mb-4 mt-2">
                  <div className={`${game.color.split(' ')[0]}`}>{game.icon}</div>
                  <span className="font-mono text-[10px] text-slate-500 bg-black px-1 border border-slate-700">{game.desc}</span>
              </div>
              
              <h3 className="text-sm font-bold text-white mb-1 font-pixel uppercase truncate">{game.name}</h3>
              
              {profile?.bestScores[`${game.id}_${difficulty}`] ? (
                  <div className="text-[10px] font-mono text-slate-400">HI: {profile.bestScores[`${game.id}_${difficulty}`]}</div>
              ) : (
                  <div className="text-[10px] font-mono text-slate-600">NO DATA</div>
              )}
              
              <div className="mt-auto pt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-pixel text-black bg-white px-2 py-1 animate-blink">INFO</span>
              </div>
          </div>
        ))}
      </div>
      
      <div className="mt-16 text-center border-t-2 border-slate-800 pt-8">
          <Button variant="danger" onClick={onLogout} className="mx-auto">
              <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
          </Button>
      </div>
    </div>
  );
};
