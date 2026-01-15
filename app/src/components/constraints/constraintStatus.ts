import { 
  GameBoard, 
  ConstraintDefinition, 
  CountConstraint,
  CellConstraint,
  CatShape, 
  isCountConstraint, 
  isCellConstraint,
  ConstraintState
} from '../../game/types';

/**
 * Count shapes in a region, with options for how to treat Cats
 * 
 * @param cells - Array of cells to count
 * @param shape - Target shape to count (undefined = count all)
 * @param countCatsAs - How to count cat cells:
 *   - 'match': Cat counts as matching any shape (for at_least, is)
 *   - 'exclude': Cat doesn't count (for exact counts)
 *   - 'only': Only count committed shapes (for violation detection)
 */
const countShapes = (
  cells: { shape: number }[], 
  shape: number | undefined,
  countCatsAs: 'match' | 'exclude' | 'only' = 'match'
): { matching: number; cats: number; committed: number } => {
  let matching = 0;
  let cats = 0;
  let committed = 0;

  cells.forEach(cell => {
    if (cell.shape === CatShape) {
      cats++;
      if (countCatsAs === 'match' && shape !== undefined && shape !== CatShape) {
        matching++;
      }
    } else if (shape === undefined || cell.shape === shape) {
      matching++;
      committed++;
    }
  });

  return { matching, cats, committed };
};

/**
 * Get cells for a constraint's scope
 */
export const getCellsInScope = (grid: GameBoard, constraint: ConstraintDefinition): { shape: number }[] => {
  if (isCountConstraint(constraint)) {
    const { type, index = 0 } = constraint;
    
    if (type === 'global') {
      return grid.flat();
    }
    
    if (type === 'row') {
      return grid[index] || [];
    }
    
    if (type === 'column') {
      return grid.map(row => row[index]).filter(Boolean);
    }
  }
  
  if (isCellConstraint(constraint)) {
    const cell = grid[constraint.y]?.[constraint.x];
    return cell ? [cell] : [];
  }
  
  return [];
};

/**
 * Check a count constraint and return detailed state
 */
const checkCountConstraintState = (
  grid: GameBoard, 
  constraint: CountConstraint
): ConstraintState => {
  const { rule } = constraint;
  const cells = getCellsInScope(grid, constraint);
  const { matching, cats, committed } = countShapes(cells, rule.shape, 'match');
  
  switch (rule.operator) {
    case 'exactly': {
      // Satisfied: exact match
      if (matching === rule.count) {
        return 'satisfied';
      }
      // Violated: already have too many committed shapes
      if (committed > rule.count) {
        return 'violated';
      }
      // Violated: can't possibly reach count even if all cats become target
      if (committed + cats < rule.count) {
        // Only violated if no more cats to place (all cells filled)
        const totalCells = cells.length;
        if (totalCells === cells.filter(c => c.shape !== CatShape).length + cats && matching < rule.count) {
          return 'in_progress'; // Still have cats that could help
        }
      }
      return 'in_progress';
    }
    
    case 'at_least': {
      // Satisfied: have enough
      if (matching >= rule.count) {
        return 'satisfied';
      }
      // Can't be violated with cats (they could become target)
      return 'in_progress';
    }
    
    case 'at_most': {
      // Violated: already have too many committed
      if (committed > rule.count) {
        return 'violated';
      }
      // Satisfied: committed count is within limit
      // (cats don't contribute to at_most since they might not become target)
      if (committed <= rule.count) {
        return 'satisfied';
      }
      return 'in_progress';
    }
    
    case 'none': {
      // Violated: have any committed shapes of this type
      if (committed > 0) {
        return 'violated';
      }
      // Satisfied: no committed shapes (cats are okay - they might not become target)
      return 'satisfied';
    }
    
    default:
      return 'in_progress';
  }
};

/**
 * Check a cell constraint and return detailed state
 */
const checkCellConstraintState = (
  grid: GameBoard, 
  constraint: CellConstraint
): ConstraintState => {
  const cell = grid[constraint.y]?.[constraint.x];
  if (!cell) return 'in_progress';
  
  const { shape, operator } = constraint.rule;
  
  if (operator === 'is') {
    // "Cell is X"
    if (shape === CatShape) {
      // Must be cat
      return cell.shape === CatShape ? 'satisfied' : 'violated';
    }
    // Satisfied if cell is target or is cat (cat can become anything)
    if (cell.shape === shape) return 'satisfied';
    if (cell.shape === CatShape) return 'satisfied'; // Cat counts as matching
    return 'violated';
  }
  
  if (operator === 'is_not') {
    // "Cell is not X"
    if (shape === CatShape) {
      // Must not be cat - satisfied if committed to any shape
      return cell.shape !== CatShape ? 'satisfied' : 'in_progress';
    }
    // Violated if cell IS the forbidden shape
    if (cell.shape === shape) return 'violated';
    // In progress if cat (could still become forbidden)
    if (cell.shape === CatShape) return 'in_progress';
    // Satisfied if committed to different shape
    return 'satisfied';
  }
  
  return 'in_progress';
};

/**
 * Get detailed constraint state (satisfied, in_progress, or violated)
 */
export const getConstraintState = (
  grid: GameBoard, 
  constraint: ConstraintDefinition
): ConstraintState => {
  if (isCountConstraint(constraint)) {
    return checkCountConstraintState(grid, constraint);
  }
  
  if (isCellConstraint(constraint)) {
    return checkCellConstraintState(grid, constraint);
  }
  
  return 'in_progress';
};

/**
 * Get states for all constraints
 */
export const getConstraintStates = (
  grid: GameBoard, 
  constraints: ConstraintDefinition[]
): ConstraintState[] => {
  return constraints.map(constraint => getConstraintState(grid, constraint));
};

