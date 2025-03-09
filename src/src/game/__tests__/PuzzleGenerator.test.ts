import { describe, it, expect } from 'vitest';
import { PuzzleGenerator } from '../PuzzleGenerator';

describe('PuzzleGenerator', () => {
  it('should generate a puzzle with default settings', () => {
    const puzzle = PuzzleGenerator.generate();
    
    expect(puzzle).toBeDefined();
    expect(puzzle.grid).toBeDefined();
    expect(puzzle.constraints).toBeDefined();
    expect(puzzle.config).toBeDefined();
    
    // Default difficulty is medium, which means 3x3 grid
    expect(puzzle.grid.length).toBe(3);
    expect(puzzle.grid[0].length).toBe(3);
    
    // Should have between 3 and 5 constraints for medium difficulty
    expect(puzzle.constraints.length).toBeGreaterThanOrEqual(3);
    expect(puzzle.constraints.length).toBeLessThanOrEqual(5);
  });

  it('should generate an easy puzzle correctly', () => {
    const puzzle = PuzzleGenerator.generate({ difficulty: 'easy' });
    
    expect(puzzle.grid.length).toBe(2);
    expect(puzzle.grid[0].length).toBe(2);
    expect(puzzle.constraints.length).toBeGreaterThanOrEqual(2);
    expect(puzzle.constraints.length).toBeLessThanOrEqual(3);
  });

  it('should generate a hard puzzle correctly', () => {
    const puzzle = PuzzleGenerator.generate({ difficulty: 'hard' });
    
    expect(puzzle.grid.length).toBe(4);
    expect(puzzle.grid[0].length).toBe(4);
    expect(puzzle.constraints.length).toBeGreaterThanOrEqual(4);
    expect(puzzle.constraints.length).toBeLessThanOrEqual(7);
  });

  it('should initialize all cells in cat', () => {
    const puzzle = PuzzleGenerator.generate();
    
    puzzle.grid.forEach(row => {
      row.forEach(cell => {
        expect(cell.shape).toBe('cat');
        expect(cell.locked).toBe(false);
        expect(cell.allowedShapes?.size).toBe(3); // square, circle, triangle
      });
    });
  });

  it('should always include a superposition constraint', () => {
    const puzzle = PuzzleGenerator.generate();
    
    const superpositionConstraint = puzzle.constraints.find(
      c => c.type === 'global' && c.rule.shape === 'cat'
    );
    
    expect(superpositionConstraint).toBeDefined();
    expect(superpositionConstraint?.rule.operator).toBe('exactly');
  });

  it('should respect custom size configuration', () => {
    const customSize = 5;
    const puzzle = PuzzleGenerator.generate({ size: customSize, difficulty: 'medium' });
    
    expect(puzzle.grid.length).toBe(customSize);
    expect(puzzle.grid[0].length).toBe(customSize);
  });

  it('should not generate duplicate constraints for the same row/column/shape', () => {
    const puzzle = PuzzleGenerator.generate();
    
    const constraintMap = new Map<string, number>();
    
    puzzle.constraints.forEach(constraint => {
      if (constraint.type !== 'global') {
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
}); 