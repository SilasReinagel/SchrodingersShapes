import { PuzzleGenerator } from './PuzzleGenerator';
import { PuzzleSolver } from './PuzzleSolver';
import { Difficulty } from './types';

interface PuzzleStats {
  fewestMoves: number;
  correctSolutions: number;
  deadEnds: number;
  isSolvable: boolean;
}

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

/**
 * Analyzes puzzle statistics for a given difficulty level
 */
function analyzePuzzles(difficulty: Difficulty, count: number): DifficultyStats {
  console.log(`Generating and analyzing ${count} ${difficulty} puzzles...`);
  
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
    if (i > 0 && i % 100 === 0) {
      console.log(`  Progress: ${i}/${count} ${difficulty} puzzles analyzed`);
    }
    
    const puzzleDef = PuzzleGenerator.generate({ difficulty });
    const solver = new PuzzleSolver(puzzleDef);
    const result = solver.solve();
    
    if (result.isSolvable) {
      stats.solvableCount++;
      
      // Update moves stats
      if (result.fewestMoves < stats.minMoves) stats.minMoves = result.fewestMoves;
      if (result.fewestMoves > stats.maxMoves) stats.maxMoves = result.fewestMoves;
      totalMoves += result.fewestMoves;
      
      // Update solutions stats
      if (result.correctSolutions < stats.minSolutions) stats.minSolutions = result.correctSolutions;
      if (result.correctSolutions > stats.maxSolutions) stats.maxSolutions = result.correctSolutions;
      totalSolutions += result.correctSolutions;
    }
    
    // Update dead ends stats
    if (result.deadEnds < stats.minDeadEnds) stats.minDeadEnds = result.deadEnds;
    if (result.deadEnds > stats.maxDeadEnds) stats.maxDeadEnds = result.deadEnds;
    totalDeadEnds += result.deadEnds;
  }
  
  // Calculate averages
  stats.avgMoves = stats.solvableCount > 0 ? totalMoves / stats.solvableCount : 0;
  stats.avgSolutions = stats.solvableCount > 0 ? totalSolutions / stats.solvableCount : 0;
  stats.avgDeadEnds = count > 0 ? totalDeadEnds / count : 0;
  
  // Handle edge cases where no puzzles were solvable
  if (stats.solvableCount === 0) {
    stats.minMoves = 0;
    stats.maxMoves = 0;
    stats.minSolutions = 0;
    stats.maxSolutions = 0;
  }
  
  return stats;
}

/**
 * Prints the statistics for a difficulty level
 */
function printStats(difficulty: Difficulty, stats: DifficultyStats): void {
  console.log(`\n=== ${difficulty.toUpperCase()} PUZZLE STATISTICS ===`);
  console.log(`Total puzzles: ${stats.totalPuzzles}`);
  console.log(`Solvable puzzles: ${stats.solvableCount} (${(stats.solvableCount / stats.totalPuzzles * 100).toFixed(2)}%)`);
  
  console.log('\nMoves:');
  console.log(`  Min: ${stats.minMoves === Infinity ? 'N/A' : stats.minMoves}`);
  console.log(`  Max: ${stats.maxMoves === -Infinity ? 'N/A' : stats.maxMoves}`);
  console.log(`  Avg: ${stats.avgMoves.toFixed(2)}`);
  
  console.log('\nSolutions:');
  console.log(`  Min: ${stats.minSolutions === Infinity ? 'N/A' : stats.minSolutions}`);
  console.log(`  Max: ${stats.maxSolutions === -Infinity ? 'N/A' : stats.maxSolutions}`);
  console.log(`  Avg: ${stats.avgSolutions.toFixed(2)}`);
  
  console.log('\nDead Ends:');
  console.log(`  Min: ${stats.minDeadEnds === Infinity ? 'N/A' : stats.minDeadEnds}`);
  console.log(`  Max: ${stats.maxDeadEnds === -Infinity ? 'N/A' : stats.maxDeadEnds}`);
  console.log(`  Avg: ${stats.avgDeadEnds.toFixed(2)}`);
}

/**
 * Main function to run the analysis
 */
function runAnalysis() {
  console.log('Starting puzzle analysis...');
  const startTime = Date.now();
  
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const count = 1000;
  
  const results: Record<Difficulty, DifficultyStats> = {} as Record<Difficulty, DifficultyStats>;
  
  for (const difficulty of difficulties) {
    const difficultyStartTime = Date.now();
    results[difficulty] = analyzePuzzles(difficulty, count);
    const difficultyEndTime = Date.now();
    
    console.log(`Completed ${difficulty} analysis in ${((difficultyEndTime - difficultyStartTime) / 1000).toFixed(2)} seconds`);
    printStats(difficulty, results[difficulty]);
  }
  
  const endTime = Date.now();
  const executionTime = (endTime - startTime) / 1000;
  console.log(`\nTotal analysis completed in ${executionTime.toFixed(2)} seconds`);
  
  return results;
}

export { runAnalysis, analyzePuzzles, printStats };
