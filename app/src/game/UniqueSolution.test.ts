import { describe, it, expect } from 'vitest';
import { PuzzleGenerator } from './PuzzleGenerator';
import { PuzzleSolver } from './PuzzleSolver';
import { FastSolver } from './FastSolver';
import { Difficulty } from './types';

/**
 * Test to validate puzzle uniqueness and benchmark solver performance.
 * 
 * A good puzzle should have EXACTLY one solution - this tests whether our
 * constraint selection actually produces uniquely-solvable puzzles.
 */
describe('Unique Solution Validation', () => {
  const SAMPLE_SIZE = 20;

  const testUniqueness = (difficulty: Difficulty, useFastSolver = true) => {
    const results: Array<{
      seed: number;
      solutions: number;
      constraints: number;
      timeMs: number;
    }> = [];

    const startTotal = performance.now();

    for (let seed = 0; seed < SAMPLE_SIZE; seed++) {
      const puzzle = PuzzleGenerator.generate({ difficulty }, seed);
      const start = performance.now();
      
      let solutionCount: number;
      if (useFastSolver) {
        const solver = new FastSolver(puzzle);
        const result = solver.solve(false);
        solutionCount = result.solutionCount;
      } else {
        const solver = new PuzzleSolver(puzzle);
        const result = solver.solve(false);
        solutionCount = result.correctSolutions;
      }
      
      const elapsed = performance.now() - start;
      
      results.push({
        seed,
        solutions: solutionCount,
        constraints: puzzle.constraints.length,
        timeMs: elapsed,
      });
    }

    const totalTime = performance.now() - startTotal;
    const uniqueSolutions = results.filter(r => r.solutions === 1).length;
    const multipleSolutions = results.filter(r => r.solutions > 1);
    const noSolutions = results.filter(r => r.solutions === 0);
    const avgTime = results.reduce((a, b) => a + b.timeMs, 0) / results.length;
    
    console.log(`\n${difficulty} (${useFastSolver ? 'FastSolver' : 'PuzzleSolver'}):`);
    console.log(`  Unique solution: ${uniqueSolutions}/${SAMPLE_SIZE}`);
    console.log(`  Multiple solutions: ${multipleSolutions.length}/${SAMPLE_SIZE}`);
    console.log(`  No solutions: ${noSolutions.length}/${SAMPLE_SIZE}`);
    console.log(`  Avg time: ${avgTime.toFixed(2)}ms | Total: ${totalTime.toFixed(0)}ms`);
    
    if (multipleSolutions.length > 0) {
      console.log(`  Examples with multiple solutions:`);
      multipleSolutions.slice(0, 5).forEach(r => {
        console.log(`    Seed ${r.seed}: ${r.solutions} solutions (${r.constraints} constraints)`);
      });
    }

    return { uniqueSolutions, multipleSolutions: multipleSolutions.length, noSolutions: noSolutions.length, avgTime, totalTime };
  };

  describe('FastSolver', () => {
    it('should report uniqueness statistics for level1', () => {
      const { uniqueSolutions } = testUniqueness('level1', true);
      expect(uniqueSolutions).toBe(SAMPLE_SIZE);
    });

    it('should report uniqueness statistics for level2', () => {
      const { uniqueSolutions } = testUniqueness('level2', true);
      expect(uniqueSolutions).toBe(SAMPLE_SIZE);
    });

    it('should report uniqueness statistics for level3', () => {
      const { uniqueSolutions } = testUniqueness('level3', true);
      expect(uniqueSolutions).toBe(SAMPLE_SIZE);
    });

    it('should report uniqueness statistics for level4', () => {
      const { uniqueSolutions } = testUniqueness('level4', true);
      expect(uniqueSolutions).toBe(SAMPLE_SIZE);
    });

    it('should report uniqueness statistics for level5', () => {
      const { uniqueSolutions } = testUniqueness('level5', true);
      expect(uniqueSolutions).toBe(SAMPLE_SIZE);
    });
  });

  describe('Performance Comparison', () => {
    it('should compare FastSolver vs PuzzleSolver on level1-3', () => {
      console.log('\n=== PERFORMANCE COMPARISON ===');
      
      const levels: Difficulty[] = ['level1', 'level2', 'level3'];
      
      for (const level of levels) {
        const fast = testUniqueness(level, true);
        const slow = testUniqueness(level, false);
        
        const speedup = slow.totalTime / fast.totalTime;
        console.log(`\n${level}: FastSolver is ${speedup.toFixed(1)}x faster`);
        console.log(`  FastSolver: ${fast.totalTime.toFixed(0)}ms total`);
        console.log(`  PuzzleSolver: ${slow.totalTime.toFixed(0)}ms total`);
      }
    });
  });
});

