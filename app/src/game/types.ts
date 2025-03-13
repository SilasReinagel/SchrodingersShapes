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

export type ConstraintDefinition = {
  type: 'row' | 'column' | 'global';
  index?: number;
  rule: {
    shape?: ShapeId;
    count: number;
    operator: 'exactly' | 'at_least' | 'at_most' | 'none';
  };
};


export type PuzzleConfig = {
  width: number; // Grid width (e.g., 2 for 2x2, 3 for 3x3)
  height: number; // Grid height (e.g., 2 for 2x2, 3 for 3x3)
  difficulty: Difficulty;
  minConstraints?: number; // Minimum number of constraints
  maxConstraints?: number; // Maximum number of constraints
  requiredSuperpositions?: number; // Number of cells that must remain in superposition
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
