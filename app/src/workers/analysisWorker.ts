import { PuzzleGenerator } from '../game/PuzzleGenerator';
import { PuzzleSolver } from '../game/PuzzleSolver';
import { Difficulty } from '../game/types';

interface DifficultyStats {
  minMoves: number;
  maxMoves: number;
  avgMoves: number;
  minSolutions: number;
  maxSolutions: number;
  avgSolutions: number;
  minDeadEnds: number;
  maxDeadEnds: number;
  avgDeadEnds: number;
  solvableCount: number;
  totalPuzzles: number;
}

function analyzePuzzles(difficulty: Difficulty, count: number): DifficultyStats {
  const stats: DifficultyStats = {
    minMoves: Infinity,
    maxMoves: -Infinity,
    avgMoves: 0,
    minSolutions: Infinity,
    maxSolutions: -Infinity,
    avgSolutions: 0,
    minDeadEnds: Infinity,
    maxDeadEnds: -Infinity,
    avgDeadEnds: 0,
    solvableCount: 0,
    totalPuzzles: count
  };
  
  let totalMoves = 0;
  let totalSolutions = 0;
  let totalDeadEnds = 0;
  
  for (let i = 0; i < count; i++) {
    const puzzleDef = PuzzleGenerator.generate({ difficulty });
    const solver = new PuzzleSolver(puzzleDef);
    const result = solver.solve();
    
    if (result.isSolvable) {
      stats.solvableCount++;
      
      if (result.fewestMoves < stats.minMoves) stats.minMoves = result.fewestMoves;
      if (result.fewestMoves > stats.maxMoves) stats.maxMoves = result.fewestMoves;
      totalMoves += result.fewestMoves;
      
      if (result.correctSolutions < stats.minSolutions) stats.minSolutions = result.correctSolutions;
      if (result.correctSolutions > stats.maxSolutions) stats.maxSolutions = result.correctSolutions;
      totalSolutions += result.correctSolutions;
    }
    
    if (result.deadEnds < stats.minDeadEnds) stats.minDeadEnds = result.deadEnds;
    if (result.deadEnds > stats.maxDeadEnds) stats.maxDeadEnds = result.deadEnds;
    totalDeadEnds += result.deadEnds;
  }
  
  stats.avgMoves = stats.solvableCount > 0 ? totalMoves / stats.solvableCount : 0;
  stats.avgSolutions = stats.solvableCount > 0 ? totalSolutions / stats.solvableCount : 0;
  stats.avgDeadEnds = count > 0 ? totalDeadEnds / count : 0;
  
  if (stats.solvableCount === 0) {
    stats.minMoves = 0;
    stats.maxMoves = 0;
    stats.minSolutions = 0;
    stats.maxSolutions = 0;
  }
  
  return stats;
}

self.onmessage = (e: MessageEvent) => {
  const { batchSize, difficulty } = e.data;
  
  try {
    const results = analyzePuzzles(difficulty, batchSize);
    self.postMessage({ type: 'success', difficulty, results });
  } catch (error) {
    self.postMessage({ type: 'error', difficulty, error: error.message });
  }
}; 