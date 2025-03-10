import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PuzzleGenerator } from './game/PuzzleGenerator';
import { Grid } from './components/grid/Grid';
import { ConstraintsPanel } from './components/constraints/ConstraintsPanel';
import type { Puzzle } from './game/types';

const App = () => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Generate a new puzzle when the component mounts
    setPuzzle(PuzzleGenerator.generate({ difficulty: 'medium' }));
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellClick = (row: number, col: number): void => {
    if (!puzzle) return;
    
    // Start timer on first move
    if (!isPlaying) {
      setIsPlaying(true);
    }

    // TODO: Implement cell click logic to cycle through shapes or show shape selector
    console.log(`Clicked cell at row ${row}, col ${col}`);
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
          <div className="text-lg font-mono bg-white px-4 py-2 rounded-full shadow-sm">
            {formatTime(timer)}
          </div>
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
        <button className="nav-button">
          Undo
        </button>
        <div className="text-sm bg-white px-4 py-2 rounded-full shadow-sm">
          Moves: 0
        </div>
      </motion.footer>
    </div>
  );
};

export default App;