export const CatShape = 0;
export const SquareShape = 1;
export const CircleShape = 2;
export const TriangleShape = 3;

export type ShapeId = typeof CatShape | typeof SquareShape | typeof CircleShape | typeof TriangleShape;
export const ShapeNames = ['Cat', 'Square', 'Circle', 'Triangle'];

export type Cell = {
  shape: ShapeId;
  locked: boolean;
};

export type GameBoard = Cell[][];

export type Difficulty = 'level1' | 'level2' | 'level3' | 'level4' | 'level5';

/**
 * Count-based constraint (row, column, or global)
 * Examples:
 * - "Row 0: exactly 2 circles"
 * - "Global: at least 1 cat"
 * - "Column 2: no triangles"
 */
export type CountConstraint = {
  type: 'row' | 'column' | 'global';
  index?: number;
  rule: {
    shape?: ShapeId;
    count: number;
    operator: 'exactly' | 'at_least' | 'at_most' | 'none';
  };
};

/**
 * Cell-level constraint (is or is_not)
 * Examples:
 * - "Cell (1,2) is a Circle"
 * - "Cell (0,0) is not a Triangle"
 * 
 * Note: For 'is' constraints, Cat counts as matching any shape (superposition)
 * For 'is_not' constraints, Cat does NOT match (it could still become that shape)
 */
export type CellConstraint = {
  type: 'cell';
  x: number;
  y: number;
  rule: {
    shape: ShapeId;
    operator: 'is' | 'is_not';
  };
};

/**
 * Union of all constraint types
 */
export type ConstraintDefinition = CountConstraint | CellConstraint;

/**
 * Type guard for count constraints
 */
export const isCountConstraint = (c: ConstraintDefinition): c is CountConstraint => {
  return c.type === 'row' || c.type === 'column' || c.type === 'global';
};

/**
 * Type guard for cell constraints
 */
export const isCellConstraint = (c: ConstraintDefinition): c is CellConstraint => {
  return c.type === 'cell';
};

export type PuzzleConfig = {
  width: number;
  height: number;
  difficulty: Difficulty;
  minConstraints?: number;
  maxConstraints?: number;
  requiredSuperpositions?: number;
};

export type PuzzleDefinition = {
  initialBoard: GameBoard;
  constraints: ConstraintDefinition[];
}; 

export type PuzzleMove = {
  x: number;
  y: number;
  shape: ShapeId;
  previousShape: ShapeId;
};

export type PuzzleSnapshot = {
  board: GameBoard;
  moves: PuzzleMove[];
}

/**
 * Constraint evaluation state
 */
export type ConstraintState = 'satisfied' | 'in_progress' | 'violated';
