import { DIFFICULTY_SETTINGS } from './DifficultySettings';
import { ShapeId, GameBoard, ConstraintDefinition, PuzzleConfig, PuzzleDefinition, CatShape, SquareShape, CircleShape, TriangleShape, isCountConstraint, isCellConstraint } from './types';
import { SeededRNG } from './SeededRNG';

/**
 * Represents a fact extracted from a solution board
 */
type FactType = 'row_count' | 'col_count' | 'global_count' | 'cell_is' | 'cell_is_not';

type Fact = {
  type: FactType;
  shape: ShapeId;
  count?: number;
  index?: number;  // row/col index
  x?: number;
  y?: number;
};

/**
 * Solution-First Puzzle Generator
 * 
 * Matches the C implementation in algo/src/generator.c
 * 
 * This generator creates puzzles by:
 * 1. Generating a valid solution board first
 * 2. Extracting facts (true statements) about the solution
 * 3. Scoring and selecting constraints iteratively
 * 4. Adding locked cells (pre-revealed from solution)
 * 5. Returning a puzzle with an all-cats initial board
 */
export class PuzzleGenerator {
  private static readonly SHAPES: ShapeId[] = [SquareShape, CircleShape, TriangleShape];
  private static readonly ALL_SHAPES: ShapeId[] = [CatShape, SquareShape, CircleShape, TriangleShape];
  
  // Level configurations matching C implementation
  private static readonly LEVEL_CONFIGS = [
    { width: 0, height: 0, minConstraints: 0, maxConstraints: 0, requiredCats: 0, maxLockedCells: 0 }, // Placeholder
    { width: 2, height: 2, minConstraints: 2, maxConstraints: 10, requiredCats: 0, maxLockedCells: 0 }, // Level 1
    { width: 2, height: 3, minConstraints: 3, maxConstraints: 12, requiredCats: 0, maxLockedCells: 0 }, // Level 2
    { width: 3, height: 3, minConstraints: 4, maxConstraints: 20, requiredCats: 1, maxLockedCells: 1 }, // Level 3
    { width: 3, height: 4, minConstraints: 5, maxConstraints: 25, requiredCats: 1, maxLockedCells: 2 }, // Level 4
    { width: 4, height: 4, minConstraints: 6, maxConstraints: 30, requiredCats: 2, maxLockedCells: 3 }, // Level 5
  ];
  
  public static generate(config: Partial<PuzzleConfig> = {}, seed?: number | string): PuzzleDefinition {
    const fullConfig = this.getFullConfig(config);
    
    // Create seeded RNG - use provided seed or generate random seed
    const rngSeed = seed ?? Math.floor(Math.random() * 0xFFFFFFFF);
    const rng = new SeededRNG(rngSeed);
    
    // Get level config
    const levelNum = this.difficultyToLevel(fullConfig.difficulty);
    const levelConfig = this.LEVEL_CONFIGS[levelNum];
    
    // Override with provided config values
    const genConfig = {
      width: fullConfig.width || levelConfig.width,
      height: fullConfig.height || levelConfig.height,
      minConstraints: fullConfig.minConstraints ?? levelConfig.minConstraints,
      maxConstraints: fullConfig.maxConstraints ?? levelConfig.maxConstraints,
      requiredCats: fullConfig.requiredSuperpositions ?? levelConfig.requiredCats,
      maxLockedCells: levelConfig.maxLockedCells,
    };
    
    // Generate solution board
    const solutionBoard = this.generateSolutionBoard(genConfig, rng);
    
    // Extract facts from solution
    const facts = this.extractFacts(solutionBoard, genConfig);
    
    // Initialize puzzle board with all cats
    const initialBoard = this.initializeGrid(genConfig.width, genConfig.height);
    
    // Select constraints for unique solution (without solver checking since we removed JS solvers)
    const constraints = this.selectConstraints(facts, genConfig, rng);
    
    // Add locked cells (pre-revealed from solution)
    this.addLockedCells(solutionBoard, initialBoard, genConfig, rng);
    
    return {
      initialBoard,
      constraints
    };
  }

  /**
   * Generates a valid solution board with the required number of cats
   * and random shapes for remaining cells
   */
  private static generateSolutionBoard(
    config: { width: number; height: number; requiredCats: number },
    rng: SeededRNG
  ): GameBoard {
    const { width, height, requiredCats } = config;
    const totalCells = width * height;
    
    // Initialize board with random concrete shapes
    const board: GameBoard = Array(height).fill(null).map(() =>
      Array(width).fill(null).map(() => ({
        shape: this.SHAPES[rng.nextInt(this.SHAPES.length)],
        locked: false
      }))
    );
    
    // Place required cats randomly
    if (requiredCats > 0) {
      // Create array of cell indices and shuffle
      const indices: number[] = [];
      for (let i = 0; i < totalCells; i++) {
        indices.push(i);
      }
      this.shuffleArray(indices, rng);
      
      // Place cats at first N shuffled positions
      for (let i = 0; i < requiredCats && i < totalCells; i++) {
        const idx = indices[i];
        const y = Math.floor(idx / width);
        const x = idx % width;
        board[y][x].shape = CatShape;
      }
    }
    
    return board;
  }

  /**
   * Extracts all facts from a solution board
   */
  private static extractFacts(
    board: GameBoard,
    config: { width: number; height: number }
  ): Fact[] {
    const facts: Fact[] = [];
    const { width, height } = config;
    
    // Global count facts for each shape
    for (const shape of this.ALL_SHAPES) {
      const count = this.countShapeInBoard(board, shape);
      facts.push({
        type: 'global_count',
        shape,
        count
      });
    }
    
    // Row count facts
    for (let y = 0; y < height; y++) {
      for (const shape of this.ALL_SHAPES) {
        const count = this.countShapeInRow(board, y, shape);
        facts.push({
          type: 'row_count',
          shape,
          count,
          index: y
        });
      }
    }
    
    // Column count facts
    for (let x = 0; x < width; x++) {
      for (const shape of this.ALL_SHAPES) {
        const count = this.countShapeInColumn(board, x, shape);
        facts.push({
          type: 'col_count',
          shape,
          count,
          index: x
        });
      }
    }
    
    // Cell facts (both is and is_not)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellShape = board[y][x].shape;
        
        // "Cell is X" fact
        facts.push({
          type: 'cell_is',
          shape: cellShape,
          x,
          y
        });
        
        // "Cell is not X" facts for other shapes
        for (const shape of this.ALL_SHAPES) {
          if (shape !== cellShape) {
            facts.push({
              type: 'cell_is_not',
              shape,
              x,
              y
            });
          }
        }
      }
    }
    
    return facts;
  }

  /**
   * Score a fact for selection priority
   * Higher scores = more informative constraints
   */
  private static scoreFact(fact: Fact, config: { width: number; height: number }): number {
    let score = 0;
    
    switch (fact.type) {
      case 'cell_is':
        // Cell facts are very constraining
        score = 100;
        // Prefer non-cat reveals (more informative)
        if (fact.shape !== CatShape) score += 20;
        break;
        
      case 'cell_is_not':
        // "Is not" constraints are highly valued!
        // "Is not Cat" is especially powerful - forces concrete shape
        if (fact.shape === CatShape) {
          score = 120;  // Very constraining - eliminates superposition
        } else {
          score = 80;   // Still good - eliminates one concrete option
        }
        break;
        
      case 'row_count':
      case 'col_count':
        // Row/column constraints are moderately constraining
        score = 70;
        // Zero or full counts are more constraining
        const dimensionSize = fact.type === 'row_count' ? config.width : config.height;
        if (fact.count === 0 || fact.count === dimensionSize) {
          score += 30;
        }
        break;
        
      case 'global_count':
        // Global constraints are less constraining
        score = 40;
        // Zero counts (none) are very constraining
        if (fact.count === 0) score += 50;
        break;
    }
    
    return score;
  }

  /**
   * Select constraints to create a uniquely solvable puzzle
   * Note: Without JS solver, we can't verify uniqueness, but we follow the same selection strategy
   */
  private static selectConstraints(
    facts: Fact[],
    config: { minConstraints: number; maxConstraints: number; width: number; height: number },
    rng: SeededRNG
  ): ConstraintDefinition[] {
    const constraints: ConstraintDefinition[] = [];
    
    // Score and sort facts
    const scoredFacts = facts.map(fact => ({
      fact,
      score: this.scoreFact(fact, config) + rng.nextInt(50) // Add random factor
    }));
    
    // Sort by score (descending)
    scoredFacts.sort((a, b) => b.score - a.score);
    
    // Try adding constraints until we have enough
    for (const { fact } of scoredFacts) {
      if (constraints.length >= config.maxConstraints) break;
      
      const constraint = this.factToConstraint(fact, config.width);
      if (!constraint) continue;
      
      // Check if constraint is redundant or conflicting
      if (this.isRedundantOrConflicting(constraint, constraints)) {
        continue;
      }
      
      constraints.push(constraint);
      
      // If we have minimum constraints, we can stop (without uniqueness check)
      // In C version, it continues until unique solution is found
      if (constraints.length >= config.minConstraints) {
        // Continue adding for variety (up to max)
      }
    }
    
    return constraints;
  }

  /**
   * Convert a fact to a constraint
   */
  private static factToConstraint(fact: Fact, _width: number): ConstraintDefinition | null {
    switch (fact.type) {
      case 'row_count':
        return {
          type: 'row',
          index: fact.index,
          rule: {
            shape: fact.shape,
            count: fact.count!,
            operator: 'exactly'
          }
        };
        
      case 'col_count':
        return {
          type: 'column',
          index: fact.index,
          rule: {
            shape: fact.shape,
            count: fact.count!,
            operator: 'exactly'
          }
        };
        
      case 'global_count':
        return {
          type: 'global',
          rule: {
            shape: fact.shape,
            count: fact.count!,
            operator: 'exactly'
          }
        };
        
      case 'cell_is':
        return {
          type: 'cell',
          x: fact.x!,
          y: fact.y!,
          rule: {
            shape: fact.shape,
            operator: 'is'
          }
        };
        
      case 'cell_is_not':
        return {
          type: 'cell',
          x: fact.x!,
          y: fact.y!,
          rule: {
            shape: fact.shape,
            operator: 'is_not'
          }
        };
        
      default:
        return null;
    }
  }

  /**
   * Check if adding a constraint would be redundant or conflicting
   */
  private static isRedundantOrConflicting(
    newConstraint: ConstraintDefinition,
    existingConstraints: ConstraintDefinition[]
  ): boolean {
    // Check for duplicate constraints
    for (const c of existingConstraints) {
      if (isCellConstraint(c) && isCellConstraint(newConstraint)) {
        if (c.x === newConstraint.x && c.y === newConstraint.y && c.rule.shape === newConstraint.rule.shape) {
          return true;
        }
      } else if (isCountConstraint(c) && isCountConstraint(newConstraint)) {
        if (c.type === newConstraint.type && c.rule.shape === newConstraint.rule.shape) {
          if (c.type === 'global') {
            return true;
          } else if (c.index === newConstraint.index) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Add locked cells to puzzle (pre-revealed from solution)
   * Locked cells show the solution value and cannot be changed
   */
  private static addLockedCells(
    solutionBoard: GameBoard,
    initialBoard: GameBoard,
    config: { width: number; height: number; maxLockedCells: number },
    rng: SeededRNG
  ): void {
    if (config.maxLockedCells <= 0) return;
    
    const { width, height, maxLockedCells } = config;
    const totalCells = width * height;
    
    // Create shuffled indices of non-cat cells (prefer revealing concrete shapes)
    const candidates: number[] = [];
    
    for (let i = 0; i < totalCells; i++) {
      const y = Math.floor(i / width);
      const x = i % width;
      // Only lock non-cat cells (revealing cats is less interesting)
      if (solutionBoard[y][x].shape !== CatShape) {
        candidates.push(i);
      }
    }
    
    this.shuffleArray(candidates, rng);
    
    // Lock up to maxLockedCells
    const toLock = Math.min(maxLockedCells, candidates.length);
    
    for (let i = 0; i < toLock; i++) {
      const idx = candidates[i];
      const y = Math.floor(idx / width);
      const x = idx % width;
      initialBoard[y][x].shape = solutionBoard[y][x].shape;
      initialBoard[y][x].locked = true;
    }
  }

  /**
   * Counts a specific shape in the entire board
   */
  private static countShapeInBoard(board: GameBoard, shape: ShapeId): number {
    let count = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell.shape === shape) {
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
      if (cell.shape === shape) {
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
      if (row[colIndex].shape === shape) {
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

  /**
   * Convert difficulty string to level number
   */
  private static difficultyToLevel(difficulty: string): number {
    const match = difficulty.match(/level(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
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
