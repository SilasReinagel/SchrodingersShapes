# Skill: Playtesting Schrödinger's Shapes as a Synthetic User

## Overview

This skill describes how to playtest puzzles in Schrödinger's Shapes using the CLI interface. The CLI provides a text-based interface that allows AI agents to solve puzzles through pure logical deduction without needing to interact with the visual UI.

## Game Rules

Schrödinger's Shapes is a logic puzzle game where you fill a grid with shapes (Square, Circle, or Triangle) to satisfy all given constraints. Each puzzle presents a grid of empty cells and a set of constraints that must all be satisfied simultaneously. Constraints can specify what shape must or must not appear in a specific cell, or they can specify counts—how many of a particular shape must appear in a row, column, or the entire grid. Some cells may be locked with a pre-placed shape that cannot be changed. A puzzle is solved when every cell is filled and all constraints show as satisfied.

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

## Handling Locked Cells

Locked cells are marked with `*` in the board display:
```
A | ●*| ? |
```

This means A1 is locked as Circle and cannot be changed.

## Writing Playtest Reports

After completing a playtest session, write a report to the `.playtest/` folder.

### File Naming Convention

```
.playtest/YYYY-MM-DD-<name>-<age>.md
```

**Examples:**
- `.playtest/2026-01-14-alex-18.md`
- `.playtest/2026-01-15-sam-25.md`
- `.playtest/2026-01-15-jordan-32.md`

### Report Template

Include the following sections:

```markdown
# Playtest Report
**Player:** <Name>  
**Age:** <Age>  
**Date:** <Full Date>  
**Session Duration:** <Time spent>  
**Levels Played:** <List of levels>

---

## Session Summary
| Level | Grid | Seed | Moves | Result | Difficulty Rating |
|-------|------|------|-------|--------|-------------------|
| 1 | 2x2 | 1001 | 4 | ✅ Solved | X/10 |

---

## Level X (Seed XXXX)
### Initial State
<Grid display>

### Constraints
<List of constraints>

### Solution
<Final grid>

### Notes
<Observations about this level>

---

## Player Feedback
### Positives ✅
<What worked well>

### Issues ⚠️
<Problems encountered>

---

## Recommendations
| Priority | Issue | Suggestion |
|----------|-------|------------|

---

## Ratings
| Category | Score | Notes |
|----------|-------|-------|
| Clarity | ⭐⭐⭐⭐⭐ | |
| Challenge | ⭐☆☆☆☆ | |
| Fun | ⭐⭐☆☆☆ | |
| Replayability | ⭐⭐☆☆☆ | |

**Overall:** X/20
```

### What to Report

1. **Solvability**: Could you solve the puzzle using pure logic?
2. **Constraint clarity**: Were the constraints unambiguous?
3. **Difficulty**: Was the level appropriate for its designation?
4. **Edge cases**: Any unexpected behavior?
5. **Deduction depth**: How many multi-step deductions were required?
6. **Redundancy**: Were there unnecessary or redundant constraints?
