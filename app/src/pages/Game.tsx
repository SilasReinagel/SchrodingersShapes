import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PuzzleGenerator } from '../game/PuzzleGenerator';
import { Grid } from '../components/grid/Grid';
import { ConstraintsPanel } from '../components/constraints/ConstraintsPanel';
import { VictoryModal } from '../components/VictoryModal';
import type { ShapeId, Difficulty } from '../game/types';
import { Timer } from '../components/Timer';
import { CurrentPuzzle } from '../game/CurrentPuzzle';
import { CatShape } from '../game/types';
import { DIFFICULTY_SETTINGS } from '../game/DifficultySettings';

// Difficulty display names
const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  level1: 'Level 1 - Easy',
  level2: 'Level 2 - Medium',
  level3: 'Level 3 - Challenging',
  level4: 'Level 4 - Hard',
  level5: 'Level 5 - Expert'
};

export const Game = () => {
  const [puzzle, setPuzzle] = useState<CurrentPuzzle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('level2');
  const timerRef = useRef<{ getTime: () => string } | null>(null);

  useEffect(() => {
    generateNewPuzzle(difficulty);
  }, [difficulty]);

  const generateNewPuzzle = (difficultyLevel: Difficulty) => {
    const initialPuzzleDef = PuzzleGenerator.generate({ difficulty: difficultyLevel });
    const initialPuzzle = new CurrentPuzzle(initialPuzzleDef);
    setPuzzle(initialPuzzle);
    setIsPlaying(false);
    setShowVictory(false);
  };

  const handleCellClick = useCallback((row: number, col: number): void => {
    if (!puzzle || showVictory) return;
    
    if (!isPlaying) {
      setIsPlaying(true);
    }

    if (!puzzle.canMove(col, row)) {
      return;
    }
    
    // Let the Grid component handle the ShapePicker for cat cells
    const cell = puzzle.currentBoard[row][col];
    if (cell.shape === CatShape) {
      return;
    }

    // For non-cat cells, try to make the move
    const moveSuccessful = puzzle.makeMove(col, row, cell.shape);
    if (moveSuccessful) {
      setPuzzle(new CurrentPuzzle(puzzle.definition)); // Create new instance to trigger re-render
      
      if (puzzle.isPuzzleSolved()) {
        setIsPlaying(false);
        setShowVictory(true);
      }
    }
  }, [puzzle, showVictory, isPlaying]);

  const handleShapeSelect = useCallback((row: number, col: number, shape: ShapeId) => {
    if (!puzzle || showVictory) return;

    const moveSuccessful = puzzle.makeMove(col, row, shape);
    if (moveSuccessful) {
      setPuzzle(new CurrentPuzzle(puzzle.definition)); // Create new instance to trigger re-render
      
      if (puzzle.isPuzzleSolved()) {
        setIsPlaying(false);
        setShowVictory(true);
      }
    }
  }, [puzzle, showVictory]);

  const handleUndo = useCallback(() => {
    if (!puzzle || showVictory || !puzzle.getCanUndo()) return;
    
    puzzle.undoMove();
    setPuzzle(new CurrentPuzzle(puzzle.definition)); // Create new instance to trigger re-render
  }, [puzzle, showVictory]);

  const handleNextPuzzle = useCallback(() => {
    generateNewPuzzle(difficulty);
  }, [difficulty]);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(e.target.value as Difficulty);
  };

  const handleCloseVictory = useCallback(() => {
    setShowVictory(false);
  }, []);

  if (!puzzle) return null;

  return (
    <div className="h-screen text-text-primary relative overflow-hidden flex flex-col">
      {/* Background Bubbles */}
      <div className="bubble-1" />
      <div className="bubble-2" />
      <div className="bubble-3" />

      {/* Navigation Bar */}
      <motion.nav 
        className="relative z-10 flex items-center justify-between p-4 md:p-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-xl md:text-2xl font-bold">
          <span className="bg-gradient-to-r from-shape-square to-shape-circle bg-clip-text text-transparent">
            Schrödinger's Shapes
          </span>
        </h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={difficulty}
              onChange={handleDifficultyChange}
              className="appearance-none bg-white/10 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(DIFFICULTY_NAMES).map(([value, name]) => (
                <option key={value} value={value}>{name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          <Timer 
            isPlaying={isPlaying} 
            ref={timerRef}
          />
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 relative z-10 flex items-center justify-center">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-6 max-h-[calc(100vh-140px)]">
          {/* Puzzle Grid Container */}
          <div className="w-full lg:w-auto">
            <div className="max-h-[min(65vh,65vw)]">
              <Grid 
                grid={puzzle.currentBoard}
                onCellClick={handleCellClick}
                onShapeSelect={handleShapeSelect}
              />
            </div>
          </div>

          {/* Constraints Panel */}
          <div className="w-full lg:w-auto max-h-[65vh] overflow-y-auto">
            <ConstraintsPanel 
              constraints={puzzle.definition.constraints} 
              grid={puzzle.currentBoard}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 p-4 md:p-6 flex justify-center items-center space-x-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button 
          className="nav-button"
          onClick={handleUndo}
          disabled={!puzzle.getCanUndo() || showVictory}
        >
          Undo
        </button>
        <div className="text-sm bg-white px-4 py-2 rounded-full shadow-sm">
          Moves: {puzzle.getMoveCount()}
        </div>
        <button 
          className="nav-button"
          onClick={handleNextPuzzle}
        >
          New Puzzle
        </button>
      </motion.footer>

      {/* Victory Modal */}
      <VictoryModal
        isOpen={showVictory}
        onClose={handleCloseVictory}
        moves={puzzle.getMoveCount()}
        time={timerRef.current?.getTime() || '0:00'}
        onNextPuzzle={handleNextPuzzle}
      />
    </div>
  );
}; 