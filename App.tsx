
import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { GameMode, Difficulty, GameResult, UserProfile, FontSize, Language, Theme } from './types';
import { NeuralLoader, Tooltip } from './components/Shared';
import { SettingsModal } from './components/SettingsModal';
import { DifficultyModal } from './components/DifficultyModal';
import { GameInfoModal } from './components/GameInfoModal';
import { NeuralBackground } from './components/NeuralBackground';
import { RetroToast } from './components/RetroToast';
import { UsernameModal } from './components/UsernameModal';
import { AchievementsModal } from './components/AchievementsModal';
import { generateGameFeedback } from './services/geminiService';
import { startMusic, stopMusic, playSound, toggleMute, getIsMuted } from './services/audioService';
import { getUserProfile, registerUser, saveGameResult } from './services/authService';
import { getTranslation } from './services/languageService';
import { Volume2, VolumeX, Settings } from 'lucide-react';

// Screens
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { MenuScreen } from './components/screens/MenuScreen';
import { ResultScreen } from './components/screens/ResultScreen';
import { AboutScreen } from './components/screens/AboutScreen';

// Lazy Games
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
  // Global State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.WELCOME);
  const [language, setLanguage] = useState<Language>('ID');
  const [theme, setTheme] = useState<Theme>('DARK');
  const [isMuted, setIsMuted] = useState(false);
  
  // Game Config State
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [pendingGameMode, setPendingGameMode] = useState<GameMode | null>(null);

  // Result State
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  // Modal Visibility State
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'info' | 'success' | 'warning' }>({
    visible: false, message: '', type: 'info'
  });

  const t = (key: string) => getTranslation(language, key);

  // --- INITIALIZATION ---
  useEffect(() => {
    setIsMuted(getIsMuted());
    
    // Load Language
    const savedLang = localStorage.getItem('neuro_lang') as Language;
    if (savedLang) setLanguage(savedLang);
    
    // Load Theme
    const savedTheme = localStorage.getItem('neuro_theme') as Theme;
    if (savedTheme) setTheme(savedTheme);

    // Load Font Size
    const savedFont = localStorage.getItem('neuro_font_size') as FontSize;
    if (savedFont) {
        const sizeMap: Record<FontSize, string> = { 'SMALL': '14px', 'MEDIUM': '16px', 'LARGE': '20px' };
        document.documentElement.style.fontSize = sizeMap[savedFont];
    }
    
    const existingProfile = getUserProfile();
    if (existingProfile) setProfile(existingProfile);
  }, []);

  // Apply Theme Class
  useEffect(() => {
    if (theme === 'LIGHT') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    localStorage.setItem('neuro_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (gameMode === GameMode.WELCOME || gameMode === GameMode.MENU || gameMode === GameMode.RESULT || gameMode === GameMode.ABOUT) {
      startMusic('MENU');
    }
  }, [gameMode]);

  // --- HANDLERS ---
  const handleStartSystem = useCallback(() => {
    playSound('click');
    const existingProfile = getUserProfile();
    if (existingProfile) {
        setProfile(existingProfile);
        setGameMode(GameMode.MENU);
        setToast({ visible: true, message: `WELCOME BACK, ${existingProfile.username}`, type: 'success' });
    } else {
        if (localStorage.getItem('neuro_user_profile_v1')) {
             setToast({ visible: true, message: 'SECURITY WARNING: DATA CORRUPTED.', type: 'warning' });
        }
        setShowUsernameModal(true);
    }
  }, []);

  const handleRegister = useCallback((username: string) => {
      const newProfile = registerUser(username);
      setProfile(newProfile);
      setShowUsernameModal(false);
      setGameMode(GameMode.MENU);
      setToast({ visible: true, message: `NEURAL LINK ESTABLISHED`, type: 'success' });
  }, []);

  const handleGameSelect = useCallback((mode: GameMode) => {
    playSound('click');
    setPendingGameMode(mode);
    setShowInfoModal(true);
  }, []);

  const handleInfoProceed = useCallback(() => {
    setShowInfoModal(false);
    setShowDifficultyModal(true);
  }, []);

  const handleDifficultySelect = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setShowDifficultyModal(false);
    if (pendingGameMode) {
      setGameMode(pendingGameMode);
      setPendingGameMode(null);
    }
  }, [pendingGameMode]);

  const handleEndGame = useCallback(async (result: GameResult) => {
    let finalResult = result;
    if (!result.isPractice) {
        try {
            const { updatedProfile, result: savedResult } = saveGameResult(result);
            setProfile(updatedProfile);
            finalResult = savedResult;
            if (savedResult.newAchievements?.length) {
                savedResult.newAchievements.forEach((ach, i) => {
                    setTimeout(() => {
                        setToast({ visible: true, message: `🏆 UNLOCKED: ${ach.title}`, type: 'warning' });
                        playSound('correct');
                    }, i * 2000);
                });
            }
        } catch (e) {
            setToast({ visible: true, message: "SAVE ERROR", type: 'warning' });
        }
    }
    setLastResult(finalResult);
    setGameMode(GameMode.RESULT);
    setIsFeedbackLoading(true);
    try {
      const feedback = await generateGameFeedback(finalResult);
      setAiFeedback(feedback);
    } catch {
      setAiFeedback("CONNECTION_LOST");
    } finally {
      setIsFeedbackLoading(false);
    }
  }, []);

  // --- RENDER CONTENT SWITCHER ---
  const renderContent = () => {
    switch (gameMode) {
      case GameMode.WELCOME:
        return (
          <WelcomeScreen 
            onStart={handleStartSystem} 
            onAbout={() => setGameMode(GameMode.ABOUT)}
            language={language}
            text={{ welcome: t('welcome'), startSystem: t('startSystem'), aboutSystem: t('aboutSystem') }} 
          />
        );
      case GameMode.ABOUT:
        return (
          <AboutScreen 
            onBack={() => { playSound('click'); setGameMode(GameMode.WELCOME); }} 
            language={language} 
          />
        );
      case GameMode.MENU:
        return (
          <MenuScreen 
            profile={profile}
            onGameSelect={handleGameSelect}
            onLogout={() => setGameMode(GameMode.WELCOME)}
            onAchievementsOpen={() => setIsAchievementsOpen(true)}
            t={t}
            difficulty={difficulty}
            isQuickMode={isQuickMode}
            setIsQuickMode={setIsQuickMode}
            isPracticeMode={isPracticeMode}
            setIsPracticeMode={setIsPracticeMode}
            theme={theme}
            setTheme={setTheme}
          />
        );
      case GameMode.RESULT:
        return (
          <ResultScreen 
             lastResult={lastResult}
             aiFeedback={aiFeedback}
             isFeedbackLoading={isFeedbackLoading}
             onMenu={() => setGameMode(GameMode.MENU)}
             onRetry={() => setGameMode(lastResult?.gameMode || GameMode.MENU)}
             t={t}
          />
        );
      default:
        // Render Active Game
        const gameProps = {
            difficulty,
            onEndGame: handleEndGame,
            onBack: () => setGameMode(GameMode.MENU),
            isQuickMode,
            isPracticeMode,
            language
        };
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
    <div className="min-h-screen bg-retro-bg text-retro-green font-sans selection:bg-retro-green selection:text-black overflow-x-hidden relative flex flex-col transition-colors duration-300">
      <NeuralBackground />
      
      {/* Global Floating Controls */}
      {gameMode === GameMode.MENU && (
        <div className="fixed top-4 right-4 z-[90] flex gap-3">
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
      )}

      <main className="relative z-10 container mx-auto px-4 py-6 md:px-6 md:py-10 flex-1 flex flex-col justify-center">
        {renderContent()}
      </main>

      {/* Global Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        language={language}
        setLanguage={(l) => { setLanguage(l); localStorage.setItem('neuro_lang', l); }}
        theme={theme}
        setTheme={setTheme}
        t={t}
      />
      <GameInfoModal
        isOpen={showInfoModal}
        gameMode={pendingGameMode}
        onProceed={handleInfoProceed}
        onClose={() => { setShowInfoModal(false); setPendingGameMode(null); }}
      />
      <DifficultyModal 
        isOpen={showDifficultyModal} 
        onClose={() => { setShowDifficultyModal(false); setPendingGameMode(null); }} 
        onSelect={handleDifficultySelect} 
      />
      <UsernameModal isOpen={showUsernameModal} onSubmit={handleRegister} />
      {profile && <AchievementsModal isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} profile={profile} />}
      <RetroToast message={toast.message} isVisible={toast.visible} type={toast.type} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />
    </div>
  );
};

export default App;
