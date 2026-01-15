# Skill: Playtesting Schrödinger's Shapes as a Synthetic User

## Overview

This skill describes how to playtest puzzles in Schrödinger's Shapes using the CLI interface. The CLI provides a text-based interface that allows AI agents to solve puzzles through pure logical deduction without needing to interact with the visual UI.

## Prerequisites

- Working directory: `app/`
- CLI available via: `bun run cli`

## CLI Commands

```bash
# Start a new puzzle
bun run cli --userid=<your-id> start --level=<1-5> --seed=<number>

# Place a shape on a tile
bun run cli --userid=<your-id> select --tile=<coord> --shape=<shape>

# Undo the last move
bun run cli --userid=<your-id> undo

# Reset puzzle to initial state
bun run cli --userid=<your-id> reset

# Show current puzzle state
bun run cli --userid=<your-id> status
```

## Coordinate System

- **Rows**: Letters A, B, C, D (top to bottom)
- **Columns**: Numbers 1, 2, 3, 4 (left to right)
- **Examples**: `A1` = top-left, `B2` = row B column 2, `C3` = row C column 3

## Shape Codes

| Code | Shape | Symbol |
|------|-------|--------|
| `SQR` | Square | ■ |
| `CIR` | Circle | ● |
| `TRI` | Triangle | ▲ |
| `CAT` | Unknown/Clear | ? |

## Constraint Status Symbols

| Symbol | Meaning |
|--------|---------|
| ✓ | Satisfied - constraint is met |
| ○ | In Progress - constraint not yet determined |
| ✗ | Violated - constraint is broken |

## Playtesting Workflow

### Step 1: Start a Puzzle

```bash
bun run cli --userid=playtest1 start --level=1 --seed=42
```

Use a unique `--userid` to avoid conflicts with other sessions.

### Step 2: Analyze the Constraints

Read the constraint list carefully. Look for:

1. **Direct cell assignments** (most constraining):
   - `A1 = Square` → Cell A1 MUST be a Square
   - `B2 = Circle` → Cell B2 MUST be a Circle

2. **Cell exclusions**:
   - `A1 ≠ Cat` → Cell A1 must have a concrete shape (not unknown)
   - `B2 ≠ Triangle` → Cell B2 can be Square or Circle, not Triangle

3. **Row/Column constraints**:
   - `Row A: exactly 2 Squares` → Row A has exactly 2 squares
   - `Col 1: exactly 0 Triangles` → Column 1 has no triangles

### Step 3: Solve Using Logical Deduction

Start with the most constrained cells:

1. **Fill direct assignments first**: Any `X = Shape` constraint tells you exactly what goes there
2. **Apply exclusions**: `X ≠ Shape` narrows possibilities
3. **Use row/column counts**: If "Row A: exactly 2 Squares" and you've placed 2, no more squares in that row

### Step 4: Place Shapes One at a Time

```bash
bun run cli --userid=playtest1 select --tile=A1 --shape=SQR
```

After each move, check:
- Did any constraints turn from ○ to ✓?
- Did any constraints turn to ✗ (violated)?
- If violated, use `undo` and try a different shape

### Step 5: Verify Solution

When all cells are filled and all constraints show ✓:
```
🎉 PUZZLE SOLVED! All constraints satisfied!
```

## Example Playtest Session

```bash
# Start Level 1 puzzle
bun run cli --userid=agent1 start --level=1 --seed=42

# Read output, identify that A1 = Square, B1 = Circle, etc.
# Place shapes based on constraints:
bun run cli --userid=agent1 select --tile=A1 --shape=SQR
bun run cli --userid=agent1 select --tile=A2 --shape=SQR
bun run cli --userid=agent1 select --tile=B1 --shape=CIR
bun run cli --userid=agent1 select --tile=B2 --shape=SQR

# Should see: 🎉 PUZZLE SOLVED!
```

## Solving Strategy

### For Cell Constraints (`X = Shape` or `X ≠ Shape`)

1. `A1 = Square` → Place Square at A1 immediately
2. `A1 ≠ Cat` → A1 needs SOME shape, but which one depends on other constraints
3. `A1 ≠ Triangle` → A1 can only be Square or Circle

### For Count Constraints (`Row/Col/All: exactly N Shape`)

1. `Row A: exactly 0 Triangles` → No triangles anywhere in row A
2. `Col 1: exactly 2 Circles` → Column 1 must have exactly 2 circles
3. `All: exactly 3 Squares` → The entire grid has exactly 3 squares

### Deduction Example

Given constraints:
- `A1 = Square`
- `A2 ≠ Square`
- `Row A: exactly 1 Square`

Deduction:
1. A1 must be Square (from constraint 1)
2. A2 cannot be Square (from constraint 2)
3. Row A has exactly 1 Square, and A1 is it (constraint 3 is satisfied)
4. Therefore A2 must be Circle or Triangle

## Handling Locked Cells

Locked cells are marked with `*` in the board display:
```
A | ●*| ? |
```

This means A1 is locked as Circle and cannot be changed. Use locked cells as given information when solving.

## Reporting Issues

When playtesting, note:

1. **Solvability**: Could you solve the puzzle using pure logic?
2. **Constraint clarity**: Were the constraints unambiguous?
3. **Difficulty**: Was the level appropriate for its designation?
4. **Edge cases**: Any unexpected behavior?

## Tips for AI Agents

1. **Parse constraints systematically** - Extract all direct assignments first
2. **Track possibilities** - For each cell, maintain a set of possible shapes
3. **Apply elimination** - When a constraint eliminates a possibility, propagate
4. **Verify incrementally** - Check constraint status after each move
5. **Use undo liberally** - If stuck, backtrack and try alternatives

