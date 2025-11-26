
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, GameMode, Difficulty, Theme } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Toggle } from '../ui/Toggle';
import { NeuralChart } from '../NeuralChart';
import { calculateNeuroStats } from '../../services/statsService';
import { getRankTitle, calculateXPForNextLevel, calculateXPForCurrentLevel } from '../../services/authService';
import { LogOut, User as UserIcon, Activity, Award, Settings, Grid, BrainCircuit, Network, Lightbulb, BookOpen, RotateCcw, Eye, Calculator, Type, Scan, Compass, Shuffle, Map, ChevronsUp, Database, Zap, Hexagon, Crosshair, MessageSquare, Sun, Moon } from 'lucide-react';

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
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  profile, onGameSelect, onLogout, onAchievementsOpen, t, difficulty, isQuickMode, setIsQuickMode, isPracticeMode, setIsPracticeMode, theme, setTheme
}) => {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  
  // Calculate Stats
  const neuroStats = useMemo(() => calculateNeuroStats(profile), [profile]);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentLevel = profile?.level || 1;
  const currentXP = profile?.totalXp || 0;
  const xpStart = calculateXPForCurrentLevel(currentLevel);
  const xpEnd = calculateXPForNextLevel(currentLevel);
  const xpNeeded = xpEnd - xpStart;
  const xpProgress = Math.min(Math.max(currentXP - xpStart, 0), xpNeeded);
  const progressPercent = Math.min((xpProgress / xpNeeded) * 100, 100);
  const rankTitle = getRankTitle(currentLevel);

  const getSessionState = (secs: number) => {
      if (secs < 300) return { label: "WARMING UP", color: "text-slate-400", border: "border-slate-700" };
      if (secs < 1200) return { label: "OPTIMAL FLOW", color: "text-retro-green", border: "border-retro-green" };
      if (secs < 2400) return { label: "PEAK LOAD", color: "text-retro-yellow", border: "border-retro-yellow" };
      return { label: "OVERHEAT", color: "text-retro-red", border: "border-retro-red" };
  };
  const sessionState = getSessionState(sessionSeconds);

  const games = [
    { id: GameMode.MEMORY, name: "PATTERN", desc: "MEM", icon: <BrainCircuit />, color: "border-retro-pink text-retro-pink" },
    { id: GameMode.SEQUENCE, name: "SEQUENCE", desc: "LOGIC", icon: <Network />, color: "border-retro-green text-retro-green" },
    { id: GameMode.PROBLEM, name: "RIDDLES", desc: "LATERAL", icon: <Lightbulb />, color: "border-retro-yellow text-retro-yellow" },
    { id: GameMode.WORD, name: "LINK", desc: "VERBAL", icon: <BookOpen />, color: "border-retro-cyan text-retro-cyan" },
    { id: GameMode.N_BACK, name: "N-BACK", desc: "WORK MEM", icon: <RotateCcw />, color: "border-retro-purple text-retro-purple" },
    { id: GameMode.COLOR_MATCH, name: "STROOP", desc: "FOCUS", icon: <Eye />, color: "border-retro-red text-retro-red" },
    { id: GameMode.MATH_RUSH, name: "MATH", desc: "CALC", icon: <Calculator />, color: "border-retro-cyan text-retro-cyan" },
    { id: GameMode.ANAGRAM, name: "ANAGRAM", desc: "WORD", icon: <Type />, color: "border-retro-yellow text-retro-yellow" },
    { id: GameMode.VISUAL_SEARCH, name: "SEARCH", desc: "SCAN", icon: <Scan />, color: "border-retro-green text-retro-green" },
    { id: GameMode.NAVIGATION, name: "NAV", desc: "SPACE", icon: <Compass />, color: "border-retro-purple text-retro-purple" },
    { id: GameMode.TASK_SWITCH, name: "SWITCH", desc: "FLEX", icon: <Shuffle />, color: "border-retro-pink text-retro-pink" },
    { id: GameMode.PATHFINDING, name: "BOT", desc: "PLAN", icon: <Map />, color: "border-retro-yellow text-retro-yellow" },
  ];

  const highlightedGames = games.filter(g => [GameMode.N_BACK, GameMode.MATH_RUSH, GameMode.VISUAL_SEARCH].includes(g.id));
  const [showLibrary, setShowLibrary] = useState(false);

  // LIBRARY VIEW
  if (showLibrary) {
      return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in pb-20 pt-10 px-4">
             <div className="flex items-center gap-4 mb-6">
                 <Button onClick={() => setShowLibrary(false)} variant="ghost" className="!px-0">&larr; BACK TO COMMAND CENTER</Button>
             </div>
             <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-700 pb-2">
                <Database className="w-6 h-6 text-retro-cyan" />
                <h1 className="text-2xl font-pixel text-white uppercase tracking-wider">MODULE DATABASE</h1>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {games.map((game) => (
                    <Card key={game.id} onClick={() => onGameSelect(game.id)} className={`group flex flex-col items-start border-4 ${game.color} hover:bg-slate-900`}>
                        <div className="flex justify-between w-full mb-3">
                            {game.icon}
                            <span className="font-mono text-[10px] bg-slate-800 px-1">{game.desc}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1 font-pixel uppercase">{game.name}</h3>
                        <div className="text-[10px] font-mono text-slate-500">
                             BEST: {profile?.bestScores[`${game.id}_${difficulty}`] || 0}
                        </div>
                    </Card>
                ))}
             </div>
        </div>
      );
  }

  // DASHBOARD VIEW
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-10">
      
      {/* Top Section: ID Card & Stats */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 mt-10">
          
          {/* ID CARD PROFILE */}
          <div className="flex-[2] bg-black border-4 border-slate-700 p-4 shadow-retro flex gap-5 relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-[10px] font-pixel text-slate-600">ID_CARD_V2</div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-retro-green opacity-5 blur-3xl group-hover:opacity-20 transition-opacity"></div>
              
              <div className="w-24 h-24 bg-retro-green border-4 border-white shadow-retro shrink-0 flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-black" />
              </div>
              
              <div className="flex flex-col justify-between flex-1 min-w-0 z-10">
                    <div>
                        <div className="flex items-center gap-2 text-retro-cyan text-[10px] font-pixel mb-1">
                            <ChevronsUp className="w-3 h-3" /> RANK: {rankTitle}
                        </div>
                        <h2 className="text-2xl md:text-3xl text-white font-bold font-mono tracking-tighter truncate">
                            {profile?.username || 'GUEST'}
                        </h2>
                        {/* ARCHETYPE BADGE */}
                        <div className="inline-block mt-1 px-2 py-0.5 bg-slate-800 border border-retro-pink text-retro-pink font-pixel text-[10px] uppercase shadow-glow">
                             {neuroStats.archetype}
                        </div>
                    </div>

                    <div className="mt-3">
                       <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>EXP PROGRESS</span>
                          <span>{xpProgress}/{xpNeeded}</span>
                       </div>
                       <div className="w-full h-3 bg-slate-900 border border-slate-600">
                           <div className="h-full bg-gradient-to-r from-retro-cyan to-blue-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                       </div>
                    </div>
              </div>
          </div>

          {/* Quick Stats */}
          <div className="flex-1 flex gap-4">
               <Card onClick={onAchievementsOpen} className="flex-1 flex flex-col justify-center items-center cursor-pointer hover:border-retro-yellow group">
                    <Award className="w-8 h-8 text-retro-yellow mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-pixel text-[10px] text-white">ACHIEVEMENTS</span>
                    <span className="font-mono text-xs text-slate-500">{profile?.unlockedAchievements.length} UNLOCKED</span>
               </Card>
               
               <Card className={`flex-1 flex flex-col justify-center items-center ${sessionState.border}`}>
                    <Activity className={`w-8 h-8 mb-2 ${sessionState.color} animate-pulse`} />
                    <span className="font-pixel text-[10px] text-white">SYNC STATUS</span>
                    <span className={`font-mono text-xs font-bold ${sessionState.color}`}>{sessionState.label}</span>
               </Card>
          </div>
      </div>

      <div className="relative border-b-4 border-white mb-8 pb-2">
            <h1 className="text-5xl md:text-7xl font-pixel text-white text-shadow-retro leading-none">COMMAND CENTER</h1>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* NEURO-METRIC PROFILER (Replaces WeeklyStats) */}
          <div className="lg:col-span-2 h-auto min-h-[300px] bg-black border-4 border-slate-700 shadow-retro-lg flex flex-col md:flex-row relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              
              {/* Chart Side */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/30">
                  <div className="text-center z-10 w-full mb-8">
                       <h3 className="font-pixel text-retro-cyan text-lg md:text-xl mb-1">{t('stats.title')}</h3>
                       <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">{t('stats.subtitle')}</p>
                  </div>
                  <div className="w-full flex justify-center items-center flex-1">
                      {/* Strictly responsive container to prevent chart from being too big */}
                      <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[200px] md:h-[200px] lg:w-[240px] lg:h-[240px] relative">
                          <NeuralChart stats={neuroStats} size={200} />
                      </div>
                  </div>
              </div>

              {/* Stats Breakdown Side */}
              <div className="flex-1 p-6 flex flex-col justify-center gap-4 bg-black/60 z-10">
                   {[
                       { label: t('stats.memory'), val: neuroStats.memory, icon: <BrainCircuit className="w-4 h-4" />, color: "bg-retro-pink", text: "text-retro-pink" },
                       { label: t('stats.logic'), val: neuroStats.logic, icon: <Hexagon className="w-4 h-4" />, color: "bg-retro-yellow", text: "text-retro-yellow" },
                       { label: t('stats.speed'), val: neuroStats.speed, icon: <Zap className="w-4 h-4" />, color: "bg-retro-cyan", text: "text-retro-cyan" },
                       { label: t('stats.focus'), val: neuroStats.focus, icon: <Crosshair className="w-4 h-4" />, color: "bg-retro-red", text: "text-retro-red" },
                       { label: t('stats.verbal'), val: neuroStats.verbal, icon: <MessageSquare className="w-4 h-4" />, color: "bg-retro-green", text: "text-retro-green" },
                   ].map((stat, idx) => (
                       <div key={idx} className="flex items-center gap-3">
                           <div className={`p-1.5 bg-slate-900 border border-slate-700 rounded ${stat.text}`}>{stat.icon}</div>
                           <div className="flex-1">
                               <div className="flex justify-between items-end mb-1">
                                   <span className={`text-[10px] font-pixel ${stat.text}`}>{stat.label}</span>
                                   <span className="text-xs font-mono text-white font-bold">{stat.val}/100</span>
                               </div>
                               <div className="w-full h-1.5 bg-slate-900">
                                   <div className={`h-full ${stat.color} transition-all duration-1000 ease-out`} style={{ width: `${stat.val}%` }}></div>
                               </div>
                           </div>
                       </div>
                   ))}
              </div>
          </div>

          {/* Config Card */}
          <Card className="flex flex-col gap-4 h-full justify-center min-h-[200px]">
              <div className="flex items-center gap-2 border-b-2 border-slate-700 pb-2 mb-2">
                  <Settings className="w-5 h-5 text-retro-cyan" />
                  <span className="font-pixel text-sm text-white">CONFIG</span>
              </div>
              <Toggle checked={isQuickMode} onChange={setIsQuickMode} label={t('turboMode')} />
              <Toggle checked={isPracticeMode} onChange={setIsPracticeMode} label={t('practiceMode')} />
              <div className="border-t border-slate-800 my-2"></div>
              <Toggle 
                checked={theme === 'LIGHT'} 
                onChange={(val) => setTheme(val ? 'LIGHT' : 'DARK')} 
                label={theme === 'LIGHT' ? t('light') : t('dark')} 
              />
              <div className="mt-auto pt-4 border-t border-slate-800 text-center">
                  <p className="text-[10px] font-mono text-slate-500 mb-2">NEURAL INDEX</p>
                  <p className="text-4xl font-black text-white font-mono">{neuroStats.totalIndex}</p>
              </div>
          </Card>
      </div>
      
      {/* Module Selection */}
      <div className="flex items-center gap-2 mb-4">
          <Grid className="w-5 h-5 text-retro-pink" />
          <h2 className="text-xl font-pixel text-white uppercase tracking-wider">{t('selectModule')}</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {highlightedGames.map((game) => (
          <Card key={game.id} onClick={() => onGameSelect(game.id)} className={`group border-4 ${game.color} hover:bg-slate-900`}>
              <div className="absolute top-0 right-0 bg-white text-black text-[8px] font-pixel px-1">PRIORITY</div>
              <div className="flex justify-between items-start mb-4 mt-2">
                  {game.icon}
                  <span className="font-mono text-[10px] bg-slate-800 px-1 border border-slate-700">{game.desc}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1 font-pixel uppercase">{game.name}</h3>
          </Card>
        ))}

        <div onClick={() => setShowLibrary(true)} className="flex flex-col justify-center items-center p-4 bg-slate-900 border-4 border-dashed border-slate-600 hover:border-white hover:-translate-y-1 transition-all cursor-pointer shadow-retro">
             <Database className="w-8 h-8 text-slate-400 mb-2" />
             <h3 className="text-sm font-bold text-white font-pixel uppercase">DATABASE</h3>
             <span className="text-[10px] text-slate-500 font-mono">ALL MODULES &rarr;</span>
        </div>
      </div>
      
      <div className="mt-16 text-center">
          <Button variant="danger" onClick={onLogout} className="mx-auto px-8">
              <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
          </Button>
      </div>
    </div>
  );
};
