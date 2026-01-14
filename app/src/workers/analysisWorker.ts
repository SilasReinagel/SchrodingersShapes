import { PuzzleGenerator } from '../game/PuzzleGenerator';
import { Difficulty } from '../game/types';
import { DIFFICULTY_SETTINGS } from '../game/DifficultySettings';

interface DifficultyStats {
  totalPuzzles: number;
  possibleCombinations: number;
}

function calculatePossibleCombinations(difficulty: Difficulty): number {
  // Get board size based on difficulty
  const width = DIFFICULTY_SETTINGS[difficulty].width;
  const height = DIFFICULTY_SETTINGS[difficulty].height;
  const totalCells = width * height;
  
  // We have 4 possible shapes (Square, Circle, Triangle, Cat) for each non-locked cell
  // For each cell, we can place any of these 4 shapes
  // So it's 4^(totalCells) for total theoretical combinations
  return Math.pow(4, totalCells);
}

function analyzePuzzles(difficulty: Difficulty, count: number): DifficultyStats {
  const stats: DifficultyStats = {
    totalPuzzles: count,
    possibleCombinations: calculatePossibleCombinations(difficulty)
  };
  
  // Generate puzzles (without solver analysis since JS solvers were removed)
  for (let i = 0; i < count; i++) {
    PuzzleGenerator.generate({ difficulty });
  }
  
  return stats;
}

self.onmessage = (e: MessageEvent) => {
  const { batchSize, difficulty } = e.data;
  
  try {
    const results = analyzePuzzles(difficulty, batchSize);
    self.postMessage({ type: 'success', difficulty, results });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    self.postMessage({ type: 'error', difficulty, error: errorMessage });
  }
};
