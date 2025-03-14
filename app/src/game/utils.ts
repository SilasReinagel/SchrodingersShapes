import { GameBoard, ConstraintDefinition, CatShape } from './types';

// Count shapes in the entire grid
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

// Count shapes in a specific row
const countShapesInRow = (grid: GameBoard, rowIndex: number, shape?: number): number => {
  let count = 0;
  grid[rowIndex].forEach(cell => {
    if (shape === undefined || cell.shape === shape || cell.shape === CatShape) {
      count++;
    }
  });
  return count;
};

// Count shapes in a specific column
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
const checkOperator = (count: number, rule: ConstraintDefinition['rule']): boolean => {
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

export const checkConstraint = (grid: GameBoard, constraint: ConstraintDefinition): boolean => {
  const { type, rule } = constraint;
  let count = 0;
  
  if (type === 'global') {
    count = countShapesInGrid(grid, rule.shape);
  } else {
    const index = constraint.index ?? 0;
    if (type === 'row') {
      count = countShapesInRow(grid, index, rule.shape);
    } else { // column
      count = countShapesInColumn(grid, index, rule.shape);
    }
  }

  return checkOperator(count, rule);
};

export const checkAllConstraints = (grid: GameBoard, constraints: ConstraintDefinition[]): boolean => {
  return constraints.every(constraint => checkConstraint(grid, constraint));
};

export const getConstraintStatus = (grid: GameBoard, constraints: ConstraintDefinition[]): boolean[] => {
  return constraints.map(constraint => checkConstraint(grid, constraint));
}; 
