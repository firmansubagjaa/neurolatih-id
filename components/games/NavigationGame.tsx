
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { Button, Card, Badge, Tooltip } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Compass, HelpCircle, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react';

interface NavigationGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
}

type RelativeMove = 'FORWARD' | 'LEFT' | 'RIGHT'; 
type Heading = 'N' | 'E' | 'S' | 'W';

const NavigationGame: React.FC<NavigationGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false }) => {
  const [introFinished, setIntroFinished] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [startHeading, setStartHeading] = useState<Heading>('N');
  const [moves, setMoves] = useState<RelativeMove[]>([]);
  const [finalHeading, setFinalHeading] = useState<Heading>('N');
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const getTimeLimit = () => difficulty === Difficulty.BEGINNER ? 60 : difficulty === Difficulty.INTERMEDIATE ? 45 : 30;
  const TOTAL_TIME = getTimeLimit();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);
  const HEADINGS: Heading[] = ['N', 'E', 'S', 'W']; 

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('FOCUS');
    nextRound();
    return () => { isMountedRef.current = false; stopMusic(); };
  }, []);

  const calculateFinalHeading = (start: Heading, sequence: RelativeMove[]): Heading => {
      let currentIdx = HEADINGS.indexOf(start);
      for (const move of sequence) {
          if (move === 'RIGHT') currentIdx = (currentIdx + 1) % 4;
          else if (move === 'LEFT') currentIdx = (currentIdx - 1 + 4) % 4;
      }
      return HEADINGS[currentIdx];
  };

  const nextRound = () => {
    const start = HEADINGS[Math.floor(Math.random() * 4)];
    setStartHeading(start);
    const moveCount = difficulty === Difficulty.BEGINNER ? 3 : difficulty === Difficulty.INTERMEDIATE ? 4 : 6;
    const possibleMoves: RelativeMove[] = ['LEFT', 'RIGHT', 'FORWARD'];
    const newMoves: RelativeMove[] = [];
    for (let i = 0; i < moveCount; i++) newMoves.push(possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
    setMoves(newMoves);
    setFinalHeading(calculateFinalHeading(start, newMoves));
  };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    setGameActive(false); playSound('win'); stopMusic();
    onEndGame({ score, totalQuestions: rounds, correctAnswers: score / 100, accuracy: 100, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.NAVIGATION });
  }, [rounds, score, timeLeft, difficulty, onEndGame]);

  useEffect(() => { if (!isPracticeMode && introFinished && gameActive && !showTutorial && !showQuitModal && timeLeft > 0) { const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100); return () => clearInterval(timer); } }, [introFinished, gameActive, showTutorial, showQuitModal, timeLeft, isPracticeMode]);
  useEffect(() => { if (!isPracticeMode && timeLeft <= 0 && gameActive && introFinished) handleFinish(); }, [timeLeft, gameActive, introFinished, handleFinish, isPracticeMode]);

  const handleAnswer = (ans: Heading) => {
    setRounds(r => r + 1);
    if (ans === finalHeading) { playSound('pop'); setScore(s => s + 100); if (Math.random() > 0.8) setShowConfetti(true); nextRound(); } 
    else { playSound('wrong'); setScore(s => Math.max(0, s - 50)); nextRound(); }
  };

  const headingName = (h: Heading) => { switch(h) { case 'N': return 'UTARA'; case 'S': return 'SELATAN'; case 'E': return 'TIMUR'; case 'W': return 'BARAT'; } };

  return (
    <div className="w-full max-w-lg mx-auto relative">
      {!introFinished && <GameIntro gameMode={GameMode.NAVIGATION} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title="Egocentric Navigation" content={["Mulai menghadap arah tertentu.", "Instruksi bersifat RELATIF.", "Tentukan arah akhir."]} icon={<Compass className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={() => { setShowQuitModal(false); onBack(); }} onCancel={() => setShowQuitModal(false)} />

      <div className="flex justify-between items-center mb-6">
         <div className="flex gap-2"><Button variant="ghost" onClick={() => isPracticeMode ? handleFinish() : setShowQuitModal(true)} className="!px-3 text-sm">&larr; Exit</Button><Tooltip text="ATURAN MAIN"><Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-3 text-neuro-400"><HelpCircle className="w-5 h-5" /></Button></Tooltip></div>
         <Badge color="bg-indigo-500">Rounds: {rounds}</Badge>
      </div>

      <Card className="flex flex-col items-center p-6 md:p-8">
         <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
         
         <div className="flex flex-col items-center justify-center w-full mb-8 gap-6">
             <div className="bg-slate-800 p-6 rounded-xl border-4 border-slate-600 text-center w-full shadow-retro-lg">
                 <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold font-pixel">START FACING</div>
                 <div className="text-5xl md:text-6xl font-black text-retro-yellow tracking-widest">{headingName(startHeading)}</div>
             </div>
             
             <div className="flex flex-col gap-2 w-full bg-slate-900/80 p-6 rounded-xl border-2 border-white/10">
                 {moves.map((m, i) => (
                     <div key={i} className="flex items-center gap-4 text-white font-mono border-b border-white/5 pb-2 last:border-0 last:pb-0 text-xl md:text-2xl">
                         <span className="text-slate-500 text-sm w-8 font-pixel">{i+1}.</span>
                         {m === 'RIGHT' && <ArrowRight className="w-8 h-8 text-retro-cyan" />}
                         {m === 'LEFT' && <ArrowLeft className="w-8 h-8 text-retro-cyan" />}
                         {m === 'FORWARD' && <ArrowUp className="w-8 h-8 text-emerald-400" />}
                         <span className="uppercase font-bold tracking-wide">{m === 'FORWARD' ? 'MAJU' : m === 'LEFT' ? 'KIRI' : 'KANAN'}</span>
                     </div>
                 ))}
             </div>
         </div>

         <div className="text-sm text-slate-500 mb-4 uppercase font-bold font-pixel">FINAL HEADING?</div>
         <div className="grid grid-cols-2 gap-4 w-full">
            {['N', 'S', 'W', 'E'].map(h => (
                <Button key={h} variant="outline" onClick={() => handleAnswer(h as Heading)} className="py-6 text-xl border-indigo-500 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white">
                    {headingName(h as Heading)}
                </Button>
            ))}
         </div>
      </Card>
    </div>
  );
};
export default NavigationGame;
