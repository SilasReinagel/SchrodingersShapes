import { describe, it, expect } from 'vitest';
import { PuzzleGenerator } from './PuzzleGenerator';
import { CatShape, isCountConstraint } from './types';

describe('PuzzleGenerator', () => {
  it('should generate a puzzle with default settings', () => {
    const puzzle = PuzzleGenerator.generate({ difficulty: 'level2' });
    
    expect(puzzle).toBeDefined();
    expect(puzzle.initialBoard).toBeDefined();
    expect(puzzle.constraints).toBeDefined();
    
    // Level 2 is 2x3 grid (matching C implementation)
    expect(puzzle.initialBoard.length).toBe(3);
    expect(puzzle.initialBoard[0].length).toBe(2);
    
    // Should have between 3 and 12 constraints for level2
    expect(puzzle.constraints.length).toBeGreaterThanOrEqual(3);
    expect(puzzle.constraints.length).toBeLessThanOrEqual(12);
  });

  it('should generate an easy puzzle correctly', () => {
    const puzzle = PuzzleGenerator.generate({ difficulty: 'level1' });
    
    expect(puzzle.initialBoard.length).toBe(2);
    expect(puzzle.initialBoard[0].length).toBe(2);
    expect(puzzle.constraints.length).toBeGreaterThanOrEqual(2);
    expect(puzzle.constraints.length).toBeLessThanOrEqual(10);
  });

  it('should generate a hard puzzle correctly', () => {
    const puzzle = PuzzleGenerator.generate({ difficulty: 'level5' });
    
    expect(puzzle.initialBoard.length).toBe(4);
    expect(puzzle.initialBoard[0].length).toBe(4);
    expect(puzzle.constraints.length).toBeGreaterThanOrEqual(6);
    expect(puzzle.constraints.length).toBeLessThanOrEqual(30);
  });

  it('should initialize all cells in cat state (except locked cells)', () => {
    const puzzle = PuzzleGenerator.generate({ difficulty: 'level1' });
    
    puzzle.initialBoard.forEach(row => {
      row.forEach(cell => {
        if (!cell.locked) {
          expect(cell.shape).toBe(CatShape);
        } else {
          // Locked cells are pre-revealed from solution (not cat)
          expect(cell.shape).not.toBe(CatShape);
        }
      });
    });
  });

  it('may include a superposition constraint', () => {
    const puzzle = PuzzleGenerator.generate({ difficulty: 'level1' });
    
    const superpositionConstraint = puzzle.constraints.find(
      c => c.type === 'global' && c.rule.shape === CatShape
    );
    
    // Note: C implementation doesn't always include cat constraint
    // It depends on the facts extracted from the solution
    if (superpositionConstraint) {
      expect(superpositionConstraint.rule.operator).toBe('exactly');
    }
  });

  it('should respect custom size configuration', () => {
    const customSize = 5;
    const puzzle = PuzzleGenerator.generate({ width: customSize, height: customSize, difficulty: 'level2' });
    
    expect(puzzle.initialBoard.length).toBe(customSize);
    expect(puzzle.initialBoard[0].length).toBe(customSize);
  });

  it('should not generate duplicate constraints for the same row/column/shape', () => {
    const puzzle = PuzzleGenerator.generate({ difficulty: 'level2' });
    
    const constraintMap = new Map<string, number>();
    
    puzzle.constraints.forEach(constraint => {
      if (isCountConstraint(constraint) && constraint.type !== 'global') {
        const key = `${constraint.type}-${constraint.index}-${constraint.rule.shape}`;
        const count = constraintMap.get(key) || 0;
        constraintMap.set(key, count + 1);
      }
    });
    
    // Each combination should only appear once
    Array.from(constraintMap.values()).forEach(count => {
      expect(count).toBe(1);
    });
  });


  it('should not generate impossible constraint combinations', () => {
    // Test multiple difficulties to ensure no impossible combinations
    const difficulties = ['level1', 'level2', 'level3', 'level4', 'level5'] as const;
    
    difficulties.forEach(difficulty => {
      for (let i = 0; i < 3; i++) {
        const puzzle = PuzzleGenerator.generate({ difficulty });
        
        // Find the cat constraint
        const catConstraint = puzzle.constraints.find(
          c => isCountConstraint(c) && c.type === 'global' && c.rule.shape === CatShape && c.rule.operator === 'exactly'
        );
        
        // Cat constraint may or may not exist (C implementation doesn't guarantee it)
        if (catConstraint && isCountConstraint(catConstraint)) {
          const requiredCats = catConstraint.rule.count;
          
          // Check that no exact shape constraint requires fewer shapes than the number of cats
          puzzle.constraints.forEach(constraint => {
            if (isCountConstraint(constraint) &&
                constraint.type === 'global' && 
                constraint.rule.shape !== CatShape && 
                constraint.rule.operator === 'exactly') {
              
              // The exact count must be at least the number of required cats
              // since cats count as all shapes
              expect(constraint.rule.count).toBeGreaterThanOrEqual(requiredCats);
            }
          });
        }
      }
    });
  });
}); 