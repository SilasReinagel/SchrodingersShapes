import { PuzzleDefinition, GameBoard, PuzzleMove, PuzzleSnapshot, ShapeId, Cell } from './types';
import { getConstraintStatus } from './utils';

export class CurrentPuzzle {
  public readonly initialBoard: GameBoard;
  public readonly constraints: PuzzleDefinition['constraints'];
  public moveHistory: PuzzleMove[] = [];
  public snapshotHistory: PuzzleSnapshot[] = [];
  public currentBoard: GameBoard;
  public currentConstraintStatuses: boolean[] = [];

  constructor(puzzleDef: PuzzleDefinition) {
    this.initialBoard = this.deepCloneBoard(puzzleDef.initialBoard);
    this.currentBoard = this.deepCloneBoard(puzzleDef.initialBoard);
    this.constraints = [...puzzleDef.constraints];
    this.updateConstraintCache();
  }

  public canMove(x: number, y: number): boolean {
    // Check if coordinates are within bounds
    if (y < 0 || y >= this.currentBoard.length || 
        x < 0 || x >= this.currentBoard[0].length) {
      return false;
    }
    
    // Check if the cell is locked
    return !this.currentBoard[y][x].locked;
  }
  
  public makeMove(x: number, y: number, shape: ShapeId): boolean {
    // Check if the cell is locked
    if (this.currentBoard[y][x].locked) {
      return false;
    }

    // Save current state before making the move
    this.saveSnapshot();

    // Update the board
    this.currentBoard[y][x].shape = shape;
    
    // Record the move
    this.moveHistory.push({ x, y, shape });

    // Update constraint cache
    this.updateConstraintCache();

    return true;
  }

  public undoMove(): boolean {
    if (this.snapshotHistory.length === 0) {
      return false;
    }

    const lastSnapshot = this.snapshotHistory.pop()!;
    this.currentBoard = this.deepCloneBoard(lastSnapshot.board);
    this.moveHistory = [...lastSnapshot.moves];

    // Update constraint cache after undoing
    this.updateConstraintCache();

    return true;
  }

  public resetPuzzle(): void {
    this.currentBoard = this.deepCloneBoard(this.initialBoard);
    this.moveHistory = [];
    this.snapshotHistory = [];
    this.updateConstraintCache();
  }

  public isPuzzleSolved(): boolean {
    // Use cached constraint status instead of recalculating
    return this.currentConstraintStatuses.every(status => status === true);
  }

  public getCanUndo(): boolean {
    return this.moveHistory.length > 0;
  }

  public getMoveCount(): number {
    return this.moveHistory.length;
  }

  private updateConstraintCache(): void {
    this.currentConstraintStatuses = getConstraintStatus(this.currentBoard, this.constraints);
  }

  private saveSnapshot(): void {
    this.snapshotHistory.push({
      board: this.deepCloneBoard(this.currentBoard),
      moves: [...this.moveHistory]
    });
  }

  private deepCloneBoard(board: GameBoard): GameBoard {
    return board.map(row => 
      row.map(cell => ({ 
        shape: cell.shape, 
        locked: cell.locked 
      }))
    );
  }
}
