import { CurrentPuzzle } from './CurrentPuzzle';
import { PuzzleDefinition, ShapeId, SquareShape, CircleShape, TriangleShape, CatShape } from './types';

export class PuzzleSolver {
  private static readonly SHAPES: ShapeId[] = [SquareShape, CircleShape, TriangleShape, CatShape];
  
  private puzzle: CurrentPuzzle;
  private fewestMoves: number = Infinity;
  private correctSolutions: number = 0;
  private deadEnds: number = 0;
  private isSolvable: boolean = false;
  
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
   * Recursive function to try all possible moves
   * @param x Current x coordinate
   * @param y Current y coordinate
   * @param moveCount Current move count
   */
  private solveRecursive(x: number, y: number, moveCount: number): void {
    const size = this.puzzle.currentBoard.length;
    
    // If we've already found a solution with fewer moves, prune this branch
    if (moveCount >= this.fewestMoves) {
      return;
    }
    
    // Check if the puzzle is solved
    if (this.puzzle.isPuzzleSolved()) {
      this.isSolvable = true;
      this.correctSolutions++;
      this.fewestMoves = moveCount;
      return;
    }
    
    // Find the next cell to try
    let nextX = x;
    let nextY = y;
    
    // Move to the next cell
    nextX++;
    if (nextX >= size) {
      nextX = 0;
      nextY++;
    }
    
    // If we've gone through all cells and haven't found a solution, it's a dead end
    if (nextY >= size) {
      this.deadEnds++;
      return;
    }
    
    // If the current cell is locked, skip to the next cell
    if (!this.puzzle.canMove(x, y)) {
      this.solveRecursive(nextX, nextY, moveCount);
      return;
    }
    
    // Try each possible shape in the current cell
    for (const shape of PuzzleSolver.SHAPES) {
      // Skip if the shape is already in this cell
      if (this.puzzle.currentBoard[y][x].shape === shape) {
        this.solveRecursive(nextX, nextY, moveCount);
        return;
      }
      
      // Make the move
      this.puzzle.makeMove(x, y, shape);
      
      // Recursively try the next cell
      this.solveRecursive(nextX, nextY, moveCount + 1);
      
      // Undo the move to backtrack
      this.puzzle.undoMove();
    }
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
   * Get the number of dead ends
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
