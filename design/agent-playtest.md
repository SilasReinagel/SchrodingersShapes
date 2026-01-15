# AI Agent Playtesting Interface Design

## Problem Statement

During UI-based playtesting, AI agents face several challenges:
1. **Animation interference** - Animated elements cause click reliability issues
2. **Constraint readability** - Small grid icons are hard to interpret visually
3. **Slow iteration** - Each interaction requires browser commands and screenshots
4. **Screenshot interpretation** - Visual elements must be parsed from images

A text-based puzzle representation would enable:
- Pure logical reasoning about puzzles
- Fast validation of puzzle solvability
- Batch testing of many puzzles
- Clear, unambiguous constraint specifications

---

## Proposed Text Format

### Grid Representation

Use a coordinate system where rows are letters (A, B, C...) and columns are numbers (1, 2, 3...):

```
Level 1 (2x2):
    1   2
  +---+---+
A | ? | ? |
  +---+---+
B | ? | ? |
  +---+---+
```

```
Level 3 (3x3):
    1   2   3
  +---+---+---+
A | ? | ? | ? |
  +---+---+---+
B | ? | ? | ? |
  +---+---+---+
C | ? | ? | ? |
  +---+---+---+
```

### Shape Symbols

| Shape | Symbol | Alt Symbol |
|-------|--------|------------|
| Unknown (Cat) | `?` | `CAT` |
| Square | `■` | `SQR` |
| Circle | `●` | `CIR` |
| Triangle | `▲` | `TRI` |

### Constraint Syntax

Each constraint follows this pattern:
```
<scope> <operator> <shape>
```

#### Scope Types

| Scope | Meaning | Example |
|-------|---------|---------|
| `A1` | Single cell | Cell at row A, column 1 |
| `A*` | Entire row A | All cells in row A |
| `*1` | Entire column 1 | All cells in column 1 |
| `A1,B2` | Specific cells | Listed cells only |
| `ALL` | Entire grid | Every cell |

#### Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Must be exactly | `A1 = TRI` (A1 must be triangle) |
| `!=` | Must not be | `A* != CIR` (row A has no circles) |
| `HAS` | At least one | `A* HAS SQR` (row A contains at least one square) |
| `NONE` | Zero of | `*1 NONE TRI` (column 1 has no triangles) |
| `COUNT=N` | Exactly N of | `ALL COUNT=2 CIR` (exactly 2 circles total) |
| `COUNT>=N` | At least N of | `B* COUNT>=1 SQR` (row B has at least 1 square) |

---

## Example Puzzles

### Example 1: Simple Level 1

```
PUZZLE: Level 1, Seed 42
GRID: 2x2
SHAPES: SQR, CIR, TRI

    1   2
  +---+---+
A | ? | ? |
  +---+---+
B | ? | ? |
  +---+---+

CONSTRAINTS:
1. A1 = TRI
2. B2 = SQR
3. A* != CIR
4. B1 != CAT
5. A2 != CAT

SOLUTION FORMAT:
A1=<shape>, A2=<shape>, B1=<shape>, B2=<shape>
```

**Example Solution:**
```
SOLUTION: A1=TRI, A2=SQR, B1=CIR, B2=SQR
```

### Example 2: Level 3 Puzzle

```
PUZZLE: Level 3, Seed 108
GRID: 3x3
SHAPES: SQR, CIR, TRI

    1   2   3
  +---+---+---+
A | ? | ? | ? |
  +---+---+---+
B | ? | 2 | ? |
  +---+---+---+
C | ? | ? | ? |
  +---+---+---+

GIVEN: B2 = CIR (pre-filled, cannot change)

CONSTRAINTS:
1. A1 != CAT
2. A3 = TRI
3. A* != CIR
4. B* COUNT=1 CIR
5. C1 = SQR
6. C3 != TRI
7. *1 HAS TRI
8. *3 NONE SQR
9. ALL COUNT>=2 TRI

SOLUTION FORMAT:
A1=<shape>, A2=<shape>, A3=<shape>, B1=<shape>, B3=<shape>, C1=<shape>, C2=<shape>, C3=<shape>
```

---

## Validation Response Format

After submitting a solution, return validation results:

```
VALIDATION RESULT:
==================
Grid State:
    1   2   3
  +---+---+---+
A | ▲ | ■ | ▲ |
  +---+---+---+
B | ■ | ● | ▲ |
  +---+---+---+
C | ■ | ● | ● |
  +---+---+---+

Constraint Results:
1. A1 != CAT        ✓ PASS (A1=TRI, TRI != CAT)
2. A3 = TRI         ✓ PASS (A3=TRI)
3. A* != CIR        ✓ PASS (Row A: TRI, SQR, TRI - no circles)
4. B* COUNT=1 CIR   ✓ PASS (Row B has 1 circle: B2)
5. C1 = SQR         ✓ PASS (C1=SQR)
6. C3 != TRI        ✓ PASS (C3=CIR, CIR != TRI)
7. *1 HAS TRI       ✓ PASS (Column 1: TRI, SQR, SQR - has triangle)
8. *3 NONE SQR      ✓ PASS (Column 3: TRI, TRI, CIR - no squares)
9. ALL COUNT>=2 TRI ✓ PASS (Grid has 3 triangles)

RESULT: ✓ PUZZLE SOLVED! (9/9 constraints satisfied)
```

Or for failures:

```
VALIDATION RESULT:
==================
Constraint Results:
1. A1 != CAT        ✓ PASS
2. A3 = TRI         ✗ FAIL (A3=SQR, expected TRI)
3. A* != CIR        ✓ PASS
...

RESULT: ✗ PUZZLE FAILED (7/9 constraints satisfied)
Failed constraints: 2, 5
```

---

## Implementation Options

### Option A: CLI Tool

Create a command-line tool that agents can invoke:

```bash
# Generate a puzzle
./puzzle generate --level 2 --seed 42 --format text

# Validate a solution
./puzzle validate --level 2 --seed 42 --solution "A1=TRI,A2=SQR,..."

# Interactive solve mode
./puzzle solve --level 2 --seed 42
```

### Option B: HTTP API Endpoint

Add an API endpoint to the dev server:

```
GET /api/puzzle?level=2&seed=42
POST /api/puzzle/validate
  Body: { level: 2, seed: 42, solution: { A1: "TRI", A2: "SQR", ... } }
```

### Option C: In-Browser Console API

Expose functions on `window` for browser console access:

```javascript
// In browser console
window.SchrodingersPuzzle.describe()  // Print current puzzle in text format
window.SchrodingersPuzzle.solve({ A1: 'TRI', A2: 'SQR', ... })
window.SchrodingersPuzzle.validate()  // Check current grid state
```

### Option D: File-Based Testing

Read puzzles from files and output results:

```
puzzles/
  level1_seed42.txt    # Input puzzle
  level1_seed42.solution.txt  # Agent writes solution here
  level1_seed42.result.txt    # Validation output
```

---

## Recommended Approach

**Start with Option C (Browser Console API)** because:
1. No additional infrastructure needed
2. Works alongside existing UI for verification
3. Easy to implement - just expose existing game state
4. Agent can still take screenshots to visually verify

Then add **Option A (CLI Tool)** for:
1. Batch testing hundreds of puzzles
2. CI/CD integration
3. Puzzle generation validation

---

## Agent Workflow Example

```
AGENT PROMPT:
=============
Solve this Schrödinger's Shapes puzzle using logical deduction.

PUZZLE: Level 1, Seed 2
GRID: 2x2
SHAPES: SQR (■), CIR (●), TRI (▲)

    1   2
  +---+---+
A | ? | ? |
  +---+---+
B | ? | ? |
  +---+---+

CONSTRAINTS:
1. A1 != CAT     (A1 must have a shape)
2. B* != CIR     (Row B has no circles)
3. A2 != CAT     (A2 must have a shape)
4. B1 != CAT     (B1 must have a shape)
5. B2 != CAT     (B2 must have a shape)
6. A1 = TRI      (A1 must be triangle)
7. B2 = SQR      (B2 must be square)
8. *2 NONE CIR   (Column 2 has no circles)
9. B1 = TRI      (B1 must be triangle)
10. A* NONE CAT  (Row A all filled)

Provide your solution in the format: A1=X, A2=X, B1=X, B2=X

AGENT RESPONSE:
===============
Let me solve this step by step:

1. From constraint 6: A1 = TRI ▲
2. From constraint 7: B2 = SQR ■
3. From constraint 9: B1 = TRI ▲
4. For A2: 
   - Must not be CAT (constraint 3)
   - Column 2 has no circles (constraint 8)
   - So A2 must be SQR or TRI
   - No other constraints limit A2, so either works
   - I'll choose A2 = SQR ■

SOLUTION: A1=TRI, A2=SQR, B1=TRI, B2=SQR

Final grid:
    1   2
  +---+---+
A | ▲ | ■ |
  +---+---+
B | ▲ | ■ |
  +---+---+
```

---

## Benefits of Text-Based Playtesting

1. **Unambiguous constraints** - No visual interpretation needed
2. **Fast iteration** - Test puzzles in milliseconds, not minutes
3. **Logical verification** - Agent can explain reasoning step-by-step
4. **Batch testing** - Validate hundreds of puzzle seeds automatically
5. **Difficulty calibration** - Measure solve time/complexity programmatically
6. **Regression testing** - Ensure puzzle generator produces solvable puzzles
7. **Documentation** - Text format serves as puzzle specification

---

## Next Steps

1. [ ] Implement `window.SchrodingersPuzzle.describe()` browser API
2. [ ] Add text export to existing puzzle generator
3. [ ] Create CLI wrapper for puzzle binary
4. [ ] Build test suite with known-solvable puzzles
5. [ ] Document constraint types used by generator

