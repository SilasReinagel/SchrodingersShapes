import {
  GameBoard, ConstraintDefinition, ShapeId,
  CatShape, SquareShape, CircleShape, TriangleShape,
  isCountConstraint, isCellConstraint, CountConstraint
} from './types';
import { getConstraintState } from '../components/constraints/constraintStatus';

const ALL_SHAPES: ShapeId[] = [CatShape, SquareShape, CircleShape, TriangleShape];

type ScopePositions = { x: number; y: number }[];

/**
 * Counts valid solutions for a puzzle using backtracking with constraint-violation pruning.
 * Uses a partial-board checker for intermediate pruning and the game's own constraint
 * evaluation at leaf nodes to guarantee consistency with actual gameplay.
 *
 * @param maxCount Stop counting once this threshold is reached (early exit optimization)
 * @returns Number of distinct boards where every constraint is 'satisfied', capped at maxCount
 */
export const countSolutions = (
  initialBoard: GameBoard,
  constraints: ConstraintDefinition[],
  maxCount: number
): number => {
  const height = initialBoard.length;
  const width = initialBoard[0]?.length || 0;

  const unlocked: { x: number; y: number }[] = [];
  const assigned: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false)
  );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (initialBoard[y][x].locked) {
        assigned[y][x] = true;
      } else {
        unlocked.push({ x, y });
      }
    }
  }

  if (unlocked.length === 0) {
    return allSatisfied(initialBoard, constraints) ? 1 : 0;
  }

  const board: GameBoard = initialBoard.map(row =>
    row.map(cell => ({ shape: cell.shape, locked: cell.locked }))
  );

  const scopeCache = buildScopeCache(constraints, width, height);

  return solve(board, constraints, unlocked, 0, maxCount, assigned, scopeCache);
};

const allSatisfied = (board: GameBoard, constraints: ConstraintDefinition[]): boolean => {
  for (const c of constraints) {
    if (getConstraintState(board, c) !== 'satisfied') return false;
  }
  return true;
};

const solve = (
  board: GameBoard,
  constraints: ConstraintDefinition[],
  unlocked: { x: number; y: number }[],
  idx: number,
  maxCount: number,
  assigned: boolean[][],
  scopeCache: Map<ConstraintDefinition, ScopePositions>
): number => {
  if (idx === unlocked.length) {
    return allSatisfied(board, constraints) ? 1 : 0;
  }

  const { x, y } = unlocked[idx];
  let found = 0;

  for (const shape of ALL_SHAPES) {
    board[y][x].shape = shape;
    assigned[y][x] = true;

    if (!isPartiallyViolated(board, constraints, assigned, scopeCache)) {
      found += solve(board, constraints, unlocked, idx + 1, maxCount, assigned, scopeCache);
      if (found >= maxCount) {
        board[y][x].shape = CatShape;
        assigned[y][x] = false;
        return found;
      }
    }
  }

  board[y][x].shape = CatShape;
  assigned[y][x] = false;
  return found;
};

/**
 * Checks whether any constraint is definitely violated given the current
 * partial assignment. Unassigned cells are treated as wildcards — they can
 * become any shape, so we only prune when the already-assigned cells make
 * satisfaction impossible.
 */
const isPartiallyViolated = (
  board: GameBoard,
  constraints: ConstraintDefinition[],
  assigned: boolean[][],
  scopeCache: Map<ConstraintDefinition, ScopePositions>
): boolean => {
  for (const c of constraints) {
    if (isCellConstraint(c)) {
      if (!assigned[c.y]?.[c.x]) continue;
      const state = getConstraintState(board, c);
      if (state !== 'satisfied') return true;
      continue;
    }

    if (isCountConstraint(c) && c.rule.operator === 'exactly') {
      if (isCountViolatedPartial(board, c, assigned, scopeCache.get(c)!)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Partial-board violation check for "exactly N [shape]" count constraints.
 *
 * - For concrete shapes with count > 0: counts only exact-match assigned cells
 *   (Cat cells are NOT committed to any concrete shape).
 * - For concrete shapes with count === 0: any assigned cell that is the target
 *   shape OR CatShape triggers a violation (Cat is in superposition and matches
 *   every concrete shape for the "exactly 0" check).
 * - For CatShape: counts only assigned CatShape cells.
 *
 * Bounds check: if committed > count, or committed + remaining_unassigned < count,
 * the constraint can never be satisfied regardless of future assignments.
 */
const isCountViolatedPartial = (
  board: GameBoard,
  c: CountConstraint,
  assigned: boolean[][],
  positions: ScopePositions
): boolean => {
  const { shape, count } = c.rule;
  let committed = 0;
  let matching = 0;
  let unassignedInScope = 0;

  for (const pos of positions) {
    if (!assigned[pos.y][pos.x]) {
      unassignedInScope++;
      continue;
    }

    const cellShape = board[pos.y][pos.x].shape;

    if (shape === CatShape) {
      if (cellShape === CatShape) { committed++; matching++; }
    } else if (count === 0) {
      if (cellShape === shape || cellShape === CatShape) return true;
    } else {
      if (cellShape === shape) { committed++; matching++; }
      else if (cellShape === CatShape) { matching++; }
    }
  }

  // Too many committed shapes — can never undo
  if (committed > count) return true;
  // Not enough potential even if all remaining cells match
  if (matching + unassignedInScope < count) return true;

  return false;
};

const buildScopeCache = (
  constraints: ConstraintDefinition[],
  width: number,
  height: number
): Map<ConstraintDefinition, ScopePositions> => {
  const cache = new Map<ConstraintDefinition, ScopePositions>();

  for (const c of constraints) {
    if (!isCountConstraint(c)) continue;

    const positions: ScopePositions = [];
    if (c.type === 'global') {
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
          positions.push({ x, y });
    } else if (c.type === 'row') {
      for (let x = 0; x < width; x++)
        positions.push({ x, y: c.index! });
    } else if (c.type === 'column') {
      for (let y = 0; y < height; y++)
        positions.push({ x: c.index!, y });
    }
    cache.set(c, positions);
  }

  return cache;
};
