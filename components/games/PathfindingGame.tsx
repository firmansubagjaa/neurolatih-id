
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Difficulty, GameResult, GameMode, Language } from '../../types';
import { startMusic, stopMusic, playSound } from '../../services/audioService';
import { getTranslation } from '../../services/languageService';
import { Button, Card, Badge, Toggle } from '../Shared';
import { TutorialOverlay } from '../TutorialOverlay';
import { QuitModal } from '../QuitModal';
import { Confetti } from '../Confetti';
import { CountdownBar } from '../CountdownBar';
import { GameIntro } from '../GameIntro';
import { Map, HelpCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Zap, Flag, Cpu, Play, Grid, Database, Bot, Trash2 } from 'lucide-react';

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

interface Position {
  x: number;
  y: number;
}

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

const PathfindingGame: React.FC<PathfindingGameProps> = ({ difficulty, onEndGame, onBack, isQuickMode = false, isPracticeMode = false, language = 'ID' as Language }) => {
  const t = (key: string) => getTranslation(language, `pathfinding.${key}`);
  
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

  const generateGrid = useCallback((type: MazeType) => {
    const size = difficulty === Difficulty.BEGINNER ? 5 : difficulty === Difficulty.INTERMEDIATE ? 7 : 9;
    setGridSize(size);
    let newGrid: CellType[][] = Array(size).fill(null).map(() => Array(size).fill('EMPTY'));
    
    const start = { x: 0, y: 0 };
    let end = { x: size - 1, y: size - 1 };
    
    if (type === 'LABYRINTH') {
        newGrid = Array(size).fill(null).map(() => Array(size).fill('WALL'));
    }

    if (type === 'RANDOM') {
        let curr = { ...start };
        const path = new Set<string>([`0,0`]);
        let safety = 0;
        while ((curr.x !== end.x || curr.y !== end.y) && safety < 200) {
            safety++;
            const moves = [];
            if (curr.x < end.x) moves.push({x:curr.x+1, y:curr.y});
            if (curr.y < end.y) moves.push({x:curr.x, y:curr.y+1});
            if(Math.random() > 0.6) {
                if(curr.x > 0) moves.push({x:curr.x-1, y:curr.y});
                if(curr.y > 0) moves.push({x:curr.x, y:curr.y-1});
            }
            const valid = moves.filter(p => p.x >= 0 && p.x < size && p.y >= 0 && p.y < size);
            if(valid.length) curr = valid[Math.floor(Math.random()*valid.length)];
            path.add(`${curr.x},${curr.y}`);
        }
        for(let y=0; y<size; y++) {
            for(let x=0; x<size; x++) {
                if(!path.has(`${x},${y}`) && Math.random() < 0.3) newGrid[y][x] = 'WALL';
            }
        }
    } else if (type === 'LABYRINTH') {
        const stack = [start];
        newGrid[start.y][start.x] = 'EMPTY';
        while(stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];
            const dirs = [{x:0, y:-2}, {x:0, y:2}, {x:-2, y:0}, {x:2, y:0}];
            for (const d of dirs) {
                const nx = current.x + d.x, ny = current.y + d.y;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && newGrid[ny][nx] === 'WALL') {
                    neighbors.push({nx, ny, dx: d.x/2, dy: d.y/2});
                }
            }
            if (neighbors.length > 0) {
                const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                newGrid[current.y + chosen.dy][current.x + chosen.dx] = 'EMPTY';
                newGrid[chosen.ny][chosen.nx] = 'EMPTY';
                stack.push({x: chosen.nx, y: chosen.ny});
            } else {
                stack.pop();
            }
        }
        newGrid[end.y][end.x] = 'EMPTY';
    } else if (type === 'BINARY') {
        newGrid = Array(size).fill(null).map(() => Array(size).fill('WALL'));
        for(let y=0; y<size; y+=2) {
             for(let x=0; x<size; x+=2) {
                 newGrid[y][x] = 'EMPTY';
                 const dirs = [];
                 if (y > 0) dirs.push('N');
                 if (x > 0) dirs.push('W');
                 const carve = dirs[Math.floor(Math.random() * dirs.length)];
                 if (carve === 'N') newGrid[y-1][x] = 'EMPTY';
                 if (carve === 'W') newGrid[y][x-1] = 'EMPTY';
             }
        }
    } else if (type === 'BUNKER') {
        end = { x: Math.floor(size/2), y: Math.floor(size/2) };
        for(let r=0; r<size/2; r+=2) {
             for(let i=r; i<size-r; i++) {
                 if(i!==r+1) newGrid[r][i] = 'WALL'; 
                 if(i!==size-r-2) newGrid[size-r-1][i] = 'WALL';
                 if(i!==r+1) newGrid[i][r] = 'WALL';
                 newGrid[i][size-r-1] = 'WALL'; 
             }
             newGrid[r+1][r] = 'EMPTY'; 
        }
    } else if (type === 'OBSTACLE') {
        for(let y=0; y<size; y++) {
            for(let x=0; x<size; x++) {
                if (Math.random() < 0.4) newGrid[y][x] = 'WALL';
            }
        }
        newGrid[start.y][start.x] = 'EMPTY';
        newGrid[end.y][end.x] = 'EMPTY';
    }

    newGrid[start.y][start.x] = 'START';
    newGrid[end.y][end.x] = 'END';
    setStartPos(start);
    setBotPos(start);
    setEndPos(end);
    setGrid(newGrid);
    setCommands([]);
    setDebugLogs([]);
    setIsRunning(false);
    setActiveCommandIndex(null);
    setIsWinning(false);
  }, [difficulty]);

  const startGame = (type: MazeType) => {
    playSound('click');
    setCurrentMazeType(type);
    generateGrid(type);
    setViewState('GAME');
    startMusic('FOCUS');
    setTimeLeft(TOTAL_TIME);
  };

  const saveMission = () => {
    const data: SavedGame = {
        grid, botPos, startPos, endPos, commands, level, score, mazeType: currentMazeType
    };
    localStorage.setItem('pathfinding_save', JSON.stringify(data));
    playSound('correct');
  };

  const loadMission = () => {
    const saved = localStorage.getItem('pathfinding_save');
    if (saved) {
        const data: SavedGame = JSON.parse(saved);
        setGrid(data.grid);
        setBotPos(data.botPos);
        setStartPos(data.startPos);
        setEndPos(data.endPos);
        setCommands(data.commands);
        setLevel(data.level);
        setScore(data.score);
        setCurrentMazeType(data.mazeType);
        setGridSize(data.grid.length);
        setViewState('GAME');
        startMusic('FOCUS');
        playSound('click');
    }
  };

  const executeRun = async () => {
    if (commands.length === 0 || isRunning) return;
    
    setIsRunning(true);
    setDebugLogs([]); 
    let currentPos = { ...startPos };
    let crash = false;
    let win = false;

    setBotPos(startPos);
    
    // Wait a moment before starting
    await new Promise(r => setTimeout(r, 300));

    for (let i = 0; i < commands.length; i++) {
        if (!isMountedRef.current) return;
        setActiveCommandIndex(i); 
        const cmd = commands[i];
        let nextPos = { ...currentPos };

        switch(cmd) {
            case 'UP': nextPos.y -= 1; break;
            case 'DOWN': nextPos.y += 1; break;
            case 'LEFT': nextPos.x -= 1; break;
            case 'RIGHT': nextPos.x += 1; break;
        }

        let statusLog = 'OK';
        if (nextPos.x < 0 || nextPos.x >= gridSize || nextPos.y < 0 || nextPos.y >= gridSize) {
            crash = true; statusLog = 'BOUNDS';
        } else if (grid[nextPos.y][nextPos.x] === 'WALL') {
            crash = true; statusLog = 'WALL';
        }

        if (!crash && nextPos.x === endPos.x && nextPos.y === endPos.y) {
            win = true; statusLog = 'GOAL';
        }

        setDebugLogs(prev => [`[${i+1}] ${cmd}: (${nextPos.x},${nextPos.y}) ${statusLog}`, ...prev]);

        if (crash) {
            setBotPos(nextPos); 
            playSound('wrong');
            mistakeTracker.current.push("Collision Error");
            break;
        }

        setBotPos(nextPos);
        currentPos = nextPos;
        playSound('pop');

        if (win) break; 
        // Increased delay to 350ms to be safer than CSS 300ms transition
        const delay = isDebugMode ? 1000 : 350; 
        await new Promise(r => setTimeout(r, delay));
    }

    if (win) {
        setIsWinning(true);
        setScore(s => s + 100 + (difficulty === Difficulty.ADVANCED ? 50 : 0));
        setLevel(l => l + 1);
        playSound('correct');
        setShowConfetti(true);
        localStorage.removeItem('pathfinding_save');
        setHasSavedGame(false);
        setTimeout(() => {
            if(isMountedRef.current) {
                setIsWinning(false);
                generateGrid(currentMazeType);
            }
        }, 1500);
    } else {
        setTimeout(() => {
             if (isMountedRef.current) {
                setIsRunning(false);
                setBotPos(startPos);
                setActiveCommandIndex(null);
                setScore(s => Math.max(0, s - 20));
             }
        }, 1000);
    }
  };

  const addCommand = (dir: Direction) => {
    if (isRunning) return;
    if (commands.length < 20) { 
        setCommands(prev => [...prev, dir]);
        playSound('click');
    }
  };

  const removeCommand = () => {
    if (isRunning) return;
    setCommands(prev => prev.slice(0, -1));
    playSound('click');
  };

  const clearCommands = () => {
    if (isRunning) return;
    setCommands([]);
    playSound('click');
  };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    if (viewState === 'GAME' && !isRunning) saveMission();
    onEndGame({
      score: score,
      totalQuestions: level,
      correctAnswers: level - 1,
      accuracy: level > 1 ? 100 : 0, 
      duration: (TOTAL_TIME - timeLeft) * 1000,
      difficulty: difficulty,
      gameMode: GameMode.PATHFINDING,
      mistakePatterns: mistakeTracker.current
    });
  }, [viewState, isRunning, level, score, timeLeft, difficulty, onEndGame]);

  useEffect(() => {
    if (viewState === 'GAME' && !isPracticeMode && timeLeft > 0 && !isRunning) {
         const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100);
         return () => clearInterval(timer);
    }
  }, [viewState, isPracticeMode, timeLeft, isRunning]);

  useEffect(() => {
    if (timeLeft <= 0 && viewState === 'GAME' && !isPracticeMode) handleFinish();
  }, [timeLeft, viewState, isPracticeMode, handleFinish]);

  if (viewState === 'SELECT') {
      return (
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
             <div className="flex justify-between items-center mb-4">
                 <Button variant="ghost" onClick={onBack}>&larr; {t('missionSelect')}</Button>
                 <Badge color="bg-amber-500">{t('title')}</Badge>
             </div>
             {hasSavedGame && (
                 <Card onClick={loadMission} className="cursor-pointer border-l-8 border-l-retro-green flex items-center justify-between hover:bg-slate-900 group p-4">
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
                 {[
                     { id: 'RANDOM', name: t('missions.random'), icon: <Map />, desc: "Standard tasks." },
                     { id: 'LABYRINTH', name: t('missions.labyrinth'), icon: <Grid />, desc: "Complex mazes." },
                     { id: 'BUNKER', name: t('missions.bunker'), icon: <Database />, desc: "Spiral defense." },
                     { id: 'BINARY', name: t('missions.binary'), icon: <Cpu />, desc: "Biased paths." },
                     { id: 'OBSTACLE', name: t('missions.obstacle'), icon: <Zap />, desc: "Debris field." },
                 ].map((m) => (
                     <Card key={m.id} onClick={() => startGame(m.id as MazeType)} className="cursor-pointer hover:border-retro-cyan hover:-translate-y-1 transition-all p-4">
                         <div className="flex items-center gap-3 mb-2">
                             <div className="text-retro-cyan">{m.icon}</div>
                             <h3 className="font-pixel text-sm">{m.name}</h3>
                         </div>
                         <p className="text-xs text-slate-400 font-mono">{m.desc}</p>
                     </Card>
                 ))}
             </div>
        </div>
      );
  }

  return (
    <div className="w-full max-w-4xl mx-auto relative h-[calc(100vh-100px)] flex flex-col">
      {!introFinished && (
        <GameIntro 
          gameMode={GameMode.PATHFINDING} 
          language={language}
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
        title={getTranslation(language, 'tutorialTitle')}
        content={[
            t('goal'),
            "HINDARI TEMBOK / BOUNDS.",
            "INPUT COMMANDS > EXECUTE",
        ]}
        icon={<Map className="w-6 h-6" />}
      />
      <QuitModal isOpen={showQuitModal} onConfirm={handleFinish} onCancel={() => setShowQuitModal(false)} language={language} />

      <div className="flex justify-between items-center mb-2 shrink-0">
         <div className="flex gap-1">
            <Button variant="ghost" onClick={() => setShowQuitModal(true)} className="!px-2 text-xs">&larr; {t('save')}</Button>
            <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400"><HelpCircle className="w-4 h-4" /></Button>
         </div>
         <div className="flex gap-2 items-center">
            <Badge color="bg-amber-500">Lv.{level}</Badge>
            <Badge color="bg-retro-green">Sc:{score}</Badge>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
        {/* GRID AREA (FLEXIBLE) */}
        <div className="flex-1 flex flex-col items-center justify-start lg:justify-center min-h-0 overflow-hidden relative">
             <div className="w-full max-w-md mb-2 shrink-0"><CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} /></div>
             
             <div className="flex-1 w-full flex items-center justify-center min-h-0">
                <div className="relative aspect-square h-full max-h-full bg-slate-800 border-4 border-slate-600 p-1">
                    <div 
                        className="w-full h-full bg-slate-900"
                        style={{ 
                            display: 'grid',
                            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                            gap: '1px',
                        }}
                    >
                        {grid.map((row, y) => row.map((cell, x) => {
                            const isEnd = endPos.x === x && endPos.y === y;
                            const isStart = startPos.x === x && startPos.y === y;
                            let cellClass = "w-full h-full relative flex items-center justify-center ";
                            if (cell === 'WALL') cellClass += "bg-slate-800 border border-slate-700";
                            else cellClass += "bg-black border border-white/5";
                            return (
                                <div key={`${x}-${y}`} className={cellClass}>
                                    {cell === 'WALL' && <div className="w-full h-full opacity-40 bg-[repeating-linear-gradient(45deg,#000,#000_2px,#475569_2px,#475569_4px)]"></div>}
                                    {isStart && <div className="w-2/3 h-2/3 bg-emerald-500/50 border border-emerald-500"></div>}
                                    {isEnd && <Flag className="w-2/3 h-2/3 text-red-500 animate-bounce" />}
                                </div>
                            );
                        }))}
                        <div 
                            className="absolute z-20 transition-all duration-300 ease-linear pointer-events-none p-0.5"
                            style={{
                                width: `calc(100% / ${gridSize})`,
                                height: `calc(100% / ${gridSize})`,
                                left: `calc(${botPos.x} * 100% / ${gridSize})`,
                                top: `calc(${botPos.y} * 100% / ${gridSize})`,
                            }}
                        >
                            <div className={`w-full h-full border border-white flex items-center justify-center ${isWinning ? 'bg-retro-green animate-spin' : 'bg-retro-cyan'}`}>
                                 <Bot className="w-3/4 h-3/4 text-black" />
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>

        {/* CONTROL PANEL (BOTTOM ON MOBILE / RIGHT ON DESKTOP) */}
        <div className="flex-none lg:flex-1 lg:w-1/3 flex flex-col gap-2 min-w-0 w-full h-[200px] lg:h-auto shrink-0">
            <div className="flex justify-between items-center bg-black border border-slate-700 p-1 px-2 shrink-0">
                <div className="flex items-center gap-1 text-retro-yellow font-pixel text-[10px]"><Cpu size={12} /> BOT CONTROL</div>
                <Toggle checked={isDebugMode} onChange={setIsDebugMode} label={t('debug')} />
            </div>

            {/* COMMAND QUEUE */}
            <div className="bg-black border-2 border-slate-600 p-2 flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px]">
                {isDebugMode ? (
                     <div className="flex flex-col gap-0.5 text-retro-green">
                        {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
                     </div>
                ) : (
                    <div className="flex flex-wrap gap-1 content-start">
                        {commands.length === 0 && <span className="text-retro-green animate-pulse"> WAITING...</span>}
                        {commands.map((cmd, idx) => (
                            <div key={idx} className={`w-5 h-5 flex items-center justify-center border ${
                                idx === activeCommandIndex ? 'bg-retro-green text-black border-white' : 'bg-slate-900 text-retro-cyan border-retro-cyan'
                            }`}>
                                {cmd === 'UP' ? <ArrowUp size={10}/> : cmd === 'DOWN' ? <ArrowDown size={10}/> : cmd === 'LEFT' ? <ArrowLeft size={10}/> : <ArrowRight size={10}/>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* BUTTONS */}
            <div className="bg-slate-900 border border-slate-700 p-2 grid grid-cols-4 gap-1 shrink-0">
                 <Button onClick={() => addCommand('UP')} disabled={isRunning} className="justify-center bg-slate-800 p-2 border-b-2"><ArrowUp size={16}/></Button>
                 <Button onClick={() => addCommand('DOWN')} disabled={isRunning} className="justify-center bg-slate-800 p-2 border-b-2"><ArrowDown size={16}/></Button>
                 <Button onClick={() => addCommand('LEFT')} disabled={isRunning} className="justify-center bg-slate-800 p-2 border-b-2"><ArrowLeft size={16}/></Button>
                 <Button onClick={() => addCommand('RIGHT')} disabled={isRunning} className="justify-center bg-slate-800 p-2 border-b-2"><ArrowRight size={16}/></Button>
                 
                 <Button onClick={removeCommand} disabled={isRunning} variant="secondary" className="col-span-2 justify-center text-[10px] p-1 h-8"><RotateCcw size={12} className="mr-1"/> UNDO</Button>
                 <Button onClick={clearCommands} disabled={isRunning} variant="secondary" className="col-span-2 justify-center text-[10px] p-1 h-8"><Trash2 size={12} className="mr-1"/> CLEAR</Button>
                 
                 <Button onClick={executeRun} disabled={isRunning || commands.length === 0} className={`col-span-4 justify-center h-10 ${isRunning ? 'bg-retro-yellow' : 'bg-retro-green'}`}>
                    {isRunning ? 'RUNNING...' : <><Play size={14} className="mr-2"/> EXECUTE</>}
                 </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PathfindingGame;
