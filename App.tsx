import React, { useState, useEffect, Suspense } from 'react';
import { GameMode, Difficulty, GameResult, User } from './types';
import { Button, Card, NeuralLoader, Toggle, Badge, Tooltip } from './components/Shared';
import { SettingsModal } from './components/SettingsModal';
import { DifficultyModal } from './components/DifficultyModal';
import { Confetti } from './components/Confetti';
import { WeeklyStats } from './components/WeeklyStats';
import { NeuralBackground } from './components/NeuralBackground';
import { RetroToast } from './components/RetroToast';
import { generateGameFeedback, generateWelcomeMessage } from './services/geminiService';
import { startMusic, stopMusic, playSound } from './services/audioService';
import { loginWithGoogle, logout, getCurrentUser, saveGameResult } from './services/authService';
import { Brain, Zap, Network, Trophy, ChevronRight, Lightbulb, Grid, Activity, BookOpen, Timer, Settings, RotateCcw, BrainCircuit, Eye, LogOut, Terminal, Calculator, Type, Scan, Compass, Shuffle } from 'lucide-react';

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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.WELCOME);
  
  // State to hold the specific game user clicked before difficulty selection
  const [pendingGameMode, setPendingGameMode] = useState<GameMode | null>(null);
  
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'info' | 'success' | 'warning' }>({
    visible: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setGameMode(GameMode.MENU);
    }

    const fetchWelcome = async () => {
      const msg = await generateWelcomeMessage();
      setWelcomeMessage(msg);
    };
    fetchWelcome();
  }, []);

  useEffect(() => {
    if (gameMode === GameMode.WELCOME || gameMode === GameMode.MENU || gameMode === GameMode.RESULT) {
      startMusic('MENU');
    }
    return () => {
      if (gameMode === GameMode.WELCOME || gameMode === GameMode.MENU) {
        stopMusic();
      }
    };
  }, [gameMode]);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setToast({ visible: true, message, type });
  };

  const handlePracticeToggle = (val: boolean) => {
    setIsPracticeMode(val);
    if (val) {
        showToast("MODE LATIHAN AKTIF: Nyawa tak terbatas, tanpa timer ketat.", 'success');
    } else {
        showToast("MODE KOMPETITIF AKTIF: Waktu berjalan, skor dicatat!", 'warning');
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 10);
  };

  const handleLogin = async () => {
    playSound('click');
    setIsAuthLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      setUser(loggedUser);
      setGameMode(GameMode.MENU);
      playSound('correct');
      showToast("Login Berhasil. Selamat datang kembali.", 'success');
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    playSound('click');
    await logout();
    setUser(null);
    setGameMode(GameMode.WELCOME);
  };

  const handleGameCardClick = (mode: GameMode) => {
    playSound('click');
    setPendingGameMode(mode);
  };

  const handleDifficultySelect = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    if (pendingGameMode) {
        stopMusic();
        setIsQuickMode(false);
        setGameMode(pendingGameMode);
        setPendingGameMode(null);
    }
  };

  const handleStartQuickGame = () => {
    stopMusic();
    let targetDifficulty = Difficulty.INTERMEDIATE;
    if (lastResult) {
      if (lastResult.accuracy >= 80) targetDifficulty = Difficulty.ADVANCED;
      else if (lastResult.accuracy < 40) targetDifficulty = Difficulty.BEGINNER;
    }
    setDifficulty(targetDifficulty);

    const modes = [
        GameMode.MEMORY, GameMode.SEQUENCE, GameMode.PROBLEM, GameMode.WORD, 
        GameMode.N_BACK, GameMode.COLOR_MATCH, GameMode.MATH_RUSH, 
        GameMode.ANAGRAM, GameMode.VISUAL_SEARCH, GameMode.NAVIGATION, GameMode.TASK_SWITCH
    ];
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    
    setIsQuickMode(true);
    setIsPracticeMode(false);
    setGameMode(randomMode);
    showToast("Quick Play dimulai! Mode acak dipilih.", 'info');
  };

  const handleEndGame = async (result: GameResult) => {
    const fullResult = { ...result, isPractice: isPracticeMode };
    setLastResult(fullResult);
    setGameMode(GameMode.RESULT);
    
    if (user && !isPracticeMode) {
      saveGameResult(user.id, fullResult);
    }

    if (result.accuracy >= 70) playSound('win');
    else playSound('wrong');
    
    setIsFeedbackLoading(true);
    setAiFeedback('');
    try {
        const feedback = await generateGameFeedback(fullResult);
        setAiFeedback(feedback);
    } catch (e) {
        setAiFeedback("Analisis selesai.");
    } finally {
        setIsFeedbackLoading(false);
    }
  };

  const resetGame = () => {
    setGameMode(GameMode.MENU);
    setLastResult(null);
    setIsQuickMode(false);
    setAiFeedback('');
    playSound('click');
  };

  const handlePlayAgain = () => {
    if (lastResult) {
        playSound('click');
        setGameMode(lastResult.gameMode);
    }
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-[90vh] w-full max-w-4xl mx-auto px-6 text-center relative z-10">
      <div className="mb-6 p-3 border-4 border-retro-green bg-black shadow-[8px_8px_0px_0px_rgba(51,255,0,0.5)]">
         <Brain className="w-16 h-16 md:w-20 md:h-20 text-retro-green animate-pulse mx-auto" />
      </div>
      
      <h1 className="text-3xl md:text-5xl font-pixel text-white mb-4 leading-relaxed text-shadow-retro">
        NeuroLatih<br/><span className="text-retro-green">8-BIT</span>
      </h1>
      
      <div className="mb-8 w-full max-w-lg border-2 border-slate-700 bg-black p-3 font-mono text-retro-cyan text-sm md:text-base">
         <div className="flex gap-2 mb-2 border-b border-slate-800 pb-2">
            <span className="text-retro-pink">root@system:~$</span>
            <span className="animate-pulse">_</span>
         </div>
         {welcomeMessage ? (
           <p className="leading-tight typing-effect">"{welcomeMessage}"</p>
         ) : (
           <div className="h-6 w-32 bg-retro-green/20 animate-pulse mx-auto"></div>
         )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button 
          onClick={handleLogin}
          disabled={isAuthLoading}
          className="retro-btn border-2 md:border-4 border-white bg-blue-600 hover:bg-blue-500 text-white font-pixel py-3 px-6 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] flex items-center justify-center gap-3 text-xs md:text-sm"
        >
           {isAuthLoading ? "MENGHUBUNGKAN..." : "MASUKKAN KOIN (LOGIN)"}
        </button>
      </div>
    </div>
  );

  const BentoItem = ({ title, desc, icon, color, onClick, colSpan = "col-span-1", rowSpan = "row-span-1" }: any) => {
    let borderClass = "border-white";
    let textClass = "text-white";
    
    switch(color) {
        case 'pink': borderClass = "border-retro-pink"; textClass = "text-retro-pink"; break;
        case 'purple': borderClass = "border-purple-500"; textClass = "text-purple-400"; break;
        case 'blue': borderClass = "border-retro-cyan"; textClass = "text-retro-cyan"; break;
        case 'emerald': borderClass = "border-retro-green"; textClass = "text-retro-green"; break;
        case 'indigo': borderClass = "border-indigo-400"; textClass = "text-indigo-300"; break;
        case 'orange': borderClass = "border-retro-yellow"; textClass = "text-retro-yellow"; break;
        case 'red': borderClass = "border-retro-red"; textClass = "text-retro-red"; break;
    }

    return (
      <div 
        onClick={onClick}
        className={`${colSpan} ${rowSpan} cursor-pointer bg-black border-2 md:border-4 ${borderClass} p-3 md:p-4 flex flex-col justify-between transition-transform active:scale-95 hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(50,50,50,0.5)] group min-h-[100px] md:min-h-[120px]`}
      >
          <div className="flex justify-between items-start">
             <div className={`${textClass} group-hover:animate-bounce transform scale-90 md:scale-100 origin-top-left`}>{icon}</div>
             <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-600 group-hover:text-white" />
          </div>
          <div>
              <h3 className={`font-pixel text-[8px] md:text-[10px] uppercase mb-0.5 md:mb-1 ${textClass}`}>{title}</h3>
              <p className="font-mono text-[10px] md:text-xs text-slate-400 leading-tight tracking-tight">{desc}</p>
          </div>
      </div>
    );
  };

  const renderMenu = () => (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-3 md:px-4 pb-20">
      
      {/* Header */}
      <header className={`w-full flex flex-col gap-3 py-3 mb-4 md:py-5 md:flex-row md:items-center md:justify-between sticky top-0 z-40 transition-all ${isScrolled ? 'bg-black/95 border-b-2 border-retro-green px-3 -mx-3 shadow-lg' : ''}`}>
        
        <div className="flex items-center justify-between w-full">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-retro-green border-2 md:border-4 border-white flex items-center justify-center overflow-hidden">
                   <img src={user?.avatarUrl} alt="Avatar" className="w-full h-full grayscale hover:grayscale-0" />
                </div>
                <div className="flex flex-col font-pixel">
                   <h1 className="text-[10px] md:text-xs text-white uppercase">PEMAIN 1</h1>
                   <span className="text-[10px] text-retro-green">{user?.name.split(' ')[0]}</span>
                </div>
             </div>

             <div className="flex items-center gap-2">
                <Tooltip text="PENGATURAN" position="bottom">
                  <button onClick={() => { setIsSettingsOpen(true); playSound('click'); }} className="p-1.5 md:p-2 border-2 border-slate-600 bg-black hover:bg-slate-800 text-slate-300">
                    <Settings className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </Tooltip>
                
                <Tooltip text="KELUAR" position="bottom">
                  <button onClick={handleLogout} className="p-1.5 md:p-2 border-2 border-retro-red bg-black hover:bg-retro-red hover:text-white text-retro-red">
                    <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </Tooltip>
             </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-end">
             <Toggle checked={isPracticeMode} onChange={handlePracticeToggle} label="LATIHAN" />
        </div>
      </header>

      {/* Grid - Adjusted for 11 Games */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        
        {/* Quick Start */}
        <div 
            onClick={handleStartQuickGame}
            className="col-span-2 row-span-1 md:row-span-1 cursor-pointer bg-retro-yellow/10 border-2 md:border-4 border-retro-yellow p-4 md:p-6 flex items-center justify-between text-center hover:bg-retro-yellow/20 transition-all shadow-[4px_4px_0px_0px_rgba(250,255,0,0.5)] relative overflow-hidden group"
        >
             <div className="text-left">
                <h2 className="font-pixel text-sm md:text-lg text-white mb-1">MAIN CEPAT</h2>
                <p className="font-mono text-[10px] md:text-xs text-retro-yellow">TANTANGAN ACAK</p>
             </div>
             <Zap className="w-8 h-8 md:w-10 md:h-10 text-retro-yellow group-hover:scale-110 transition-transform" />
             <div className="absolute top-0 left-0 w-full h-1 bg-retro-yellow animate-[glitch_2s_infinite]"></div>
        </div>

        {/* --- Memory & Focus --- */}
        <BentoItem title="POLA" desc="MEMORI" icon={<Grid className="w-5 h-5" />} color="pink" onClick={() => handleGameCardClick(GameMode.MEMORY)} />
        <BentoItem title="N-BACK" desc="MEMORI KERJA" icon={<BrainCircuit className="w-5 h-5" />} color="purple" onClick={() => handleGameCardClick(GameMode.N_BACK)} />
        
        {/* --- New Focus/Perception --- */}
        <BentoItem title="MATA ELANG" desc="PENCARIAN" icon={<Scan className="w-5 h-5" />} color="emerald" onClick={() => handleGameCardClick(GameMode.VISUAL_SEARCH)} />
        <BentoItem title="STROOP" desc="FOKUS" icon={<Eye className="w-5 h-5" />} color="blue" onClick={() => handleGameCardClick(GameMode.COLOR_MATCH)} />
        
        {/* --- Logic & Math --- */}
        <BentoItem title="DERET" desc="LOGIKA" icon={<Network className="w-5 h-5" />} color="indigo" onClick={() => handleGameCardClick(GameMode.SEQUENCE)} />
        {/* New Math Game */}
        <BentoItem title="MATH RUSH" desc="HITUNG CEPAT" icon={<Calculator className="w-5 h-5" />} color="red" onClick={() => handleGameCardClick(GameMode.MATH_RUSH)} />
        <BentoItem title="TEKA-TEKI" desc="PEMECAHAN MASALAH" icon={<Lightbulb className="w-5 h-5" />} color="indigo" colSpan="col-span-2" onClick={() => handleGameCardClick(GameMode.PROBLEM)} />

        {/* --- Verbal & Spatial --- */}
        <BentoItem title="ASOSIASI" desc="VERBAL" icon={<BookOpen className="w-5 h-5" />} color="orange" onClick={() => handleGameCardClick(GameMode.WORD)} />
        <BentoItem title="ANAGRAM" desc="KATA SANDI" icon={<Type className="w-5 h-5" />} color="pink" onClick={() => handleGameCardClick(GameMode.ANAGRAM)} />
        
        {/* New Game */}
        <BentoItem title="SWITCH" desc="MULTITASKING" icon={<Shuffle className="w-5 h-5" />} color="blue" onClick={() => handleGameCardClick(GameMode.TASK_SWITCH)} />
        
        <BentoItem title="NAVIGASI" desc="SPASIAL" icon={<Compass className="w-5 h-5" />} color="emerald" onClick={() => handleGameCardClick(GameMode.NAVIGATION)} />
        
        {/* Stats Panel */}
        <div className="col-span-2 md:col-span-4 bg-black border-2 md:border-4 border-slate-700 p-3 md:p-4 relative">
             <div className="absolute top-0 right-0 p-1 bg-slate-700 text-[8px] md:text-[10px] font-pixel text-white">MODUL_STATISTIK_V1.0</div>
             {user ? <WeeklyStats user={user} /> : <div>MEMUAT...</div>}
        </div>
      </div>
    </div>
  );

  const renderResult = () => {
    if (!lastResult) return null;
    const isWin = lastResult.accuracy >= 70;
    
    return (
      <div className="w-full max-w-lg mx-auto pb-10 pt-4 px-4 flex flex-col items-center">
        {isWin && <Confetti />}
        
        <div className="text-center mb-6 animate-fade-in-up">
            <h2 className={`text-3xl md:text-5xl font-pixel mb-3 text-shadow-retro ${isWin ? 'text-retro-yellow' : 'text-retro-red'}`}>
                {isWin ? 'SKOR TINGGI!' : 'GAME OVER'}
            </h2>
            <div className="inline-block border-2 border-white px-3 py-1 bg-black font-mono text-retro-cyan text-sm">
                {lastResult.gameMode} // {lastResult.difficulty}
            </div>
        </div>

        <div className="w-full bg-black border-2 md:border-4 border-white p-4 md:p-6 mb-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
            <div className="flex justify-between items-end border-b-2 border-dashed border-slate-600 pb-4 mb-4">
                <span className="font-pixel text-[10px] text-slate-400">AKURASI</span>
                <span className={`font-mono text-3xl md:text-4xl ${lastResult.accuracy < 50 ? 'text-retro-red' : 'text-retro-green'}`}>
                    {lastResult.accuracy.toFixed(0)}%
                </span>
            </div>
            <div className="flex justify-between items-end">
                <span className="font-pixel text-[10px] text-slate-400">SKOR</span>
                <span className="font-mono text-3xl md:text-4xl text-retro-yellow">{lastResult.score}</span>
            </div>
        </div>

        <div className="w-full bg-slate-900 border-2 border-slate-700 p-4 mb-6 font-mono text-xs md:text-sm leading-relaxed text-slate-300">
            <div className="flex items-center gap-2 mb-2 text-retro-green font-bold">
                <Terminal className="w-4 h-4" />
                <span>UMPAN_BALIK_AI:</span>
            </div>
            {isFeedbackLoading ? <NeuralLoader message="MENGANALISIS..." /> : <p className="typing-effect">{aiFeedback}</p>}
        </div>

        <div className="flex flex-col w-full gap-3">
            <Button onClick={handlePlayAgain} className="w-full py-3 bg-retro-green text-black hover:bg-white hover:text-black">
                ULANGI LEVEL
            </Button>
            <Button onClick={resetGame} variant="secondary" className="w-full py-3">
                MENU UTAMA
            </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-retro-dark text-retro-green selection:bg-retro-green selection:text-black font-mono overflow-x-hidden">
        <NeuralBackground />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <RetroToast 
            isVisible={toast.visible} 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(p => ({ ...p, visible: false }))} 
        />
        
        {/* Difficulty Selection Modal */}
        <DifficultyModal 
            isOpen={!!pendingGameMode} 
            onClose={() => setPendingGameMode(null)} 
            onSelect={handleDifficultySelect} 
        />

        <div className="relative z-10 w-full min-h-screen flex flex-col" onScroll={handleScroll}>
            {gameMode === GameMode.WELCOME && renderWelcome()}
            {gameMode === GameMode.MENU && renderMenu()}
            
            <div className={`flex-grow flex items-center justify-center ${gameMode !== GameMode.MENU ? 'px-3 py-4 md:px-4 md:py-6' : ''}`}>
               <Suspense fallback={<NeuralLoader />}>
                  {gameMode === GameMode.PROBLEM && <LogicGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                  {gameMode === GameMode.MEMORY && <MemoryGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                  {gameMode === GameMode.SEQUENCE && <SequenceGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                  {gameMode === GameMode.WORD && <WordGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                  {gameMode === GameMode.N_BACK && <NBackGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                  {gameMode === GameMode.COLOR_MATCH && <ColorMatchGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                  
                  {/* New Games */}
                  {gameMode === GameMode.MATH_RUSH && <MathRushGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                  {gameMode === GameMode.ANAGRAM && <AnagramGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                  {gameMode === GameMode.VISUAL_SEARCH && <VisualSearchGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                  {gameMode === GameMode.NAVIGATION && <NavigationGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                  {gameMode === GameMode.TASK_SWITCH && <TaskSwitchGame difficulty={difficulty} onEndGame={handleEndGame} onBack={resetGame} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
               </Suspense>

               {gameMode === GameMode.RESULT && renderResult()}
            </div>
        </div>
    </div>
  );
};

export default App;