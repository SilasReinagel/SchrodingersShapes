import React from 'react';
import { useGame } from '../contexts/GameContext';
import type { Difficulty } from '../game/types';
import { Timer } from './Timer';

export const BottomBar: React.FC = () => {
  const {
    difficulty,
    setDifficulty,
    seed,
    timer,
    handleUndo,
    handleResetLevel,
  } = useGame();

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = e.target.value as Difficulty;
    setDifficulty(newDifficulty);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-panel-bg z-10">
      <div className="max-w-4xl mx-auto h-full flex items-center justify-between px-4 md:px-6">
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
            <option value="level1">Level 1</option>
            <option value="level2">Level 2</option>
            <option value="level3">Level 3</option>
            <option value="level4">Level 4</option>
            <option value="level5">Level 5</option>
          </select>
        </div>

        {/* Center: Game Stats */}
        <div className="flex items-center gap-6">
          <div className="font-inter text-sm text-text-secondary">
            Time: <Timer time={timer} className="text-text-primary" />
          </div>
          <div className="font-inter text-sm text-text-secondary">
            Seed: <span className="text-text-primary">{seed}</span>
          </div>
        </div>

        {/* Right: Control Buttons */}
        <div className="flex items-center gap-3">
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
