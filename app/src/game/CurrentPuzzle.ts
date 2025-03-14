import { PuzzleDefinition, GameBoard, PuzzleMove, ShapeId } from './types';
import { getConstraintStatus } from './utils';

export class CurrentPuzzle {
  public readonly definition: PuzzleDefinition;
  public moveHistory: PuzzleMove[] = [];
  public currentBoard: GameBoard;
  public currentConstraintStatuses: boolean[];
  public previousConstraintStatuses: boolean[];

  constructor(puzzleDef: PuzzleDefinition) {
    this.definition = puzzleDef;
    // Initial deep clone is necessary as we'll modify currentBoard
    this.currentBoard = this.deepCloneBoard(puzzleDef.initialBoard);
    // Pre-allocate constraint statuses arrays
    this.currentConstraintStatuses = new Array(puzzleDef.constraints.length);
    this.previousConstraintStatuses = new Array(puzzleDef.constraints.length).fill(false);
    
    this.updateConstraintCache();
  }

  public canMove(x: number, y: number): boolean {
    // Bounds check first for early return
    if (y < 0 || y >= this.currentBoard.length || 
        x < 0 || x >= this.currentBoard[0].length) {
      return false;
    }
    return !this.currentBoard[y][x].locked;
  }
  
  public makeMove(x: number, y: number, shape: ShapeId): boolean {
    if (!this.canMove(x, y)) {
      return false;
    }

    // Store previous constraint statuses
    this.previousConstraintStatuses = [...this.currentConstraintStatuses];

    // Store the move in history
    this.moveHistory.push({
      x,
      y,
      shape,
      previousShape: this.currentBoard[y][x].shape
    });

    // Update the board
    this.currentBoard[y][x].shape = shape;

    // Update constraint cache
    this.updateConstraintCache();

    return true;
  }

  public undoMove(): boolean {
    const lastMove = this.moveHistory.pop();
    if (!lastMove) {
      return false;
    }

    // Restore the previous shape
    this.currentBoard[lastMove.y][lastMove.x].shape = lastMove.previousShape;

    // Update constraint cache
    this.updateConstraintCache();

    return true;
  }

  public resetToInitial(): void {
    // Reset board to initial state
    for (let y = 0; y < this.currentBoard.length; y++) {
      for (let x = 0; x < this.currentBoard[y].length; x++) {
        this.currentBoard[y][x].shape = this.definition.initialBoard[y][x].shape;
      }
    }
    // Clear move history
    this.moveHistory.length = 0;
    this.updateConstraintCache();
  }

  // Keep resetPuzzle as an alias for backward compatibility
  public resetPuzzle(): void {
    this.resetToInitial();
  }

  public isPuzzleSolved(): boolean {
    return this.currentConstraintStatuses.every(status => status === true);
  }

  public getCanUndo(): boolean {
    return this.moveHistory.length > 0;
  }

  public getMoveCount(): number {
    return this.moveHistory.length;
  }

  private updateConstraintCache(): void {
    this.currentConstraintStatuses = getConstraintStatus(this.currentBoard, this.definition.constraints);
  }

  private deepCloneBoard(board: GameBoard): GameBoard {
    const newBoard: GameBoard = new Array(board.length);
    for (let y = 0; y < board.length; y++) {
      newBoard[y] = new Array(board[y].length);
      for (let x = 0; x < board[y].length; x++) {
        newBoard[y][x] = {
          shape: board[y][x].shape,
          locked: board[y][x].locked
        };
      }
    }
    return newBoard;
  }
}
