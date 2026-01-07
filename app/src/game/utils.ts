import { GameBoard, ConstraintDefinition, CatShape, CountConstraint, CellConstraint, isCountConstraint, isCellConstraint } from './types';

// Count shapes in the entire grid (Cat counts toward all non-cat shapes)
const countShapesInGrid = (grid: GameBoard, shape?: number): number => {
  let count = 0;
  grid.forEach(row => {
    row.forEach(cell => {
      if (shape === undefined || cell.shape === shape || cell.shape === CatShape) {
        count++;
      }
    });
  });
  return count;
};

// Count shapes in a specific row (Cat counts toward all non-cat shapes)
const countShapesInRow = (grid: GameBoard, rowIndex: number, shape?: number): number => {
  let count = 0;
  grid[rowIndex].forEach(cell => {
    if (shape === undefined || cell.shape === shape || cell.shape === CatShape) {
      count++;
    }
  });
  return count;
};

// Count shapes in a specific column (Cat counts toward all non-cat shapes)
const countShapesInColumn = (grid: GameBoard, colIndex: number, shape?: number): number => {
  let count = 0;
  grid.forEach(row => {
    const cell = row[colIndex];
    if (shape === undefined || cell.shape === shape || cell.shape === CatShape) {
      count++;
    }
  });
  return count;
};

// Check if count satisfies the constraint operator
const checkCountOperator = (count: number, rule: CountConstraint['rule']): boolean => {
  switch (rule.operator) {
    case 'exactly':
      return count === rule.count;
    case 'at_least':
      return count >= rule.count;
    case 'at_most':
      return count <= rule.count;
    case 'none':
      return count === 0;
    default:
      return false;
  }
};

/**
 * Check a count-based constraint (row, column, global)
 */
const checkCountConstraint = (grid: GameBoard, constraint: CountConstraint): boolean => {
  const { type, rule } = constraint;
  let count = 0;
  
  if (type === 'global') {
    count = countShapesInGrid(grid, rule.shape);
  } else {
    const index = constraint.index ?? 0;
    if (type === 'row') {
      count = countShapesInRow(grid, index, rule.shape);
    } else {
      count = countShapesInColumn(grid, index, rule.shape);
    }
  }

  return checkCountOperator(count, rule);
};

/**
 * Check a cell-level constraint (is / is_not)
 * 
 * For 'is' constraint:
 * - Returns true if cell has the exact shape OR cell is Cat (superposition satisfies any shape)
 * - Exception: if shape is Cat, only actual Cat cells match
 * 
 * For 'is_not' constraint:
 * - Returns true if cell is NOT that shape AND cell is not Cat
 * - Cat cells fail 'is_not' constraints because they could collapse to that shape
 * - Exception: 'is_not Cat' passes if the cell is not Cat
 */
const checkCellConstraint = (grid: GameBoard, constraint: CellConstraint): boolean => {
  const { x, y, rule } = constraint;
  const cell = grid[y][x];
  const { shape, operator } = rule;
  
  if (operator === 'is') {
    // "Cell is X" - satisfied if cell is X or cell is Cat (counts as all shapes)
    // Exception: "Cell is Cat" only matches actual Cat
    if (shape === CatShape) {
      return cell.shape === CatShape;
    }
    return cell.shape === shape || cell.shape === CatShape;
  } else {
    // "Cell is not X" - satisfied if cell is definitely not X
    // Cat fails because it could still become X
    // Exception: "Cell is not Cat" passes if cell is not Cat
    if (shape === CatShape) {
      return cell.shape !== CatShape;
    }
    // For non-cat shapes: must be a different committed shape (not Cat, not target)
    return cell.shape !== shape && cell.shape !== CatShape;
  }
};

/**
 * Check any constraint against the grid
 */
export const checkConstraint = (grid: GameBoard, constraint: ConstraintDefinition): boolean => {
  if (isCellConstraint(constraint)) {
    return checkCellConstraint(grid, constraint);
  } else if (isCountConstraint(constraint)) {
    return checkCountConstraint(grid, constraint);
  }
  return false;
};

/**
 * Check if all constraints are satisfied
 */
export const checkAllConstraints = (grid: GameBoard, constraints: ConstraintDefinition[]): boolean => {
  return constraints.every(constraint => checkConstraint(grid, constraint));
};

/**
 * Get satisfaction status for each constraint
 */
export const getConstraintStatus = (grid: GameBoard, constraints: ConstraintDefinition[]): boolean[] => {
  return constraints.map(constraint => checkConstraint(grid, constraint));
};
