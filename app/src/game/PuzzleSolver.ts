import { CurrentPuzzle } from './CurrentPuzzle';
import { PuzzleDefinition, ShapeId, SquareShape, CircleShape, TriangleShape, CatShape } from './types';

export class PuzzleSolver {
  private static readonly SHAPES: ShapeId[] = [SquareShape, CircleShape, TriangleShape, CatShape];
  
  private puzzle: CurrentPuzzle;
  private fewestMoves: number = Infinity;
  private correctSolutions: number = 0;
  private deadEnds: number = 0;
  private isSolvable: boolean = false;
  private stateCache: Map<string, {
    fewestMoves: number;
    correctSolutions: number;
    deadEnds: number;
    isSolvable: boolean;
  }> = new Map();
  
  constructor(puzzleDef: PuzzleDefinition) {
    this.puzzle = new CurrentPuzzle(puzzleDef);
  }
  
  /**
   * Solve the puzzle using brute force and return statistics
   */
  public solve(): {
    fewestMoves: number;
    correctSolutions: number;
    deadEnds: number;
    isSolvable: boolean;
  } {
    // Reset statistics
    this.fewestMoves = Infinity;
    this.correctSolutions = 0;
    this.deadEnds = 0;
    this.isSolvable = false;
    this.stateCache.clear();
    
    // Start the recursive solving process
    this.solveRecursive(0, 0, 0);
    
    return {
      fewestMoves: this.isSolvable ? this.fewestMoves : -1,
      correctSolutions: this.correctSolutions,
      deadEnds: this.deadEnds,
      isSolvable: this.isSolvable
    };
  }
  
  /**
   * Generate a unique string key for the current board state
   */
  private getBoardStateKey(): string {
    return JSON.stringify(this.puzzle.currentBoard);
  }
  
  /**
   * Recursive function to try all possible moves
   * @param x Current x coordinate
   * @param y Current y coordinate
   * @param moveCount Current move count
   * @returns Object containing solution statistics for this branch
   */
  private solveRecursive(x: number, y: number, moveCount: number): {
    fewestMoves: number;
    correctSolutions: number;
    deadEnds: number;
    isSolvable: boolean;
  } {
    // Get the actual width and height of the board
    const height = this.puzzle.currentBoard.length;
    const width = this.puzzle.currentBoard[0].length;
    
    // If we've already found a solution with fewer moves, prune this branch
    if (moveCount >= this.fewestMoves) {
      return {
        fewestMoves: Infinity,
        correctSolutions: 0,
        deadEnds: 0,
        isSolvable: false
      };
    }
    
    // Check if we've seen this board state before
    const stateKey = this.getBoardStateKey();
    const cachedResult = this.stateCache.get(stateKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Check if all constraints are satisfied
    const allConstraintsSatisfied = this.puzzle.currentConstraintStatuses.every(status => status);
    
    // Check if the puzzle is solved
    if (allConstraintsSatisfied) {
      this.isSolvable = true;
      this.correctSolutions++;
      this.fewestMoves = moveCount;
      
      const result = {
        fewestMoves: 0, // 0 additional moves needed
        correctSolutions: 1,
        deadEnds: 0,
        isSolvable: true
      };
      this.stateCache.set(stateKey, result);
      return result;
    }
    
    // Find the next cell to try
    let nextX = x;
    let nextY = y;
    
    // Move to the next cell
    nextX++;
    if (nextX >= width) {
      nextX = 0;
      nextY++;
    }
    
    // If we've gone through all cells and haven't found a solution, it's a dead end
    if (nextY >= height) {
      this.deadEnds++;
      
      const result = {
        fewestMoves: Infinity,
        correctSolutions: 0,
        deadEnds: 1,
        isSolvable: false
      };
      this.stateCache.set(stateKey, result);
      return result;
    }
    
    // If the current cell is locked, skip to the next cell
    if (!this.puzzle.canMove(x, y)) {
      const result = this.solveRecursive(nextX, nextY, moveCount);
      this.stateCache.set(stateKey, result);
      return result;
    }
    
    // Aggregate results from all possible moves
    let branchFewestMoves = Infinity;
    let branchCorrectSolutions = 0;
    let branchDeadEnds = 0;
    let branchIsSolvable = false;
    
    // Try each possible shape in the current cell
    for (const shape of PuzzleSolver.SHAPES) {
      // Skip if the shape is already in this cell
      if (this.puzzle.currentBoard[y][x].shape === shape) {
        continue; // Skip to the next shape instead of returning
      }
      
      // Make the move
      this.puzzle.makeMove(x, y, shape);
      
      // Recursively try the next cell
      const result = this.solveRecursive(nextX, nextY, moveCount + 1);
      
      // Update branch statistics
      if (result.isSolvable) {
        branchIsSolvable = true;
        branchCorrectSolutions += result.correctSolutions;
        if (result.fewestMoves + 1 < branchFewestMoves) {
          branchFewestMoves = result.fewestMoves + 1;
        }
      }
      branchDeadEnds += result.deadEnds;
      
      // Undo the move to backtrack
      this.puzzle.undoMove();
    }
    
    // Create result for this state
    const result = {
      fewestMoves: branchIsSolvable ? branchFewestMoves : Infinity,
      correctSolutions: branchCorrectSolutions,
      deadEnds: branchDeadEnds,
      isSolvable: branchIsSolvable
    };
    
    // Cache the result
    this.stateCache.set(stateKey, result);
    
    return result;
  }
  
  /**
   * Get the fewest moves needed to solve the puzzle
   */
  public getFewestMoves(): number {
    return this.fewestMoves === Infinity ? -1 : this.fewestMoves;
  }
  
  /**
   * Get the number of correct solutions
   */
  public getCorrectSolutions(): number {
    return this.correctSolutions;
  }
  
  /**
   * Get the number of dead ends encountered
   */
  public getDeadEnds(): number {
    return this.deadEnds;
  }
  
  /**
   * Check if the puzzle is solvable
   */
  public getIsSolvable(): boolean {
    return this.isSolvable;
  }
}
