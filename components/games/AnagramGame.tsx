
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode, AnagramQuestion } from '../../types';
import { generateAnagram } from '../../services/geminiService';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, NeuralLoader, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Type, HelpCircle, Key, Delete } from 'lucide-react';

interface AnagramGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

const AnagramGame: React.FC<AnagramGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [question, setQuestion] = useState<AnagramQuestion | null>(null);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

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

  const fetchNextQuestion = useCallback(async () => {
    setLoading(true);
    setUserInput("");
    setFeedback(null);
    setShowConfetti(false);
    
    try {
      const q = await generateAnagram(difficulty);
      if (isMountedRef.current) {
        setQuestion(q);
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
    };
  }, [fetchNextQuestion]);

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false);
    playSound('win');
    stopMusic();
    
    const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;

    onEndGame({
      score: score,
      totalQuestions: questionsAnswered,
      correctAnswers: correctAnswers,
      accuracy: accuracy,
      duration: (TOTAL_TIME - timeLeft) * 1000,
      difficulty: difficulty,
      gameMode: GameMode.ANAGRAM
    });
  }, [questionsAnswered, correctAnswers, score, timeLeft, difficulty, onEndGame, TOTAL_TIME]);

  // Timer
  useEffect(() => {
    if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(t => Math.max(0, t - 0.1));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);

  useEffect(() => {
    if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) {
      handleFinish();
    }
  }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  const handleInput = (char: string) => {
    if (userInput.length < (question?.original.length || 0)) {
        setUserInput(prev => prev + char);
        playSound('click');
    }
  };

  const handleDelete = () => {
      setUserInput(prev => prev.slice(0, -1));
      playSound('click');
  };

  const handleSubmit = () => {
      if (!question) return;
      setQuestionsAnswered(p => p + 1);

      if (userInput === question.original) {
          setScore(s => s + 100 + (difficulty === Difficulty.ADVANCED ? 50 : 0));
          setCorrectAnswers(c => c + 1);
          setFeedback('CORRECT');
          playSound('pop');
          if (Math.random() > 0.8) setShowConfetti(true);
      } else {
          setScore(s => Math.max(0, s - 20));
          setFeedback('WRONG');
          playSound('wrong');
      }

      setTimeout(() => {
          if (isMountedRef.current) fetchNextQuestion();
      }, 1500);
  };

  const handleBackRequest = () => {
    playSound('click');
    if (isPracticeMode) {
      handleFinish();
    } else {
      setShowQuitModal(true);
    }
  };

  // Virtual Keyboard
  const letters = question ? question.scrambled.split('') : [];
  // Basic QWERTY or Shuffle for display? Shuffle is better for Anagram
  // But for the game, we usually show the scrambled letters as buttons
  // Let's show the scrambled letters as the available pool

  return (
    <div className="w-full max-w-xl mx-auto relative">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.ANAGRAM} 
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
        title="Cara Bermain: Anagram"
        content={[
          "Susun kembali huruf acak.",
          "Bentuk kata yang bermakna.",
          ...(isQuickMode ? ["MODE CEPAT: Waktu menipis 2x lebih cepat!"] : []),
          "Gunakan petunjuk jika bingung."
        ]}
        icon={<Type className="w-6 h-6" />}
      />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-2">
            <Button variant="ghost" onClick={handleBackRequest} className="!px-3 text-sm">&larr; {isPracticeMode ? "Selesai" : "Keluar"}</Button>
            <Tooltip text="ATURAN MAIN">
                <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button>
            </Tooltip>
         </div>
         <Badge color="bg-retro-yellow">Score: {score}</Badge>
      </div>

      <Card className="flex flex-col items-center p-6 md:p-8">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />

         {loading ? (
             <NeuralLoader message="MENGACAK HURUF..." />
         ) : question ? (
             <>
                <div className="w-full text-center mb-8">
                    <p className="text-slate-500 font-pixel text-xs mb-2 uppercase tracking-widest">HINT: {question.hint}</p>
                    
                    {/* Input Display */}
                    <div className="flex justify-center gap-2 mb-4 h-16">
                        {Array.from({ length: question.original.length }).map((_, i) => (
                            <div key={i} className={`w-10 h-14 md:w-12 md:h-16 border-b-4 flex items-center justify-center text-3xl font-mono font-bold ${
                                userInput[i] ? 'border-retro-yellow text-white' : 'border-slate-700 text-slate-700'
                            }`}>
                                {userInput[i] || '_'}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrambled Letter Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mb-8 max-w-sm">
                    {letters.map((char, i) => (
                        <button
                            key={i}
                            onClick={() => handleInput(char)}
                            className="w-12 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-2xl font-bold hover:bg-slate-700 hover:border-white active:scale-95 transition-all shadow-retro-sm"
                        >
                            {char}
                        </button>
                    ))}
                </div>

                {/* Control Actions */}
                <div className="flex gap-4 w-full">
                    <Button variant="danger" onClick={handleDelete} className="flex-1 justify-center py-4">
                        <Delete className="w-5 h-5" />
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSubmit} 
                        className="flex-[2] justify-center py-4 bg-retro-yellow text-black border-white hover:bg-white"
                        disabled={userInput.length !== question.original.length}
                    >
                        <Key className="w-5 h-5 mr-2" /> CEK KATA
                    </Button>
                </div>
                
                {feedback && (
                    <div className={`mt-4 p-3 w-full text-center font-bold font-pixel border-2 ${
                        feedback === 'CORRECT' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : 'bg-red-900/50 border-red-500 text-red-400'
                    }`}>
                        {feedback === 'CORRECT' ? 'BENAR!' : `SALAH! (${question.original})`}
                    </div>
                )}
             </>
         ) : (
             <div className="text-red-500">Error loading anagram.</div>
         )}
      </Card>
    </div>
  );
};

export default AnagramGame;
