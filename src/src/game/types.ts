export type Shape = 'square' | 'circle' | 'triangle' | 'cat';

export type Cell = {
  shape: Shape;
  locked: boolean; // Whether the cell can be changed by the player
  allowedShapes?: Set<Exclude<Shape, 'cat'>>; // For cells in superposition, what shapes they can collapse into
};

export type Grid = Cell[][];

export type Constraint = {
  type: 'row' | 'column' | 'global';
  index?: number; // Row or column index, not used for global constraints
  rule: {
    shape?: Shape;
    count: number;
    operator: 'exactly' | 'at_least' | 'at_most' | 'none';
  };
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export type PuzzleConfig = {
  size: number; // Grid size (e.g., 2 for 2x2, 3 for 3x3)
  difficulty: Difficulty;
  minConstraints?: number; // Minimum number of constraints
  maxConstraints?: number; // Maximum number of constraints
  requiredSuperpositions?: number; // Number of cells that must remain in superposition
};

export type Puzzle = {
  grid: Grid;
  constraints: Constraint[];
  config: PuzzleConfig;
}; 