import React, { useState, useRef, useEffect } from 'react';
import ReactModal from 'react-modal';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import type { Difficulty } from '../game/types';
import { Timer } from './Timer';
import { formatLevelNumber, encodeLevelNumber, decodeLevelNumber } from '../game/LevelNumber';

export const BottomBar: React.FC = () => {
  const {
    difficulty,
    setDifficulty,
    levelNumber,
    timer,
    handleUndo,
    handleResetLevel,
    handleNextLevel,
    handlePreviousLevel,
    generatePuzzleForLevel,
  } = useGame();

  const [showLevelModal, setShowLevelModal] = useState(false);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = e.target.value as Difficulty;
    setDifficulty(newDifficulty);
  };

  const handleGoToSeed = (seed: number) => {
    const newLevel = encodeLevelNumber(difficulty, seed);
    generatePuzzleForLevel(newLevel);
    setShowLevelModal(false);
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-panel-bg/90 backdrop-blur-sm z-30 border-t border-white/10">
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
            <button
              onClick={() => setShowLevelModal(true)}
              className="font-inter text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              Level: <span className="text-text-primary font-medium">{formatLevelNumber(levelNumber)}</span>
            </button>
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

      <LevelNavigationModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        levelNumber={levelNumber}
        onNext={() => { handleNextLevel(); setShowLevelModal(false); }}
        onPrevious={() => { handlePreviousLevel(); setShowLevelModal(false); }}
        onGoToSeed={handleGoToSeed}
      />
    </>
  );
};

interface LevelNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelNumber: number;
  onNext: () => void;
  onPrevious: () => void;
  onGoToSeed: (seed: number) => void;
}

const LevelNavigationModal: React.FC<LevelNavigationModalProps> = ({
  isOpen,
  onClose,
  levelNumber,
  onNext,
  onPrevious,
  onGoToSeed,
}) => {
  const { seed } = decodeLevelNumber(levelNumber);
  const [inputValue, setInputValue] = useState(seed.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(seed.toString());
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen, seed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 9999) {
      onGoToSeed(parsed);
    }
  };

  const btnClass =
    'flex-1 py-3 px-4 rounded-xl font-fredoka font-bold text-base transition-all cursor-pointer';

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal-content"
      overlayClassName="modal-overlay"
      closeTimeoutMS={200}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative max-w-sm mx-auto rounded-2xl p-6 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.97), rgba(30, 20, 60, 0.97))',
          boxShadow: `
            0 0 40px rgba(79, 195, 247, 0.3),
            0 20px 40px -10px rgba(0, 0, 0, 0.6),
            inset 0 0 60px rgba(79, 195, 247, 0.08),
            0 0 0 1.5px rgba(79, 195, 247, 0.4)
          `,
          border: '1.5px solid rgba(79, 195, 247, 0.3)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <h3
          className="text-xl font-fredoka font-bold mb-5 text-center"
          style={{
            background: 'linear-gradient(135deg, #4FC3F7, #FFB5BA)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Go to Puzzle
        </h3>

        <div className="text-center text-text-secondary font-inter text-sm mb-4">
          Current: <span className="text-text-primary font-medium">{formatLevelNumber(levelNumber)}</span>
        </div>

        <form onSubmit={handleSubmit} className="mb-5">
          <label className="block text-text-secondary font-inter text-xs mb-1.5">
            Seed (0–9999)
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="number"
              min={0}
              max={9999}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-background text-text-primary font-inter text-base border border-cell-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4FC3F7]/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-inter font-semibold text-sm text-white cursor-pointer transition-all hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #4FC3F7, #6B46C1)',
                border: '1px solid rgba(79, 195, 247, 0.4)',
              }}
            >
              Go
            </button>
          </div>
        </form>

        <div className="flex gap-3 mb-4">
          <button
            onClick={onPrevious}
            className={btnClass}
            style={{
              background: 'rgba(79, 195, 247, 0.12)',
              color: '#4FC3F7',
              border: '1px solid rgba(79, 195, 247, 0.3)',
            }}
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            className={btnClass}
            style={{
              background: 'rgba(79, 195, 247, 0.12)',
              color: '#4FC3F7',
              border: '1px solid rgba(79, 195, 247, 0.3)',
            }}
          >
            Next →
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 text-text-secondary font-inter text-sm hover:text-text-primary transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </motion.div>
    </ReactModal>
  );
};
