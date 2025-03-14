import React, { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import type { Difficulty } from '../game/types';

export const BottomBar: React.FC = () => {
  const {
    difficulty,
    setDifficulty,
    timer,
    moveCount,
    handleUndo,
    handleResetLevel,
    isPlaying
  } = useGame();
  
  const [localTimer, setLocalTimer] = useState(timer);
  
  useEffect(() => {
    let interval: number | undefined;
    
    if (isPlaying) {
      // Start the timer when game is playing
      interval = window.setInterval(() => {
        const [minutes, seconds] = localTimer.split(':').map(Number);
        let newSeconds = seconds + 1;
        let newMinutes = minutes;
        
        if (newSeconds >= 60) {
          newSeconds = 0;
          newMinutes += 1;
        }
        
        const formattedTime = `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
        setLocalTimer(formattedTime);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, localTimer]);
  
  // Reset local timer when the game timer changes (new game, reset, etc.)
  useEffect(() => {
    setLocalTimer(timer);
  }, [timer]);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = e.target.value as Difficulty;
    setDifficulty(newDifficulty);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-panel-bg z-10">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:h-16 px-4 md:px-6">
        <div className="flex items-center justify-between py-2 sm:py-0">
          {/* Left: Difficulty Selector */}
          <div className="flex items-center gap-3">
            <label htmlFor="difficulty" className="font-inter text-sm text-text-secondary">
              Difficulty:
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={handleDifficultyChange}
              className="font-inter text-sm bg-background text-text-primary border border-cell-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cell-hover cursor-pointer"
            >
              <option value="level1">Easiest</option>
              <option value="level2">Easy</option>
              <option value="level3">Medium</option>
              <option value="level4">Hard</option>
              <option value="level5">Hardest</option>
            </select>
          </div>

          {/* Center: Game Stats */}
          <div className="flex items-center gap-6 ml-4">
            <div className="font-inter text-sm text-text-secondary">
              Time: <span className="text-text-primary">{localTimer}</span>
            </div>
            <div className="font-inter text-sm text-text-secondary">
              Moves: <span className="text-text-primary">{moveCount}</span>
            </div>
          </div>
        </div>

        {/* Right: Control Buttons */}
        <div className="flex items-center justify-center sm:justify-end gap-3 py-2 sm:py-0 sm:ml-auto border-t sm:border-t-0 border-gray-200">
          <button
            onClick={handleUndo}
            className="font-inter text-sm px-3 py-1 bg-background text-text-primary border border-cell-border rounded hover:bg-cell-hover focus:outline-none focus:ring-2 focus:ring-cell-hover cursor-pointer"
          >
            Undo
          </button>
          <button
            onClick={handleResetLevel}
            className="font-inter text-sm px-3 py-1 bg-background text-text-primary border border-cell-border rounded hover:bg-cell-hover focus:outline-none focus:ring-2 focus:ring-cell-hover cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </footer>
  );
}; 