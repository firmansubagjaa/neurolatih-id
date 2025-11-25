
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
import { Map, HelpCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Zap, Flag, Cpu, Play, Grid, Database, Bot } from 'lucide-react';

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
  
  // View State: SELECT (Menu) or GAME (Playing)
  const [viewState, setViewState] = useState<'SELECT' | 'GAME'>('SELECT');
  const [introFinished, setIntroFinished] = useState(false);
  
  // Game State
  const [gridSize, setGridSize] = useState(5);
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [botPos, setBotPos] = useState<Position>({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState<Position>({ x: 0, y: 0 });
  
  const [commands, setCommands] = useState<Direction[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCommandIndex, setActiveCommandIndex] = useState<number | null>(null); // For visual feedback
  const [isWinning, setIsWinning] = useState(false);
  
  const [level, setLevel] = useState(1);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  
  const [currentMazeType, setCurrentMazeType] = useState<MazeType>('RANDOM');
  const [hasSavedGame, setHasSavedGame] = useState(false);

  // Modals
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
    
    // Check for saved game
    const saved = localStorage.getItem('pathfinding_save');
    if (saved) setHasSavedGame(true);

    return () => {
      isMountedRef.current = false;
      stopMusic();
    };
  }, []);

  // --- ALGORITHMS ---

  const generateGrid = useCallback((type: MazeType) => {
    const size = difficulty === Difficulty.BEGINNER ? 5 : difficulty === Difficulty.INTERMEDIATE ? 7 : 9;
    setGridSize(size);
    let newGrid: CellType[][] = Array(size).fill(null).map(() => Array(size).fill('EMPTY'));
    
    const start = { x: 0, y: 0 };
    let end = { x: size - 1, y: size - 1 };
    
    // Initialize Grid with Walls for DFS/Maze algos
    if (type === 'LABYRINTH') {
        newGrid = Array(size).fill(null).map(() => Array(size).fill('WALL'));
    }

    // 1. RANDOM WALKER (Classic)
    if (type === 'RANDOM') {
        let curr = { ...start };
        const path = new Set<string>([`0,0`]);
        let safety = 0;
        // Simple random walk to end
        while ((curr.x !== end.x || curr.y !== end.y) && safety < 200) {
            safety++;
            const moves = [];
            if (curr.x < end.x) moves.push({x:curr.x+1, y:curr.y});
            if (curr.y < end.y) moves.push({x:curr.x, y:curr.y+1});
            // Random jitter
            if(Math.random() > 0.6) {
                if(curr.x > 0) moves.push({x:curr.x-1, y:curr.y});
                if(curr.y > 0) moves.push({x:curr.x, y:curr.y-1});
            }
            const valid = moves.filter(p => p.x >= 0 && p.x < size && p.y >= 0 && p.y < size);
            if(valid.length) curr = valid[Math.floor(Math.random()*valid.length)];
            path.add(`${curr.x},${curr.y}`);
        }
        // Fill noise
        for(let y=0; y<size; y++) {
            for(let x=0; x<size; x++) {
                if(!path.has(`${x},${y}`) && Math.random() < 0.3) newGrid[y][x] = 'WALL';
            }
        }
    }
    
    // 2. THE LABYRINTH (DFS)
    else if (type === 'LABYRINTH') {
        const stack = [start];
        newGrid[start.y][start.x] = 'EMPTY';
        
        while(stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];
            // Look 2 steps away
            const dirs = [{x:0, y:-2}, {x:0, y:2}, {x:-2, y:0}, {x:2, y:0}];
            for (const d of dirs) {
                const nx = current.x + d.x, ny = current.y + d.y;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && newGrid[ny][nx] === 'WALL') {
                    neighbors.push({nx, ny, dx: d.x/2, dy: d.y/2});
                }
            }

            if (neighbors.length > 0) {
                const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                // Break wall between
                newGrid[current.y + chosen.dy][current.x + chosen.dx] = 'EMPTY';
                newGrid[chosen.ny][chosen.nx] = 'EMPTY';
                stack.push({x: chosen.nx, y: chosen.ny});
            } else {
                stack.pop();
            }
        }
        // Ensure end is open
        newGrid[end.y][end.x] = 'EMPTY';
    }

    // 3. BINARY TREE (Bias)
    else if (type === 'BINARY') {
        // Start full walls
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
    }

    // 4. THE BUNKER (Spiral)
    else if (type === 'BUNKER') {
        // Hardcoded-ish spiral or concentric rings
        end = { x: Math.floor(size/2), y: Math.floor(size/2) };
        for(let r=0; r<size/2; r+=2) {
             // Draw ring
             for(let i=r; i<size-r; i++) {
                 if(i!==r+1) newGrid[r][i] = 'WALL'; // Top
                 if(i!==size-r-2) newGrid[size-r-1][i] = 'WALL'; // Bottom
                 if(i!==r+1) newGrid[i][r] = 'WALL'; // Left
                 newGrid[i][size-r-1] = 'WALL'; // Right
             }
             // Open entrance for ring
             newGrid[r+1][r] = 'EMPTY'; 
        }
    }

    // 5. OBSTACLE (Random Chaos)
    else if (type === 'OBSTACLE') {
        for(let y=0; y<size; y++) {
            for(let x=0; x<size; x++) {
                if (Math.random() < 0.4) newGrid[y][x] = 'WALL';
            }
        }
        // Ensure Start/End clear
        newGrid[start.y][start.x] = 'EMPTY';
        newGrid[end.y][end.x] = 'EMPTY';
    }

    // Common Cleanup
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

  // --- GAME FLOW ---

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
    // Maybe show toast?
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

  // --- RUN LOGIC ---

  const executeRun = async () => {
    if (commands.length === 0 || isRunning) return;
    
    setIsRunning(true);
    setDebugLogs([]); 
    let currentPos = { ...startPos };
    let crash = false;
    let win = false;

    setBotPos(startPos);
    
    await new Promise(r => setTimeout(r, 300));

    for (let i = 0; i < commands.length; i++) {
        if (!isMountedRef.current) return;
        
        setActiveCommandIndex(i); // VISUAL FEEDBACK
        const cmd = commands[i];
        let nextPos = { ...currentPos };

        switch(cmd) {
            case 'UP': nextPos.y -= 1; break;
            case 'DOWN': nextPos.y += 1; break;
            case 'LEFT': nextPos.x -= 1; break;
            case 'RIGHT': nextPos.x += 1; break;
        }

        let statusLog = 'OK';
        // Bounds Check
        if (nextPos.x < 0 || nextPos.x >= gridSize || nextPos.y < 0 || nextPos.y >= gridSize) {
            crash = true;
            statusLog = 'BOUNDS_ERR';
        } 
        // Wall Check
        else if (grid[nextPos.y][nextPos.x] === 'WALL') {
            crash = true;
            statusLog = 'WALL_HIT';
        }

        // Win Check
        if (!crash && nextPos.x === endPos.x && nextPos.y === endPos.y) {
            win = true;
            statusLog = 'GOAL_REACHED';
        }

        const logEntry = `[${i + 1}] ${cmd}: (${nextPos.x},${nextPos.y}) [${statusLog}]`;
        setDebugLogs(prev => [logEntry, ...prev]);

        if (crash) {
            setBotPos(nextPos); // Move to crash site visually
            playSound('wrong');
            mistakeTracker.current.push("Collision Error");
            break;
        }

        setBotPos(nextPos);
        currentPos = nextPos;
        playSound('pop');

        if (win) break; 

        const delay = isDebugMode ? 600 : 300;
        await new Promise(r => setTimeout(r, delay));
    }

    if (win) {
        setIsWinning(true);
        setScore(s => s + 100 + (difficulty === Difficulty.ADVANCED ? 50 : 0));
        setLevel(l => l + 1);
        playSound('correct');
        setShowConfetti(true);
        // Clear save on win to prevent farming
        localStorage.removeItem('pathfinding_save');
        setHasSavedGame(false);
        
        setTimeout(() => {
            if(isMountedRef.current) {
                setIsWinning(false);
                // Generate next level of same type
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

  // --- CONTROLS ---

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
      setDebugLogs([]);
      playSound('click');
  };

  const handleFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Auto-save on exit if playing
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

  // Timer
  useEffect(() => {
    if (viewState === 'GAME' && !isPracticeMode && timeLeft > 0 && !isRunning) {
         const timer = setInterval(() => {
            setTimeLeft(t => Math.max(0, t - 0.1));
         }, 100);
         return () => clearInterval(timer);
    }
  }, [viewState, isPracticeMode, timeLeft, isRunning]);

  useEffect(() => {
    if (timeLeft <= 0 && viewState === 'GAME' && !isPracticeMode) {
        handleFinish();
    }
  }, [timeLeft, viewState, isPracticeMode, handleFinish]);

  // --- RENDERS ---

  if (viewState === 'SELECT') {
      return (
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                 <Button variant="ghost" onClick={onBack}>&larr; {t('missionSelect')}</Button>
                 <Badge color="bg-amber-500">{t('title')}</Badge>
             </div>
             
             {hasSavedGame && (
                 <Card onClick={loadMission} className="cursor-pointer border-l-8 border-l-retro-green flex items-center justify-between hover:bg-slate-900 group">
                    <div className="flex items-center gap-4">
                        <Database className="w-8 h-8 text-retro-green" />
                        <div className="text-left">
                            <h3 className="font-pixel text-retro-green">{t('resume')}</h3>
                            <p className="text-xs text-slate-500 font-mono">CONTINUE PREVIOUS SESSION</p>
                        </div>
                    </div>
                    <Play className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                 </Card>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[
                     { id: 'RANDOM', name: t('missions.random'), icon: <Map />, desc: "Standard navigation tasks." },
                     { id: 'LABYRINTH', name: t('missions.labyrinth'), icon: <Grid />, desc: "Complex maze structures." },
                     { id: 'BUNKER', name: t('missions.bunker'), icon: <Database />, desc: "Spiral defense layout." },
                     { id: 'BINARY', name: t('missions.binary'), icon: <Cpu />, desc: "Biased diagonal paths." },
                     { id: 'OBSTACLE', name: t('missions.obstacle'), icon: <Zap />, desc: "Random debris field." },
                 ].map((m) => (
                     <Card 
                        key={m.id} 
                        onClick={() => startGame(m.id as MazeType)} 
                        className="cursor-pointer hover:border-retro-cyan hover:-translate-y-1 transition-all"
                     >
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
    <div className="w-full max-w-4xl mx-auto space-y-3 relative">
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
            <div key="vis-1" className="flex items-center gap-2 my-2 bg-slate-800 p-2 border border-slate-600">
               <div className="flex gap-1">
                 <div className="w-6 h-6 bg-retro-cyan border border-white"></div>
                 <div className="w-6 h-6 border border-white flex items-center justify-center"><ArrowRight size={14} className="text-white"/></div>
                 <div className="w-6 h-6 border border-white bg-black flex items-center justify-center text-xs text-retro-red"><Flag size={14}/></div>
               </div>
               <span className="text-xs text-slate-400">{t('avoidWalls')}</span>
            </div>,
            "INPUT COMMANDS > EXECUTE",
        ]}
        icon={<Map className="w-6 h-6" />}
      />
      <QuitModal 
        isOpen={showQuitModal} 
        onConfirm={handleFinish} 
        onCancel={() => setShowQuitModal(false)}
        language={language}
      />

      {/* Header Bar */}
      <div className="flex flex-row justify-between items-center gap-2">
         <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowQuitModal(true)} className="!px-2 text-xs md:text-sm">
              &larr; {t('save')}
            </Button>
            <Button variant="ghost" onClick={() => setShowTutorial(true)} className="!px-2 text-neuro-400 hover:text-white text-xs md:text-sm">
              <HelpCircle className="w-4 h-4 mr-1" />
            </Button>
         </div>
         <div className="flex gap-2 items-center">
            {isQuickMode && <Badge color="bg-yellow-500 animate-pulse text-black"><Zap className="w-3 h-3 mr-1 inline" /> SPEED</Badge>}
            <Badge color="bg-amber-500">Lv.{level}</Badge>
            <Badge color="bg-retro-green">Score: {score}</Badge>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* LEFT: GRID AREA */}
        <div className="flex-1 flex flex-col items-center min-w-0">
             <Card className="mb-2 py-2 px-3 bg-slate-800/80 border-slate-700 w-full">
               <CountdownBar totalTime={TOTAL_TIME} timeLeft={timeLeft} isPracticeMode={isPracticeMode} />
            </Card>

            <div className="relative w-full max-w-[500px] aspect-square mx-auto bg-slate-800 border-4 border-slate-600 shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] p-1">
                <div 
                    className="w-full h-full bg-slate-900"
                    style={{ 
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                        gap: '2px', // Distinct retro grid lines
                    }}
                >
                    {grid.map((row, y) => 
                        row.map((cell, x) => {
                            const isEnd = endPos.x === x && endPos.y === y;
                            const isStart = startPos.x === x && startPos.y === y;
                            
                            // Retro Cell Styling
                            let cellContent = null;
                            let cellClass = "w-full h-full relative flex items-center justify-center overflow-hidden ";
                            
                            if (cell === 'WALL') {
                                cellClass += "bg-slate-800 border-slate-700";
                                // High contrast hatching pattern
                                cellContent = (
                                    <div className="w-full h-full opacity-40 bg-[repeating-linear-gradient(45deg,#000,#000_5px,#475569_5px,#475569_10px)]"></div>
                                );
                            } else {
                                cellClass += "bg-black";
                                // Subtle dot grid for empty cells
                                cellContent = <div className="w-0.5 h-0.5 bg-slate-800 rounded-full"></div>;
                            }

                            if (isStart) {
                                cellClass += " bg-emerald-900/30";
                                cellContent = (
                                    <div className="w-full h-full flex items-center justify-center">
                                         <div className="w-2/3 h-2/3 border-2 border-emerald-500 bg-emerald-500/20 animate-pulse flex items-center justify-center">
                                            <div className="w-1/3 h-1/3 bg-emerald-500"></div>
                                         </div>
                                    </div>
                                );
                            }

                            if (isEnd) {
                                cellClass += " bg-red-900/30";
                                cellContent = (
                                     <div className="w-full h-full flex items-center justify-center">
                                        <Flag className="w-2/3 h-2/3 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-bounce" strokeWidth={3} />
                                     </div>
                                );
                            }

                            return (
                                <div key={`${x}-${y}`} className={cellClass}>
                                    {cellContent}
                                </div>
                            );
                        })
                    )}
                    
                    {/* Bot Overlay - Independent of Grid Cells for Smoothness */}
                    <div 
                        className="absolute z-20 transition-all duration-300 ease-linear pointer-events-none"
                        style={{
                            width: `calc(100% / ${gridSize})`,
                            height: `calc(100% / ${gridSize})`,
                            left: `calc(${botPos.x} * 100% / ${gridSize})`,
                            top: `calc(${botPos.y} * 100% / ${gridSize})`,
                            padding: '4px' // Padding to fit inside cell borders
                        }}
                    >
                        <div className={`w-full h-full border-2 border-white flex items-center justify-center relative transition-all duration-300 ${
                            isWinning 
                            ? 'bg-retro-green shadow-[0_0_30px_#33ff00] animate-spin scale-110' 
                            : 'bg-retro-cyan shadow-[0_0_15px_#0ff]'
                        }`}
                        style={isWinning ? { animationDuration: '0.5s' } : {}}
                        >
                             <Bot className={`w-3/4 h-3/4 ${isWinning ? 'text-white' : 'text-black'}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: CONTROL PANEL */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
            
            {/* Header / Debug */}
            <div className="flex justify-between items-center bg-black border-2 border-slate-700 p-2 px-3">
                <div className="flex items-center gap-2 text-retro-yellow font-pixel text-xs">
                    <Cpu className="w-4 h-4" /> {t('programBot')}
                </div>
                <Toggle checked={isDebugMode} onChange={setIsDebugMode} label={t('debug')} />
            </div>

            {/* COMMAND QUEUE / CRT */}
            <div className="bg-black border-4 border-slate-600 p-3 h-[140px] overflow-y-auto custom-scrollbar relative font-mono text-xs shadow-inner">
                {/* CRT Scanline */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10 opacity-20"></div>
                
                {isDebugMode ? (
                     <div className="flex flex-col gap-1 text-retro-green">
                        {debugLogs.length === 0 && <span className="animate-pulse"> WAITING...</span>}
                        {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
                     </div>
                ) : (
                    <div className="flex flex-wrap gap-1 content-start">
                        {commands.length === 0 && <span className="text-retro-green animate-pulse"> {t('commands')}...</span>}
                        {commands.map((cmd, idx) => (
                            <div key={idx} className={`w-7 h-7 flex items-center justify-center border-2 font-bold transition-all ${
                                idx === activeCommandIndex
                                ? 'bg-retro-green text-black border-retro-green scale-110 z-10 shadow-[0_0_10px_#3f0]'
                                : 'bg-slate-900 text-retro-cyan border-retro-cyan'
                            }`}>
                                {cmd === 'UP' && <ArrowUp size={14} />}
                                {cmd === 'DOWN' && <ArrowDown size={14} />}
                                {cmd === 'LEFT' && <ArrowLeft size={14} />}
                                {cmd === 'RIGHT' && <ArrowRight size={14} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            <div className="bg-slate-900 border-2 border-slate-700 p-3 flex flex-col gap-3">
                <div className="flex justify-center">
                    <div className="grid grid-cols-3 gap-1 bg-black p-2 rounded-lg border border-slate-600">
                        <div></div>
                        <Button 
                            onClick={() => addCommand('UP')} 
                            disabled={isRunning} 
                            className={`w-14 h-14 !p-0 justify-center border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 ${
                                activeCommandIndex !== null && commands[activeCommandIndex] === 'UP' ? 'bg-retro-green border-white' : 'bg-slate-800'
                            }`}
                        >
                            <ArrowUp size={20}/>
                        </Button>
                        <div></div>
                        
                        <Button 
                            onClick={() => addCommand('LEFT')} 
                            disabled={isRunning} 
                            className={`w-14 h-14 !p-0 justify-center border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 ${
                                activeCommandIndex !== null && commands[activeCommandIndex] === 'LEFT' ? 'bg-retro-green border-white' : 'bg-slate-800'
                            }`}
                        >
                            <ArrowLeft size={20}/>
                        </Button>
                        <div className="w-14 h-14 flex items-center justify-center"><div className="w-2 h-2 bg-slate-700 rounded-full"></div></div>
                        <Button 
                            onClick={() => addCommand('RIGHT')} 
                            disabled={isRunning} 
                            className={`w-14 h-14 !p-0 justify-center border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 ${
                                activeCommandIndex !== null && commands[activeCommandIndex] === 'RIGHT' ? 'bg-retro-green border-white' : 'bg-slate-800'
                            }`}
                        >
                            <ArrowRight size={20}/>
                        </Button>
                        
                        <div></div>
                        <Button 
                            onClick={() => addCommand('DOWN')} 
                            disabled={isRunning} 
                            className={`w-14 h-14 !p-0 justify-center border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 ${
                                activeCommandIndex !== null && commands[activeCommandIndex] === 'DOWN' ? 'bg-retro-green border-white' : 'bg-slate-800'
                            }`}
                        >
                            <ArrowDown size={20}/>
                        </Button>
                        <div></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button 
                        disabled={isRunning || commands.length === 0}
                        onClick={removeCommand}
                        variant="secondary"
                        className="text-xs border-red-900 text-red-400 hover:bg-red-900/20 py-2"
                    >
                        <RotateCcw className="w-3 h-3 mr-1" /> {t('undo')}
                    </Button>
                    <Button 
                        disabled={isRunning}
                        onClick={clearCommands}
                        variant="secondary"
                        className="text-xs border-slate-600 text-slate-400 py-2"
                    >
                        {t('clear')}
                    </Button>
                </div>
                
                <Button 
                    disabled={isRunning || commands.length === 0} 
                    onClick={executeRun}
                    className={`w-full py-3 text-base border-b-4 border-black active:border-b-0 active:translate-y-1 transition-all ${isRunning ? 'bg-retro-yellow text-black' : 'bg-retro-green text-black animate-pulse'}`}
                >
                    {isRunning ? t('running') : <><Play className="w-4 h-4 mr-2" /> {t('execute')}</>}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PathfindingGame;
