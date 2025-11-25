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

interface SavedGame {
  grid: CellType[][];
  botPos: Position;
  startPos: Position;
  endPos: Position;
  commands: Direction[];
  level: number;
  score: number;
  mazeType: MazeType;
}

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

  const TOTAL_TIME = 90;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const isMountedRef = useRef(true);
  const mistakeTracker = useRef<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMountedRef.current = true;
    startMusic('MENU');
    const saved = localStorage.getItem('pathfinding_save');
    if (saved) setHasSavedGame(true);
    return () => {
      isMountedRef.current = false;
      stopMusic();
    };
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [debugLogs, commands]);

  // --- LOGIC: MAZE GENERATION ---
  const createMaze = (size: number, type: MazeType): CellType[][] => {
      let maze: CellType[][] = Array(size).fill(null).map(() => Array(size).fill('EMPTY'));
      
      if (type === 'LABYRINTH') {
          // Fill with walls
          for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) maze[y][x] = 'WALL';
          
          const stack: Position[] = [{x: 0, y: 0}];
          maze[0][0] = 'EMPTY';
          
          while (stack.length > 0) {
              const current = stack[stack.length - 1];
              const neighbors: Position[] = [];
              [[0, -2], [0, 2], [-2, 0], [2, 0]].forEach(([dx, dy]) => {
                  const nx = current.x + dx, ny = current.y + dy;
                  if (nx >= 0 && nx < size && ny >= 0 && ny < size && maze[ny][nx] === 'WALL') {
                      neighbors.push({x: nx, y: ny});
                  }
              });

              if (neighbors.length > 0) {
                  const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                  maze[next.y][next.x] = 'EMPTY';
                  maze[current.y + (next.y - current.y)/2][current.x + (next.x - current.x)/2] = 'EMPTY';
                  stack.push(next);
              } else {
                  stack.pop();
              }
          }
          // Ensure end is reachable
          maze[size-1][size-1] = 'EMPTY';
          if (maze[size-2][size-1] === 'WALL' && maze[size-1][size-2] === 'WALL') {
               maze[size-1][size-2] = 'EMPTY';
          }
      } 
      else if (type === 'BUNKER') {
          for (let y = 0; y < size; y++) {
             for (let x = 0; x < size; x++) {
                 if (x % 2 !== 0 && y % 2 !== 0) maze[y][x] = 'WALL';
                 if (Math.random() < 0.2) maze[y][x] = 'WALL';
             }
          }
      }
      else {
          const density = type === 'OBSTACLE' ? 0.35 : 0.2;
          for(let y=0; y<size; y++) for(let x=0; x<size; x++) {
              if(Math.random() < density && (x!==0||y!==0) && (x!==size-1||y!==size-1)) maze[y][x] = 'WALL';
          }
          // Path Guarantee
          maze[0][1] = 'EMPTY'; maze[1][0] = 'EMPTY'; 
          maze[size-1][size-2] = 'EMPTY'; maze[size-2][size-1] = 'EMPTY';
      }
      return maze;
  };

  const generateGrid = useCallback((type: MazeType) => {
    const size = difficulty === Difficulty.BEGINNER ? 5 : difficulty === Difficulty.INTERMEDIATE ? 7 : 9;
    setGridSize(size);
    let newGrid = createMaze(size, type);
    
    const start = { x: 0, y: 0 };
    const end = { x: size - 1, y: size - 1 };
    
    newGrid[start.y][start.x] = 'START';
    newGrid[end.y][end.x] = 'END';
    
    setStartPos(start); setBotPos(start); setEndPos(end);
    setGrid(newGrid); setCommands([]); setDebugLogs(["> SYSTEM READY"]); setIsRunning(false); setActiveCommandIndex(null); setIsWinning(false);
  }, [difficulty]);

  const startGame = (type: MazeType) => {
    playSound('click'); setCurrentMazeType(type); generateGrid(type); setViewState('GAME'); startMusic('FOCUS'); setTimeLeft(TOTAL_TIME);
  };

  // --- LOGIC: GAMEPLAY ---
  const saveMission = () => {
    const data: SavedGame = { grid, botPos, startPos, endPos, commands, level, score, mazeType: currentMazeType };
    localStorage.setItem('pathfinding_save', JSON.stringify(data)); playSound('correct');
  };

  const loadMission = () => {
    const saved = localStorage.getItem('pathfinding_save');
    if (saved) {
        const data: SavedGame = JSON.parse(saved);
        setGrid(data.grid); setBotPos(data.botPos); setStartPos(data.startPos); setEndPos(data.endPos);
        setCommands(data.commands); setLevel(data.level); setScore(data.score); setCurrentMazeType(data.mazeType); setGridSize(data.grid.length);
        setViewState('GAME'); startMusic('FOCUS'); playSound('click');
    }
  };

  const executeRun = async () => {
    if (commands.length === 0 || isRunning) return;
    setIsRunning(true); setDebugLogs(p => [...p, "> EXECUTING SEQUENCE..."]); 
    let currentPos = { ...startPos }; let crash = false; let win = false; setBotPos(startPos);
    
    await new Promise(r => setTimeout(r, 300));
    
    for (let i = 0; i < commands.length; i++) {
        if (!isMountedRef.current) return;
        setActiveCommandIndex(i); const cmd = commands[i]; let nextPos = { ...currentPos };
        
        switch(cmd) { case 'UP': nextPos.y-=1; break; case 'DOWN': nextPos.y+=1; break; case 'LEFT': nextPos.x-=1; break; case 'RIGHT': nextPos.x+=1; break; }
        
        let statusLog = 'OK';
        if (nextPos.x < 0 || nextPos.x >= gridSize || nextPos.y < 0 || nextPos.y >= gridSize) { 
            crash = true; statusLog = 'BOUNDS_ERR'; 
        } else if (grid[nextPos.y][nextPos.x] === 'WALL') { 
            crash = true; statusLog = 'WALL_COLLISION'; 
        }
        
        if (!crash && nextPos.x === endPos.x && nextPos.y === endPos.y) { 
            win = true; statusLog = 'TARGET_ACQUIRED'; 
        }
        
        setDebugLogs(prev => [...prev, `[${i+1}] ${cmd}: (${nextPos.x},${nextPos.y}) ${statusLog}`]);
        
        if (crash) { 
            playSound('wrong'); mistakeTracker.current.push(statusLog);
            if (statusLog === 'WALL_COLLISION') setBotPos(nextPos); // Visually hit wall
            break; 
        }
        
        setBotPos(nextPos); currentPos = nextPos; playSound('pop');
        if (win) break; 
        const delay = isDebugMode ? 600 : 250; 
        await new Promise(r => setTimeout(r, delay));
    }
    
    if (win) {
        setIsWinning(true); setScore(s => s + 100 + (difficulty === Difficulty.ADVANCED ? 50 : 0)); setLevel(l => l + 1); playSound('correct'); setShowConfetti(true); localStorage.removeItem('pathfinding_save'); setHasSavedGame(false);
        setDebugLogs(p => [...p, "> MISSION SUCCESS. UPLOADING..."]);
        setTimeout(() => { if(isMountedRef.current) { setIsWinning(false); generateGrid(currentMazeType); } }, 1500);
    } else {
        setDebugLogs(p => [...p, "> EXECUTION FAILED. RESETTING..."]);
        setTimeout(() => { if (isMountedRef.current) { setIsRunning(false); setBotPos(startPos); setActiveCommandIndex(null); setScore(s => Math.max(0, s - 20)); } }, 1000);
    }
  };

  const addCommand = (dir: Direction) => { if (isRunning) return; if (commands.length < 20) { setCommands(prev => [...prev, dir]); playSound('click'); } };
  const removeCommand = () => { if (isRunning) return; setCommands(prev => prev.slice(0, -1)); playSound('click'); };
  const clearCommands = () => { if (isRunning) return; setCommands([]); playSound('click'); };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    if (viewState === 'GAME' && !isRunning) saveMission();
    onEndGame({ score: score, totalQuestions: level, correctAnswers: level - 1, accuracy: level > 1 ? 100 : 0, duration: (TOTAL_TIME - timeLeft) * 1000, difficulty: difficulty, gameMode: GameMode.PATHFINDING, mistakePatterns: mistakeTracker.current });
  }, [viewState, isRunning, level, score, timeLeft, difficulty, onEndGame]);

  useEffect(() => { if (viewState === 'GAME' && !isPracticeMode && timeLeft > 0 && !isRunning) { const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100); return () => clearInterval(timer); } }, [viewState, isPracticeMode, timeLeft, isRunning]);
  useEffect(() => { if (timeLeft <= 0 && viewState === 'GAME' && !isPracticeMode) handleFinish(); }, [timeLeft, viewState, isPracticeMode, handleFinish]);

  // --- RENDER: SELECT SCREEN ---
  if (viewState === 'SELECT') {
      return (
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar flex flex-col justify-center">
             <div className="flex justify-between items-center mb-4">
                 <Button variant="ghost" onClick={onBack}>&larr; {t('missionSelect')}</Button>
                 <Badge color="bg-amber-500">{t('title')}</Badge>
             </div>
             {hasSavedGame && (
                 <Card onClick={loadMission} className="cursor-pointer border-l-8 border-l-retro-green flex items-center justify-between hover:bg-slate-900 group p-4 border-2 border-slate-700 mb-4">
                    <div className="flex items-center gap-4">
                        <Database className="w-8 h-8 text-retro-green" />
                        <div>
                            <h3 className="font-pixel text-retro-green">{t('resume')}</h3>
                            <p className="text-xs text-slate-500 font-mono">CONTINUE PREVIOUS SESSION</p>
                        </div>
                    </div>
                    <Play className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                 </Card>
             )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[{ id: 'RANDOM', name: t('missions.random'), icon: <Map />, desc: "Standard tasks." }, { id: 'LABYRINTH', name: t('missions.labyrinth'), icon: <Grid />, desc: "Complex mazes." }, { id: 'BUNKER', name: t('missions.bunker'), icon: <Database />, desc: "Room clearing." }, { id: 'BINARY', name: t('missions.binary'), icon: <Cpu />, desc: "Biased paths." }, { id: 'OBSTACLE', name: t('missions.obstacle'), icon: <Zap />, desc: "Debris field." }].map((m) => (
                     <Card key={m.id} onClick={() => startGame(m.id as MazeType)} className="cursor-pointer hover:border-retro-cyan hover:-translate-y-1 transition-all p-4 border-2 border-slate-700 group">
                         <div className="flex items-center gap-3 mb-2">
                             <div className="text-retro-cyan group-hover:text-white transition-colors">{m.icon}</div>
                             <h3 className="font-pixel text-sm">{m.name}</h3>
                         </div>
                         <p className="text-xs text-slate-400 font-mono">{m.desc}</p>
                     </Card>
                 ))}
             </div>
        </div>
      );
  }

  // --- RENDER: GAME SCREEN ---
  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col gap-2 p-2 relative">
      {!introFinished && <GameIntro gameMode={GameMode.PATHFINDING} language={language} onStart={() => { playSound('click'); setIntroFinished(true); setShowTutorial(true); }} />}
      {showConfetti && <Confetti />}
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} title={t('tutorialTitle')} content={[t('goal'), "HINDARI TEMBOK / BOUNDS.", "INPUT COMMANDS > EXECUTE"]} icon={<Map className="w-6 h-6" />} />
      <QuitModal isOpen={showQuitModal} onConfirm={handleFinish} onCancel={() => setShowQuitModal(false)} language={language} />

      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-slate-900/90 p-2 border-b-2 border-slate-700 shrink-0 z-20">
         <div className="flex gap-2 items-center">
            <Button variant="ghost" onClick={() => setShowQuitModal(true)} className="!px-2 text-xs !py-1 text-slate-400 hover:text-white">&larr; EXIT</Button>
            <Tooltip text="HELP">
                <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 !py-1 text-neuro-400 hover:text-white"><HelpCircle className="w-4 h-4" /></Button>
            </Tooltip>
         </div>
         <div className="flex gap-2 items-center">
            <Badge color="bg-amber-600 text-black border-amber-400">LVL {level}</Badge>
            <Badge color="bg-emerald-600 text-black border-emerald-400">PTS: {score}</Badge>
         </div>
      </div>

      <div className="w-full shrink-0">
           <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} className="!mb-0" />
      </div>

      {/* GAME LAYOUT - Responsive Split */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 relative">
        
        {/* LEFT: TACTICAL MAP */}
        <div className="flex-1 relative flex items-center justify-center bg-slate-950 border-2 border-slate-700 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden min-h-0">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* The Grid Container - Responsive Aspect Ratio */}
            <div className="w-full h-full p-4 flex items-center justify-center">
                <div 
                    className="relative transition-all duration-300 shadow-2xl bg-black border border-slate-800"
                    style={{ 
                        // Key to responsiveness: maintain square aspect ratio
                        // Scale based on the smaller dimension available
                        width: 'min(100%, 100%)',
                        maxWidth: '65vh', // On desktop, limit by height roughly
                        aspectRatio: '1/1',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                        gap: '1px'
                    }}
                >
                    {grid.map((row, y) => row.map((cell, x) => {
                        const isEnd = endPos.x === x && endPos.y === y;
                        const isStart = startPos.x === x && startPos.y === y;
                        return (
                            <div key={`${x}-${y}`} className="w-full h-full relative border border-slate-800/50 bg-slate-900/30">
                                {cell === 'WALL' && (
                                    <div className="w-full h-full bg-slate-800/80 border border-slate-600 relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 6px)' }}></div>
                                    </div>
                                )}
                                {isStart && <div className="absolute inset-1 border-2 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse"></div>}
                                {isEnd && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Flag className="w-3/5 h-3/5 text-red-500 fill-current drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce" />
                                    </div>
                                )}
                            </div>
                        );
                    }))}

                    {/* Bot Overlay */}
                    <div 
                        className="absolute z-20 transition-all duration-300 ease-in-out pointer-events-none flex items-center justify-center"
                        style={{ 
                            left: `${(botPos.x / gridSize) * 100}%`,
                            top: `${(botPos.y / gridSize) * 100}%`,
                            width: `${100 / gridSize}%`,
                            height: `${100 / gridSize}%`,
                        }}
                    >
                        <div className={`relative w-[85%] h-[85%] bg-retro-cyan/20 border-2 border-retro-cyan shadow-[0_0_15px_rgba(34,211,238,0.6)] flex items-center justify-center backdrop-blur-sm rounded-sm ${isWinning ? 'animate-spin bg-retro-green/40 border-retro-green' : ''}`}>
                             <Bot className="w-3/4 h-3/4 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: COMMAND CENTER (Fixed height on mobile, full on desktop) */}
        <div className="lg:w-[350px] shrink-0 flex flex-col gap-2 bg-black border-2 border-slate-700 rounded-lg p-3 shadow-retro-lg">
            
            {/* Terminal Screen */}
            <div className="bg-slate-900 border-2 border-slate-600 rounded p-2 h-[120px] lg:h-[200px] overflow-hidden flex flex-col relative shadow-inner">
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-700 pb-1 mb-1 font-pixel">
                    <span className="flex items-center gap-1"><Terminal size={10} /> SYSTEM_LOG</span>
                    <Toggle checked={isDebugMode} onChange={setIsDebugMode} label="DEBUG" />
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed">
                    {isDebugMode ? (
                        <div className="text-retro-green">
                            {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
                            <div ref={logsEndRef} />
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1 content-start">
                             {commands.length === 0 && <span className="text-slate-600 animate-pulse w-full text-center mt-4">AWAITING INPUT...</span>}
                             {commands.map((cmd, idx) => (
                                <div key={idx} className={`w-6 h-6 flex items-center justify-center border rounded font-bold transition-all ${idx === activeCommandIndex ? 'bg-retro-green text-black border-white scale-110 shadow-glow z-10' : 'bg-slate-800 text-retro-cyan border-slate-600'}`}>
                                    {cmd === 'UP' ? '↑' : cmd === 'DOWN' ? '↓' : cmd === 'LEFT' ? '←' : '→'}
                                </div>
                             ))}
                             <div ref={logsEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
                 {/* D-PAD */}
                 <div className="bg-slate-800/50 p-2 rounded border border-slate-700 aspect-square flex items-center justify-center">
                     <div className="grid grid-cols-3 gap-1 w-full max-w-[140px]">
                         <div className="col-start-2">
                            <Button onClick={() => addCommand('UP')} disabled={isRunning} className="w-full aspect-square flex items-center justify-center p-0 bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"><ArrowUp size={20}/></Button>
                         </div>
                         <div className="col-start-1 row-start-2">
                            <Button onClick={() => addCommand('LEFT')} disabled={isRunning} className="w-full aspect-square flex items-center justify-center p-0 bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"><ArrowLeft size={20}/></Button>
                         </div>
                         <div className="col-start-2 row-start-2">
                            <Button onClick={() => addCommand('DOWN')} disabled={isRunning} className="w-full aspect-square flex items-center justify-center p-0 bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"><ArrowDown size={20}/></Button>
                         </div>
                         <div className="col-start-3 row-start-2">
                            <Button onClick={() => addCommand('RIGHT')} disabled={isRunning} className="w-full aspect-square flex items-center justify-center p-0 bg-slate-700 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"><ArrowRight size={20}/></Button>
                         </div>
                     </div>
                 </div>

                 {/* Actions */}
                 <div className="flex flex-col gap-2 justify-center">
                     <div className="flex gap-1">
                         <Button onClick={removeCommand} disabled={isRunning} variant="secondary" className="flex-1 justify-center py-3 border-b-4 active:border-b-0 active:translate-y-1 text-xs"><RotateCcw size={16}/></Button>
                         <Button onClick={clearCommands} disabled={isRunning} variant="danger" className="flex-1 justify-center py-3 border-b-4 active:border-b-0 active:translate-y-1 text-xs"><Trash2 size={16}/></Button>
                     </div>
                     <div className="flex-1">
                         <Button 
                            onClick={executeRun} 
                            disabled={isRunning || commands.length === 0} 
                            className={`w-full h-full flex flex-col items-center justify-center text-sm font-bold border-b-4 active:border-b-0 active:translate-y-1 transition-all ${isRunning ? 'bg-retro-yellow text-black border-yellow-700' : 'bg-retro-green text-black border-green-700 hover:brightness-110'}`}
                        >
                            {isRunning ? <span className="animate-blink">RUNNING...</span> : <><Play size={24} className="mb-1 fill-current" /> EXECUTE</>}
                        </Button>
                     </div>
                     <div className="text-center font-mono text-[10px] text-slate-500">
                        MEM: {commands.length}/20
                     </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PathfindingGame;