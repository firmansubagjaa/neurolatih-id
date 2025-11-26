
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound, playCombo } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Eye, HelpCircle, Zap } from 'lucide-react';

interface ColorMatchGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

const COLORS = [
  { name: 'MERAH', value: '#ef4444', label: 'red' },
  { name: 'BIRU', value: '#3b82f6', label: 'blue' },
  { name: 'HIJAU', value: '#10b981', label: 'green' },
  { name: 'KUNING', value: '#f59e0b', label: 'yellow' },
  { name: 'UNGU', value: '#8b5cf6', label: 'purple' },
];

const ColorMatchGame: React.FC<ColorMatchGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [currentWord, setCurrentWord] = useState(COLORS[0]);
  const [inkColor, setInkColor] = useState(COLORS[1]);
  const [options, setOptions] = useState<typeof COLORS>([]);
  const [alignment, setAlignment] = useState<'start' | 'center' | 'end'>('center');
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0); // Track streak for audio combo
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const getTimeLimit = () => difficulty === Difficulty.BEGINNER ? 60 : difficulty === Difficulty.INTERMEDIATE ? 40 : 20;
  const TOTAL_TIME = getTimeLimit();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);

  useEffect(() => { isMountedRef.current = true; startMusic('PLAYFUL'); nextRound(); return () => { isMountedRef.current = false; stopMusic(); }; }, []);

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false); playSound('win'); stopMusic();
    onEndGame({ score, totalQuestions: questionsAnswered, correctAnswers, accuracy: questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.COLOR_MATCH });
  }, [questionsAnswered, correctAnswers, score, timeLeft, difficulty, onEndGame]);

  useEffect(() => { if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) { const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 0.1)), 100); return () => clearInterval(timer); } }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);
  useEffect(() => { if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) handleFinish(); }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  const nextRound = () => {
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    let colorIdx = Math.floor(Math.random() * COLORS.length);
    const aligns: ('start' | 'center' | 'end')[] = ['start', 'center', 'end'];
    setAlignment(aligns[Math.floor(Math.random() * aligns.length)]);
    let interferenceChance = difficulty === Difficulty.BEGINNER ? 0.3 : difficulty === Difficulty.ADVANCED ? 0.8 : 0.5;
    if (Math.random() < interferenceChance && colorIdx === wordIdx) colorIdx = (colorIdx + 1) % COLORS.length;
    
    const correct = COLORS[colorIdx];
    let roundOptions = [correct];
    while (roundOptions.length < 4) { const r = COLORS[Math.floor(Math.random() * COLORS.length)]; if (!roundOptions.find(o => o.label === r.label)) roundOptions.push(r); }
    roundOptions = roundOptions.sort(() => Math.random() - 0.5);
    setCurrentWord(COLORS[wordIdx]); setInkColor(COLORS[colorIdx]); setOptions(roundOptions);
  };

  const handleAnswer = (selectedColorLabel: string) => {
    if (!gameActive) return;
    setQuestionsAnswered(prev => prev + 1);
    if (selectedColorLabel === inkColor.label) { 
        setScore(s => s + 100 + (difficulty === Difficulty.ADVANCED ? 50 : 0)); 
        setCorrectAnswers(c => c + 1); 
        setStreak(s => s + 1);
        playCombo(streak); // Dynamic audio pitch
        if (Math.random() > 0.8) setShowConfetti(true); 
    } else { 
        playSound('wrong'); 
        setScore(s => Math.max(0, s - 50)); 
        setStreak(0);
    }
    nextRound();
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      {!introFinished && <GameIntro gameMode={GameMode.COLOR_MATCH} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title="Spatial Stroop" content={["Abaikan TULISAN.", "Fokus pada WARNA TINTA.", "Tebak WARNA-nya."]} icon={<Eye className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

       <div className="flex justify-between items-center mb-6">
         <div className="flex gap-2"><Button variant="ghost" onClick={() => isPracticeMode ? handleFinish() : setShowQuitModal(true)} className="!px-3 text-sm">&larr; Exit</Button><Tooltip text="ATURAN MAIN"><Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button></Tooltip></div>
         <div className="flex gap-2">
            {streak > 3 && <Badge color="bg-retro-yellow text-black"><Zap className="w-3 h-3 inline mr-1 animate-pulse" />COMBO x{streak}</Badge>}
            <Badge color="bg-pink-500">Spatial Stroop</Badge>
         </div>
      </div>

      <Card className="flex flex-col items-center p-6 md:p-8">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />

         <div className="flex-1 w-full flex flex-col justify-center min-h-[250px] mb-8 bg-black rounded-3xl border-4 border-slate-700 relative overflow-hidden px-4 shadow-inner">
             <div className="absolute top-4 left-0 w-full text-center text-xs text-slate-500 uppercase tracking-widest font-bold">WARNA TINTANYA APA?</div>
             <div className={`flex w-full ${alignment === 'start' ? 'justify-start pl-8' : alignment === 'end' ? 'justify-end pr-8' : 'justify-center'}`}>
                <h1 className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter drop-shadow-2xl transition-all duration-200" style={{ color: inkColor.value, textShadow: `0 0 50px ${inkColor.value}60` }}>{currentWord.name}</h1>
             </div>
         </div>

         <div className="grid grid-cols-2 gap-4 w-full">
            {options.map((opt, idx) => (
                <button key={idx} onClick={() => handleAnswer(opt.label)} className="py-8 rounded-2xl bg-slate-800 border-b-8 border-slate-950 hover:border-white hover:bg-slate-700 hover:-translate-y-1 active:border-b-0 active:translate-y-2 transition-all font-bold text-xl md:text-3xl text-white shadow-lg relative overflow-hidden group">
                    {opt.name}
                </button>
            ))}
         </div>
      </Card>
    </div>
  );
};
export default ColorMatchGame;
