
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode, Language } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { getTranslation } from '../../services/languageService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { Tooltip } from '../ui/Tooltip';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Map, HelpCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Zap, Flag, Cpu, Play, Grid, Database, Bot, Trash2, Terminal } from 'lucide-react';

interface PathfindingGameProps {
  difficulty: Difficulty;
  onEndGame: (result: GameResult) => void;
  onBack: () => void;
  isQuickMode?: boolean;
  isPracticeMode?: boolean;
  language?: Language;
}

type CellType = 'EMPTY' | 'WALL' | 'START' | 'END';
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type MazeType = 'RANDOM' | 'LABYRINTH' | 'BUNKER' | 'BINARY' | 'OBSTACLE';

interface Position { x: number; y: number; }

const PathfindingGame: React.FC<PathfindingGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false, language = 'ID' }) => {
  const t = (key: string) => getTranslation(language as Language, `pathfinding.${key}`);
  const [viewState, setViewState] = useState<'SELECT' | 'GAME'>('SELECT');
  const [introFinished, setIntroFinished] = useState(false);
  const [gridSize, setGridSize] = useState(5);
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [botPos, setBotPos] = useState<Position>({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState<Position>({ x: 0, y: 0 });
  const [commands, setCommands] = useState<Direction[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCommandIndex, setActiveCommandIndex] = useState<number | null>(null);
  const [isWinning, setIsWinning] = useState(false);
  const [level, setLevel] = useState(1);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [currentMazeType, setCurrentMazeType] = useState<MazeType>('RANDOM');
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const getTimeLimit = () => difficulty === Difficulty.BEGINNER ? 90 : difficulty === Difficulty.INTERMEDIATE ? 60 : 45;
  const TOTAL_TIME = getTimeLimit();
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);
  const mistakeTracker = useRef<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('MENU');
    const saved = localStorage.getItem('pathfinding_save');
    if (saved) setHasSavedGame(true);
    return () => { isMountedRef.current = false; stopMusic(); };
  }, []);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [debugLogs, commands]);

  const createMaze = (size: number, type: MazeType): CellType[][] => {
      let maze: CellType[][] = Array(size).fill(null).map(() => Array(size).fill('EMPTY'));
      if (type === 'LABYRINTH') {
          for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) maze[y][x] = 'WALL';
          const stack: Position[] = [{x: 0, y: 0}]; maze[0][0] = 'EMPTY';
          while (stack.length > 0) {
              const current = stack[stack.length - 1];
              const neighbors: Position[] = [];
              [[0, -2], [0, 2], [-2, 0], [2, 0]].forEach(([dx, dy]) => {
                  const nx = current.x + dx, ny = current.y + dy;
                  if (nx >= 0 && nx < size && ny >= 0 && ny < size && maze[ny][nx] === 'WALL') neighbors.push({x: nx, y: ny});
              });
              if (neighbors.length > 0) {
                  const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                  maze[next.y][next.x] = 'EMPTY'; maze[current.y + (next.y - current.y)/2][current.x + (next.x - current.x)/2] = 'EMPTY'; stack.push(next);
              } else stack.pop();
          }
          maze[size-1][size-1] = 'EMPTY';
      } else if (type === 'BUNKER') {
          for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { if (x % 2 !== 0 && y % 2 !== 0) maze[y][x] = 'WALL'; if (Math.random() < 0.2) maze[y][x] = 'WALL'; }
      } else {
          const density = type === 'OBSTACLE' ? 0.35 : 0.2;
          for(let y=0; y<size; y++) for(let x=0; x<size; x++) if(Math.random() < density && (x!==0||y!==0) && (x!==size-1||y!==size-1)) maze[y][x] = 'WALL';
      }
      return maze;
  };

  const generateGrid = useCallback((type: MazeType) => {
    const size = difficulty === Difficulty.BEGINNER ? 5 : difficulty === Difficulty.INTERMEDIATE ? 7 : 9;
    setGridSize(size);
    let newGrid = createMaze(size, type);
    const start = { x: 0, y: 0 }; const end = { x: size - 1, y: size - 1 };
    newGrid[start.y][start.x] = 'START'; newGrid[end.y][end.x] = 'END';
    setStartPos(start); setBotPos(start); setEndPos(end); setGrid(newGrid); setCommands([]); setDebugLogs(["> SYSTEM READY"]); setIsRunning(false); setActiveCommandIndex(null); setIsWinning(false);
  }, [difficulty]);

  const startGame = (type: MazeType) => { setCurrentMazeType(type); generateGrid(type); setViewState('GAME'); startMusic('FOCUS'); setTimeLeft(TOTAL_TIME); };
  const executeRun = async () => {
    if (commands.length === 0 || isRunning) return;
    setIsRunning(true); setDebugLogs(p => [...p, "> EXECUTING SEQUENCE..."]); 
    let currentPos = { ...startPos }; let crash = false; let win = false; setBotPos(startPos);
    await new Promise(r => setTimeout(r, 300));
    for (let i = 0; i < commands.length; i++) {
        if (!isMountedRef.current) return;
        setActiveCommandIndex(i); const cmd = commands[i]; let nextPos = { ...currentPos };
        switch(cmd) { case 'UP': nextPos.y-=1; break; case 'DOWN': nextPos.y+=1; break; case 'LEFT': nextPos.x-=1; break; case 'RIGHT': nextPos.x+=1; break; }
        if (nextPos.x < 0 || nextPos.x >= gridSize || nextPos.y < 0 || nextPos.y >= gridSize || grid[nextPos.y][nextPos.x] === 'WALL') crash = true;
        if (!crash && nextPos.x === endPos.x && nextPos.y === endPos.y) win = true;
        setDebugLogs(prev => [...prev, `[${i+1}] ${cmd}: (${nextPos.x},${nextPos.y}) ${crash ? 'ERR' : 'OK'}`]);
        if (crash) { playSound('wrong'); mistakeTracker.current.push("COLLISION"); setBotPos(nextPos); break; }
        setBotPos(nextPos); currentPos = nextPos; playSound('pop');
        if (win) break; await new Promise(r => setTimeout(r, isDebugMode ? 600 : 250));
    }
    if (win) {
        setIsWinning(true); setScore(s => s + 100); setLevel(l => l + 1); playSound('correct'); setShowConfetti(true); localStorage.removeItem('pathfinding_save'); setHasSavedGame(false);
        setTimeout(() => { if(isMountedRef.current) { setIsWinning(false); generateGrid(currentMazeType); } }, 1500);
    } else {
        setTimeout(() => { if (isMountedRef.current) { setIsRunning(false); setBotPos(startPos); setActiveCommandIndex(null); setScore(s => Math.max(0, s - 20)); } }, 1000);
    }
  };
  const addCommand = (dir: Direction) => { if (isRunning) return; if (commands.length < 20) { setCommands(prev => [...prev, dir]); playSound('click'); } };
  const removeCommand = () => { if (isRunning) return; setCommands(prev => prev.slice(0, -1)); playSound('click'); };
  const clearCommands = () => { if (isRunning) return; setCommands([]); playSound('click'); };
  const handleFinish = useCallback(() => { onEndGame({ score, totalQuestions: level, correctAnswers: level - 1, accuracy: 100, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty, gameMode: GameMode.PATHFINDING, mistakePatterns: mistakeTracker.current }); }, [score, level, timeLeft, difficulty, onEndGame]);
  useEffect(() => { if (viewState === 'GAME' && !isPracticeMode && timeLeft > 0 && !isRunning) { const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100); return () => clearInterval(timer); } }, [viewState, isPracticeMode, timeLeft, isRunning]);
  useEffect(() => { if (timeLeft <= 0 && viewState === 'GAME' && !isPracticeMode) handleFinish(); }, [timeLeft, viewState, isPracticeMode, handleFinish]);

  if (viewState === 'SELECT') return (
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
             <div className="flex justify-between items-center mb-2 shrink-0"><Button variant="ghost" onClick={onBack}>&larr; {t('missionSelect')}</Button><Badge color="bg-amber-500">{t('title')}</Badge></div>
             
             <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 pb-4">
                {hasSavedGame && <Card onClick={() => { const data = JSON.parse(localStorage.getItem('pathfinding_save')!); setGrid(data.grid); setBotPos(data.botPos); setStartPos(data.startPos); setEndPos(data.endPos); setCommands(data.commands); setLevel(data.level); setScore(data.score); setCurrentMazeType(data.mazeType); setGridSize(data.grid.length); setViewState('GAME'); startMusic('FOCUS'); }} className="cursor-pointer border-l-8 border-l-retro-green flex items-center justify-between hover:bg-slate-900 group p-6 border-2 border-slate-700 mb-6"><div className="flex items-center gap-4"><Database className="w-8 h-8 text-retro-green" /><div><h3 className="font-pixel text-retro-green text-lg">{t('resume')}</h3><p className="text-xs font-mono text-slate-400">CONTINUE PREVIOUS</p></div></div><Play className="w-8 h-8 text-white group-hover:scale-110" /></Card>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                    {[{ id: 'RANDOM', name: t('missions.random'), icon: <Map /> }, { id: 'LABYRINTH', name: t('missions.labyrinth'), icon: <Grid /> }, { id: 'BUNKER', name: t('missions.bunker'), icon: <Database /> }, { id: 'BINARY', name: t('missions.binary'), icon: <Cpu /> }, { id: 'OBSTACLE', name: t('missions.obstacle'), icon: <Zap /> }].map((m) => (
                        <Card key={m.id} onClick={() => startGame(m.id as MazeType)} className="cursor-pointer hover:border-retro-cyan hover:-translate-y-1 transition-all p-6 border-2 border-slate-700 group flex items-center gap-4">
                            <div className="text-retro-cyan group-hover:text-white transition-colors p-2 bg-slate-900 rounded">{m.icon}</div>
                            <h3 className="font-pixel text-sm md:text-base">{m.name}</h3>
                        </Card>
                    ))}
                </div>
             </div>
        </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col gap-2 p-2 relative">
      {!introFinished && <GameIntro gameMode={GameMode.PATHFINDING} language={language} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title={t('tutorialTitle')} content={[t('goal'), "HINDARI TEMBOK.", "INPUT > EXECUTE"]} icon={<Map className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={handleFinish} onCancel={() => setShowQuitModal(false)} language={language} />

      <div className="flex justify-between items-center bg-slate-900/90 p-2 border-b-2 border-slate-700 shrink-0 z-20">
         <div className="flex gap-2 items-center"><Button variant="ghost" onClick={() => setShowQuitModal(true)} className="!px-2 text-xs !py-1">&larr; EXIT</Button><Tooltip text="HELP"><Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 !py-1"><HelpCircle className="w-4 h-4" /></Button></Tooltip></div>
         <div className="flex gap-2 items-center"><Badge color="bg-amber-600 text-black border-amber-400">LVL {level}</Badge><Badge color="bg-emerald-600 text-black border-emerald-400">PTS: {score}</Badge></div>
      </div>
      <div className="w-full shrink-0"><CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} className="!mb-0" /></div>

      {/* Main Game Container */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 relative h-full">
        
        {/* MAP / GRID SECTION */}
        <div className="flex-1 relative flex items-center justify-center bg-slate-950 border-2 border-slate-700 rounded-lg overflow-hidden min-h-[300px] lg:min-h-0">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4 custom-scrollbar">
                <div className="relative transition-all duration-300 shadow-2xl bg-black border-4 border-slate-800" style={{ width: `${gridSize * 50}px`, height: `${gridSize * 50}px`, display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)`, gap: '1px' }}>
                    {grid.map((row, y) => row.map((cell, x) => (
                        <div key={`${x}-${y}`} className={`w-full h-full relative border border-slate-800/30 ${cell === 'WALL' ? 'bg-slate-800' : 'bg-slate-900/80'}`}>
                            {cell === 'WALL' && <div className="w-full h-full opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.2)_5px,rgba(0,0,0,0.2)_10px)]"></div>}
                            {startPos.x === x && startPos.y === y && <div className="absolute inset-1 border-4 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse bg-emerald-500/20"></div>}
                            {endPos.x === x && endPos.y === y && <div className="w-full h-full flex items-center justify-center"><Flag className="w-3/4 h-3/4 text-retro-red fill-current animate-bounce" /></div>}
                        </div>
                    )))}
                    <div className="absolute z-20 transition-all duration-300 ease-in-out pointer-events-none flex items-center justify-center" style={{ left: `${(botPos.x / gridSize) * 100}%`, top: `${(botPos.y / gridSize) * 100}%`, width: `${100 / gridSize}%`, height: `${100 / gridSize}%` }}>
                        <div className={`relative w-[80%] h-[80%] bg-retro-cyan text-black border-2 border-white shadow-[0_0_20px_rgba(34,211,238,0.8)] flex items-center justify-center rounded-md ${isWinning ? 'animate-spin bg-retro-green' : ''} transform scale-110`}><Bot className="w-3/4 h-3/4" /></div>
                    </div>
                </div>
            </div>
        </div>

        {/* CONTROLLER SECTION */}
        <div className="shrink-0 flex flex-col gap-3 bg-black border-2 border-slate-700 rounded-lg p-3 shadow-retro-lg w-full lg:w-[320px] lg:h-full lg:overflow-y-auto custom-scrollbar">
            
            {/* LOGS / DEBUG */}
            <div className="bg-slate-900 border-2 border-slate-600 rounded p-2 h-[80px] md:h-[100px] lg:h-[200px] lg:shrink-0 overflow-hidden flex flex-col relative shadow-inner">
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-700 pb-1 mb-1 font-pixel"><span className="flex items-center gap-1"><Terminal size={10} /> LOG</span><Toggle checked={isDebugMode} onChange={setIsDebugMode} label="DEBUG" /></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed">
                    {isDebugMode ? <div className="text-retro-green">{debugLogs.map((log, i) => <div key={i}>{log}</div>)}<div ref={logsEndRef} /></div> : <div className="flex flex-wrap gap-1 content-start">{commands.map((cmd, idx) => (<div key={idx} className={`w-6 h-6 flex items-center justify-center border rounded font-bold transition-all ${idx === activeCommandIndex ? 'bg-retro-green text-black border-white scale-110 shadow-glow z-10' : 'bg-slate-800 text-retro-cyan border-slate-600'}`}>{cmd === 'UP' ? '↑' : cmd === 'DOWN' ? '↓' : cmd === 'LEFT' ? '←' : '→'}</div>))}<div ref={logsEndRef} /></div>}
                </div>
            </div>

            {/* CONTROLS AREA */}
            <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:flex-1 lg:gap-6">
                 
                 {/* D-PAD */}
                 <div className="bg-slate-800/50 p-2 rounded border border-slate-700 aspect-square flex items-center justify-center lg:aspect-auto lg:h-auto lg:py-8 lg:flex-1">
                     <div className="grid grid-cols-3 gap-1 w-full h-full max-w-[140px] max-h-[140px] aspect-square lg:scale-110 lg:gap-2">
                         <div className="col-start-2"><Button onClick={() => addCommand('UP')} disabled={isRunning} className="w-full h-full flex items-center justify-center p-0 bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 rounded-md"><ArrowUp size={24}/></Button></div>
                         <div className="col-start-1 row-start-2"><Button onClick={() => addCommand('LEFT')} disabled={isRunning} className="w-full h-full flex items-center justify-center p-0 bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 rounded-md"><ArrowLeft size={24}/></Button></div>
                         <div className="col-start-2 row-start-2"><Button onClick={() => addCommand('DOWN')} disabled={isRunning} className="w-full h-full flex items-center justify-center p-0 bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 rounded-md"><ArrowDown size={24}/></Button></div>
                         <div className="col-start-3 row-start-2"><Button onClick={() => addCommand('RIGHT')} disabled={isRunning} className="w-full h-full flex items-center justify-center p-0 bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 rounded-md"><ArrowRight size={24}/></Button></div>
                     </div>
                 </div>

                 {/* ACTION BUTTONS */}
                 <div className="flex flex-col gap-2 justify-center lg:justify-end lg:pb-4 lg:h-auto">
                     <div className="flex gap-1 h-1/3 min-h-[40px] lg:min-h-[50px]"><Button onClick={removeCommand} disabled={isRunning} variant="secondary" className="flex-1 justify-center py-0 h-full border-b-4 active:border-b-0 active:translate-y-1 text-xs rounded-md"><RotateCcw size={16}/></Button><Button onClick={clearCommands} disabled={isRunning} variant="danger" className="flex-1 justify-center py-0 h-full border-b-4 active:border-b-0 active:translate-y-1 text-xs rounded-md"><Trash2 size={16}/></Button></div>
                     <div className="flex-1 h-2/3 min-h-[60px] lg:min-h-[80px]"><Button onClick={executeRun} disabled={isRunning || commands.length === 0} className={`w-full h-full flex flex-col items-center justify-center text-sm font-bold border-b-4 active:border-b-0 active:translate-y-1 transition-all rounded-md ${isRunning ? 'bg-retro-yellow text-black border-yellow-700' : 'bg-retro-green text-black border-green-700 hover:brightness-110'}`}>{isRunning ? <span className="animate-blink">...</span> : <Play size={28} className="fill-current" />}</Button></div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};
export default PathfindingGame;
