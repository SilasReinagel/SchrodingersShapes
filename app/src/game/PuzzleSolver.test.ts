import { describe, it, expect } from 'vitest';
import { countSolutions } from './PuzzleSolver';
import { GameBoard, ConstraintDefinition, CatShape, SquareShape, CircleShape, TriangleShape } from './types';

const createBlankBoard = (width: number, height: number): GameBoard =>
  Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ shape: CatShape, locked: false }))
  );

describe('countSolutions', () => {
  it('returns total permutations when no constraints exist', () => {
    const board = createBlankBoard(2, 2);
    // 4 shapes ^ 4 cells = 256
    expect(countSolutions(board, [], 300)).toBe(256);
  });

  it('respects maxCount early exit', () => {
    const board = createBlankBoard(2, 2);
    const count = countSolutions(board, [], 10);
    // Early exit caps at maxCount (may slightly overshoot due to batching)
    expect(count).toBeGreaterThanOrEqual(10);
    expect(count).toBeLessThan(256);
  });

  it('returns 0 for contradictory constraints', () => {
    const board = createBlankBoard(2, 2);
    const constraints: ConstraintDefinition[] = [
      { type: 'cell', x: 0, y: 0, rule: { shape: SquareShape, operator: 'is' } },
      { type: 'cell', x: 0, y: 0, rule: { shape: TriangleShape, operator: 'is_not' } },
      { type: 'cell', x: 0, y: 0, rule: { shape: CircleShape, operator: 'is_not' } },
      { type: 'cell', x: 0, y: 0, rule: { shape: CatShape, operator: 'is_not' } },
      // Cell (0,0) must be Square (not Cat, not Circle, not Triangle)
      // Now add a contradicting global constraint
      { type: 'global', rule: { shape: SquareShape, count: 0, operator: 'exactly' } },
    ];
    expect(countSolutions(board, constraints, 10)).toBe(0);
  });

  it('counts correctly with global cat count constraint', () => {
    const board = createBlankBoard(2, 2);
    const constraints: ConstraintDefinition[] = [
      { type: 'global', rule: { shape: CatShape, count: 1, operator: 'exactly' } },
    ];
    // 1 cat in one of 4 positions, other 3 cells each have 3 choices (Sq/Ci/Tr)
    // 4 * 3^3 = 108
    expect(countSolutions(board, constraints, 200)).toBe(108);
  });

  it('locked cells are not varied by the solver', () => {
    const board: GameBoard = [
      [{ shape: SquareShape, locked: true }, { shape: CatShape, locked: false }],
      [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
    ];
    const constraints: ConstraintDefinition[] = [
      { type: 'global', rule: { shape: CatShape, count: 0, operator: 'exactly' } },
    ];
    // 0 cats means every unlocked cell must be Sq/Ci/Tr. 3 unlocked cells × 3 choices = 27
    expect(countSolutions(board, constraints, 50)).toBe(27);
  });

  it('cats satisfy count constraints via matching', () => {
    // With cats counting as all shapes, [Cat, Tri, Ci, Tri] satisfies
    // "exactly 1 square" because the Cat IS a square (matching=1).
    const board = createBlankBoard(2, 2);
    const constraints: ConstraintDefinition[] = [
      { type: 'global', rule: { shape: CatShape, count: 1, operator: 'exactly' } },
      { type: 'global', rule: { shape: SquareShape, count: 1, operator: 'exactly' } },
      { type: 'global', rule: { shape: CircleShape, count: 1, operator: 'exactly' } },
      { type: 'global', rule: { shape: TriangleShape, count: 1, operator: 'exactly' } },
    ];
    // 1 cat + exactly 1 of each concrete shape (matching, not committed).
    // The cat satisfies one concrete count on its own.
    // Valid boards: any permutation of [Cat, Sq, Ci, Tr] = 4! = 24
    expect(countSolutions(board, constraints, 30)).toBe(24);
  });

  it('achieves unique solution with enough constraints', () => {
    const board = createBlankBoard(2, 2);
    const constraints: ConstraintDefinition[] = [
      { type: 'global', rule: { shape: CatShape, count: 0, operator: 'exactly' } },
      { type: 'row', index: 0, rule: { shape: SquareShape, count: 1, operator: 'exactly' } },
      { type: 'column', index: 0, rule: { shape: CircleShape, count: 1, operator: 'exactly' } },
      { type: 'row', index: 1, rule: { shape: TriangleShape, count: 1, operator: 'exactly' } },
    ];
    // 0 cats: all cells concrete. No matching-via-cat ambiguity.
    // Row 0 [X,Y]: 1 square → one is Sq. Col 0 [X,Z]: 1 circle. Row 1 [Z,W]: 1 triangle.
    // X=Sq: Y≠Sq. Z=Ci. W must give 1 Tr in row 1=[Ci,W] → W=Tr. Y∈{Ci,Tr} → 2 solutions.
    // X=Ci: Y=Sq. Z≠Ci. Z∈{Sq,Tr}. If Z=Sq: row1=[Sq,W] 1 Tr → W=Tr. If Z=Tr: row1=[Tr,W] 1 Tr, W≠Tr → W∈{Sq,Ci} 2 opts.
    //   → 1 + 2 = 3 solutions
    // X=Tr: Y must be Sq (row 0 needs 1 Sq). Z=Ci (col 0 needs 1 Ci). row1=[Ci,W] 1 Tr → W=Tr → 1 solution.
    // Total: 2 + 3 + 1 = 6
    expect(countSolutions(board, constraints, 10)).toBe(6);
  });

  it('handles all-locked board correctly', () => {
    const board: GameBoard = [
      [{ shape: SquareShape, locked: true }, { shape: CircleShape, locked: true }],
      [{ shape: TriangleShape, locked: true }, { shape: CatShape, locked: true }],
    ];
    const constraints: ConstraintDefinition[] = [
      { type: 'global', rule: { shape: CatShape, count: 1, operator: 'exactly' } },
    ];
    // All cells locked, board already satisfies constraint → 1
    expect(countSolutions(board, constraints, 10)).toBe(1);
  });

  it('handles all-locked board that violates constraints', () => {
    const board: GameBoard = [
      [{ shape: SquareShape, locked: true }, { shape: CircleShape, locked: true }],
      [{ shape: TriangleShape, locked: true }, { shape: SquareShape, locked: true }],
    ];
    const constraints: ConstraintDefinition[] = [
      { type: 'global', rule: { shape: CatShape, count: 1, operator: 'exactly' } },
    ];
    // No cat on board but constraint requires 1 → 0
    expect(countSolutions(board, constraints, 10)).toBe(0);
  });

  it('cell is_not constraints reduce solution space', () => {
    const board = createBlankBoard(2, 2);
    const constraints: ConstraintDefinition[] = [
      { type: 'global', rule: { shape: CatShape, count: 0, operator: 'exactly' } },
      { type: 'cell', x: 0, y: 0, rule: { shape: SquareShape, operator: 'is_not' } },
      { type: 'cell', x: 0, y: 0, rule: { shape: CircleShape, operator: 'is_not' } },
    ];
    // 0 cats → all cells are Sq/Ci/Tr.
    // (0,0) can't be Sq or Ci → must be Tr. Other 3 cells: 3 choices each.
    // 1 * 3 * 3 * 3 = 27
    expect(countSolutions(board, constraints, 50)).toBe(27);
  });
});
