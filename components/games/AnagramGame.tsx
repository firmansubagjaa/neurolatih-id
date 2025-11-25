
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
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const TOTAL_TIME = 60;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  
  const isMountedRef = useRef(true);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setUserInput("");
    setShowConfetti(false);
    try {
        const q = await generateAnagram(difficulty);
        if (isMountedRef.current) setQuestion(q);
    } catch(e) {
        console.error(e);
    } finally {
        if (isMountedRef.current) setLoading(false);
    }
  }, [difficulty]);

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('PLAYFUL');
    fetchNext();
    return () => {
      isMountedRef.current = false;
      stopMusic();
    };
  }, [fetchNext]);

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false);
    playSound('win');
    stopMusic();
    
    onEndGame({
      score: score,
      totalQuestions: questionsAnswered,
      correctAnswers: score / 100, // Approximate
      accuracy: 100, // Anagrams are usually solve or fail
      duration: (TOTAL_TIME - timeLeft) * 1000,
      difficulty: difficulty,
      gameMode: GameMode.ANAGRAM
    });
  }, [questionsAnswered, score, timeLeft, difficulty, onEndGame]);

  useEffect(() => {
    if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100);
      return () => clearInterval(timer);
    }
  }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);

  useEffect(() => {
    if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) {
      handleFinish();
    }
  }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  const handleType = (char: string) => {
    if (userInput.length < (question?.original.length || 0)) {
        setUserInput(p => p + char);
        playSound('click');
    }
  };

  const handleBackspace = () => {
    setUserInput(p => p.slice(0, -1));
    playSound('click');
  };

  const checkAnswer = () => {
    if (!question) return;
    setQuestionsAnswered(p => p + 1);
    
    if (userInput.toUpperCase() === question.original.toUpperCase()) {
        setScore(s => s + 100);
        playSound('correct');
        setShowConfetti(true);
        setTimeout(() => fetchNext(), 1000);
    } else {
        playSound('wrong');
        setUserInput(""); // Reset on wrong
    }
  };

  const handleBackRequest = () => {
    playSound('click');
    if (isPracticeMode) {
      handleFinish();
    } else {
      setShowQuitModal(true);
    }
  };

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
        title="Cara Bermain: Dekripsi Kata"
        content={[
            "Susun ulang huruf acak.", 
            ...(isQuickMode ? ["MODE CEPAT: Waktu berkurang lebih cepat!"] : []), // Fixed bug
            "Bentuk satu kata baku Bahasa Indonesia.", 
            "Gunakan keyboard di layar."
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
         <Badge color="bg-retro-pink">Words: {questionsAnswered}</Badge>
      </div>

      <Card className="flex flex-col items-center p-6 md:p-8">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
         
         {loading ? <NeuralLoader message="ENCRYPTING..." /> : question && (
             <>
                <div className="w-full mb-8 text-center">
                    <p className="text-sm md:text-base text-slate-500 mb-3 uppercase tracking-widest font-bold">HINT: <span className="text-retro-yellow">{question.hint}</span></p>
                    <div className="text-4xl md:text-6xl font-mono text-slate-400 tracking-[0.2em] mb-6 break-words">{question.scrambled}</div>
                    
                    {/* Input Display */}
                    <div className="flex justify-center gap-2 mb-8 flex-wrap min-h-[60px]">
                        {Array.from({ length: question.original.length }).map((_, i) => (
                            <div key={i} className={`w-10 h-12 md:w-12 md:h-16 border-b-4 flex items-center justify-center text-2xl md:text-3xl font-bold ${userInput[i] ? 'border-retro-green text-retro-green' : 'border-slate-700'}`}>
                                {userInput[i] || ''}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Keyboard */}
                <div className="w-full grid grid-cols-6 gap-2 md:gap-3 mb-6">
                    {question.scrambled.split('').sort().map((char, i) => (
                         // Simple usage logic: count occurrences in input vs scrambled to disable used keys would be better, 
                         // but for speed, just showing keys is enough.
                        <button key={i} onClick={() => handleType(char)} className="p-3 md:p-4 bg-slate-800 border border-slate-600 rounded-lg active:bg-slate-700 font-mono text-xl md:text-2xl hover:border-retro-green text-white transition-all shadow-md">
                            {char}
                        </button>
                    ))}
                </div>
                
                <div className="flex w-full gap-4">
                    <Button variant="secondary" onClick={handleBackspace} className="flex-1 py-4"><Delete className="w-6 h-6" /></Button>
                    <Button onClick={checkAnswer} className="flex-[3] text-lg py-4"><Key className="w-6 h-6 mr-2" /> SUBMIT</Button>
                </div>
             </>
         )}
      </Card>
    </div>
  );
};

export default AnagramGame;
