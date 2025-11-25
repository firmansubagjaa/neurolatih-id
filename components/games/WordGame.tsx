
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, WordAssociationQuestion, GameResult, GameMode } from '../../types';
import { generateWordAssociation } from '../../services/geminiService';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, NeuralLoader } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { BookOpen, CheckCircle, XCircle, Sparkles, HelpCircle } from 'lucide-react';

interface WordGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

const WordGame: React.FC<WordGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<WordAssociationQuestion | null>(null);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // GLOBAL TIMER STATE
  const TOTAL_TIME = 50;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  const isMountedRef = useRef(true);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNextQuestion = useCallback(async () => {
    setLoading(true);
    setSelectedWords([]);
    setIsSubmitted(false);
    setShowConfetti(false);
    setShowExplanation(false);
    
    try {
      const q = await generateWordAssociation(difficulty);
      
      if (isMountedRef.current) {
        setCurrentQuestion(q);
        const allWords = [...q.correctWords, ...q.distractors];
        for (let i = allWords.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
        }
        setShuffledWords(allWords);
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
    startMusic('PLAYFUL');
    fetchNextQuestion();

    return () => {
      isMountedRef.current = false;
      stopMusic();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [fetchNextQuestion]);

  // Hardcore Timer Logic
  useEffect(() => {
    // Timer keeps running during loading
    // Stops for Tutorial or Quit Modal
    // DISABLED in Practice Mode
    if (!isPracticeMode && gameActive && introFinished && !showTutorial && !showQuitModal && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newVal = Math.max(0, prev - 0.1);
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
  }, [gameActive, introFinished, showTutorial, showQuitModal, timeLeft, isPracticeMode]);

  const toggleWord = (word: string) => {
    if (isSubmitted || (!isPracticeMode && timeLeft <= 0)) return;

    if (selectedWords.includes(word)) {
      setSelectedWords(prev => prev.filter(w => w !== word));
      playSound('pop');
    } else {
      if (selectedWords.length < 3) {
        setSelectedWords(prev => [...prev, word]);
        playSound('pop');
      }
    }
  };

  const handleNext = () => {
    if (!isPracticeMode && timeLeft <= 0) {
      handleFinish();
    } else {
      fetchNextQuestion();
    }
  };

  const handleSubmit = () => {
    if (!currentQuestion) return;
    setIsSubmitted(true);
    setQuestionsAnswered(prev => prev + 1);

    const correctSet = new Set(currentQuestion.correctWords);
    
    // Check correct words
    let correctCount = 0;
    selectedWords.forEach(w => {
        if (correctSet.has(w)) correctCount++;
    });

    if (correctCount === 3 && selectedWords.length === 3) {
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
    }, 1000);
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
      gameMode: GameMode.WORD
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 relative">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.WORD} 
          onStart={() => {
            playSound('click');
            setIntroFinished(true);
            setShowTutorial(true); // Tutorial triggered
          }} 
        />
      )}

      {showConfetti && <Confetti />}
      <TutorialOverlay 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)}
        title="Cara Bermain: Asosiasi Kata"
        content={[
          "Total waktu 50 Detik (Kecuali Mode Latihan).",
          "Waktu BERJALAN TERUS saat memuat soal.",
          "Pilih 3 kata yang sesuai kategori secepatnya.",
          "Sistem otomatis lanjut setelah Anda menekan Cek Jawaban."
        ]}
        icon={<BookOpen className="w-6 h-6" />}
      />

      <QuitModal 
        isOpen={showQuitModal}
        onConfirm={handleConfirmQuit}
        onCancel={() => setShowQuitModal(false)}
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="ghost" onClick={handleBackRequest} className="!px-2">
            &larr; {isPracticeMode ? "Selesai" : "Keluar"}
          </Button>
          <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400 hover:text-white">
            <HelpCircle className="w-5 h-5 mr-1" /> Cara Main
          </Button>
        </div>
        <div className="flex gap-4">
          <Badge color="bg-orange-500">{difficulty}</Badge>
          <Badge color="bg-amber-500">Skor: {score}</Badge>
        </div>
      </div>

      <div className="relative min-h-[400px]">
         {/* Global Timer Bar */}
         <Card className="mb-4 py-3 px-4 bg-slate-800/80 border-slate-700">
           <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
        </Card>

        {/* Large Prominent Timer */}
        {!isPracticeMode && (
          <div className="flex justify-center mb-6">
            <div className={`text-6xl font-mono font-bold tracking-tighter transition-all duration-300 ${
                timeLeft <= 10 ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse scale-110' : 
                timeLeft <= 20 ? 'text-yellow-400' : 'text-white'
            }`}>
              {timeLeft.toFixed(1)}
            </div>
          </div>
        )}

        {loading ? (
          <Card className="flex flex-col items-center justify-center h-80 animate-pulse">
            <NeuralLoader message="AI sedang mencari hubungan kata..." />
            {!isPracticeMode && <p className="text-xs text-slate-500 mt-4 animate-pulse">Waktu terus berjalan...</p>}
          </Card>
        ) : currentQuestion ? (
          <Card className="border-t-4 border-t-orange-500 animate-fade-in-up">
            
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="p-4 bg-orange-900/30 rounded-full mb-4 ring-2 ring-orange-500/20">
                <BookOpen className="w-10 h-10 text-orange-400" />
              </div>
              <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-2">KATEGORI</p>
              <h3 className="text-2xl font-bold text-white leading-relaxed bg-slate-800/50 px-8 py-3 rounded-xl border border-white/5 inline-block">
                {currentQuestion.category}
              </h3>
              <p className="text-slate-400 text-sm mt-4">Pilih 3 kata yang berhubungan</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {shuffledWords.map((word, idx) => {
                const isSelected = selectedWords.includes(word);
                const isCorrect = currentQuestion.correctWords.includes(word);
                
                let btnClass = "h-20 p-2 rounded-xl border-2 transition-all flex items-center justify-center text-center font-bold text-sm md:text-base relative overflow-hidden ";
                
                if (isSubmitted) {
                   if (isCorrect) {
                       btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-100 glow-success";
                   } else if (isSelected && !isCorrect) {
                       btnClass += "bg-red-500/20 border-red-500 text-red-100 opacity-70";
                   } else {
                       btnClass += "bg-slate-800 border-slate-700 opacity-40";
                   }
                } else {
                    if (isSelected) {
                        btnClass += "bg-orange-500/20 border-orange-500 text-orange-100 scale-105 shadow-lg shadow-orange-500/20";
                    } else {
                        btnClass += "bg-slate-800 border-slate-700 text-slate-300 hover:border-orange-500/50 hover:bg-slate-700";
                    }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => toggleWord(word)}
                    disabled={isSubmitted || (!isPracticeMode && timeLeft <= 0)}
                    className={btnClass}
                  >
                    <span className="relative z-10">{word}</span>
                    {isSubmitted && isCorrect && <CheckCircle className="absolute top-1 right-1 w-4 h-4 text-emerald-500" />}
                    {isSubmitted && isSelected && !isCorrect && <XCircle className="absolute top-1 right-1 w-4 h-4 text-red-500" />}
                  </button>
                );
              })}
            </div>

            {(!isSubmitted) ? (
               <div className="flex justify-center">
                    <Button 
                        onClick={handleSubmit} 
                        disabled={selectedWords.length !== 3}
                        variant={selectedWords.length === 3 ? 'primary' : 'secondary'}
                        className={`w-full md:w-auto min-w-[200px] ${selectedWords.length === 3 ? '!text-black' : '!text-retro-cyan'}`}
                    >
                        Cek Jawaban ({selectedWords.length}/3)
                    </Button>
               </div>
            ) : (
              <div className="animate-fade-in">
                 <div className={`p-4 rounded-lg mb-4 text-sm flex items-start gap-3 border bg-orange-900/20 border-orange-500/30 text-orange-200`}>
                    <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                         <p>{currentQuestion.explanation}</p>
                    </div>
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

export default WordGame;
