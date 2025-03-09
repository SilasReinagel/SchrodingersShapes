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
    <div className="min-h-screen bg-[--background] text-[--text-primary]">
      {/* Navigation Bar */}
      <motion.nav 
        className="flex items-center justify-between p-4 bg-white shadow-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-xl font-semibold">Schrödinger's Shapes</h1>
        <div className="flex items-center space-x-4">
          <div className="text-lg font-mono">{formatTime(timer)}</div>
          <button className="nav-button">
            Share
          </button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
          {/* Puzzle Grid */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Grid 
              grid={puzzle.grid}
              onCellClick={handleCellClick}
            />
          </motion.div>

          {/* Constraints Panel */}
          <ConstraintsPanel constraints={puzzle.constraints} />
        </div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-sm flex justify-center items-center space-x-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button className="nav-button">
          Undo
        </button>
        <div className="text-sm text-[--text-secondary]">
          Moves: 0
        </div>
      </motion.footer>
    </div>
  );
};

export default App;