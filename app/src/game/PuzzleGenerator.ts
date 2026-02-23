import { DIFFICULTY_SETTINGS } from './DifficultySettings';
import { ShapeId, GameBoard, ConstraintDefinition, PuzzleConfig, PuzzleDefinition, CatShape, SquareShape, CircleShape, TriangleShape, isCountConstraint, isCellConstraint, CountConstraint, CellConstraint } from './types';
import { SeededRNG } from './SeededRNG';
import { countSolutions } from './PuzzleSolver';

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
  // Constraint quotas control difficulty by limiting direct assignments:
  // - maxCellIs: Direct "A1 = Square" constraints (lower = harder)
  // - maxCellIsNotCat: "A1 ≠ Cat" constraints (max 1 per puzzle to reduce spam)
  // - minCountConstraints: Row/col/global counts force deduction
  // Cat distribution: every puzzle gets 1 cat guaranteed. Each additional cat
  // is rolled with extraCatChance probability (geometric decay — stop on first fail).
  private static readonly LEVEL_CONFIGS = [
    { width: 0, height: 0, minConstraints: 0, maxConstraints: 0, minCats: 0, maxCats: 0, extraCatChance: 0, maxLockedCells: 0, maxCellIs: 0, maxCellIsNotCat: 0, minCountConstraints: 0, maxSolutions: 1 }, // Placeholder
    { width: 2, height: 2, minConstraints: 2, maxConstraints: 4, minCats: 1, maxCats: 1, extraCatChance: 0, maxLockedCells: 0, maxCellIs: 2, maxCellIsNotCat: 1, minCountConstraints: 1, maxSolutions: 3 }, // Level 1: Tutorial
    { width: 2, height: 3, minConstraints: 3, maxConstraints: 12, minCats: 1, maxCats: 2, extraCatChance: 0.15, maxLockedCells: 0, maxCellIs: 1, maxCellIsNotCat: 1, minCountConstraints: 2, maxSolutions: 4 }, // Level 2: Easy
    { width: 3, height: 3, minConstraints: 4, maxConstraints: 20, minCats: 1, maxCats: 2, extraCatChance: 0.25, maxLockedCells: 1, maxCellIs: 0, maxCellIsNotCat: 1, minCountConstraints: 3, maxSolutions: 6 }, // Level 3: Medium
    { width: 3, height: 4, minConstraints: 5, maxConstraints: 25, minCats: 1, maxCats: 3, extraCatChance: 0.30, maxLockedCells: 2, maxCellIs: 0, maxCellIsNotCat: 0, minCountConstraints: 4, maxSolutions: 8 }, // Level 4: Hard
    { width: 4, height: 4, minConstraints: 6, maxConstraints: 30, minCats: 1, maxCats: 4, extraCatChance: 0.40, maxLockedCells: 3, maxCellIs: 0, maxCellIsNotCat: 0, minCountConstraints: 5, maxSolutions: 12 }, // Level 5: Expert
  ];
  
  private static readonly MAX_GENERATION_ATTEMPTS = 50;
  private static readonly MAX_SOLVABLE_CELLS = 16;

  public static generate(config: Partial<PuzzleConfig> = {}, seed?: number | string): PuzzleDefinition {
    const fullConfig = this.getFullConfig(config);
    const levelNum = this.difficultyToLevel(fullConfig.difficulty);
    const levelConfig = this.LEVEL_CONFIGS[levelNum];
    const maxSolutions = levelConfig.maxSolutions;

    const baseSeed = seed ?? Math.floor(Math.random() * 0xFFFFFFFF);
    const gridSize = (fullConfig.width || levelConfig.width) * (fullConfig.height || levelConfig.height);

    if (gridSize > this.MAX_SOLVABLE_CELLS) {
      return this.generateOnce(config, baseSeed);
    }

    let bestPuzzle: PuzzleDefinition | null = null;
    let bestSolutionCount = Infinity;

    for (let attempt = 0; attempt < this.MAX_GENERATION_ATTEMPTS; attempt++) {
      const attemptSeed = typeof baseSeed === 'string'
        ? `${baseSeed}-${attempt}`
        : (baseSeed as number) + attempt;

      const puzzle = this.generateOnce(config, attemptSeed);
      const solutions = countSolutions(puzzle.initialBoard, puzzle.constraints, maxSolutions + 1);

      if (solutions >= 1 && solutions <= maxSolutions) {
        return puzzle;
      }

      if (solutions >= 1 && solutions < bestSolutionCount) {
        bestPuzzle = puzzle;
        bestSolutionCount = solutions;
      }
    }

    return bestPuzzle ?? this.generateOnce(config, baseSeed);
  }

  private static generateOnce(config: Partial<PuzzleConfig> = {}, seed?: number | string): PuzzleDefinition {
    const fullConfig = this.getFullConfig(config);
    
    // Create seeded RNG - use provided seed or generate random seed
    const rngSeed = seed ?? Math.floor(Math.random() * 0xFFFFFFFF);
    const rng = new SeededRNG(rngSeed);
    
    // Get level config
    const levelNum = this.difficultyToLevel(fullConfig.difficulty);
    const levelConfig = this.LEVEL_CONFIGS[levelNum];
    
    const width = fullConfig.width || levelConfig.width;
    const height = fullConfig.height || levelConfig.height;

    // Roll for cat count: guaranteed minimum, then geometric decay for extras.
    // Only use explicit override from the caller, not from DifficultySettings.
    const catCount = config.requiredSuperpositions
      ?? this.rollCatCount(rng, levelConfig, width * height);

    const genConfig = {
      width,
      height,
      minConstraints: fullConfig.minConstraints ?? levelConfig.minConstraints,
      maxConstraints: fullConfig.maxConstraints ?? levelConfig.maxConstraints,
      requiredCats: catCount,
      maxLockedCells: levelConfig.maxLockedCells,
      maxCellIs: levelConfig.maxCellIs,
      maxCellIsNotCat: levelConfig.maxCellIsNotCat,
      minCountConstraints: levelConfig.minCountConstraints,
    };
    
    // Generate solution board
    const solutionBoard = this.generateSolutionBoard(genConfig, rng);
    
    // Extract facts from solution
    const facts = this.extractFacts(solutionBoard, genConfig);
    
    // Initialize puzzle board with all cats
    const initialBoard = this.initializeGrid(genConfig.width, genConfig.height);
    
    // Select constraints, optimize, and backfill if optimization pruned too many
    const rawConstraints = this.selectConstraints(facts, genConfig, rng);
    
    // Add locked cells (pre-revealed from solution)
    this.addLockedCells(solutionBoard, initialBoard, genConfig, rng);
    
    // Optimize constraints for display (remove redundant, consolidate, shuffle)
    const preOptCount = rawConstraints.length;
    let constraints = this.optimizeConstraints(rawConstraints, initialBoard, rngSeed);

    // Backfill if optimization pruned constraints — try to recover to pre-optimization count
    if (constraints.length < preOptCount) {
      constraints = this.backfillConstraints(
        constraints, facts, { ...genConfig, maxConstraints: preOptCount }, initialBoard, rng, rngSeed
      );
    }
    
    return {
      initialBoard,
      constraints
    };
  }

  /**
   * Generates a valid solution board with the required number of cats
   * and at least one of every concrete shape for variety.
   */
  private static generateSolutionBoard(
    config: { width: number; height: number; requiredCats: number },
    rng: SeededRNG
  ): GameBoard {
    const { width, height, requiredCats } = config;
    const totalCells = width * height;
    const nonCatCells = totalCells - requiredCats;
    
    // Build a flat array of shapes for non-cat cells:
    // guarantee one of each concrete shape, fill the rest randomly
    const shapes: ShapeId[] = [];
    if (nonCatCells >= this.SHAPES.length) {
      for (const s of this.SHAPES) shapes.push(s);
      for (let i = this.SHAPES.length; i < nonCatCells; i++) {
        shapes.push(this.SHAPES[rng.nextInt(this.SHAPES.length)]);
      }
    } else {
      for (let i = 0; i < nonCatCells; i++) {
        shapes.push(this.SHAPES[rng.nextInt(this.SHAPES.length)]);
      }
    }
    const shuffledShapes = this.getShuffledArray(shapes, rng);

    // Create shuffled cell indices and assign: cats first, then concrete shapes
    const indices: number[] = [];
    for (let i = 0; i < totalCells; i++) indices.push(i);
    const shuffledIndices = this.getShuffledArray(indices, rng);

    const board: GameBoard = Array(height).fill(null).map(() =>
      Array(width).fill(null).map(() => ({ shape: 0 as ShapeId, locked: false }))
    );

    let shapeIdx = 0;
    for (let i = 0; i < totalCells; i++) {
      const idx = shuffledIndices[i];
      const y = Math.floor(idx / width);
      const x = idx % width;

      if (i < requiredCats) {
        board[y][x].shape = CatShape;
      } else {
        board[y][x].shape = shuffledShapes[shapeIdx++];
      }
    }

    return board;
  }

  /**
   * Extracts facts from a solution board using an implication hierarchy.
   * 
   * Facts are built in layers — each layer only includes facts not already
   * implied by a higher layer:
   *   Layer 1: Global counts (always included)
   *   Layer 2: Row/column counts (only if not implied by globals)
   *   Layer 3: Cell facts (only if not implied by row/col or globals)
   * 
   * This ensures the selection pool contains no redundant information,
   * so every selected constraint carries genuine deductive value.
   */
  private static extractFacts(
    board: GameBoard,
    config: { width: number; height: number }
  ): Fact[] {
    const facts: Fact[] = [];
    const { width, height } = config;
    const totalCells = width * height;

    // Layer 1: Global counts — these are the broadest facts, always included.
    // IMPORTANT: "exactly 0 of concrete shape" is invalid in any scope that
    // contains cats, because the constraint checker treats cats as matching
    // every concrete shape (quantum superposition). We must suppress these.
    const globalCounts = new Map<ShapeId, number>();
    const globalCatCount = this.countShapeInBoard(board, CatShape);
    for (const shape of this.ALL_SHAPES) {
      const count = this.countShapeInBoard(board, shape);
      globalCounts.set(shape, count);

      if (shape !== CatShape && count === 0 && globalCatCount > 0) continue;

      facts.push({ type: 'global_count', shape, count });
    }

    // Layer 2: Row/column counts — only if not fully determined by a global fact
    // A global count of 0 or totalCells makes every row/col count for that shape redundant
    const rowCounts = new Map<string, number>();
    for (let y = 0; y < height; y++) {
      const rowCatCount = this.countShapeInRow(board, y, CatShape);
      for (const shape of this.ALL_SHAPES) {
        const count = this.countShapeInRow(board, y, shape);
        rowCounts.set(`${y}-${shape}`, count);

        const globalCount = globalCounts.get(shape)!;
        if (globalCount === 0 || globalCount === totalCells) continue;
        if (shape !== CatShape && count === 0 && rowCatCount > 0) continue;

        facts.push({ type: 'row_count', shape, count, index: y });
      }
    }

    const colCounts = new Map<string, number>();
    for (let x = 0; x < width; x++) {
      const colCatCount = this.countShapeInColumn(board, x, CatShape);
      for (const shape of this.ALL_SHAPES) {
        const count = this.countShapeInColumn(board, x, shape);
        colCounts.set(`${x}-${shape}`, count);

        const globalCount = globalCounts.get(shape)!;
        if (globalCount === 0 || globalCount === totalCells) continue;
        if (shape !== CatShape && count === 0 && colCatCount > 0) continue;

        facts.push({ type: 'col_count', shape, count, index: x });
      }
    }

    // Layer 3: Cell facts — only if not implied by any higher-level constraint
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellShape = board[y][x].shape;

        // "Cell is X" — skip if the entire row, column, or board is shape X
        const isImplied =
          rowCounts.get(`${y}-${cellShape}`) === width ||
          colCounts.get(`${x}-${cellShape}`) === height ||
          globalCounts.get(cellShape) === totalCells;

        if (!isImplied) {
          facts.push({ type: 'cell_is', shape: cellShape, x, y });
        }

        // "Cell is not X" — skip if row, column, or board already has 0 of shape X.
        // Cat cells are in superposition (they ARE every shape), so "is not X"
        // can never be satisfied for a cat cell — skip entirely.
        if (cellShape !== CatShape) {
          for (const shape of this.ALL_SHAPES) {
            if (shape === cellShape) continue;

            const isNotImplied =
              rowCounts.get(`${y}-${shape}`) === 0 ||
              colCounts.get(`${x}-${shape}`) === 0 ||
              globalCounts.get(shape) === 0;

            if (!isNotImplied) {
              facts.push({ type: 'cell_is_not', shape, x, y });
            }
          }
        }
      }
    }

    return facts;
  }

  /**
   * Quota tracking for constraint selection
   */
  private static quotas = {
    cellIsCount: 0,
    cellIsNotCatCount: 0,
    countConstraintCount: 0
  };

  /**
   * Score a fact for selection priority
   * 
   * DESIGN PRINCIPLE: Reward constraints that require DEDUCTION, not direct answers.
   * 
   * Key changes from original:
   * - Row/column counts are now HIGHEST priority (force cross-referencing)
   * - "Cell = Shape" is now LOWEST priority (removes puzzle element)
   * - "Cell ≠ Cat" is limited (mostly redundant information)
   * - Returns -1000 when quotas would be exceeded
   */
  private static scoreFact(
    fact: Fact, 
    config: { width: number; height: number; maxCellIs: number; maxCellIsNotCat: number }
  ): number {
    let score = 0;
    
    switch (fact.type) {
      case 'cell_is':
        // Direct assignments should be RARE - they remove the puzzle element
        if (this.quotas.cellIsCount >= config.maxCellIs) {
          return -1000;  // Quota exceeded - skip
        }
        // Low base score - these are the "answer key" constraints
        score = 20;
        // Cat reveals are less useful (superposition state)
        if (fact.shape === CatShape) score -= 10;
        break;
        
      case 'cell_is_not':
        if (fact.shape === CatShape) {
          // "Cell ≠ Cat" constraints are mostly redundant, limit to 1 per puzzle
          if (this.quotas.cellIsNotCatCount >= config.maxCellIsNotCat) {
            return -1000;  // Quota exceeded - skip
          }
          score = 30;  // Low priority - often obvious
        } else {
          // "Cell ≠ [concrete shape]" is more interesting
          // Forces elimination reasoning: "not square, not circle, must be triangle"
          score = 60;
        }
        break;
        
      case 'row_count':
      case 'col_count':
        // ROW/COLUMN COUNTS ARE THE HEART OF THE PUZZLE
        // These force players to cross-reference and deduce
        score = 100;  // Highest base priority!
        
        // Boundary counts (0 or full) are especially powerful
        if (fact.count === 0) {
          score += 30;  // Very powerful for elimination
        }
        const dimension = fact.type === 'row_count' ? config.width : config.height;
        if (fact.count === dimension) {
          score += 20;  // Powerful but more obvious
        }
        // Middle counts force counting
        if (fact.count !== undefined && fact.count > 0 && fact.count < dimension) {
          score += 15;  // Requires careful tracking
        }
        break;
        
      case 'global_count':
        // Global counts are good for overall constraint
        score = 70;
        // Zero counts are very constraining
        if (fact.count === 0) score += 40;
        // Full counts are interesting (rare)
        const total = config.width * config.height;
        if (fact.count === total) score += 30;
        break;
    }
    
    return score;
  }

  /**
   * Update quota tracking when a constraint is added
   */
  private static updateQuotasForConstraint(constraint: ConstraintDefinition): void {
    if (isCellConstraint(constraint)) {
      if (constraint.rule.operator === 'is') {
        this.quotas.cellIsCount++;
      } else if (constraint.rule.operator === 'is_not' && constraint.rule.shape === CatShape) {
        this.quotas.cellIsNotCatCount++;
      }
    } else {
      this.quotas.countConstraintCount++;
    }
  }

  /**
   * Check if a constraint would exceed quotas
   */
  private static wouldExceedQuota(
    constraint: ConstraintDefinition,
    config: { maxCellIs: number; maxCellIsNotCat: number }
  ): boolean {
    if (isCellConstraint(constraint)) {
      if (constraint.rule.operator === 'is' && this.quotas.cellIsCount >= config.maxCellIs) {
        return true;
      }
      if (constraint.rule.operator === 'is_not' && 
          constraint.rule.shape === CatShape &&
          this.quotas.cellIsNotCatCount >= config.maxCellIsNotCat) {
        return true;
      }
    }
    return false;
  }

  /**
   * Select constraints to create a uniquely solvable puzzle
   * 
   * DESIGN: Enforces constraint quotas to ensure appropriate difficulty:
   * - Limits direct "cell = shape" assignments (easier puzzles allow more)
   * - Limits "cell ≠ cat" spam (max 1 per puzzle)
   * - Requires minimum count constraints (forces deduction)
   */
  private static selectConstraints(
    facts: Fact[],
    config: { minConstraints: number; maxConstraints: number; width: number; height: number; maxCellIs: number; maxCellIsNotCat: number },
    rng: SeededRNG
  ): ConstraintDefinition[] {
    const constraints: ConstraintDefinition[] = [];
    
    // Reset quota tracking for this puzzle
    this.quotas = { cellIsCount: 0, cellIsNotCatCount: 0, countConstraintCount: 0 };

    // The global cat count is mandatory — cats are the core mechanic.
    // Pull it from the pool and add it before competitive selection.
    const catFactIdx = facts.findIndex(f => f.type === 'global_count' && f.shape === CatShape);
    if (catFactIdx !== -1) {
      const catFact = facts[catFactIdx];
      const catConstraint = this.factToConstraint(catFact, config.width);
      if (catConstraint) {
        constraints.push(catConstraint);
        this.updateQuotasForConstraint(catConstraint);
      }
    }
    
    // Score and sort remaining facts with quota awareness
    const scoredFacts = facts
      .filter(f => !(f.type === 'global_count' && f.shape === CatShape))
      .map(fact => ({
        fact,
        score: this.scoreFact(fact, config) + rng.nextInt(40)
      }));
    
    // Sort by score (descending)
    scoredFacts.sort((a, b) => b.score - a.score);
    
    // Fill remaining slots competitively
    for (const { fact, score } of scoredFacts) {
      if (constraints.length >= config.maxConstraints) break;
      
      // Skip facts that exceeded quotas during scoring
      if (score < 0) continue;
      
      const constraint = this.factToConstraint(fact, config.width);
      if (!constraint) continue;
      
      // Check if constraint is redundant or conflicting
      if (this.isRedundantOrConflicting(constraint, constraints)) {
        continue;
      }
      
      // Double-check quotas (since scoring was predictive)
      if (this.wouldExceedQuota(constraint, config)) {
        continue;
      }
      
      constraints.push(constraint);
      this.updateQuotasForConstraint(constraint);
    }
    
    return constraints;
  }

  /**
   * Backfill constraints from the fact pool after optimization pruned too many.
   * Picks the highest-scoring unused, non-redundant facts and re-optimizes.
   */
  private static backfillConstraints(
    optimized: ConstraintDefinition[],
    facts: Fact[],
    config: { minConstraints: number; maxConstraints: number; width: number; height: number; maxCellIs: number; maxCellIsNotCat: number },
    board: GameBoard,
    rng: SeededRNG,
    seed: number | string
  ): ConstraintDefinition[] {
    const combined = [...optimized];

    const candidates = facts
      .map(fact => ({ fact, score: this.scoreFact(fact, config) + rng.nextInt(40) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score);

    for (const { fact } of candidates) {
      if (combined.length >= config.maxConstraints) break;

      const constraint = this.factToConstraint(fact, config.width);
      if (!constraint) continue;

      if (this.isRedundantOrConflicting(constraint, combined)) continue;
      if (this.isConstraintRedundant(constraint, combined, board)) continue;

      combined.push(constraint);
    }

    return this.optimizeConstraints(combined, board, seed);
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
    
    const shuffledCandidates = this.getShuffledArray(candidates, rng);
    
    // Lock up to maxLockedCells
    const toLock = Math.min(maxLockedCells, shuffledCandidates.length);
    
    for (let i = 0; i < toLock; i++) {
      const idx = shuffledCandidates[i];
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
   * Roll for cat count using geometric decay.
   * Always at least minCats. Each extra cat beyond that succeeds with
   * extraCatChance probability; stop on first failure.
   * Hard-capped so at least SHAPES.length cells remain for concrete shapes.
   */
  private static rollCatCount(
    rng: SeededRNG,
    levelConfig: { minCats: number; maxCats: number; extraCatChance: number },
    totalCells: number
  ): number {
    const { minCats, maxCats, extraCatChance } = levelConfig;
    const absoluteMax = Math.min(maxCats, totalCells - this.SHAPES.length);
    let cats = minCats;

    while (cats < absoluteMax && rng.random() < extraCatChance) {
      cats++;
    }

    return cats;
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
  private static getShuffledArray<T>(array: T[], rng: SeededRNG): T[] {
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

  private static getFullConfig(partialConfig: Partial<PuzzleConfig>): Required<Omit<PuzzleConfig, 'requiredSuperpositions'>> {
    const difficulty = partialConfig.difficulty;
    if (!difficulty) {
      throw new Error('Difficulty is required');
    }
    return {
      ...DIFFICULTY_SETTINGS[difficulty],
      ...partialConfig
    };
  }

  // =============================================================================
  // Constraint Optimization for User Display
  // =============================================================================

  /**
   * Optimize constraints for display by removing redundant ones and consolidating
   * when possible. This matches the C implementation in generator.c.
   * 
   * @param constraints - Raw constraints from puzzle generation
   * @param board - Initial board (to check locked cells)
   * @param seed - Seed for shuffling (optional)
   * @returns Optimized constraints for display
   */
  public static optimizeConstraints(
    constraints: ConstraintDefinition[],
    board: GameBoard,
    seed?: number | string
  ): ConstraintDefinition[] {
    if (constraints.length === 0) return [];

    const width = board[0]?.length || 0;
    const height = board.length;

    // Start with copy of raw constraints, filtering redundant ones
    const kept: ConstraintDefinition[] = [];

    // First pass: keep the global cat count constraint (always first and important)
    for (const c of constraints) {
      if (isCountConstraint(c) && c.type === 'global' && c.rule.shape === CatShape) {
        kept.push({ ...c });
        break;
      }
    }

    // Second pass: add non-redundant constraints
    for (const c of constraints) {
      // Skip global cat count (already added)
      if (isCountConstraint(c) && c.type === 'global' && c.rule.shape === CatShape) {
        continue;
      }

      if (!this.isConstraintRedundant(c, kept, board)) {
        kept.push({ ...c });
      }
    }

    // Prune row/col constraints that are subsumed by global constraints
    this.pruneSubsumedByGlobal(kept, width, height);

    // Prune global constraints that are implied by a complete set of row or column constraints
    this.pruneGlobalSubsumedByRowCol(kept, width, height);

    // Try to consolidate cell constraints into row/column counts
    let display = [...kept];
    let didConsolidate = true;
    while (didConsolidate) {
      const result = this.tryConsolidateRowColumn(display, board);
      display = result.constraints;
      didConsolidate = result.didConsolidate;
    }

    // Shuffle — pin global cat count first if it survived optimization
    if (display.length > 1 && seed !== undefined) {
      const globalCatIdx = display.findIndex(
        c => isCountConstraint(c) && c.type === 'global' && c.rule.shape === CatShape
      );
      const rng = new SeededRNG(seed);

      if (globalCatIdx >= 0) {
        const [globalCat] = display.splice(globalCatIdx, 1);
        this.shuffleConstraints(display, rng);
        display.unshift(globalCat);
      } else {
        this.shuffleConstraints(display, rng);
      }
    }

    return display;
  }

  /**
   * Remove row/column constraints that are subsumed by a global constraint.
   * e.g. if global says "exactly 0 circles", row "exactly 0 circles" is redundant.
   * Mutates the array in place.
   */
  private static pruneSubsumedByGlobal(
    constraints: ConstraintDefinition[],
    width: number,
    height: number
  ): void {
    const totalCells = width * height;

    const globals = constraints.filter(
      c => isCountConstraint(c) && c.type === 'global'
    ) as CountConstraint[];

    for (const g of globals) {
      const { shape, count, operator } = g.rule;
      if (operator !== 'exactly') continue;

      const subsumesBoundary = count === 0 || count === totalCells;
      if (!subsumesBoundary) continue;

      for (let i = constraints.length - 1; i >= 0; i--) {
        const c = constraints[i];
        if (!isCountConstraint(c)) continue;
        if (c.type !== 'row' && c.type !== 'column') continue;
        if (c.rule.shape !== shape || c.rule.operator !== 'exactly') continue;

        const expectedDimCount = count === 0 ? 0 : (c.type === 'row' ? width : height);
        if (c.rule.count === expectedDimCount) {
          constraints.splice(i, 1);
        }
      }
    }
  }

  /**
   * Remove a global constraint if ALL rows (or ALL columns) have "exactly N"
   * constraints for the same shape that sum to the global count.
   * e.g. "col 0: 1 cat" + "col 1: 0 cats" implies "global: 1 cat".
   * Mutates the array in place.
   */
  private static pruneGlobalSubsumedByRowCol(
    constraints: ConstraintDefinition[],
    width: number,
    height: number
  ): void {
    const globals = constraints.filter(
      c => isCountConstraint(c) && c.type === 'global' && c.rule.operator === 'exactly'
    ) as CountConstraint[];

    for (const g of globals) {
      const { shape, count: globalCount } = g.rule;

      const rowConstraints = constraints.filter(
        c => isCountConstraint(c) && c.type === 'row' && c.rule.shape === shape && c.rule.operator === 'exactly'
      ) as CountConstraint[];

      const colConstraints = constraints.filter(
        c => isCountConstraint(c) && c.type === 'column' && c.rule.shape === shape && c.rule.operator === 'exactly'
      ) as CountConstraint[];

      const allRowsCovered = rowConstraints.length === height
        && rowConstraints.reduce((sum, c) => sum + c.rule.count, 0) === globalCount;

      const allColsCovered = colConstraints.length === width
        && colConstraints.reduce((sum, c) => sum + c.rule.count, 0) === globalCount;

      if (allRowsCovered || allColsCovered) {
        const idx = constraints.indexOf(g);
        if (idx >= 0) constraints.splice(idx, 1);
      }
    }
  }

  /**
   * Check if a cell constraint is implied by row/column count constraints
   */
  private static cellConstraintImpliedByCount(
    cellConstraint: CellConstraint,
    constraints: ConstraintDefinition[],
    board: GameBoard
  ): boolean {
    const cx = cellConstraint.x;
    const cy = cellConstraint.y;
    const width = board[0]?.length || 0;
    const height = board.length;

    for (const c of constraints) {
      if (!isCountConstraint(c)) continue;

      // Check row constraints
      if (c.type === 'row' && c.index === cy) {
        // "Row has exactly 0 of shape" implies "cell is not that shape"
        if (c.rule.operator === 'exactly' && c.rule.count === 0 && c.rule.shape === cellConstraint.rule.shape) {
          if (cellConstraint.rule.operator === 'is_not') {
            return true;
          }
        }
        // "Row has exactly N of shape" where N = row width implies all cells are that shape
        if (c.rule.operator === 'exactly' && c.rule.count === width && c.rule.shape === cellConstraint.rule.shape) {
          if (cellConstraint.rule.operator === 'is') {
            return true;
          }
        }
      }

      // Check column constraints
      if (c.type === 'column' && c.index === cx) {
        // "Column has exactly 0 of shape" implies "cell is not that shape"
        if (c.rule.operator === 'exactly' && c.rule.count === 0 && c.rule.shape === cellConstraint.rule.shape) {
          if (cellConstraint.rule.operator === 'is_not') {
            return true;
          }
        }
        // "Column has exactly N of shape" where N = column height implies all cells are that shape
        if (c.rule.operator === 'exactly' && c.rule.count === height && c.rule.shape === cellConstraint.rule.shape) {
          if (cellConstraint.rule.operator === 'is') {
            return true;
          }
        }
      }

      // Check global constraints
      if (c.type === 'global') {
        const totalCells = width * height;
        // "Global has exactly 0 of shape" implies no cell is that shape
        if (c.rule.operator === 'exactly' && c.rule.count === 0 && c.rule.shape === cellConstraint.rule.shape) {
          if (cellConstraint.rule.operator === 'is_not') {
            return true;
          }
        }
        // "Global has exactly N of shape" where N = total cells implies all cells are that shape
        if (c.rule.operator === 'exactly' && c.rule.count === totalCells && c.rule.shape === cellConstraint.rule.shape) {
          if (cellConstraint.rule.operator === 'is') {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Check if a "is not X" constraint is redundant given a "is Y" constraint
   * If we know cell IS Square, we don't need "is not Cat", "is not Circle", "is not Triangle"
   */
  private static isNotImpliedByIs(
    isNotConstraint: CellConstraint,
    constraints: ConstraintDefinition[]
  ): boolean {
    if (isNotConstraint.rule.operator !== 'is_not') return false;

    const cx = isNotConstraint.x;
    const cy = isNotConstraint.y;

    for (const c of constraints) {
      if (!isCellConstraint(c)) continue;

      // Look for "is X" constraint on same cell
      if (c.rule.operator === 'is' && c.x === cx && c.y === cy) {
        // If "is X" where X != the forbidden shape, the "is not" is redundant
        if (c.rule.shape !== isNotConstraint.rule.shape) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if constraint is about a locked cell (redundant - locked cells are already shown)
   */
  private static constraintOnLockedCell(
    constraint: ConstraintDefinition,
    board: GameBoard
  ): boolean {
    if (!isCellConstraint(constraint)) return false;

    const cell = board[constraint.y]?.[constraint.x];
    return cell?.locked ?? false;
  }

  /**
   * Check if a constraint is redundant given the current set
   */
  private static isConstraintRedundant(
    constraint: ConstraintDefinition,
    kept: ConstraintDefinition[],
    board: GameBoard
  ): boolean {
    // Check if already in kept set (duplicate)
    for (const k of kept) {
      if (isCellConstraint(k) && isCellConstraint(constraint)) {
        if (k.x === constraint.x && k.y === constraint.y && 
            k.rule.shape === constraint.rule.shape && k.rule.operator === constraint.rule.operator) {
          return true;
        }
      } else if (isCountConstraint(k) && isCountConstraint(constraint)) {
        if (k.type === constraint.type && k.rule.shape === constraint.rule.shape) {
          if (k.type === 'global') {
            return true;
          } else if (k.index === constraint.index) {
            return true;
          }
        }
      }
    }

    // Check if constraint is on a locked cell
    if (this.constraintOnLockedCell(constraint, board)) {
      return true;
    }

    // Check if "is not X" is implied by "is Y"
    if (isCellConstraint(constraint) && this.isNotImpliedByIs(constraint, kept)) {
      return true;
    }

    // Check if cell constraint is implied by row/column count
    if (isCellConstraint(constraint) && this.cellConstraintImpliedByCount(constraint, kept, board)) {
      return true;
    }

    return false;
  }

  /**
   * Try to consolidate cell constraints into row/column count constraints
   * Returns true if consolidation was performed
   */
  private static tryConsolidateRowColumn(
    constraints: ConstraintDefinition[],
    board: GameBoard
  ): { constraints: ConstraintDefinition[]; didConsolidate: boolean } {
    const width = board[0]?.length || 0;
    const height = board.length;
    let didConsolidate = false;
    let result = [...constraints];

    // For each row, check if we can consolidate
    for (let y = 0; y < height; y++) {
      for (const shape of this.ALL_SHAPES) {
        // Count "is X" constraints for this shape in this row
        let isCount = 0;
        let allSpecified = true;

        for (let x = 0; x < width; x++) {
          let foundIs = false;
          for (const c of result) {
            if (isCellConstraint(c) && c.rule.operator === 'is' &&
                c.x === x && c.y === y && c.rule.shape === shape) {
              foundIs = true;
              isCount++;
              break;
            }
          }
          if (!foundIs) {
            // Check if locked cell has this shape
            const cell = board[y]?.[x];
            if (cell?.locked && cell.shape === shape) {
              isCount++;
            } else {
              allSpecified = false;
            }
          }
        }

        // If we have 2+ "is X" constraints in a row, consider consolidating
        if (isCount >= 2 && allSpecified) {
          // Check if we already have a row constraint for this
          const hasRowConstraint = result.some(c =>
            isCountConstraint(c) && c.type === 'row' && c.index === y && c.rule.shape === shape
          );

          if (!hasRowConstraint) {
            // Remove individual cell constraints and add row constraint
            result = result.filter(c => !(
              isCellConstraint(c) && c.rule.operator === 'is' &&
              c.y === y && c.rule.shape === shape
            ));

            // Add row count constraint
            const rowConstraint: CountConstraint = {
              type: 'row',
              index: y,
              rule: {
                shape,
                count: isCount,
                operator: 'exactly'
              }
            };
            result.push(rowConstraint);
            didConsolidate = true;
          }
        }
      }
    }

    // Similar logic for columns
    for (let x = 0; x < width; x++) {
      for (const shape of this.ALL_SHAPES) {
        let isCount = 0;
        let allSpecified = true;

        for (let y = 0; y < height; y++) {
          let foundIs = false;
          for (const c of result) {
            if (isCellConstraint(c) && c.rule.operator === 'is' &&
                c.x === x && c.y === y && c.rule.shape === shape) {
              foundIs = true;
              isCount++;
              break;
            }
          }
          if (!foundIs) {
            const cell = board[y]?.[x];
            if (cell?.locked && cell.shape === shape) {
              isCount++;
            } else {
              allSpecified = false;
            }
          }
        }

        if (isCount >= 2 && allSpecified) {
          const hasColConstraint = result.some(c =>
            isCountConstraint(c) && c.type === 'column' && c.index === x && c.rule.shape === shape
          );

          if (!hasColConstraint) {
            result = result.filter(c => !(
              isCellConstraint(c) && c.rule.operator === 'is' &&
              c.x === x && c.rule.shape === shape
            ));

            const colConstraint: CountConstraint = {
              type: 'column',
              index: x,
              rule: {
                shape,
                count: isCount,
                operator: 'exactly'
              }
            };
            result.push(colConstraint);
            didConsolidate = true;
          }
        }
      }
    }

    return { constraints: result, didConsolidate };
  }

  /**
   * Shuffle constraints using Fisher-Yates algorithm with seeded RNG
   */
  private static shuffleConstraints(constraints: ConstraintDefinition[], rng: SeededRNG): void {
    for (let i = constraints.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      [constraints[i], constraints[j]] = [constraints[j], constraints[i]];
    }
  }
}
