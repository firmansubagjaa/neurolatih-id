
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

  const getTimeLimit = () => difficulty === Difficulty.BEGINNER ? 60 : difficulty === Difficulty.INTERMEDIATE ? 50 : 40;
  const TOTAL_TIME = getTimeLimit();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNextQuestion = useCallback(async () => {
    setLoading(true); setSelectedWords([]); setIsSubmitted(false); setShowConfetti(false); setShowExplanation(false);
    try {
      const q = await generateWordAssociation(difficulty);
      if (isMountedRef.current) {
        setCurrentQuestion(q);
        const allWords = [...q.correctWords, ...q.distractors];
        for (let i = allWords.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [allWords[i], allWords[j]] = [allWords[j], allWords[i]]; }
        setShuffledWords(allWords);
      }
    } catch (err) { console.error(err); } finally { if (isMountedRef.current) setLoading(false); }
  }, [difficulty]);

  useEffect(() => { isMountedRef.current = true; startMusic('PLAYFUL'); fetchNextQuestion(); return () => { isMountedRef.current = false; stopMusic(); if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); }; }, [fetchNextQuestion]);
  useEffect(() => { if (!isPracticeMode && gameActive && introFinished && !showTutorial && !showQuitModal && timeLeft > 0) { timerIntervalRef.current = setInterval(() => { setTimeLeft(prev => { const newVal = Math.max(0, prev - 0.1); if (newVal <= 0) { handleFinish(); return 0; } return newVal; }); }, 100); } else if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); }; }, [gameActive, introFinished, showTutorial, showQuitModal, timeLeft, isPracticeMode]);

  const toggleWord = (word: string) => { if (isSubmitted || (!isPracticeMode && timeLeft <= 0)) return; if (selectedWords.includes(word)) { setSelectedWords(prev => prev.filter(w => w !== word)); playSound('pop'); } else { if (selectedWords.length < 3) { setSelectedWords(prev => [...prev, word]); playSound('pop'); } } };
  const handleNext = () => { if (!isPracticeMode && timeLeft <= 0) handleFinish(); else fetchNextQuestion(); };
  const handleSubmit = () => {
    if (!currentQuestion) return;
    setIsSubmitted(true); setQuestionsAnswered(prev => prev + 1);
    const correctSet = new Set(currentQuestion.correctWords);
    let correctCount = 0; selectedWords.forEach(w => { if (correctSet.has(w)) correctCount++; });
    if (correctCount === 3 && selectedWords.length === 3) { setScore(s => s + 100); playSound('correct'); setShowConfetti(true); } else playSound('wrong');
    setShowExplanation(true); setTimeout(() => { if (isMountedRef.current && gameActive) handleNext(); }, 1500);
  };

  const handleFinish = () => { if (!isMountedRef.current) return; setGameActive(false); playSound('win'); stopMusic(); onEndGame({ score, totalQuestions: questionsAnswered, correctAnswers: score / 100, accuracy: questionsAnswered > 0 ? (score / 100) / questionsAnswered * 100 : 0, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.WORD }); };

  if (!gameActive) return null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 relative">
      {!introFinished && <GameIntro gameMode={GameMode.WORD} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title="Asosiasi Kata" content={["Pilih 3 kata sesuai kategori.", "Cek jawaban."]} icon={<BookOpen className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2"><Button variant="ghost" onClick={() => isPracticeMode ? handleFinish() : setShowQuitModal(true)} className="!px-3 text-sm">&larr; Exit</Button><Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button></div>
        <Badge color="bg-amber-500">Skor: {score}</Badge>
      </div>

      <div className="relative min-h-[500px]">
         <Card className="mb-6 py-3 px-4 bg-slate-800/80 border-slate-700">
           <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
        </Card>

        {loading ? <NeuralLoader message="ACCESSING ARCHIVES..." /> : currentQuestion ? (
          <Card key={currentQuestion.category} className="border-t-4 border-t-orange-500 animate-fade-in-up p-8">
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="p-4 bg-orange-900/30 rounded-full mb-4 ring-2 ring-orange-500/20"><BookOpen className="w-12 h-12 text-orange-400" /></div>
              <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-3 border-b border-slate-700 pb-1">SUBJECT CATEGORY</p>
              <h3 className="text-3xl md:text-5xl font-bold text-white leading-relaxed bg-slate-900 px-10 py-4 border-2 border-slate-700 inline-block shadow-lg font-pixel uppercase tracking-wider">{currentQuestion.category}</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
              {shuffledWords.map((word, idx) => {
                const isSelected = selectedWords.includes(word);
                const isCorrect = currentQuestion.correctWords.includes(word);
                let btnClass = "h-24 md:h-28 p-3 rounded-xl border-b-8 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center text-center font-bold text-base md:text-xl relative overflow-hidden ";
                if (isSubmitted) {
                   if (isCorrect) btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-100 glow-success";
                   else if (isSelected && !isCorrect) btnClass += "bg-red-500/20 border-red-500 text-red-100 opacity-70";
                   else btnClass += "bg-slate-800 border-slate-700 opacity-40";
                } else {
                    if (isSelected) btnClass += "bg-orange-600 border-orange-800 text-white scale-105 shadow-glow";
                    else btnClass += "bg-slate-800 border-slate-950 text-slate-300 hover:border-orange-500 hover:bg-slate-700 hover:text-white";
                }
                return (
                  <button key={idx} onClick={() => toggleWord(word)} disabled={isSubmitted || (!isPracticeMode && timeLeft <= 0)} className={btnClass}>
                    <span className="relative z-10">{word}</span>
                    {isSubmitted && isCorrect && <CheckCircle className="absolute top-2 right-2 w-6 h-6 text-emerald-500" />}
                    {isSubmitted && isSelected && !isCorrect && <XCircle className="absolute top-2 right-2 w-6 h-6 text-red-500" />}
                  </button>
                );
              })}
            </div>

            {!isSubmitted ? <div className="flex justify-center"><Button onClick={handleSubmit} disabled={selectedWords.length !== 3} variant={selectedWords.length === 3 ? 'primary' : 'secondary'} className={`w-full md:w-auto min-w-[240px] text-lg py-4 ${selectedWords.length === 3 ? '!text-black' : '!text-retro-cyan'}`}>VERIFY LINK ({selectedWords.length}/3)</Button></div> : <div className="animate-fade-in"><div className={`p-6 rounded-lg mb-4 text-base md:text-lg flex items-start gap-4 border bg-orange-900/20 border-orange-500/30 text-orange-200`}><Sparkles className="w-6 h-6 shrink-0 mt-1" /><div><p className="leading-relaxed">{currentQuestion.explanation}</p></div></div></div>}
          </Card>
        ) : <div className="text-red-400">Error.</div>}
      </div>
    </div>
  );
};
export default WordGame;
