import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PuzzleGenerator } from './game/PuzzleGenerator';
import { Grid } from './components/grid/Grid';
import { ConstraintsPanel } from './components/constraints/ConstraintsPanel';
import type { Puzzle, Shape } from './game/types';
import { Timer } from './components/Timer';

const App = () => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moves, setMoves] = useState<Puzzle[]>([]);

  useEffect(() => {
    const initialPuzzle = PuzzleGenerator.generate({ difficulty: 'medium' });
    setPuzzle(initialPuzzle);
    setMoves([initialPuzzle]);
  }, []);

  const handleCellClick = (row: number, col: number): void => {
    if (!puzzle) return;
    
    if (!isPlaying) {
      setIsPlaying(true);
    }

    const cell = puzzle.grid[row][col];
    if (cell.shape === 'cat' && !cell.locked) {
      // Cell click will be handled by the ShapePicker
      return;
    }
  };

  const handleShapeSelect = (row: number, col: number, shape: Shape) => {
    if (!puzzle) return;

    const newPuzzle = {
      ...puzzle,
      grid: puzzle.grid.map((r, i) =>
        r.map((cell, j) =>
          i === row && j === col
            ? { ...cell, shape }
            : cell
        )
      )
    };

    setPuzzle(newPuzzle);
    setMoves(prev => [...prev, newPuzzle]);
  };

  const handleUndo = () => {
    if (moves.length <= 1) return;
    
    const newMoves = moves.slice(0, -1);
    setPuzzle(newMoves[newMoves.length - 1]);
    setMoves(newMoves);
  };

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
          <Timer isPlaying={isPlaying} />
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
                grid={puzzle.grid}
                onCellClick={handleCellClick}
                onShapeSelect={handleShapeSelect}
              />
            </div>
          </div>

          {/* Constraints Panel */}
          <div className="w-full lg:w-auto max-h-[65vh] overflow-y-auto">
            <ConstraintsPanel constraints={puzzle.constraints} />
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
          disabled={moves.length <= 1}
        >
          Undo
        </button>
        <div className="text-sm bg-white px-4 py-2 rounded-full shadow-sm">
          Moves: {moves.length - 1}
        </div>
      </motion.footer>
    </div>
  );
};

export default App;