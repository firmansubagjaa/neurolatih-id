
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, AIQuestion, GameResult, GameMode } from '../../types';
import { generateSequencePuzzle } from '../../services/geminiService';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, NeuralLoader } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Network, CheckCircle, HelpCircle, XCircle, Zap, TrendingUp, Layers, Shuffle } from 'lucide-react';

interface SequenceGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

type LogicMode = 'LINEAR' | 'COMPLEX' | 'CHAOS';

const SequenceGame: React.FC<SequenceGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [viewState, setViewState] = useState<'SELECT' | 'GAME'>('SELECT');
  const [logicMode, setLogicMode] = useState<LogicMode>('LINEAR');

  const [introFinished, setIntroFinished] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [gameActive, setGameActive] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Difficulty Scaling: Time Limit
  const getTimeLimit = () => {
    switch (difficulty) {
      case Difficulty.BEGINNER: return 60;
      case Difficulty.INTERMEDIATE: return 45;
      case Difficulty.ADVANCED: return 30;
      default: return 60;
    }
  };
  const TOTAL_TIME = getTimeLimit();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  const isMountedRef = useRef(true);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNextQuestion = useCallback(async () => {
    setLoading(true);
    setSelectedOption(null);
    setShowConfetti(false);
    setShowExplanation(false);
    
    try {
      // Pass the selected logicMode to the generator
      const q = await generateSequencePuzzle(difficulty, logicMode);
      if (isMountedRef.current) {
        setCurrentQuestion(q);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [difficulty, logicMode]);

  // Initial Setup
  useEffect(() => {
    isMountedRef.current = true;
    startMusic('FOCUS');
    
    return () => {
      isMountedRef.current = false;
      stopMusic();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Hardcore Timer Logic
  useEffect(() => {
    if (viewState === 'GAME' && !isPracticeMode && gameActive && introFinished && !showTutorial && !showQuitModal && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const decrement = isQuickMode ? 0.2 : 0.1;
          const newVal = Math.max(0, prev - decrement);
          if (newVal <= 0) {
            handleFinish();
            return 0;
          }
          return newVal;
        });
      }, 100);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState, gameActive, introFinished, showTutorial, showQuitModal, timeLeft, isPracticeMode, isQuickMode]);

  const startGame = (mode: LogicMode) => {
      setLogicMode(mode);
      setViewState('GAME');
      setIntroFinished(false);
      setTimeLeft(TOTAL_TIME);
      fetchNextQuestion();
  };

  const handleNext = () => {
    if (!isPracticeMode && timeLeft <= 0) {
      handleFinish();
    } else {
      fetchNextQuestion();
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null || (!isPracticeMode && timeLeft <= 0)) return;
    setSelectedOption(index);
    setQuestionsAnswered(prev => prev + 1);
    
    if (currentQuestion && index === currentQuestion.correctAnswerIndex) {
      setScore(s => s + 100);
      playSound('correct');
      setShowConfetti(true);
    } else {
      playSound('wrong');
    }
    setShowExplanation(true);

    // AUTO ADVANCE
    setTimeout(() => {
      if (isMountedRef.current && gameActive) {
        handleNext();
      }
    }, 1500); // Slightly longer to read explanation
  };

  const handleFinish = () => {
    if (!isMountedRef.current) return;
    setGameActive(false);
    playSound('win');
    stopMusic();
    
    onEndGame({
      score: score,
      totalQuestions: questionsAnswered,
      correctAnswers: score / 100,
      accuracy: questionsAnswered > 0 ? (score / 100) / questionsAnswered * 100 : 0,
      duration: (TOTAL_TIME - timeLeft) * 1000,
      difficulty: difficulty,
      gameMode: GameMode.SEQUENCE
    });
  };

  const handleBackRequest = () => {
    playSound('click');
    if (isPracticeMode) {
      handleFinish();
    } else {
      setShowQuitModal(true);
    }
  };

  const handleConfirmQuit = () => {
    setShowQuitModal(false);
    onBack();
  };

  if (!gameActive) return null;

  // --- SELECT SCREEN ---
  if (viewState === 'SELECT') {
      return (
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                 <Button variant="ghost" onClick={onBack}>&larr; LOGIC MODULES</Button>
                 <Badge color="bg-retro-green">SEQUENCE</Badge>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                     { id: 'LINEAR', name: "LINEAR", sub: "Aritmatika", icon: <TrendingUp />, desc: "Pola dasar: +, -, x." },
                     { id: 'COMPLEX', name: "COMPLEX", sub: "Abstrak", icon: <Layers />, desc: "Fibonacci, Prima, Pangkat." },
                     { id: 'CHAOS', name: "CHAOS", sub: "Multilayer", icon: <Shuffle />, desc: "Dua pola selang-seling." },
                 ].map((m) => (
                     <Card 
                        key={m.id} 
                        onClick={() => startGame(m.id as LogicMode)} 
                        className="cursor-pointer hover:border-retro-green hover:-translate-y-1 transition-all group"
                     >
                         <div className="flex items-center gap-3 mb-2">
                             <div className="text-retro-green group-hover:scale-110 transition-transform">{m.icon}</div>
                             <div>
                                <h3 className="font-pixel text-sm">{m.name}</h3>
                                <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-300">{m.sub}</span>
                             </div>
                         </div>
                         <p className="text-xs text-slate-400 font-mono leading-tight">{m.desc}</p>
                     </Card>
                 ))}
             </div>
        </div>
      );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 relative">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.SEQUENCE} 
          onStart={() => {
            playSound('click');
            setIntroFinished(true);
            setShowTutorial(true);
          }} 
        />
      )}

      {showConfetti && <Confetti />}
      <TutorialOverlay 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)}
        title={`Cara Bermain: ${logicMode}`}
        content={[
          "Analisis deret angka yang muncul.",
          "Temukan pola logikanya (Misal: +2, x3, Fibonacci).",
          ...(isQuickMode ? ["MODE CEPAT: Waktu berkurang 2x lebih cepat!"] : []), 
          "Pilih angka selanjutnya yang benar."
        ]}
        icon={<Network className="w-6 h-6" />}
      />

      <QuitModal 
        isOpen={showQuitModal}
        onConfirm={handleConfirmQuit}
        onCancel={() => setShowQuitModal(false)}
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="ghost" onClick={handleBackRequest} className="!px-3 text-sm">
            &larr; Mode
          </Button>
          <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400 hover:text-white text-sm">
            <HelpCircle className="w-5 h-5 mr-2" /> Info
          </Button>
        </div>
        <div className="flex gap-2 md:gap-4">
          {isQuickMode && <Badge color="bg-yellow-500 animate-pulse text-black"><Zap className="w-3 h-3 mr-1 inline" /> SPEED</Badge>}
          <Badge color="bg-emerald-500">{logicMode}</Badge>
          <Badge color="bg-cyan-500">Skor: {score}</Badge>
        </div>
      </div>

      <div className="relative min-h-[450px]">
        {/* Global Timer Bar */}
        <Card className="mb-6 py-3 px-4 bg-slate-800/80 border-slate-700">
           <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
        </Card>

        {/* Large Prominent Timer */}
        {!isPracticeMode && (
          <div className="flex justify-center mb-6">
            <div className={`text-6xl md:text-8xl font-mono font-bold tracking-tighter transition-all duration-300 ${
                timeLeft <= 10 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse scale-110' : 
                timeLeft <= 20 ? 'text-yellow-400' : 'text-white'
            }`}>
              {timeLeft.toFixed(1)}
            </div>
          </div>
        )}

        {loading ? (
          <Card className="flex flex-col items-center justify-center h-80 animate-pulse">
            <NeuralLoader message="Menyusun angka acak..." />
            {!isPracticeMode && <p className="text-sm text-slate-500 mt-4 animate-pulse">Waktu terus berjalan...</p>}
          </Card>
        ) : currentQuestion ? (
          <Card key={currentQuestion.question} className="border-t-4 border-t-emerald-500 animate-fade-in-up p-8">
            
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="p-4 bg-emerald-900/30 rounded-full mb-4 ring-2 ring-emerald-500/20">
                <Network className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-3xl md:text-4xl font-mono font-bold text-white leading-relaxed bg-slate-800/50 px-8 py-5 rounded-xl border border-white/5 w-full">
                {currentQuestion.question}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
              {currentQuestion.options.map((option, idx) => {
                let btnClass = "p-6 md:p-8 rounded-xl border-2 border-white/10 transition-all hover:bg-white/5 flex items-center justify-center gap-3 text-2xl md:text-3xl font-bold";
                
                if (selectedOption !== null) {
                  if (idx === currentQuestion.correctAnswerIndex) {
                    btnClass = "p-6 md:p-8 rounded-xl border-2 border-emerald-500 bg-emerald-500/20 text-emerald-100 glow-success text-2xl md:text-3xl font-bold";
                  } else if (idx === selectedOption) {
                    btnClass = "p-6 md:p-8 rounded-xl border-2 border-red-500 bg-red-500/20 text-red-100 text-2xl md:text-3xl font-bold";
                  } else {
                    btnClass = "p-6 md:p-8 rounded-xl border-2 border-white/5 opacity-30 text-2xl md:text-3xl font-bold";
                  }
                } else {
                    btnClass += " cursor-pointer hover:border-emerald-400 hover:scale-105 active:scale-95";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedOption !== null}
                    className={btnClass}
                  >
                    {option}
                    {(selectedOption !== null) && idx === currentQuestion.correctAnswerIndex && (
                       <CheckCircle className="w-6 h-6" />
                    )}
                     {selectedOption !== null && idx === selectedOption && idx !== currentQuestion.correctAnswerIndex && (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="animate-fade-in mb-2">
                 <div className={`p-4 rounded-lg text-base md:text-lg text-center border-2 ${selectedOption === currentQuestion.correctAnswerIndex ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-200' : 'bg-red-900/20 border-red-500/30 text-red-200'}`}>
                    {currentQuestion.explanation}
                 </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="text-center text-red-400">Gagal memuat pertanyaan.</div>
        )}
      </div>
    </div>
  );
};

export default SequenceGame;
