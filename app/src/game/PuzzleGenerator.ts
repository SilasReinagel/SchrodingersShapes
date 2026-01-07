import { DIFFICULTY_SETTINGS } from './DifficultySettings';
import { ShapeId, GameBoard, ConstraintDefinition, PuzzleConfig, PuzzleDefinition, CatShape, SquareShape, CircleShape, TriangleShape, CountConstraint, CellConstraint, isCountConstraint, isCellConstraint } from './types';
import { SeededRNG } from './SeededRNG';

/**
 * Represents a count-based fact extracted from a solution board
 */
type CountFact = {
  factType: 'count';
  type: 'global' | 'row' | 'column';
  index?: number;
  shape: ShapeId;
  count: number;
};

/**
 * Represents a cell-level fact extracted from a solution board
 */
type CellFact = {
  factType: 'cell';
  x: number;
  y: number;
  shape: ShapeId;
  isShape: boolean; // true = cell IS this shape, false = cell is NOT this shape
};

type Fact = CountFact | CellFact;

/**
 * Solution-First Puzzle Generator
 * 
 * This generator creates puzzles by:
 * 1. Generating a valid solution board first
 * 2. Extracting facts (true statements) about the solution
 * 3. Selecting a subset of facts as constraints
 * 4. Returning a puzzle with an all-cats initial board
 * 
 * This approach guarantees solvable puzzles by construction.
 */
export class PuzzleGenerator {
  private static readonly SHAPES: ShapeId[] = [SquareShape, CircleShape, TriangleShape];
  private static readonly ALL_SHAPES: ShapeId[] = [CatShape, SquareShape, CircleShape, TriangleShape];
  
  public static generate(config: Partial<PuzzleConfig> = {}, seed?: number | string): PuzzleDefinition {
    const fullConfig = this.getFullConfig(config);
    
    // Create seeded RNG - use provided seed or generate random seed
    const rngSeed = seed ?? Math.floor(Math.random() * 0xFFFFFFFF);
    const rng = new SeededRNG(rngSeed);
    
    // Generate a valid solution board
    const solutionBoard = this.generateSolutionBoard(fullConfig, rng);
    
    // Extract facts from the solution
    const facts = this.extractFacts(solutionBoard, fullConfig);
    
    // Select constraints from facts based on difficulty
    const constraints = this.selectConstraints(facts, solutionBoard, fullConfig, rng);
    
    // Create the initial board (all cats)
    const initialBoard = this.initializeGrid(fullConfig.width, fullConfig.height);
    
    return {
      initialBoard,
      constraints
    };
  }

  /**
   * Generates a valid solution board with the required number of cats
   * and random shapes for remaining cells
   */
  private static generateSolutionBoard(config: Required<PuzzleConfig>, rng: SeededRNG): GameBoard {
    const { width, height, requiredSuperpositions } = config;
    const totalCells = width * height;
    
    // Create array of all cell positions
    const positions: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        positions.push({ x, y });
      }
    }
    
    // Shuffle positions to randomly place cats
    const shuffledPositions = this.shuffleArray(positions, rng);
    
    // Initialize board
    const board: GameBoard = Array(height).fill(null).map(() =>
      Array(width).fill(null).map(() => ({
        shape: SquareShape as ShapeId,
        locked: false
      }))
    );
    
    // Place cats in the first N positions
    for (let i = 0; i < requiredSuperpositions; i++) {
      const pos = shuffledPositions[i];
      board[pos.y][pos.x].shape = CatShape;
    }
    
    // Fill remaining cells with random non-cat shapes
    for (let i = requiredSuperpositions; i < totalCells; i++) {
      const pos = shuffledPositions[i];
      const randomShape = this.SHAPES[rng.nextInt(this.SHAPES.length)];
      board[pos.y][pos.x].shape = randomShape;
    }
    
    return board;
  }

  /**
   * Extracts all facts from a solution board
   * Includes both count facts and cell facts
   */
  private static extractFacts(board: GameBoard, config: Required<PuzzleConfig>): Fact[] {
    const facts: Fact[] = [];
    const { width, height } = config;
    
    // Extract global count facts for each shape
    for (const shape of this.ALL_SHAPES) {
      const count = this.countShapeInBoard(board, shape);
      facts.push({
        factType: 'count',
        type: 'global',
        shape,
        count
      });
    }
    
    // Extract row count facts
    for (let rowIndex = 0; rowIndex < height; rowIndex++) {
      for (const shape of this.ALL_SHAPES) {
        const count = this.countShapeInRow(board, rowIndex, shape);
        facts.push({
          factType: 'count',
          type: 'row',
          index: rowIndex,
          shape,
          count
        });
      }
    }
    
    // Extract column count facts
    for (let colIndex = 0; colIndex < width; colIndex++) {
      for (const shape of this.ALL_SHAPES) {
        const count = this.countShapeInColumn(board, colIndex, shape);
        facts.push({
          factType: 'count',
          type: 'column',
          index: colIndex,
          shape,
          count
        });
      }
    }
    
    // Extract cell facts (what shape is in each cell, and what shapes are NOT)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellShape = board[y][x].shape;
        
        // Fact: this cell IS this shape
        facts.push({
          factType: 'cell',
          x,
          y,
          shape: cellShape,
          isShape: true
        });
        
        // Facts: this cell is NOT these other shapes (for non-cat cells)
        if (cellShape !== CatShape) {
          for (const shape of this.ALL_SHAPES) {
            if (shape !== cellShape) {
              facts.push({
                factType: 'cell',
                x,
                y,
                shape,
                isShape: false
              });
            }
          }
        }
      }
    }
    
    return facts;
  }

  /**
   * Selects a subset of facts as constraints based on difficulty
   */
  private static selectConstraints(
    facts: Fact[], 
    _solutionBoard: GameBoard,
    config: Required<PuzzleConfig>, 
    rng: SeededRNG
  ): ConstraintDefinition[] {
    const constraints: ConstraintDefinition[] = [];
    const numConstraints = rng.nextIntRange(config.minConstraints, config.maxConstraints);
    
    // Always add the cat (superposition) constraint first
    const catFact = facts.find(f => 
      f.factType === 'count' && f.type === 'global' && f.shape === CatShape
    ) as CountFact | undefined;
    
    if (catFact) {
      constraints.push(this.countFactToConstraint(catFact, 'exactly'));
    }
    
    // Get candidate facts (excluding cat global fact since we already added it)
    const candidateFacts = facts.filter(f => {
      if (f.factType === 'count') {
        return !(f.type === 'global' && f.shape === CatShape);
      }
      return true;
    });
    
    // Shuffle candidates
    const shuffledFacts = this.shuffleArray([...candidateFacts], rng);
    
    // Select constraints based on difficulty
    const strategy = this.getConstraintStrategy(config.difficulty);
    
    for (const fact of shuffledFacts) {
      if (constraints.length >= numConstraints) break;
      
      // Check if we already have a conflicting constraint
      if (this.hasConflictingConstraint(fact, constraints)) continue;
      
      // Skip facts that aren't interesting based on strategy
      if (!this.isInterestingFact(fact, config, strategy)) continue;
      
      // Convert fact to constraint
      const constraint = this.factToConstraint(fact, strategy, rng);
      if (constraint) {
        constraints.push(constraint);
      }
    }
    
    // If we still need more constraints, be less picky
    if (constraints.length < numConstraints) {
      for (const fact of shuffledFacts) {
        if (constraints.length >= numConstraints) break;
        if (this.hasConflictingConstraint(fact, constraints)) continue;
        
        const constraint = this.factToConstraint(fact, { preferExact: false, allowNone: true, mixOperators: false, allowCellConstraints: true }, rng);
        if (constraint) {
          constraints.push(constraint);
        }
      }
    }
    
    return constraints;
  }

  /**
   * Converts a count fact to a count constraint
   */
  private static countFactToConstraint(
    fact: CountFact, 
    operator: CountConstraint['rule']['operator']
  ): CountConstraint {
    return {
      type: fact.type,
      index: fact.index,
      rule: {
        shape: fact.shape,
        count: fact.count,
        operator
      }
    };
  }

  /**
   * Converts a cell fact to a cell constraint
   */
  private static cellFactToConstraint(fact: CellFact): CellConstraint {
    return {
      type: 'cell',
      x: fact.x,
      y: fact.y,
      rule: {
        shape: fact.shape,
        operator: fact.isShape ? 'is' : 'is_not'
      }
    };
  }

  /**
   * Converts any fact to a constraint
   */
  private static factToConstraint(
    fact: Fact,
    strategy: { preferExact?: boolean; mixOperators?: boolean; allowNone?: boolean; allowCellConstraints?: boolean },
    rng: SeededRNG
  ): ConstraintDefinition | null {
    if (fact.factType === 'cell') {
      // Only include cell constraints if strategy allows
      if (!strategy.allowCellConstraints) return null;
      
      // Skip 'is Cat' constraints (too specific, gives away superposition locations)
      if (fact.isShape && fact.shape === CatShape) return null;
      
      return this.cellFactToConstraint(fact);
    } else {
      // Count fact
      // Don't add boring count=0 global constraints
      if (fact.count === 0 && fact.type === 'global') return null;
      
      // Don't add cat facts for row/column
      if (fact.shape === CatShape && fact.type !== 'global') return null;
      
      const operator = this.selectOperator(fact, strategy, rng);
      return this.countFactToConstraint(fact, operator);
    }
  }

  /**
   * Gets the constraint selection strategy based on difficulty
   */
  private static getConstraintStrategy(difficulty: string): { 
    preferExact: boolean; 
    allowNone: boolean; 
    mixOperators: boolean;
    allowCellConstraints: boolean;
  } {
    switch (difficulty) {
      case 'level1':
        return { preferExact: true, allowNone: false, mixOperators: false, allowCellConstraints: false };
      case 'level2':
        return { preferExact: true, allowNone: true, mixOperators: false, allowCellConstraints: false };
      case 'level3':
        return { preferExact: true, allowNone: true, mixOperators: true, allowCellConstraints: true };
      case 'level4':
      case 'level5':
      default:
        return { preferExact: false, allowNone: true, mixOperators: true, allowCellConstraints: true };
    }
  }

  /**
   * Determines if a fact is interesting enough to be a constraint
   */
  private static isInterestingFact(
    fact: Fact, 
    config: Required<PuzzleConfig>,
    strategy: { preferExact: boolean; allowNone: boolean; allowCellConstraints?: boolean }
  ): boolean {
    if (fact.factType === 'cell') {
      if (!strategy.allowCellConstraints) return false;
      
      // 'is Cat' facts are not interesting (gives away superposition)
      if (fact.isShape && fact.shape === CatShape) return false;
      
      // 'is not Cat' facts are useful for forcing collapse
      // Other 'is_not' facts enable deduction
      return true;
    }
    
    // Count facts
    // Skip cat facts for row/column (cats are handled globally)
    if (fact.shape === CatShape && fact.type !== 'global') {
      return false;
    }
    
    // Count of 0 can be interesting as "none" constraint
    if (fact.count === 0) {
      return strategy.allowNone && fact.type !== 'global';
    }
    
    // For global constraints, prefer counts > 1 for interest
    if (fact.type === 'global') {
      return fact.count >= 1;
    }
    
    // Row/column constraints are interesting if they have meaningful counts
    const dimensionSize = fact.type === 'row' ? config.width : config.height;
    return fact.count > 0 && fact.count < dimensionSize;
  }

  /**
   * Selects an operator for a count constraint
   */
  private static selectOperator(
    fact: CountFact,
    strategy: { preferExact?: boolean; mixOperators?: boolean },
    rng: SeededRNG
  ): CountConstraint['rule']['operator'] {
    // Count of 0 should be "none"
    if (fact.count === 0) {
      return 'none';
    }
    
    // Easy levels prefer "exactly"
    if (strategy.preferExact && !strategy.mixOperators) {
      return 'exactly';
    }
    
    // For mixed operators, randomly choose
    if (strategy.mixOperators) {
      const roll = rng.random();
      if (roll < 0.5) {
        return 'exactly';
      } else if (roll < 0.75) {
        return 'at_least';
      } else {
        return 'at_most';
      }
    }
    
    return 'exactly';
  }

  /**
   * Checks if adding a constraint would conflict with existing ones
   */
  private static hasConflictingConstraint(fact: Fact, constraints: ConstraintDefinition[]): boolean {
    if (fact.factType === 'cell') {
      // Check for existing cell constraint on same cell
      return constraints.some(c => 
        isCellConstraint(c) && c.x === fact.x && c.y === fact.y && c.rule.shape === fact.shape
      );
    } else {
      // Check for existing count constraint on same scope/index/shape
      return constraints.some(c => 
        isCountConstraint(c) && 
        c.type === fact.type && 
        c.index === fact.index && 
        c.rule.shape === fact.shape
      );
    }
  }

  /**
   * Counts a specific shape in the entire board
   * Uses game semantics: Cats count toward ALL shapes (except when counting cats themselves)
   */
  private static countShapeInBoard(board: GameBoard, shape: ShapeId): number {
    let count = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell.shape === shape || (shape !== CatShape && cell.shape === CatShape)) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Counts a specific shape in a row
   */
  private static countShapeInRow(board: GameBoard, rowIndex: number, shape: ShapeId): number {
    let count = 0;
    for (const cell of board[rowIndex]) {
      if (cell.shape === shape || (shape !== CatShape && cell.shape === CatShape)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Counts a specific shape in a column
   */
  private static countShapeInColumn(board: GameBoard, colIndex: number, shape: ShapeId): number {
    let count = 0;
    for (const row of board) {
      if (row[colIndex].shape === shape || (shape !== CatShape && row[colIndex].shape === CatShape)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Creates an initial board with all cells in cat (superposition) state
   */
  private static initializeGrid(width: number, height: number): GameBoard {
    return Array(height).fill(null).map(() =>
      Array(width).fill(null).map(() => ({
        shape: CatShape,
        locked: false
      }))
    );
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm with seeded RNG
   */
  private static shuffleArray<T>(array: T[], rng: SeededRNG): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private static getFullConfig(partialConfig: Partial<PuzzleConfig>): Required<PuzzleConfig> {
    const difficulty = partialConfig.difficulty;
    if (!difficulty) {
      throw new Error('Difficulty is required');
    }
    return {
      ...DIFFICULTY_SETTINGS[difficulty],
      ...partialConfig
    };
  }
}
