#!/usr/bin/env npx ts-node

/**
 * Schrödinger's Shapes CLI - Agent Playtesting Interface
 * 
 * Usage:
 *   npx ts-node cli/puzzle-cli.ts --userid=agent1 start --level=1 --seed=42
 *   npx ts-node cli/puzzle-cli.ts --userid=agent1 select --tile=A1 --shape=TRI
 *   npx ts-node cli/puzzle-cli.ts --userid=agent1 undo
 *   npx ts-node cli/puzzle-cli.ts --userid=agent1 reset
 *   npx ts-node cli/puzzle-cli.ts --userid=agent1 status
 */

import * as fs from 'fs';
import * as path from 'path';
import { PuzzleGenerator } from '../src/game/PuzzleGenerator';
import { getConstraintState } from '../src/components/constraints/constraintStatus';
import {
  GameBoard,
  ConstraintDefinition,
  PuzzleMove,
  ShapeId,
  CatShape,
  SquareShape,
  CircleShape,
  TriangleShape,
  Difficulty,
  isCountConstraint,
  isCellConstraint,
  ShapeNames,
} from '../src/game/types';

// ============================================================================
// Types
// ============================================================================

interface GameState {
  level: number;
  seed: number;
  board: GameBoard;
  initialBoard: GameBoard;
  constraints: ConstraintDefinition[];
  moves: PuzzleMove[];
  startTime: number;
  // Solution is stored but never revealed in CLI output
  _solution?: GameBoard;
}

// ============================================================================
// Constants
// ============================================================================

const SHAPE_SYMBOLS: Record<ShapeId, string> = {
  [CatShape]: '?',
  [SquareShape]: '■',
  [CircleShape]: '●',
  [TriangleShape]: '▲',
};

const SHAPE_CODES: Record<string, ShapeId> = {
  'CAT': CatShape,
  '?': CatShape,
  'SQR': SquareShape,
  'SQUARE': SquareShape,
  '■': SquareShape,
  'CIR': CircleShape,
  'CIRCLE': CircleShape,
  '●': CircleShape,
  'TRI': TriangleShape,
  'TRIANGLE': TriangleShape,
  '▲': TriangleShape,
};

const STATE_SYMBOLS = {
  satisfied: '✓',
  violated: '✗',
  in_progress: '○',
};

// ============================================================================
// Utility Functions
// ============================================================================

function getStateFilePath(userid: string): string {
  const stateDir = path.join(__dirname, '.states');
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
  return path.join(stateDir, `${userid}.json`);
}

function loadState(userid: string): GameState | null {
  const filePath = getStateFilePath(userid);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function saveState(userid: string, state: GameState): void {
  const filePath = getStateFilePath(userid);
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

function parseTileCoord(tile: string): { x: number; y: number } | null {
  const match = tile.toUpperCase().match(/^([A-Z])(\d+)$/);
  if (!match) return null;
  const y = match[1].charCodeAt(0) - 'A'.charCodeAt(0);
  const x = parseInt(match[2], 10) - 1;
  return { x, y };
}

function tileToString(x: number, y: number): string {
  return `${String.fromCharCode('A'.charCodeAt(0) + y)}${x + 1}`;
}

function parseShape(shapeStr: string): ShapeId | null {
  const normalized = shapeStr.toUpperCase().trim();
  return SHAPE_CODES[normalized] ?? null;
}

function deepCloneBoard(board: GameBoard): GameBoard {
  return board.map(row => row.map(cell => ({ ...cell })));
}

// ============================================================================
// Display Functions
// ============================================================================

function displayBoard(board: GameBoard): string {
  const height = board.length;
  const width = board[0]?.length || 0;
  
  const lines: string[] = [];
  
  // Header row
  let header = '    ';
  for (let x = 0; x < width; x++) {
    header += ` ${x + 1}  `;
  }
  lines.push(header);
  
  // Separator
  let separator = '  +';
  for (let x = 0; x < width; x++) {
    separator += '---+';
  }
  lines.push(separator);
  
  // Board rows
  for (let y = 0; y < height; y++) {
    const rowLabel = String.fromCharCode('A'.charCodeAt(0) + y);
    let rowStr = `${rowLabel} |`;
    for (let x = 0; x < width; x++) {
      const cell = board[y][x];
      const symbol = SHAPE_SYMBOLS[cell.shape];
      const locked = cell.locked ? '*' : ' ';
      rowStr += ` ${symbol}${locked}|`;
    }
    lines.push(rowStr);
    lines.push(separator);
  }
  
  lines.push('');
  lines.push('Legend: ? = Unknown (Cat), ■ = Square, ● = Circle, ▲ = Triangle');
  lines.push('        * = Locked (pre-filled, cannot change)');
  
  return lines.join('\n');
}

function describeConstraint(constraint: ConstraintDefinition, width: number, height: number): string {
  if (isCellConstraint(constraint)) {
    const tile = tileToString(constraint.x, constraint.y);
    const shapeName = ShapeNames[constraint.rule.shape];
    const op = constraint.rule.operator === 'is' ? '=' : '≠';
    return `${tile} ${op} ${shapeName}`;
  }
  
  if (isCountConstraint(constraint)) {
    const { type, index, rule } = constraint;
    const shapeName = ShapeNames[rule.shape ?? 0];
    
    let scope = '';
    if (type === 'global') {
      scope = 'ALL';
    } else if (type === 'row') {
      scope = `Row ${String.fromCharCode('A'.charCodeAt(0) + (index ?? 0))}`;
    } else if (type === 'column') {
      scope = `Col ${(index ?? 0) + 1}`;
    }
    
    let opStr = '';
    switch (rule.operator) {
      case 'exactly':
        opStr = `exactly ${rule.count}`;
        break;
      case 'at_least':
        opStr = `at least ${rule.count}`;
        break;
      case 'at_most':
        opStr = `at most ${rule.count}`;
        break;
      case 'none':
        opStr = 'no';
        break;
    }
    
    return `${scope}: ${opStr} ${shapeName}${rule.count !== 1 ? 's' : ''}`;
  }
  
  return 'Unknown constraint';
}

function displayConstraints(board: GameBoard, constraints: ConstraintDefinition[]): string {
  const height = board.length;
  const width = board[0]?.length || 0;
  
  const lines: string[] = ['CONSTRAINTS:'];
  
  let satisfied = 0;
  let violated = 0;
  let inProgress = 0;
  
  constraints.forEach((constraint, i) => {
    const state = getConstraintState(board, constraint);
    const symbol = STATE_SYMBOLS[state];
    const description = describeConstraint(constraint, width, height);
    
    if (state === 'satisfied') satisfied++;
    else if (state === 'violated') violated++;
    else inProgress++;
    
    lines.push(`  ${i + 1}. ${symbol} ${description}`);
  });
  
  lines.push('');
  lines.push(`STATUS: ${satisfied}/${constraints.length} satisfied, ${violated} violated, ${inProgress} in progress`);
  
  return lines.join('\n');
}

function displayGameState(state: GameState): string {
  const lines: string[] = [];
  
  lines.push('═'.repeat(60));
  lines.push(`PUZZLE: Level ${state.level}, Seed ${state.seed}`);
  lines.push(`GRID: ${state.board[0].length}x${state.board.length}`);
  lines.push(`MOVES: ${state.moves.length}`);
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push('BOARD:');
  lines.push(displayBoard(state.board));
  lines.push('');
  lines.push(displayConstraints(state.board, state.constraints));
  lines.push('');
  
  // Check for victory
  const allSatisfied = state.constraints.every(
    c => getConstraintState(state.board, c) === 'satisfied'
  );
  const noCats = state.board.flat().every(cell => cell.shape !== CatShape);
  
  if (allSatisfied && noCats) {
    lines.push('🎉 PUZZLE SOLVED! All constraints satisfied!');
  } else if (state.constraints.some(c => getConstraintState(state.board, c) === 'violated')) {
    lines.push('⚠️  Some constraints are violated. Use UNDO or RESET to continue.');
  }
  
  lines.push('═'.repeat(60));
  
  return lines.join('\n');
}

// ============================================================================
// Game Operations
// ============================================================================

function startPuzzle(userid: string, level: number, seed: number): void {
  const difficulty = `level${level}` as Difficulty;
  
  const puzzle = PuzzleGenerator.generate({ difficulty }, seed);
  
  const state: GameState = {
    level,
    seed,
    board: deepCloneBoard(puzzle.initialBoard),
    initialBoard: deepCloneBoard(puzzle.initialBoard),
    constraints: puzzle.constraints,
    moves: [],
    startTime: Date.now(),
  };
  
  saveState(userid, state);
  
  console.log(`\nStarted new puzzle for user: ${userid}`);
  console.log(displayGameState(state));
}

function selectTile(userid: string, tile: string, shapeStr: string): void {
  const state = loadState(userid);
  if (!state) {
    console.error(`Error: No active puzzle for user "${userid}". Use "start" first.`);
    process.exit(1);
  }
  
  const coord = parseTileCoord(tile);
  if (!coord) {
    console.error(`Error: Invalid tile "${tile}". Use format like A1, B2, etc.`);
    process.exit(1);
  }
  
  const { x, y } = coord;
  
  if (y < 0 || y >= state.board.length || x < 0 || x >= state.board[0].length) {
    console.error(`Error: Tile ${tile} is out of bounds.`);
    process.exit(1);
  }
  
  const cell = state.board[y][x];
  if (cell.locked) {
    console.error(`Error: Tile ${tile} is locked and cannot be changed.`);
    process.exit(1);
  }
  
  const shape = parseShape(shapeStr);
  if (shape === null) {
    console.error(`Error: Invalid shape "${shapeStr}". Use SQR, CIR, TRI, or CAT.`);
    process.exit(1);
  }
  
  // Record move
  const move: PuzzleMove = {
    x,
    y,
    shape,
    previousShape: cell.shape,
  };
  state.moves.push(move);
  
  // Apply move
  state.board[y][x].shape = shape;
  
  saveState(userid, state);
  
  console.log(`\nPlaced ${ShapeNames[shape]} at ${tile}`);
  console.log(displayGameState(state));
}

function undoMove(userid: string): void {
  const state = loadState(userid);
  if (!state) {
    console.error(`Error: No active puzzle for user "${userid}".`);
    process.exit(1);
  }
  
  if (state.moves.length === 0) {
    console.error('Error: No moves to undo.');
    process.exit(1);
  }
  
  const move = state.moves.pop()!;
  state.board[move.y][move.x].shape = move.previousShape;
  
  saveState(userid, state);
  
  console.log(`\nUndid move at ${tileToString(move.x, move.y)}`);
  console.log(displayGameState(state));
}

function resetPuzzle(userid: string): void {
  const state = loadState(userid);
  if (!state) {
    console.error(`Error: No active puzzle for user "${userid}".`);
    process.exit(1);
  }
  
  state.board = deepCloneBoard(state.initialBoard);
  state.moves = [];
  
  saveState(userid, state);
  
  console.log('\nPuzzle reset to initial state.');
  console.log(displayGameState(state));
}

function showStatus(userid: string): void {
  const state = loadState(userid);
  if (!state) {
    console.error(`Error: No active puzzle for user "${userid}".`);
    process.exit(1);
  }
  
  console.log(displayGameState(state));
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): { userid: string; command: string; args: Record<string, string> } {
  const args = process.argv.slice(2);
  
  let userid = 'default';
  let command = '';
  const params: Record<string, string> = {};
  
  for (const arg of args) {
    if (arg.startsWith('--userid=')) {
      userid = arg.split('=')[1];
    } else if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      params[key] = value || 'true';
    } else if (!command) {
      command = arg.toLowerCase();
    }
  }
  
  return { userid, command, args: params };
}

function printUsage(): void {
  console.log(`
Schrödinger's Shapes CLI - Agent Playtesting Interface

USAGE:
  npx ts-node cli/puzzle-cli.ts --userid=<id> <command> [options]

COMMANDS:
  start   Start a new puzzle
          --level=<1-5>  Difficulty level (required)
          --seed=<n>     Random seed (optional, default: random)
  
  select  Place a shape on a tile
          --tile=<XY>    Tile coordinate (e.g., A1, B2)
          --shape=<S>    Shape to place: SQR, CIR, TRI, or CAT
  
  undo    Undo the last move
  
  reset   Reset puzzle to initial state
  
  status  Show current puzzle state

EXAMPLES:
  npx ts-node cli/puzzle-cli.ts --userid=agent1 start --level=1 --seed=42
  npx ts-node cli/puzzle-cli.ts --userid=agent1 select --tile=A1 --shape=TRI
  npx ts-node cli/puzzle-cli.ts --userid=agent1 undo
  npx ts-node cli/puzzle-cli.ts --userid=agent1 reset
  npx ts-node cli/puzzle-cli.ts --userid=agent1 status

TILE COORDINATES:
  Rows are letters (A, B, C...), columns are numbers (1, 2, 3...)
  Example: A1 = top-left, B2 = row B, column 2

SHAPES:
  SQR (■) = Square
  CIR (●) = Circle
  TRI (▲) = Triangle
  CAT (?) = Unknown/Cat (clears the cell)
`);
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const { userid, command, args } = parseArgs();
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    return;
  }
  
  switch (command) {
    case 'start': {
      const level = parseInt(args.level, 10);
      if (isNaN(level) || level < 1 || level > 5) {
        console.error('Error: --level must be between 1 and 5');
        process.exit(1);
      }
      const seed = args.seed ? parseInt(args.seed, 10) : Math.floor(Math.random() * 0xFFFFFFFF);
      startPuzzle(userid, level, seed);
      break;
    }
    
    case 'select': {
      const tile = args.tile;
      const shape = args.shape;
      if (!tile || !shape) {
        console.error('Error: --tile and --shape are required for select');
        process.exit(1);
      }
      selectTile(userid, tile, shape);
      break;
    }
    
    case 'undo':
      undoMove(userid);
      break;
    
    case 'reset':
      resetPuzzle(userid);
      break;
    
    case 'status':
      showStatus(userid);
      break;
    
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main();

