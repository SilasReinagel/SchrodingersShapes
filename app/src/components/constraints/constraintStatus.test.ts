import { describe, it, expect } from 'vitest';
import {
  getConstraintState,
  getConstraintStates,
  getCellsInScope,
} from './constraintStatus';
import {
  GameBoard,
  CatShape,
  SquareShape,
  CircleShape,
  TriangleShape,
  CountConstraint,
  CellConstraint,
} from '../../game/types';

describe('constraintStatus', () => {
  describe('getCellsInScope', () => {
    it('should get cells for row scope', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: CircleShape, locked: false }, { shape: TriangleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: SquareShape, count: 1, operator: 'exactly' },
      };
      const cells = getCellsInScope(grid, constraint);
      expect(cells).toHaveLength(2);
      expect(cells[0].shape).toBe(CatShape);
      expect(cells[1].shape).toBe(SquareShape);
    });

    it('should get cells for column scope', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: CircleShape, locked: false }, { shape: TriangleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'column',
        index: 0,
        rule: { shape: SquareShape, count: 1, operator: 'exactly' },
      };
      const cells = getCellsInScope(grid, constraint);
      expect(cells).toHaveLength(2);
      expect(cells[0].shape).toBe(CatShape);
      expect(cells[1].shape).toBe(CircleShape);
    });

    it('should get cells for global scope', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: CircleShape, locked: false }, { shape: TriangleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'global',
        rule: { shape: SquareShape, count: 1, operator: 'exactly' },
      };
      const cells = getCellsInScope(grid, constraint);
      expect(cells).toHaveLength(4);
    });

    it('should get cell for cell scope', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: CircleShape, locked: false }, { shape: TriangleShape, locked: false }],
      ];
      const constraint: CellConstraint = {
        type: 'cell',
        x: 1,
        y: 0,
        rule: { shape: SquareShape, operator: 'is' },
      };
      const cells = getCellsInScope(grid, constraint);
      expect(cells).toHaveLength(1);
      expect(cells[0].shape).toBe(SquareShape);
    });
  });

  describe('getConstraintState - none operator', () => {
    it('should violate "none Triangle" when row contains cats', () => {
      // Cats count as everything, including triangles
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 0, operator: 'none' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('violated');
    });

    it('should violate "none Square" when row contains cats', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: SquareShape, count: 0, operator: 'none' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('violated');
    });

    it('should violate "none Circle" when row contains cats', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: CircleShape, count: 0, operator: 'none' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('violated');
    });

    it('should satisfy "none Triangle" when row contains no triangles or cats', () => {
      const grid: GameBoard = [
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 0, operator: 'none' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('satisfied');
    });

    it('should violate "none Triangle" when row contains actual triangles', () => {
      const grid: GameBoard = [
        [{ shape: TriangleShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 0, operator: 'none' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('violated');
    });

    it('should violate "none Triangle" when column contains cats', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: CatShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'column',
        index: 0,
        rule: { shape: TriangleShape, count: 0, operator: 'none' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('violated');
    });

    it('should violate "none Triangle" when global board contains cats', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'global',
        rule: { shape: TriangleShape, count: 0, operator: 'none' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('violated');
    });
  });

  describe('getConstraintState - at_most operator', () => {
    it('should violate "at most 0 Triangle" when row contains cats', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 0, operator: 'at_most' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('violated');
    });

    it('should satisfy "at most 2 Triangle" when row contains 2 cats', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 2, operator: 'at_most' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('satisfied');
    });

    it('should violate "at most 1 Triangle" when row contains 2 cats', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 1, operator: 'at_most' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('violated');
    });
  });

  describe('getConstraintState - exactly operator', () => {
    it('should be in_progress for "exactly 1 Triangle" when row contains only cats', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 1, operator: 'exactly' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('in_progress');
    });

    it('should violate "exactly 0 Square" when row contains cats (cats ARE every shape)', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: SquareShape, count: 0, operator: 'exactly' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('violated');
    });

    it('should satisfy "exactly 0 Triangle" when row contains no triangles or cats', () => {
      const grid: GameBoard = [
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 0, operator: 'exactly' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('satisfied');
    });

    it('should be satisfied for "exactly 1 Triangle" when row contains 1 triangle', () => {
      const grid: GameBoard = [
        [{ shape: TriangleShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 1, operator: 'exactly' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('satisfied');
    });
  });

  describe('getConstraintState - at_least operator', () => {
    it('should be satisfied for "at least 1 Triangle" when row contains cats', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 1, operator: 'at_least' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('satisfied');
    });

    it('should be in_progress for "at least 2 Triangle" when row contains 1 cat', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CountConstraint = {
        type: 'row',
        index: 0,
        rule: { shape: TriangleShape, count: 2, operator: 'at_least' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('in_progress');
    });
  });

  describe('getConstraintState - cell constraints', () => {
    it('should satisfy "cell is Triangle" when cell contains cat', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CellConstraint = {
        type: 'cell',
        x: 0,
        y: 0,
        rule: { shape: TriangleShape, operator: 'is' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('satisfied');
    });

    it('should be in_progress for "cell is not Triangle" when cell contains cat', () => {
      // Cat could still become triangle, so constraint is in progress
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CellConstraint = {
        type: 'cell',
        x: 0,
        y: 0,
        rule: { shape: TriangleShape, operator: 'is_not' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('in_progress');
    });

    it('should violate "cell is not Triangle" when cell contains triangle', () => {
      const grid: GameBoard = [
        [{ shape: TriangleShape, locked: false }, { shape: SquareShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraint: CellConstraint = {
        type: 'cell',
        x: 0,
        y: 0,
        rule: { shape: TriangleShape, operator: 'is_not' },
      };
      const state = getConstraintState(grid, constraint);
      expect(state).toBe('violated');
    });
  });

  describe('getConstraintStates', () => {
    it('should return states for all constraints', () => {
      const grid: GameBoard = [
        [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
        [{ shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      ];
      const constraints: CountConstraint[] = [
        {
          type: 'row',
          index: 0,
          rule: { shape: TriangleShape, count: 0, operator: 'none' },
        },
        {
          type: 'row',
          index: 1,
          rule: { shape: SquareShape, count: 1, operator: 'exactly' },
        },
      ];
      const states = getConstraintStates(grid, constraints);
      expect(states).toHaveLength(2);
      expect(states[0]).toBe('violated'); // Row 0 has cats, so "none Triangle" is violated
      expect(states[1]).toBe('satisfied'); // Row 1 has exactly 1 square
    });
  });
});
