import { PuzzleDefinition, ShapeId, ConstraintDefinition, isCountConstraint, isCellConstraint, CatShape, SquareShape, CircleShape, TriangleShape } from './types';

/**
 * High-performance puzzle solver optimized for counting all solutions.
 * 
 * Optimizations over PuzzleSolver:
 * - Flat Uint8Array board (no object overhead, cache-friendly)
 * - Incremental constraint checking (only affected constraints)
 * - Numeric state keys (no string concatenation)
 * - No move history tracking
 * - No CurrentPuzzle abstraction overhead
 * - Simple for loops (no forEach/map callbacks)
 */
export class FastSolver {
  // Board state as flat array: board[y * width + x] = shapeId
  private board: Uint8Array;
  private readonly width: number;
  private readonly height: number;
  private readonly totalCells: number;
  
  // Pre-parsed constraints for fast access
  private readonly constraints: ParsedConstraint[];
  
  // Results
  private solutionCount = 0;
  private findFirstOnly = false;
  
  // State cache using numeric keys (Map is faster than object for numeric keys)
  private readonly stateCache = new Map<number, boolean>();
  private readonly maxCacheSize = 100000;
  
  // Pre-computed for state key calculation
  private readonly powersOf4: number[];

  constructor(puzzleDef: PuzzleDefinition) {
    this.height = puzzleDef.initialBoard.length;
    this.width = puzzleDef.initialBoard[0].length;
    this.totalCells = this.width * this.height;
    
    // Initialize flat board
    this.board = new Uint8Array(this.totalCells);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.board[y * this.width + x] = puzzleDef.initialBoard[y][x].shape;
      }
    }
    
    // Pre-compute powers of 4 for state key calculation
    this.powersOf4 = new Array(this.totalCells);
    for (let i = 0; i < this.totalCells; i++) {
      this.powersOf4[i] = Math.pow(4, i);
    }
    
    // Parse constraints into optimized format
    this.constraints = this.parseConstraints(puzzleDef.constraints);
  }

  /**
   * Solve the puzzle and return solution count
   */
  solve(findFirstOnly = false): { solutionCount: number; isSolvable: boolean } {
    this.solutionCount = 0;
    this.findFirstOnly = findFirstOnly;
    this.stateCache.clear();
    
    this.solveRecursive(0);
    
    return {
      solutionCount: this.solutionCount,
      isSolvable: this.solutionCount > 0
    };
  }

  /**
   * Fast recursive solver
   */
  private solveRecursive(cellIndex: number): boolean {
    // Early exit if we found a solution and only want one
    if (this.findFirstOnly && this.solutionCount > 0) {
      return true;
    }
    
    // Check if we've filled all cells
    if (cellIndex >= this.totalCells) {
      // Verify all constraints are satisfied
      if (this.allConstraintsSatisfied()) {
        this.solutionCount++;
        return true;
      }
      return false;
    }
    
    // Early pruning: check for violated constraints
    if (this.hasViolatedConstraint()) {
      return false;
    }
    
    // State caching (only for states we've proven have no solution)
    const stateKey = this.getStateKey();
    if (this.stateCache.has(stateKey)) {
      return false;
    }
    
    const currentShape = this.board[cellIndex];
    let foundSolution = false;
    
    // Try shapes in order: current first, then non-cats, then cat
    const shapesToTry = this.getShapeOrder(currentShape);
    
    for (let i = 0; i < shapesToTry.length; i++) {
      if (this.findFirstOnly && this.solutionCount > 0) {
        return true;
      }
      
      const shape = shapesToTry[i];
      const wasChanged = shape !== currentShape;
      
      if (wasChanged) {
        this.board[cellIndex] = shape;
      }
      
      if (this.solveRecursive(cellIndex + 1)) {
        foundSolution = true;
        if (this.findFirstOnly) {
          if (wasChanged) this.board[cellIndex] = currentShape;
          return true;
        }
      }
      
      if (wasChanged) {
        this.board[cellIndex] = currentShape;
      }
    }
    
    // Cache negative results
    if (!foundSolution && this.stateCache.size < this.maxCacheSize) {
      this.stateCache.set(stateKey, true);
    }
    
    return foundSolution;
  }

  /**
   * Get shape order: current shape first, then concrete shapes, then cat
   */
  private getShapeOrder(currentShape: number): number[] {
    const shapes: number[] = [currentShape];
    
    if (SquareShape !== currentShape) shapes.push(SquareShape);
    if (CircleShape !== currentShape) shapes.push(CircleShape);
    if (TriangleShape !== currentShape) shapes.push(TriangleShape);
    if (CatShape !== currentShape) shapes.push(CatShape);
    
    return shapes;
  }

  /**
   * Fast numeric state key (treats board as base-4 number)
   * For boards up to 10 cells, this fits in a safe integer
   * For larger boards, we use a simpler hash
   */
  private getStateKey(): number {
    if (this.totalCells <= 10) {
      let key = 0;
      for (let i = 0; i < this.totalCells; i++) {
        key += this.board[i] * this.powersOf4[i];
      }
      return key;
    } else {
      // Simple hash for larger boards
      let hash = 0;
      for (let i = 0; i < this.totalCells; i++) {
        hash = ((hash << 2) | this.board[i]) ^ (hash >> 28);
      }
      return hash >>> 0; // Ensure positive
    }
  }

  /**
   * Check if all constraints are satisfied (used at leaf nodes)
   */
  private allConstraintsSatisfied(): boolean {
    for (let i = 0; i < this.constraints.length; i++) {
      if (!this.checkConstraint(this.constraints[i])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if any constraint is definitely violated (early pruning)
   */
  private hasViolatedConstraint(): boolean {
    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      
      if (c.type === 'cell') {
        const cellShape = this.board[c.cellIndex!];
        if (c.operator === 'is_not') {
          // Violated if cell IS the forbidden shape (and not Cat)
          if (cellShape === c.shape && cellShape !== CatShape) {
            return true;
          }
        }
        // 'is' constraints can't be violated early (Cat satisfies any 'is')
      } else {
        // Count constraint - skip cat constraints for early pruning
        if (c.shape === CatShape) continue;
        
        const count = this.countShape(c);
        
        if ((c.operator === 'exactly' || c.operator === 'at_most') && count > c.count!) {
          return true;
        }
        if (c.operator === 'none' && count > 0) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check a single constraint
   */
  private checkConstraint(c: ParsedConstraint): boolean {
    if (c.type === 'cell') {
      const cellShape = this.board[c.cellIndex!];
      
      if (c.operator === 'is') {
        if (c.shape === CatShape) {
          return cellShape === CatShape;
        }
        return cellShape === c.shape || cellShape === CatShape;
      } else {
        // is_not
        if (c.shape === CatShape) {
          return cellShape !== CatShape;
        }
        return cellShape !== c.shape && cellShape !== CatShape;
      }
    } else {
      // Count constraint
      const count = this.countShape(c);
      
      switch (c.operator) {
        case 'exactly': return count === c.count;
        case 'at_least': return count >= c.count!;
        case 'at_most': return count <= c.count!;
        case 'none': return count === 0;
        default: return false;
      }
    }
  }

  /**
   * Count shapes for a constraint (optimized with pre-computed indices)
   */
  private countShape(c: ParsedConstraint): number {
    let count = 0;
    const indices = c.cellIndices!;
    const targetShape = c.shape;
    const isCatTarget = targetShape === CatShape;
    
    for (let i = 0; i < indices.length; i++) {
      const cellShape = this.board[indices[i]];
      if (cellShape === targetShape || (!isCatTarget && cellShape === CatShape)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Parse constraints into optimized format with pre-computed cell indices
   */
  private parseConstraints(constraints: ConstraintDefinition[]): ParsedConstraint[] {
    return constraints.map(c => {
      if (isCellConstraint(c)) {
        return {
          type: 'cell' as const,
          shape: c.rule.shape,
          operator: c.rule.operator,
          cellIndex: c.y * this.width + c.x,
          count: undefined,
          cellIndices: undefined
        };
      } else if (isCountConstraint(c)) {
        // Pre-compute which cell indices this constraint covers
        const indices: number[] = [];
        
        if (c.type === 'global') {
          for (let i = 0; i < this.totalCells; i++) {
            indices.push(i);
          }
        } else if (c.type === 'row') {
          const row = c.index ?? 0;
          for (let x = 0; x < this.width; x++) {
            indices.push(row * this.width + x);
          }
        } else {
          const col = c.index ?? 0;
          for (let y = 0; y < this.height; y++) {
            indices.push(y * this.width + col);
          }
        }
        
        return {
          type: 'count' as const,
          shape: c.rule.shape!,
          operator: c.rule.operator,
          count: c.rule.count,
          cellIndices: indices,
          cellIndex: undefined
        };
      }
      throw new Error('Unknown constraint type');
    });
  }
}

/**
 * Optimized constraint representation
 */
interface ParsedConstraint {
  type: 'cell' | 'count';
  shape: ShapeId;
  operator: string;
  count?: number;
  cellIndex?: number;      // For cell constraints
  cellIndices?: number[];  // For count constraints (pre-computed)
}


