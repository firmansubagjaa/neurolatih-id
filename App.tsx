
import React, { useState, useEffect, Suspense } from 'react';
import { GameMode, Difficulty, GameResult, User, FontSize, Language } from './types';
import { Button, Card, NeuralLoader, Toggle, Badge, Tooltip } from './components/Shared';
import { SettingsModal } from './components/SettingsModal';
import { DifficultyModal } from './components/DifficultyModal';
import { Confetti } from './components/Confetti';
import { WeeklyStats } from './components/WeeklyStats';
import { NeuralBackground } from './components/NeuralBackground';
import { RetroToast } from './components/RetroToast';
import { generateGameFeedback, generateWelcomeMessage } from './services/geminiService';
import { startMusic, stopMusic, playSound, toggleMute, getIsMuted } from './services/audioService';
import { loginWithGoogle, logout, getCurrentUser, saveGameResult } from './services/authService';
import { getTranslation } from './services/languageService';
import { Brain, Zap, Network, Trophy, Lightbulb, Grid, Activity, BookOpen, Settings, RotateCcw, BrainCircuit, Eye, LogOut, Terminal, Calculator, Type, Scan, Compass, Shuffle, Volume2, VolumeX, Map, User as UserIcon } from 'lucide-react';

const LogicGame = React.lazy(() => import('./components/games/LogicGame'));
const MemoryGame = React.lazy(() => import('./components/games/MemoryGame'));
const SequenceGame = React.lazy(() => import('./components/games/MathGame'));
const WordGame = React.lazy(() => import('./components/games/WordGame'));
const NBackGame = React.lazy(() => import('./components/games/NBackGame'));
const ColorMatchGame = React.lazy(() => import('./components/games/ColorMatchGame'));
const MathRushGame = React.lazy(() => import('./components/games/MathRushGame'));
const AnagramGame = React.lazy(() => import('./components/games/AnagramGame'));
const VisualSearchGame = React.lazy(() => import('./components/games/VisualSearchGame'));
const NavigationGame = React.lazy(() => import('./components/games/NavigationGame'));
const TaskSwitchGame = React.lazy(() => import('./components/games/TaskSwitchGame'));
const PathfindingGame = React.lazy(() => import('./components/games/PathfindingGame'));

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.WELCOME);
  const [pendingGameMode, setPendingGameMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [language, setLanguage] = useState<Language>('ID');
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'info' | 'success' | 'warning' }>({
    visible: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    setIsMuted(getIsMuted());
    const savedLang = localStorage.getItem('neuro_lang') as Language;
    if (savedLang) setLanguage(savedLang);
    
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setGameMode(GameMode.MENU);
    }
  }, []);

  useEffect(() => {
    if (gameMode === GameMode.WELCOME || gameMode === GameMode.MENU || gameMode === GameMode.RESULT) {
      startMusic('MENU');
    }
  }, [gameMode]);

  const handleLogin = async () => {
    setIsAuthLoading(true);
    playSound('click');
    const user = await loginWithGoogle();
    setUser(user);
    setIsAuthLoading(false);
    setGameMode(GameMode.MENU);
    setToast({ visible: true, message: `LOGIN SUCCESS: ${user.name}`, type: 'success' });
  };

  const handleLogout = async () => {
    playSound('click');
    await logout();
    setUser(null);
    setGameMode(GameMode.WELCOME);
  };

  const handleGameSelect = (mode: GameMode) => {
    playSound('click');
    setPendingGameMode(mode);
  };

  const handleDifficultySelect = (diff: Difficulty) => {
    setDifficulty(diff);
    setPendingGameMode(null);
    if (pendingGameMode) {
      setGameMode(pendingGameMode);
    }
  };

  const handleEndGame = async (result: GameResult) => {
    setLastResult(result);
    setGameMode(GameMode.RESULT);
    if (user && !result.isPractice) {
        saveGameResult(user.id, result);
    }
    setIsFeedbackLoading(true);
    try {
      const feedback = await generateGameFeedback(result);
      setAiFeedback(feedback);
    } catch (error) {
      setAiFeedback("CONNECTION_LOST");
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const t = (key: string) => getTranslation(language, key);

  const renderContent = () => {
    const gameProps = {
        difficulty,
        onEndGame: handleEndGame,
        onBack: () => setGameMode(GameMode.MENU),
        isQuickMode,
        isPracticeMode,
        language
    };

    switch (gameMode) {
      case GameMode.WELCOME:
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fade-in px-4">
            <div className="mb-12 relative group">
               <div className="bg-black border-4 border-white p-6 md:p-10 shadow-retro-lg transform group-hover:-translate-y-2 transition-transform">
                 <h1 className="text-4xl sm:text-5xl md:text-7xl font-pixel text-retro-green mb-4 text-shadow-retro leading-none">
                    NEUROLATIH
                 </h1>
                 <div className="inline-block bg-retro-red px-3 py-1 border-2 border-white">
                    <p className="text-sm md:text-lg font-pixel text-white font-bold tracking-[0.5em]">8-BIT EDITION</p>
                 </div>
               </div>
            </div>
            
            <div className="max-w-md text-slate-300 mb-10 font-mono text-base md:text-xl leading-relaxed bg-black border-2 border-slate-600 p-6 w-full shadow-retro text-left">
              <span className="text-retro-green mr-2">$</span>
              <span className="typing-effect">{t('welcome')}</span>
              <span className="animate-blink inline-block w-3 h-5 bg-retro-green ml-1 align-middle"></span>
            </div>

            <Button onClick={handleLogin} isLoading={isAuthLoading} className="text-xl md:text-2xl py-5 px-10 border-4 animate-pulse-fast hover:animate-none">
              {isAuthLoading ? t('connecting') : t('startSystem')}
            </Button>
          </div>
        );

      case GameMode.MENU:
        return (
          <div className="w-full max-w-6xl mx-auto animate-fade-in pb-20">
            {/* Header Redesign: Dashboard Style */}
            <div className="mt-20 md:mt-0 mb-8">
                {/* ID Card / Status Bar */}
                <div className="bg-slate-900 border-2 border-slate-600 p-4 shadow-retro mb-6 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden group">
                    {/* Scanline Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/10 animate-[scanline_3s_linear_infinite] pointer-events-none"></div>

                    {/* Left: User Identity */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                         <div className="w-12 h-12 bg-retro-yellow border-2 border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
                              <UserIcon className="w-7 h-7 text-black" />
                         </div>
                         <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-retro-green font-pixel uppercase tracking-widest bg-retro-green/10 px-1 rounded">OPERATOR_ID</span>
                                  <div className="w-2 h-2 rounded-full bg-retro-green animate-pulse shadow-[0_0_5px_#4ade80]"></div>
                              </div>
                              <span className="text-xl text-white font-bold font-mono tracking-wider text-shadow-retro truncate max-w-[200px] md:max-w-none">
                                  {user?.name || 'UNKNOWN'}
                              </span>
                         </div>
                    </div>

                    {/* Right: Credits & Stats */}
                    <div className="flex items-center gap-4 w-full md:w-auto bg-black/40 p-2 px-4 rounded border border-slate-700/50 backdrop-blur-sm">
                         <div className="flex flex-col items-end border-r border-slate-600 pr-4">
                             <span className="text-[10px] text-slate-400 font-pixel uppercase">STATUS</span>
                             <span className="text-xs text-retro-green font-mono tracking-wide">SYSTEM ONLINE</span>
                         </div>
                         <div className="flex flex-col items-end">
                             <span className="text-[10px] text-retro-cyan font-pixel uppercase">CREDITS</span>
                             <div className="flex items-center gap-1">
                                 <span className="text-lg text-retro-cyan font-bold font-mono leading-none">∞</span>
                                 <span className="text-[10px] text-retro-cyan/70">PTS</span>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Main Title Section */}
                <div className="flex items-end justify-between border-b-4 border-white pb-2 px-1">
                     <h1 className="text-4xl md:text-6xl font-pixel text-white text-shadow-retro leading-none mt-2">
                        {t('mainMenu')}
                     </h1>
                     <div className="hidden md:flex gap-1 mb-2 opacity-50">
                         <div className="w-2 h-2 bg-slate-500"></div>
                         <div className="w-2 h-2 bg-slate-500"></div>
                         <div className="w-2 h-2 bg-slate-500"></div>
                     </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Stats Panel */}
                <div className="lg:col-span-2 h-full">
                   <Card className="h-full bg-slate-900/80 border-slate-600 relative overflow-hidden group min-h-[220px]">
                      {user && <WeeklyStats user={user} />}
                   </Card>
                </div>

                {/* Config Panel */}
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

            {/* Games Grid - Cartridge Style */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
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
              ].map((game) => (
                <div 
                  key={game.id} 
                  onClick={() => handleGameSelect(game.id)} 
                  className={`group relative flex flex-col p-4 bg-black border-4 hover:-translate-y-2 transition-transform cursor-pointer shadow-retro ${game.color.split(' ')[1]}`}
                >
                   {/* Cartridge Label */}
                   <div className="absolute top-0 left-0 w-full h-2 bg-slate-800 opacity-50"></div>
                   
                   <div className="flex justify-between items-start mb-4 mt-2">
                       <div className={`${game.color.split(' ')[0]}`}>{game.icon}</div>
                       <span className="font-mono text-[10px] text-slate-500 bg-black px-1 border border-slate-700">{game.desc}</span>
                   </div>
                   
                   <h3 className="text-sm font-bold text-white mb-1 font-pixel uppercase truncate">{game.name}</h3>
                   
                   <div className="mt-auto pt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-pixel text-black bg-white px-2 py-1 animate-blink">START</span>
                   </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center border-t-2 border-slate-800 pt-8">
                <Button variant="danger" onClick={handleLogout} className="mx-auto">
                   <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
                </Button>
            </div>
          </div>
        );

      case GameMode.RESULT:
        return (
          <div className="w-full max-w-lg mx-auto animate-fade-in text-center px-4">
            <Confetti />
            <div className="mb-8">
               <Trophy className="w-20 h-20 text-retro-yellow mx-auto mb-4 animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
               <h2 className="text-3xl md:text-5xl font-pixel text-white mb-2 text-shadow-retro">{t('missionClear')}</h2>
               <div className="inline-block bg-slate-900 px-4 py-1 border-2 border-slate-700 text-retro-cyan font-pixel text-xs uppercase tracking-widest">
                  {lastResult?.gameMode} // {lastResult?.difficulty}
               </div>
            </div>

            <Card className="mb-8 bg-black border-4 border-retro-green p-0 relative overflow-hidden">
                <div className="bg-retro-green p-2 text-black font-pixel text-center text-sm font-bold">REPORT CARD</div>
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-6 mb-6 border-b-2 border-dashed border-slate-700 pb-6">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold font-pixel">{t('totalScore')}</p>
                            <p className="text-4xl font-bold text-white font-mono">{lastResult?.score}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold font-pixel">{t('accuracy')}</p>
                            <p className={`text-4xl font-bold font-mono ${lastResult?.accuracy && lastResult.accuracy > 80 ? 'text-retro-green' : 'text-retro-red'}`}>
                                {lastResult?.accuracy.toFixed(0)}%
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-4 border-l-4 border-retro-yellow text-left mb-6">
                        <div className="flex items-center gap-2 mb-2 text-retro-yellow font-bold text-xs font-pixel">
                            <Terminal className="w-3 h-3" /> {t('aiAnalysis')}
                        </div>
                        {isFeedbackLoading ? (
                            <div className="flex gap-1 items-center text-slate-500 font-mono text-xs">
                                <span className="animate-pulse">{t('processing')}</span>
                            </div>
                        ) : (
                            <p className="text-slate-300 font-mono text-sm leading-relaxed tracking-tight">
                            {aiFeedback}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={() => setGameMode(GameMode.MENU)} variant="secondary" className="flex-1">
                            {t('menu')}
                        </Button>
                        <Button onClick={() => setGameMode(lastResult?.gameMode || GameMode.MENU)} className="flex-1">
                            {t('retry')}
                        </Button>
                    </div>
                </div>
            </Card>
          </div>
        );

      default:
        return (
          <Suspense fallback={<NeuralLoader message={t('loading')} />}>
             {gameMode === GameMode.PROBLEM && <LogicGame {...gameProps} />}
             {gameMode === GameMode.MEMORY && <MemoryGame {...gameProps} />}
             {gameMode === GameMode.SEQUENCE && <SequenceGame {...gameProps} />}
             {gameMode === GameMode.WORD && <WordGame {...gameProps} />}
             {gameMode === GameMode.N_BACK && <NBackGame {...gameProps} />}
             {gameMode === GameMode.COLOR_MATCH && <ColorMatchGame {...gameProps} />}
             {gameMode === GameMode.MATH_RUSH && <MathRushGame {...gameProps} />}
             {gameMode === GameMode.ANAGRAM && <AnagramGame {...gameProps} />}
             {gameMode === GameMode.VISUAL_SEARCH && <VisualSearchGame {...gameProps} />}
             {gameMode === GameMode.NAVIGATION && <NavigationGame {...gameProps} />}
             {gameMode === GameMode.TASK_SWITCH && <TaskSwitchGame {...gameProps} />}
             {gameMode === GameMode.PATHFINDING && <PathfindingGame {...gameProps} />}
          </Suspense>
        );
    }
  };

  return (
    <div className="min-h-screen bg-retro-bg text-retro-green font-sans selection:bg-retro-green selection:text-black overflow-x-hidden relative flex flex-col">
      <NeuralBackground />
      
      {/* Settings / Mute Fab */}
      <div className="fixed top-4 right-4 z-[100] flex gap-3">
          <Tooltip text={isMuted ? "UNMUTE" : "MUTE"} position="bottom">
            <button 
              onClick={() => { toggleMute(); setIsMuted(!isMuted); playSound('click'); }}
              className="w-10 h-10 bg-black border-2 border-slate-600 hover:border-retro-green hover:text-retro-green text-slate-400 flex items-center justify-center shadow-retro active:translate-y-1 active:shadow-none transition-none"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </Tooltip>
          
          <Tooltip text={t('settings')} position="bottom">
            <button 
              onClick={() => { setIsSettingsOpen(true); playSound('click'); }}
              className="w-10 h-10 bg-black border-2 border-slate-600 hover:border-retro-cyan hover:text-retro-cyan text-slate-400 flex items-center justify-center shadow-retro active:translate-y-1 active:shadow-none transition-none"
            >
              <Settings size={18} />
            </button>
          </Tooltip>
      </div>

      <main className="relative z-10 container mx-auto px-4 py-6 md:px-6 md:py-10 flex-1 flex flex-col justify-center">
        {renderContent()}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        language={language}
        setLanguage={(l) => { setLanguage(l); localStorage.setItem('neuro_lang', l); }}
        t={t}
      />
      <DifficultyModal 
        isOpen={pendingGameMode !== null} 
        onClose={() => setPendingGameMode(null)} 
        onSelect={handleDifficultySelect} 
      />
      
      <RetroToast 
        message={toast.message} 
        isVisible={toast.visible} 
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </div>
  );
};

export default App;
