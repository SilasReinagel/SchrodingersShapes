import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { PuzzleGenerator } from '../game/PuzzleGenerator';
import { CurrentPuzzle } from '../game/CurrentPuzzle';
import type { ShapeId, Difficulty } from '../game/types';
import { CatShape } from '../game/types';

interface GameContextType {
  // Game state
  puzzle: CurrentPuzzle | null;
  isPlaying: boolean;
  showVictory: boolean;
  difficulty: Difficulty;
  timer: string;
  moveCount: number;
  isLoaded: boolean;

  // Actions
  generateNewPuzzle: (difficultyLevel: Difficulty) => void;
  handleCellClick: (row: number, col: number) => void;
  handleShapeSelect: (row: number, col: number, shape: ShapeId) => void;
  handleUndo: () => void;
  handleResetLevel: () => void;
  handleNextPuzzle: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  handleCloseVictory: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const puzzleRef = useRef<CurrentPuzzle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('level2');
  const [isLoaded, setIsLoaded] = useState(false);
  const [timer, setTimer] = useState('00:00');
  const [moveCount, setMoveCount] = useState(0);
  const [, forceUpdate] = useState({});

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
      setShowVictory(true);
    }
  }, []);

  const generateNewPuzzle = useCallback((difficultyLevel: Difficulty) => {
    const initialPuzzleDef = PuzzleGenerator.generate({ difficulty: difficultyLevel });
    puzzleRef.current = new CurrentPuzzle(initialPuzzleDef);
    
    setIsPlaying(false);
    setShowVictory(false);
    setIsLoaded(true);
    setMoveCount(0);
    setTimer('00:00');
    forceUpdate({});
  }, []);

  useEffect(() => {
    generateNewPuzzle(difficulty);
  }, [difficulty, generateNewPuzzle]);

  const handleCellClick = useCallback((row: number, col: number): void => {
    const puzzle = puzzleRef.current;
    if (!puzzle || showVictory) return;
    
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
  }, [showVictory, isPlaying, updateMoveCount, checkVictory]);

  const handleShapeSelect = useCallback((row: number, col: number, shape: ShapeId) => {
    const puzzle = puzzleRef.current;
    if (!puzzle || showVictory) return;
    
    if (!isPlaying) {
      setIsPlaying(true);
    }

    const moveSuccessful = puzzle.makeMove(col, row, shape);
    
    if (moveSuccessful) {
      updateMoveCount();
      checkVictory();
      forceUpdate({});
    }
  }, [showVictory, isPlaying, updateMoveCount, checkVictory]);

  const handleUndo = useCallback(() => {
    const puzzle = puzzleRef.current;
    if (!puzzle || showVictory || !puzzle.getCanUndo()) return;
    
    puzzle.undoMove();
    updateMoveCount();
    forceUpdate({});
  }, [showVictory, updateMoveCount]);

  const handleNextPuzzle = useCallback(() => {
    generateNewPuzzle(difficulty);
  }, [difficulty, generateNewPuzzle]);

  const handleResetLevel = useCallback(() => {
    const puzzle = puzzleRef.current;
    if (!puzzle) return;
    
    puzzle.resetToInitial();
    setIsPlaying(false);
    setShowVictory(false);
    setMoveCount(0);
    setTimer('00:00');
    forceUpdate({});
  }, []);

  const handleCloseVictory = useCallback(() => {
    setShowVictory(false);
  }, []);

  const value = {
    puzzle: puzzleRef.current,
    isPlaying,
    showVictory,
    difficulty,
    timer,
    moveCount,
    isLoaded,
    generateNewPuzzle,
    handleCellClick,
    handleShapeSelect,
    handleUndo,
    handleResetLevel,
    handleNextPuzzle,
    setDifficulty,
    handleCloseVictory,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}; 