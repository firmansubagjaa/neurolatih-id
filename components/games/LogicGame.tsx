import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, AIQuestion, GameResult, GameMode } from '../../types';
import { generateRiddle } from '../../services/geminiService';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, NeuralLoader } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { CheckCircle, XCircle, Lightbulb, HelpCircle, Zap } from 'lucide-react';

interface LogicGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

const LogicGame: React.FC<LogicGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  
  // GLOBAL TIMER STATE
  const TOTAL_TIME = 50;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  
  const isMountedRef = useRef(true);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNextQuestion = useCallback(async () => {
    setLoading(true);
    setSelectedOption(null);
    setShowExplanation(false);
    setShowConfetti(false);
    
    try {
      const q = await generateRiddle(difficulty);
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
  }, [difficulty]);

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('FOCUS'); // Focus/Analysis Music
    fetchNextQuestion(); 
    
    return () => {
      isMountedRef.current = false;
      stopMusic();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPracticeMode && gameActive && introFinished && !showTutorial && !showQuitModal && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          // Double speed decrement if Quick Mode is active
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
  }, [gameActive, introFinished, showTutorial, showQuitModal, timeLeft, isPracticeMode, isQuickMode]);

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
    setShowExplanation(true); 
    setQuestionsAnswered(prev => prev + 1);
    
    if (currentQuestion && index === currentQuestion.correctAnswerIndex) {
      setScore(s => s + 100);
      playSound('correct');
      setShowConfetti(true);
    } else {
      playSound('wrong');
    }

    setTimeout(() => {
      if (isMountedRef.current && gameActive) {
        handleNext();
      }
    }, 2000); 
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
      gameMode: GameMode.PROBLEM
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

  if (!gameActive) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 relative">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.PROBLEM} 
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
        title="Cara Bermain: Logika Masalah"
        content={[
          "Anda memiliki waktu total 50 Detik.",
          isQuickMode ? "MODE CEPAT AKTIF: Waktu berjalan 2x lebih cepat!" : "",
          "Pecahkan teka-teki logika lateral.",
          "Pilih jawaban yang paling masuk akal.",
          "Soal dihasilkan secara acak dari database sistem."
        ]}
        icon={<Lightbulb className="w-6 h-6" />}
      />

      <QuitModal 
        isOpen={showQuitModal}
        onConfirm={() => { setShowQuitModal(false); onBack(); }}
        onCancel={() => setShowQuitModal(false)}
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="ghost" onClick={handleBackRequest} className="!px-2 text-xs">
            &larr; {isPracticeMode ? "Selesai" : "Keluar"}
          </Button>
          <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400 hover:text-white text-xs">
            <HelpCircle className="w-4 h-4 mr-1" /> Cara Main
          </Button>
        </div>
        <div className="flex gap-2 md:gap-4 flex-wrap justify-end">
          {isQuickMode && <Badge color="bg-yellow-500 animate-pulse text-black"><Zap className="w-3 h-3 mr-1 inline" /> SPEED x2</Badge>}
          <Badge color="bg-indigo-500">{difficulty}</Badge>
          <Badge color="bg-emerald-500">Skor: {score}</Badge>
        </div>
      </div>

      <div className="relative min-h-[350px]">
        <Card className="mb-4 py-2 px-3 bg-slate-800/80 border-slate-700">
           <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
        </Card>

        {!isPracticeMode && (
          <div className="flex justify-center mb-4">
            <div className={`text-5xl font-mono font-bold tracking-tighter transition-all duration-300 ${
                timeLeft <= 10 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse scale-110' : 
                timeLeft <= 20 ? 'text-yellow-400' : 'text-white'
            }`}>
              {timeLeft.toFixed(1)}
            </div>
          </div>
        )}

        {loading ? (
          <Card className="flex flex-col items-center justify-center h-64 animate-pulse">
            <NeuralLoader message="Mengakses Bank Data Logika..." />
          </Card>
        ) : currentQuestion ? (
          <Card className="border-t-4 border-t-indigo-500 animate-fade-in-up">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-indigo-900/50 rounded-lg shrink-0">
                <Lightbulb className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white leading-relaxed">
                  {currentQuestion.question}
                </h3>
              </div>
            </div>

            <div className="grid gap-2 mb-4">
              {currentQuestion.options.map((option, idx) => {
                let btnClass = "text-left p-3 rounded-lg border border-white/10 transition-all hover:bg-white/5 text-sm md:text-base";
                
                if (selectedOption !== null) {
                  if (idx === currentQuestion.correctAnswerIndex) {
                    btnClass = "text-left p-3 rounded-lg border border-emerald-500 bg-emerald-500/20 text-emerald-100 glow-success text-sm md:text-base";
                  } else if (idx === selectedOption) {
                    btnClass = "text-left p-3 rounded-lg border border-red-500 bg-red-500/20 text-red-100 text-sm md:text-base";
                  } else {
                    btnClass = "text-left p-3 rounded-lg border border-white/5 opacity-50 text-sm md:text-base";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={selectedOption !== null}
                    className={btnClass}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {(selectedOption !== null) && idx === currentQuestion.correctAnswerIndex && (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                      {selectedOption !== null && idx === selectedOption && idx !== currentQuestion.correctAnswerIndex && (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="animate-fade-in mb-2">
                <div className={`p-3 rounded-lg border text-xs md:text-sm ${
                  selectedOption === currentQuestion.correctAnswerIndex ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-100' : 'bg-red-900/20 border-red-500/30 text-red-100'
                }`}>
                   <span className="font-bold mr-2">{selectedOption === currentQuestion.correctAnswerIndex ? 'BENAR!' : 'SALAH!'}</span>
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

export default LogicGame;