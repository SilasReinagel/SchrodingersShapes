import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { PuzzleGenerator } from '../game/PuzzleGenerator';
import { CurrentPuzzle } from '../game/CurrentPuzzle';
import type { ShapeId, Difficulty } from '../game/types';
import { CatShape } from '../game/types';
import { 
  encodeLevelNumber, 
  decodeLevelNumber, 
  getNextLevelNumber,
  getPreviousLevelNumber,
  getStartingLevelNumber 
} from '../game/LevelNumber';

// LocalStorage keys
const STORAGE_KEY_LEVEL = 'schrodingers_shapes_level';
const STORAGE_KEY_COMPLETED = 'schrodingers_shapes_completed';

const VICTORY_DELAY_MS = 3000;

interface GameContextType {
  // Game state
  puzzle: CurrentPuzzle | null;
  isPlaying: boolean;
  puzzleSolved: boolean; // true when puzzle just solved, before modal (confetti + highlight phase)
  showVictory: boolean;
  difficulty: Difficulty;
  seed: number;
  levelNumber: number;
  timer: string;
  moveCount: number;
  isLoaded: boolean;

  // Actions
  generatePuzzleForLevel: (levelNumber: number) => void;
  handleCellClick: (row: number, col: number) => void;
  handleShapeSelect: (row: number, col: number, shape: ShapeId) => void;
  handleUndo: () => void;
  handleResetLevel: () => void;
  handleNextLevel: () => void;
  handlePreviousLevel: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

/**
 * Loads the saved level from localStorage, or returns the starting level for the given difficulty
 */
const loadSavedLevel = (): number => {
  try {
    const savedLevel = localStorage.getItem(STORAGE_KEY_LEVEL);
    if (savedLevel) {
      const level = parseInt(savedLevel, 10);
      if (!isNaN(level) && level >= 10000) {
        return level;
      }
    }
  } catch {
    // localStorage not available
  }
  return getStartingLevelNumber('level1');
};

/**
 * Saves the current level to localStorage
 */
const saveCurrentLevel = (levelNumber: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY_LEVEL, levelNumber.toString());
  } catch {
    // localStorage not available
  }
};

/**
 * Marks a level as completed in localStorage
 */
const markLevelCompleted = (levelNumber: number): void => {
  try {
    const completed = loadCompletedLevels();
    completed.add(levelNumber);
    localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify([...completed]));
  } catch {
    // localStorage not available
  }
};

/**
 * Loads the set of completed levels from localStorage
 */
const loadCompletedLevels = (): Set<number> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COMPLETED);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {
    // localStorage not available or invalid data
  }
  return new Set();
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const puzzleRef = useRef<CurrentPuzzle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [levelNumber, setLevelNumber] = useState<number>(() => loadSavedLevel());
  const [isLoaded, setIsLoaded] = useState(false);
  const [timer, setTimer] = useState('00:00');
  const [moveCount, setMoveCount] = useState(0);
  const [, forceUpdate] = useState({});

  // Derive difficulty and seed from level number
  const { difficulty, seed } = decodeLevelNumber(levelNumber);

  const updateMoveCount = useCallback(() => {
    const puzzle = puzzleRef.current;
    if (puzzle) {
      setMoveCount(puzzle.getMoveCount());
    }
  }, []);

  const checkVictory = useCallback(() => {
    const puzzle = puzzleRef.current;
    if (puzzle?.isPuzzleSolved()) {
      setIsPlaying(false);
      setPuzzleSolved(true);
      // Mark level as completed and save next level
      markLevelCompleted(levelNumber);
      const nextLevel = getNextLevelNumber(levelNumber);
      saveCurrentLevel(nextLevel);
    }
  }, [levelNumber]);

  // Delay victory modal by 3 seconds after puzzle solved (confetti + board highlight phase)
  useEffect(() => {
    if (!puzzleSolved) return;
    const t = setTimeout(() => setShowVictory(true), VICTORY_DELAY_MS);
    return () => clearTimeout(t);
  }, [puzzleSolved]);

  const generatePuzzleForLevel = useCallback((newLevelNumber: number) => {
    const { difficulty: newDifficulty, seed: newSeed } = decodeLevelNumber(newLevelNumber);
    const initialPuzzleDef = PuzzleGenerator.generate({ difficulty: newDifficulty }, newSeed);
    puzzleRef.current = new CurrentPuzzle(initialPuzzleDef);
    
    setLevelNumber(newLevelNumber);
    setIsPlaying(false);
    setPuzzleSolved(false);
    setShowVictory(false);
    setIsLoaded(true);
    setMoveCount(0);
    setTimer('00:00');
    saveCurrentLevel(newLevelNumber);
    forceUpdate({});
  }, []);

  // Start timer on first user interaction (hover or click) after level loads
  useEffect(() => {
    if (isPlaying || !isLoaded || puzzleSolved) return;

    const start = () => setIsPlaying(true);
    window.addEventListener('mousemove', start, { once: true });
    window.addEventListener('pointerdown', start, { once: true });
    return () => {
      window.removeEventListener('mousemove', start);
      window.removeEventListener('pointerdown', start);
    };
  }, [isPlaying, isLoaded, puzzleSolved]);

  // Pause timer when the tab is not visible (alt-tab on single monitor)
  const [tabVisible, setTabVisible] = useState(!document.hidden);
  useEffect(() => {
    const onVisChange = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, []);

  // Timer effect: only tick when playing AND tab is visible
  useEffect(() => {
    if (!isPlaying || !tabVisible) return;

    const interval = setInterval(() => {
      setTimer((currentTime) => {
        const [minutes, seconds] = currentTime.split(':').map(Number);
        let newSeconds = seconds + 1;
        let newMinutes = minutes;
        
        if (newSeconds >= 60) {
          newSeconds = 0;
          newMinutes += 1;
        }
        
        return `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, tabVisible]);

  // Initialize puzzle on mount
  useEffect(() => {
    generatePuzzleForLevel(levelNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCellClick = useCallback((row: number, col: number): void => {
    const puzzle = puzzleRef.current;
    if (!puzzle || puzzleSolved || showVictory) return;
    
    if (!isPlaying) {
      setIsPlaying(true);
    }

    if (!puzzle.canMove(col, row)) {
      return;
    }

    const cell = puzzle.currentBoard[row][col];
    if (cell.shape === CatShape) {
      return; // Let the Grid component handle cat cells with ShapePicker
    }

    // For non-cat cells, toggle the move
    const moveSuccessful = puzzle.makeMove(col, row, cell.shape);
    if (moveSuccessful) {
      updateMoveCount();
      checkVictory();
      forceUpdate({});
    }
  }, [puzzleSolved, showVictory, isPlaying, updateMoveCount, checkVictory]);

  const handleShapeSelect = useCallback((row: number, col: number, shape: ShapeId) => {
    const puzzle = puzzleRef.current;
    if (!puzzle || puzzleSolved || showVictory) return;
    
    if (!isPlaying) {
      setIsPlaying(true);
    }

    const moveSuccessful = puzzle.makeMove(col, row, shape);
    
    if (moveSuccessful) {
      updateMoveCount();
      checkVictory();
      forceUpdate({});
    }
  }, [puzzleSolved, showVictory, isPlaying, updateMoveCount, checkVictory]);

  const handleUndo = useCallback(() => {
    const puzzle = puzzleRef.current;
    if (!puzzle || puzzleSolved || showVictory || !puzzle.getCanUndo()) return;
    
    puzzle.undoMove();
    updateMoveCount();
    forceUpdate({});
  }, [puzzleSolved, showVictory, updateMoveCount]);

  const handleNextLevel = useCallback(() => {
    const nextLevel = getNextLevelNumber(levelNumber);
    generatePuzzleForLevel(nextLevel);
  }, [levelNumber, generatePuzzleForLevel]);

  const handlePreviousLevel = useCallback(() => {
    const prevLevel = getPreviousLevelNumber(levelNumber);
    generatePuzzleForLevel(prevLevel);
  }, [levelNumber, generatePuzzleForLevel]);

  const handleResetLevel = useCallback(() => {
    const puzzle = puzzleRef.current;
    if (!puzzle) return;
    
    puzzle.resetToInitial();
    setIsPlaying(false);
    setPuzzleSolved(false);
    setShowVictory(false);
    setMoveCount(0);
    setTimer('00:00');
    forceUpdate({});
  }, []);

  const setDifficultyHandler = useCallback((newDifficulty: Difficulty) => {
    // When difficulty changes, load the saved progress for that difficulty
    // or start at seed 0 if no progress exists
    const newLevelNumber = getStartingLevelNumber(newDifficulty);
    
    // Check if there's saved progress for this difficulty
    const completedLevels = loadCompletedLevels();
    let targetLevel = newLevelNumber;
    
    // Find the next uncompleted level in this difficulty
    const { difficulty: checkDiff } = decodeLevelNumber(newLevelNumber);
    for (let i = 0; i < 10000; i++) {
      const checkLevel = encodeLevelNumber(checkDiff, i);
      if (!completedLevels.has(checkLevel)) {
        targetLevel = checkLevel;
        break;
      }
    }
    
    generatePuzzleForLevel(targetLevel);
  }, [generatePuzzleForLevel]);

  const value = {
    puzzle: puzzleRef.current,
    isPlaying,
    puzzleSolved,
    showVictory,
    difficulty,
    seed,
    levelNumber,
    timer,
    moveCount,
    isLoaded,
    generatePuzzleForLevel,
    handleCellClick,
    handleShapeSelect,
    handleUndo,
    handleResetLevel,
    handleNextLevel,
    handlePreviousLevel,
    setDifficulty: setDifficultyHandler,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
