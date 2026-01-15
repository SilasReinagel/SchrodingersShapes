import { describe, it, expect } from 'vitest';
import { PuzzleGenerator } from './PuzzleGenerator';
import { CatShape, SquareShape, CircleShape, TriangleShape, isCountConstraint, isCellConstraint, ConstraintDefinition, GameBoard, Cell } from './types';

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

// =============================================================================
// Constraint Optimization Tests
// =============================================================================

describe('PuzzleGenerator.optimizeConstraints', () => {
  // Helper to create a board for testing
  const createBoard = (width: number, height: number, cells?: Partial<Cell>[][]): GameBoard => {
    const board: GameBoard = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        const override = cells?.[y]?.[x];
        row.push({
          shape: override?.shape ?? CatShape,
          locked: override?.locked ?? false
        });
      }
      board.push(row);
    }
    return board;
  };

  it('should remove duplicate constraints', () => {
    const board = createBoard(2, 2);
    const constraints: ConstraintDefinition[] = [
      { type: 'global', rule: { shape: SquareShape, count: 2, operator: 'exactly' } },
      { type: 'global', rule: { shape: SquareShape, count: 2, operator: 'exactly' } }, // duplicate
      { type: 'row', index: 0, rule: { shape: CircleShape, count: 1, operator: 'exactly' } },
    ];

    const optimized = PuzzleGenerator.optimizeConstraints(constraints, board);

    // Should only have 2 constraints (duplicate removed)
    const globalSquareCount = optimized.filter(
      c => isCountConstraint(c) && c.type === 'global' && c.rule.shape === SquareShape
    ).length;
    expect(globalSquareCount).toBe(1);
  });

  it('should remove constraints on locked cells', () => {
    const board = createBoard(2, 2, [
      [{ shape: SquareShape, locked: true }, { shape: CatShape, locked: false }],
      [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
    ]);

    const constraints: ConstraintDefinition[] = [
      { type: 'cell', x: 0, y: 0, rule: { shape: SquareShape, operator: 'is' } }, // on locked cell
      { type: 'cell', x: 1, y: 0, rule: { shape: CircleShape, operator: 'is' } }, // on unlocked cell
    ];

    const optimized = PuzzleGenerator.optimizeConstraints(constraints, board);

    // Should only have the constraint on the unlocked cell
    const cellConstraints = optimized.filter(c => isCellConstraint(c));
    expect(cellConstraints.length).toBe(1);
    expect(cellConstraints[0].x).toBe(1);
    expect(cellConstraints[0].y).toBe(0);
  });

  it('should remove "is not X" when "is Y" exists for same cell', () => {
    const board = createBoard(2, 2);
    const constraints: ConstraintDefinition[] = [
      { type: 'cell', x: 0, y: 0, rule: { shape: SquareShape, operator: 'is' } },
      { type: 'cell', x: 0, y: 0, rule: { shape: CircleShape, operator: 'is_not' } }, // redundant
      { type: 'cell', x: 0, y: 0, rule: { shape: TriangleShape, operator: 'is_not' } }, // redundant
    ];

    const optimized = PuzzleGenerator.optimizeConstraints(constraints, board);

    // Should only have the "is" constraint
    const cellConstraints = optimized.filter(c => isCellConstraint(c));
    expect(cellConstraints.length).toBe(1);
    expect(cellConstraints[0].rule.operator).toBe('is');
  });

  it('should remove cell "is not X" when row says "exactly 0 X"', () => {
    const board = createBoard(3, 2);
    const constraints: ConstraintDefinition[] = [
      { type: 'row', index: 0, rule: { shape: CircleShape, count: 0, operator: 'exactly' } },
      { type: 'cell', x: 1, y: 0, rule: { shape: CircleShape, operator: 'is_not' } }, // redundant - row says 0 circles
    ];

    const optimized = PuzzleGenerator.optimizeConstraints(constraints, board);

    // Should only have the row constraint
    const cellConstraints = optimized.filter(c => isCellConstraint(c));
    expect(cellConstraints.length).toBe(0);
  });

  it('should keep global cat count constraint first', () => {
    const board = createBoard(2, 2);
    const constraints: ConstraintDefinition[] = [
      { type: 'row', index: 0, rule: { shape: SquareShape, count: 1, operator: 'exactly' } },
      { type: 'global', rule: { shape: CatShape, count: 1, operator: 'exactly' } },
      { type: 'column', index: 1, rule: { shape: CircleShape, count: 2, operator: 'exactly' } },
    ];

    const optimized = PuzzleGenerator.optimizeConstraints(constraints, board, 12345);

    // First constraint should be global cat count
    expect(optimized[0].type).toBe('global');
    expect(isCountConstraint(optimized[0]) && optimized[0].rule.shape).toBe(CatShape);
  });

  it('should shuffle constraints (except first) with seed', () => {
    const board = createBoard(2, 2);
    const constraints: ConstraintDefinition[] = [
      { type: 'global', rule: { shape: CatShape, count: 0, operator: 'exactly' } },
      { type: 'row', index: 0, rule: { shape: SquareShape, count: 1, operator: 'exactly' } },
      { type: 'row', index: 1, rule: { shape: CircleShape, count: 1, operator: 'exactly' } },
      { type: 'column', index: 0, rule: { shape: TriangleShape, count: 1, operator: 'exactly' } },
      { type: 'column', index: 1, rule: { shape: SquareShape, count: 1, operator: 'exactly' } },
    ];

    // Same seed should produce same order
    const opt1 = PuzzleGenerator.optimizeConstraints(constraints, board, 42);
    const opt2 = PuzzleGenerator.optimizeConstraints(constraints, board, 42);

    expect(opt1.length).toBe(opt2.length);
    for (let i = 0; i < opt1.length; i++) {
      expect(opt1[i]).toEqual(opt2[i]);
    }

    // Different seed may produce different order (probabilistic)
    const opt3 = PuzzleGenerator.optimizeConstraints(constraints, board, 99999);
    // First should still be global cat count
    expect(opt3[0].type).toBe('global');
    expect(isCountConstraint(opt3[0]) && opt3[0].rule.shape).toBe(CatShape);
  });

  it('should handle empty constraints', () => {
    const board = createBoard(2, 2);
    const optimized = PuzzleGenerator.optimizeConstraints([], board);
    expect(optimized).toEqual([]);
  });

  it('generated puzzles should have optimized constraints', () => {
    // Generate multiple puzzles and verify optimization was applied
    for (let i = 0; i < 5; i++) {
      const puzzle = PuzzleGenerator.generate({ difficulty: 'level3' }, i * 1000);

      // Should not have duplicate constraints
      const seen = new Set<string>();
      for (const c of puzzle.constraints) {
        let key: string;
        if (isCellConstraint(c)) {
          key = `cell-${c.x}-${c.y}-${c.rule.shape}-${c.rule.operator}`;
        } else if (isCountConstraint(c)) {
          key = `${c.type}-${c.index ?? 'global'}-${c.rule.shape}-${c.rule.operator}`;
        } else {
          continue;
        }
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }

      // Should not have constraints on locked cells
      for (const c of puzzle.constraints) {
        if (isCellConstraint(c)) {
          const cell = puzzle.initialBoard[c.y]?.[c.x];
          expect(cell?.locked).toBe(false);
        }
      }
    }
  });
}); 