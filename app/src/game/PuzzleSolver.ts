import { CurrentPuzzle } from './CurrentPuzzle';
import { PuzzleDefinition, ShapeId, SquareShape, CircleShape, TriangleShape, CatShape, GameBoard, ConstraintDefinition, isCountConstraint, isCellConstraint } from './types';

export class PuzzleSolver {
  private static readonly SHAPES: ShapeId[] = [CatShape, SquareShape, CircleShape, TriangleShape];
  
  private puzzle: CurrentPuzzle;
  private width: number;
  private height: number;
  private totalCells: number;
  private fewestMoves: number = Infinity;
  private correctSolutions: number = 0;
  private deadEnds: number = 0;
  private isSolvable: boolean = false;
  
  // Optimizations
  private findFirstOnly: boolean = false;
  private maxCacheSize: number = 50000;
  private stateCache: Map<string, boolean> = new Map();
  
  constructor(puzzleDef: PuzzleDefinition) {
    this.puzzle = new CurrentPuzzle(puzzleDef);
    this.height = puzzleDef.initialBoard.length;
    this.width = puzzleDef.initialBoard[0].length;
    this.totalCells = this.width * this.height;
  }
  
  /**
   * Solve the puzzle and return statistics
   * @param findFirstOnly If true, stop after finding first solution (faster for solvability check)
   */
  public solve(findFirstOnly: boolean = false): {
    fewestMoves: number;
    correctSolutions: number;
    deadEnds: number;
    isSolvable: boolean;
  } {
    this.fewestMoves = Infinity;
    this.correctSolutions = 0;
    this.deadEnds = 0;
    this.isSolvable = false;
    this.findFirstOnly = findFirstOnly;
    this.stateCache.clear();
    
    this.solveRecursive(0, 0, 0);
    
    return {
      fewestMoves: this.isSolvable ? this.fewestMoves : -1,
      correctSolutions: this.correctSolutions,
      deadEnds: this.deadEnds,
      isSolvable: this.isSolvable
    };
  }
  
  /**
   * Fast check if puzzle is solvable (stops at first solution)
   */
  public isSolvableFast(): boolean {
    this.solve(true);
    return this.isSolvable;
  }
  
  /**
   * Fast state key using numeric encoding
   */
  private getBoardStateKey(): string {
    let key = '';
    for (const row of this.puzzle.currentBoard) {
      for (const cell of row) {
        key += cell.shape;
      }
    }
    return key;
  }
  
  /**
   * Check if any constraint is definitely violated
   */
  private hasViolatedConstraint(): boolean {
    const board = this.puzzle.currentBoard;
    const constraints = this.puzzle.definition.constraints;
    
    for (const constraint of constraints) {
      if (isCountConstraint(constraint)) {
        // Skip cat count constraints for early pruning (start with all cats)
        if (constraint.rule.shape === CatShape) continue;
        
        const { type, rule } = constraint;
        const { shape, count, operator } = rule;
        
        // Count only committed (non-cat) shapes
        let committedCount = 0;
        
        if (type === 'global') {
          for (const row of board) {
            for (const cell of row) {
              if (cell.shape === shape) committedCount++;
            }
          }
        } else {
          const index = constraint.index ?? 0;
          if (type === 'row') {
            for (const cell of board[index]) {
              if (cell.shape === shape) committedCount++;
            }
          } else {
            for (const row of board) {
              if (row[index].shape === shape) committedCount++;
            }
          }
        }
        
        // Check for violations
        if ((operator === 'exactly' || operator === 'at_most') && committedCount > count) {
          return true;
        }
        if (operator === 'none' && committedCount > 0) {
          return true;
        }
      } else if (isCellConstraint(constraint)) {
        const { x, y, rule } = constraint;
        const cell = board[y][x];
        const { shape, operator } = rule;
        
        if (operator === 'is_not') {
          // "Cell is not X" - violated if cell IS X (and not Cat)
          if (cell.shape === shape && cell.shape !== CatShape) {
            return true;
          }
        }
        // 'is' constraints can't be violated early (Cat satisfies any 'is')
      }
    }
    return false;
  }
  
  /**
   * Recursive solver with optimizations
   */
  private solveRecursive(x: number, y: number, moveCount: number): boolean {
    // Early exit if we've found a solution and only want one
    if (this.findFirstOnly && this.isSolvable) {
      return true;
    }
    
    // Early termination if we've found a better solution
    if (this.isSolvable && moveCount >= this.fewestMoves) {
      return false;
    }
    
    // Check if solved
    const allConstraintsSatisfied = this.puzzle.currentConstraintStatuses.every(s => s);
    if (allConstraintsSatisfied) {
      this.isSolvable = true;
      this.correctSolutions++;
      if (moveCount < this.fewestMoves) {
        this.fewestMoves = moveCount;
      }
      return true;
    }
    
    // Past the board? Dead end
    if (y >= this.height) {
      this.deadEnds++;
      return false;
    }
    
    // Early pruning: check if any constraint is violated
    if (this.hasViolatedConstraint()) {
      this.deadEnds++;
      return false;
    }
    
    // Cache states that we've proven to have no solution
    const stateKey = this.getBoardStateKey();
    if (this.stateCache.has(stateKey)) {
      this.deadEnds++;
      return false;
    }
    
    // Calculate next position
    let nextX = x + 1;
    let nextY = y;
    if (nextX >= this.width) {
      nextX = 0;
      nextY++;
    }
    
    // Skip locked cells
    if (!this.puzzle.canMove(x, y)) {
      return this.solveRecursive(nextX, nextY, moveCount);
    }
    
    const currentShape = this.puzzle.currentBoard[y][x].shape;
    let foundSolution = false;
    
    // Order shapes: current shape first (no move), then non-cats (faster pruning), then cat
    const shapesToTry: ShapeId[] = [];
    shapesToTry.push(currentShape);
    for (const s of [SquareShape, CircleShape, TriangleShape]) {
      if (s !== currentShape) shapesToTry.push(s);
    }
    if (CatShape !== currentShape) shapesToTry.push(CatShape);
    
    for (const shape of shapesToTry) {
      if (this.findFirstOnly && this.isSolvable) {
        return true;
      }
      
      const isKeepingCurrentShape = shape === currentShape;
      
      if (!isKeepingCurrentShape) {
        this.puzzle.makeMove(x, y, shape);
      }
      
      const movesUsed = isKeepingCurrentShape ? 0 : 1;
      const result = this.solveRecursive(nextX, nextY, moveCount + movesUsed);
      
      if (result) {
        foundSolution = true;
        if (this.findFirstOnly) {
          if (!isKeepingCurrentShape) {
            this.puzzle.undoMove();
          }
          return true;
        }
      }
      
      if (!isKeepingCurrentShape) {
        this.puzzle.undoMove();
      }
    }
    
    // Cache negative results only
    if (!foundSolution && this.stateCache.size < this.maxCacheSize) {
      this.stateCache.set(stateKey, true);
    }
    
    return foundSolution;
  }
  
  public getFewestMoves(): number {
    return this.fewestMoves === Infinity ? -1 : this.fewestMoves;
  }
  
  public getCorrectSolutions(): number {
    return this.correctSolutions;
  }
  
  public getDeadEnds(): number {
    return this.deadEnds;
  }
  
  public getIsSolvable(): boolean {
    return this.isSolvable;
  }
}
