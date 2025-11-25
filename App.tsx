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

  // --- DYNAMIC TITLE BAR LOGIC ---
  useEffect(() => {
    const baseTitle = "NeuroLatih 8-BIT";
    let intervalId: any;

    const getGameTitle = (mode: GameMode): string => {
      switch (mode) {
        case GameMode.MEMORY: return "👾 Memori Pola";
        case GameMode.SEQUENCE: return "🔢 Deret Logika";
        case GameMode.PROBLEM: return "💡 Teka-Teki";
        case GameMode.WORD: return "📚 Asosiasi Kata";
        case GameMode.N_BACK: return "🧠 N-Back Memory";
        case GameMode.COLOR_MATCH: return "👁️ Fokus Stroop";
        case GameMode.MATH_RUSH: return "➕ Math Rush";
        case GameMode.ANAGRAM: return "🔡 Anagram";
        case GameMode.VISUAL_SEARCH: return "🔍 Mata Elang";
        case GameMode.NAVIGATION: return "🧭 Navigasi";
        case GameMode.TASK_SWITCH: return "🔀 Quantum Switch";
        default: return "Game";
      }
    };

    const updateTitle = () => {
      clearInterval(intervalId);

      if (document.hidden) {
         document.title = "Jgn Lupa Latihan! 🧠";
         return;
      }

      if (gameMode === GameMode.WELCOME) {
        let blink = true;
        intervalId = setInterval(() => {
          document.title = blink ? `${baseTitle} | Asah Otak_` : `${baseTitle} | Tes IQ`;
          blink = !blink;
        }, 1000);
      } else if (gameMode === GameMode.MENU) {
         document.title = `[ MENU ] Pilih Tantangan | ${baseTitle}`;
      } else if (gameMode === GameMode.RESULT) {
         document.title = `[ HASIL ] Skor Latihan | ${baseTitle}`;
      } else {
        const modeName = getGameTitle(gameMode);
        document.title = `${modeName} | ${baseTitle}`;
      }
    };

    const handleVisibilityChange = () => {
       updateTitle();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    updateTitle();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [gameMode]);

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
      // Don't stop music here, let the game component handle it or transition
    };
  }, [gameMode]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async () => {
    setIsAuthLoading(true);
    playSound('click');
    const user = await loginWithGoogle();
    setUser(user);
    setIsAuthLoading(false);
    setGameMode(GameMode.MENU);
    setToast({ visible: true, message: `Login Berhasil: ${user.name}`, type: 'success' });
  };

  const handleLogout = async () => {
    playSound('click');
    await logout();
    setUser(null);
    setGameMode(GameMode.WELCOME);
    setToast({ visible: true, message: "Anda telah logout.", type: 'info' });
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
    
    // Save locally
    if (user && !result.isPractice) {
        saveGameResult(user.id, result);
    }

    setIsFeedbackLoading(true);
    try {
      const feedback = await generateGameFeedback(result);
      setAiFeedback(feedback);
    } catch (error) {
      console.error(error);
      setAiFeedback("Koneksi Neural Terputus. Tidak dapat menganalisis data.");
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const renderContent = () => {
    switch (gameMode) {
      case GameMode.WELCOME:
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fade-in px-4">
            <div className="mb-8 relative group cursor-default">
               <div className="absolute -inset-1 bg-gradient-to-r from-retro-green via-retro-cyan to-retro-pink opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
               <div className="relative bg-black border-4 border-white p-6 md:p-8 transform transition-transform group-hover:scale-105">
                 <h1 className="text-4xl md:text-7xl font-pixel text-retro-green mb-2 text-shadow-glow">NEUROLATIH</h1>
                 <p className="text-sm md:text-xl font-mono text-retro-cyan tracking-[0.5em] animate-pulse">8-BIT EDITION</p>
               </div>
            </div>
            
            <p className="max-w-md text-slate-300 mb-8 font-mono text-sm md:text-base leading-relaxed bg-black/50 p-4 rounded border border-white/10">
              <span className="text-retro-green">{">"}</span> {welcomeMessage || "Inisialisasi sistem..."}<span className="animate-blink">_</span>
            </p>

            <Button onClick={handleLogin} isLoading={isAuthLoading} className="text-lg md:text-xl py-4 px-8 md:px-12 shadow-[0_0_20px_rgba(51,255,0,0.4)] animate-bounce-slow">
              {isAuthLoading ? "MENGHUBUNGKAN..." : "MULAI LATIHAN"}
            </Button>
            
            <div className="mt-12 grid grid-cols-3 gap-4 md:gap-8 text-center opacity-70">
                <div>
                    <Brain className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 text-retro-pink" />
                    <p className="text-[10px] md:text-xs font-pixel text-retro-pink">MEMORI</p>
                </div>
                <div>
                    <Zap className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 text-retro-yellow" />
                    <p className="text-[10px] md:text-xs font-pixel text-retro-yellow">REFLEKS</p>
                </div>
                <div>
                    <Network className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 text-retro-cyan" />
                    <p className="text-[10px] md:text-xs font-pixel text-retro-cyan">LOGIKA</p>
                </div>
            </div>
          </div>
        );

      case GameMode.MENU:
        return (
          <div className="w-full max-w-5xl mx-auto animate-fade-in pb-20">
            <div className="text-center mb-8 md:mb-12 animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl font-pixel text-transparent bg-clip-text bg-gradient-to-b from-retro-green to-emerald-600 mb-4 filter drop-shadow-[0_0_10px_rgba(51,255,0,0.5)]">
                NEUROLATIH
                <span className="text-sm md:text-xl block text-retro-cyan mt-2 tracking-[0.5em] font-sans">8-BIT EDITION</span>
              </h1>
              
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-400 bg-black/40 inline-block px-4 py-2 rounded-full border border-white/10">
                 <span>STATUS: <span className="text-emerald-400">ONLINE</span></span>
                 <span>|</span>
                 <span>USER: <span className="text-retro-yellow uppercase">{user?.name}</span></span>
              </div>
            </div>

            {/* Quick Stats & Toggles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Stats Widget */}
                <div className="lg:col-span-2">
                   <Card className="h-full bg-slate-900/80 border-slate-700 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                         <Activity className="w-24 h-24 text-retro-green" />
                      </div>
                      {user && <WeeklyStats user={user} />}
                   </Card>
                </div>

                {/* Toggles */}
                <Card className="flex flex-col justify-center gap-4 bg-slate-900/80 border-slate-700">
                    <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                        <Settings className="w-4 h-4 text-retro-cyan" />
                        <span className="text-xs font-bold text-slate-300 uppercase">Konfigurasi Misi</span>
                    </div>
                    
                    <Toggle 
                        checked={isQuickMode} 
                        onChange={setIsQuickMode} 
                        label="⚡ Mode Cepat (Timer 2x Cepat)" 
                    />
                    <Toggle 
                        checked={isPracticeMode} 
                        onChange={setIsPracticeMode} 
                        label="🛡️ Mode Latihan (No Fail)" 
                    />
                </Card>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-retro-green pl-3">
               <Grid className="w-5 h-5 text-retro-green" /> PILIH MODUL LATIHAN
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Game Cards */}
              {[
                { id: GameMode.MEMORY, name: "Memori Pola", desc: "Ingat urutan kotak yang menyala.", icon: <BrainCircuit className="w-8 h-8 text-pink-500" />, color: "border-pink-500 hover:bg-pink-900/20" },
                { id: GameMode.SEQUENCE, name: "Deret Logika", desc: "Tebak angka selanjutnya.", icon: <Network className="w-8 h-8 text-emerald-500" />, color: "border-emerald-500 hover:bg-emerald-900/20" },
                { id: GameMode.PROBLEM, name: "Teka-Teki", desc: "Pecahkan masalah logika lateral.", icon: <Lightbulb className="w-8 h-8 text-indigo-500" />, color: "border-indigo-500 hover:bg-indigo-900/20" },
                { id: GameMode.WORD, name: "Asosiasi Kata", desc: "Temukan hubungan antar kata.", icon: <BookOpen className="w-8 h-8 text-orange-500" />, color: "border-orange-500 hover:bg-orange-900/20" },
                { id: GameMode.N_BACK, name: "N-Back", desc: "Tes Working Memory tingkat lanjut.", icon: <RotateCcw className="w-8 h-8 text-purple-500" />, color: "border-purple-500 hover:bg-purple-900/20" },
                { id: GameMode.COLOR_MATCH, name: "Fokus Stroop", desc: "Latih inhibisi dan fokus.", icon: <Eye className="w-8 h-8 text-blue-500" />, color: "border-blue-500 hover:bg-blue-900/20" },
                { id: GameMode.MATH_RUSH, name: "Math Rush", desc: "Hitung cepat di bawah tekanan.", icon: <Calculator className="w-8 h-8 text-teal-500" />, color: "border-teal-500 hover:bg-teal-900/20" },
                { id: GameMode.ANAGRAM, name: "Anagram", desc: "Susun kata yang teracak.", icon: <Type className="w-8 h-8 text-rose-500" />, color: "border-rose-500 hover:bg-rose-900/20" },
                { id: GameMode.VISUAL_SEARCH, name: "Mata Elang", desc: "Temukan objek yang berbeda.", icon: <Scan className="w-8 h-8 text-lime-500" />, color: "border-lime-500 hover:bg-lime-900/20" },
                { id: GameMode.NAVIGATION, name: "Navigasi", desc: "Latih orientasi spasial arah.", icon: <Compass className="w-8 h-8 text-amber-500" />, color: "border-amber-500 hover:bg-amber-900/20" },
                { id: GameMode.TASK_SWITCH, name: "Switch", desc: "Uji fleksibilitas kognitif.", icon: <Shuffle className="w-8 h-8 text-cyan-500" />, color: "border-cyan-500 hover:bg-cyan-900/20" },
              ].map((game) => (
                <Card 
                  key={game.id} 
                  onClick={() => handleGameSelect(game.id)}
                  className={`group cursor-pointer transition-all hover:scale-105 active:scale-95 ${game.color} border-l-4 bg-slate-900/50`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-black rounded-lg border border-white/10 group-hover:border-white/30 transition-colors">
                        {game.icon}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-retro-green transition-colors">{game.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">{game.desc}</p>
                </Card>
              ))}
            </div>
            
            <div className="mt-12 text-center">
               <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-400 hover:underline flex items-center justify-center gap-2 mx-auto">
                 <LogOut className="w-3 h-3" /> LOGOUT SYSTEM
               </button>
            </div>
          </div>
        );

      case GameMode.RESULT:
        return (
          <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
            <Card className="border-t-8 border-t-retro-green bg-slate-900">
              <div className="text-center mb-8">
                <Trophy className="w-20 h-20 text-retro-yellow mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <h2 className="text-3xl font-pixel text-white mb-2">LATIHAN SELESAI</h2>
                <div className="inline-block bg-slate-800 px-4 py-1 rounded-full border border-slate-700">
                   <p className="text-xs font-mono text-slate-400">MODUL: {lastResult?.gameMode}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Skor Akhir</p>
                  <p className="text-4xl font-mono font-bold text-retro-green">{lastResult?.score}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Akurasi</p>
                  <p className={`text-4xl font-mono font-bold ${lastResult && lastResult.accuracy >= 80 ? 'text-retro-cyan' : 'text-retro-red'}`}>
                    {lastResult?.accuracy.toFixed(0)}%
                  </p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Waktu</p>
                  <p className="text-2xl font-mono font-bold text-white">{(lastResult?.duration || 0) / 1000}s</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Kesulitan</p>
                  <p className="text-lg font-mono font-bold text-retro-pink uppercase">{lastResult?.difficulty}</p>
                </div>
              </div>

              <div className="bg-black/50 p-6 rounded-lg border border-white/10 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-retro-green"></div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-retro-green" /> ANALISIS AI
                </h3>
                {isFeedbackLoading ? (
                  <NeuralLoader message="MENGANALISIS DATA SARAF..." />
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="font-mono text-slate-300 leading-relaxed typing-effect">
                        {aiFeedback}
                    </p>
                    {lastResult?.mistakePatterns && lastResult.mistakePatterns.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs text-red-400 font-bold mb-2">POLA KESALAHAN TERDETEKSI:</p>
                            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                                {[...new Set(lastResult.mistakePatterns)].map((m, i) => (
                                    <li key={i}>{m}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setGameMode(GameMode.MENU)} className="flex-1">
                  KEMBALI KE MENU
                </Button>
                <Button onClick={() => setGameMode(lastResult?.gameMode || GameMode.MENU)} className="flex-1">
                  ULANGI MISI
                </Button>
              </div>
            </Card>
          </div>
        );

      default:
        return (
          <Suspense fallback={
             <div className="flex h-[50vh] items-center justify-center">
                <NeuralLoader message="MEMUAT MODUL GAME..." />
             </div>
          }>
            <div className="animate-fade-in w-full flex justify-center">
                {gameMode === GameMode.PROBLEM && <LogicGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                {gameMode === GameMode.MEMORY && <MemoryGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                {gameMode === GameMode.SEQUENCE && <SequenceGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                {gameMode === GameMode.WORD && <WordGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                {gameMode === GameMode.N_BACK && <NBackGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                {gameMode === GameMode.COLOR_MATCH && <ColorMatchGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                {gameMode === GameMode.MATH_RUSH && <MathRushGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                {gameMode === GameMode.ANAGRAM && <AnagramGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                {gameMode === GameMode.VISUAL_SEARCH && <VisualSearchGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                {gameMode === GameMode.NAVIGATION && <NavigationGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
                {gameMode === GameMode.TASK_SWITCH && <TaskSwitchGame difficulty={difficulty} onEndGame={handleEndGame} onBack={() => setGameMode(GameMode.MENU)} isQuickMode={isQuickMode} isPracticeMode={isPracticeMode} />}
            </div>
          </Suspense>
        );
    }
  };

  return (
    <main className="min-h-screen bg-retro-dark text-white font-sans selection:bg-retro-green selection:text-black overflow-x-hidden relative">
      <NeuralBackground />
      
      {/* Dynamic Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 border-b border-white/10 py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
            {/* Logo Small (Only visible when scrolled or in game) */}
            <div className={`transition-opacity duration-300 ${isScrolled || (gameMode !== GameMode.WELCOME && gameMode !== GameMode.MENU) ? 'opacity-100' : 'opacity-0'} flex items-center gap-2`}>
                <div className="w-6 h-6 bg-retro-green rounded-sm animate-pulse"></div>
                <span className="font-pixel text-xs md:text-sm text-white">NEURO<span className="text-retro-green">LATIH</span></span>
            </div>

            <nav className="flex items-center gap-4 ml-auto">
                <Button variant="ghost" onClick={() => setIsSettingsOpen(true)} className="!p-2">
                    <Settings className="w-5 h-5 text-slate-300 hover:text-white" />
                </Button>
                {user && (
                    <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-pixel">OPERATOR</p>
                            <p className="text-xs font-bold text-retro-green">{user.name}</p>
                        </div>
                        <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded border border-retro-green bg-black" />
                    </div>
                )}
            </nav>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 pt-20 pb-4 min-h-screen flex flex-col">
        {renderContent()}
      </div>

      <RetroToast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      <DifficultyModal 
        isOpen={pendingGameMode !== null} 
        onClose={() => setPendingGameMode(null)}
        onSelect={handleDifficultySelect}
      />
    </main>
  );
};

export default App;