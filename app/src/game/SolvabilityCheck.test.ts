import { describe, it, expect } from 'vitest';
import { PuzzleGenerator } from './PuzzleGenerator';
import { PuzzleSolver } from './PuzzleSolver';
import { Difficulty } from './types';

describe('Solution-First Solvability', () => {
  const SAMPLE_SIZE = 50;
  
  const testSolvability = (difficulty: Difficulty, expectedRate: number) => {
    let solvableCount = 0;
    
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const puzzle = PuzzleGenerator.generate({ difficulty }, i); // Use seed for reproducibility
      const solver = new PuzzleSolver(puzzle);
      // Use fast mode - stop at first solution found
      const result = solver.solve(true);
      
      if (result.isSolvable) {
        solvableCount++;
      }
    }
    
    const solvabilityRate = solvableCount / SAMPLE_SIZE;
    console.log(`${difficulty}: ${solvableCount}/${SAMPLE_SIZE} (${(solvabilityRate * 100).toFixed(1)}%)`);
    
    return solvabilityRate;
  };

  it('should generate 100% solvable puzzles for level1', () => {
    const rate = testSolvability('level1', 1.0);
    expect(rate).toBe(1.0);
  });

  it('should generate 100% solvable puzzles for level2', () => {
    const rate = testSolvability('level2', 1.0);
    expect(rate).toBe(1.0);
  });

  it('should generate 100% solvable puzzles for level3', () => {
    const rate = testSolvability('level3', 1.0);
    expect(rate).toBe(1.0);
  });
});

