import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PuzzleGenerator } from './game/PuzzleGenerator';
import { Grid } from './components/grid/Grid';
import { ConstraintsPanel } from './components/constraints/ConstraintsPanel';
import { VictoryModal } from './components/VictoryModal';
import type { ShapeId } from './game/types';
import { Timer } from './components/Timer';
import { CurrentPuzzle } from './game/CurrentPuzzle';
import { CatShape } from './game/types';

const App = () => {
  const [puzzle, setPuzzle] = useState<CurrentPuzzle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const timerRef = useRef<{ getTime: () => string } | null>(null);

  useEffect(() => {
    const initialPuzzleDef = PuzzleGenerator.generate({ difficulty: 'medium' });
    const initialPuzzle = new CurrentPuzzle(initialPuzzleDef);
    setPuzzle(initialPuzzle);
  }, []);

  const handleCellClick = useCallback((row: number, col: number): void => {
    if (!puzzle || showVictory) return;
    
    if (!isPlaying) {
      setIsPlaying(true);
    }

    if (!puzzle.canMove(col, row)) {
      console.log(`Cannot move at position (${col}, ${row}): cell is locked or out of bounds`);
      return;
    }
    
    const cell = puzzle.currentBoard[row][col];
    if (cell.shape === CatShape) {
      // Cell click will be handled by the ShapePicker
      console.log(`Cell at (${col}, ${row}) contains a Cat shape, will be handled by ShapePicker`);
      return;
    }

    const moveSuccessful = puzzle.makeMove(col, row, cell.shape);
    
    if (moveSuccessful) {
      setPuzzle(puzzle);
      // Check for victory
      if (puzzle.isPuzzleSolved()) {
        setIsPlaying(false);
        setShowVictory(true);
      }
    } else {
      console.log(`Move at (${col}, ${row}) failed to complete`);
    }
  }, [puzzle, showVictory, isPlaying]);

  const handleShapeSelect = useCallback((row: number, col: number, shape: ShapeId) => {
    if (!puzzle || showVictory) return;

    const moveSuccessful = puzzle.makeMove(col, row, shape);
    
    if (moveSuccessful) {
      setPuzzle(puzzle);
      // Check for victory
      if (puzzle.isPuzzleSolved()) {
        setIsPlaying(false);
        setShowVictory(true);
      }
    }
  }, [puzzle, showVictory, setIsPlaying, setShowVictory]);

  const handleUndo = useCallback(() => {
    if (!puzzle || showVictory || !puzzle.getCanUndo()) return;
    
    puzzle.undoMove();
    setPuzzle(puzzle);
  }, [puzzle, showVictory]);

  const handleNextPuzzle = useCallback(() => {
    const newPuzzleDef = PuzzleGenerator.generate({ difficulty: 'medium' });
    const newPuzzle = new CurrentPuzzle(newPuzzleDef);
    setPuzzle(newPuzzle);
    setShowVictory(false);
    setIsPlaying(false);
  }, []);

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
          <Timer 
            isPlaying={isPlaying} 
            ref={timerRef}
          />
          <button className="nav-button">
            Share
          </button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 relative z-10 flex items-center justify-center">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-6 max-h-[calc(100vh-140px)]">
          {/* Puzzle Grid Container */}
          <div className="w-full lg:w-auto">
            <div className="max-h-[min(65vh,65vw)] aspect-square">
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
              constraints={puzzle.constraints} 
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

export default App;