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

## PM Reflection: What We Ought to Solve

### Problem Prioritization

**Critical Path Issues (Must Solve First):**

1. **Constraint Format Mismatch** ⚠️ HIGH RISK
   - The document defines a text format, but we need to verify the actual puzzle generator outputs constraints that match this syntax
   - **Action Required**: Audit `algo/src/generator.c` to map actual constraint types to the proposed text format
   - **Risk**: If generator produces constraints not covered by the format, agents will fail to parse puzzles

2. **Validation Logic Gap** ⚠️ HIGH RISK
   - The validation format is specified, but no validation engine exists yet
   - **Action Required**: Build constraint validator that can evaluate all operator types (`=`, `!=`, `HAS`, `NONE`, `COUNT=N`, `COUNT>=N`)
   - **Risk**: Without validation, we can't verify agent solutions or catch generator bugs

3. **Pre-filled Cells (GIVEN) Support** ⚠️ MEDIUM RISK
   - Example 2 shows `B2 = CIR` as a pre-filled cell, but unclear if generator supports this
   - **Action Required**: Verify if generator creates puzzles with pre-filled cells, or if this is a future feature
   - **Risk**: Format mismatch if we document features that don't exist

**Implementation Gaps:**

4. **Missing Constraint Coverage**
   - Document lists 6 operators, but generator may use more/different constraint types
   - **Action Required**: Complete constraint type inventory from generator source code
   - **Risk**: Incomplete format specification leads to parsing failures

5. **No Error Handling Spec**
   - What happens when agent submits invalid solution format? Malformed coordinates? Unknown shapes?
   - **Action Required**: Define error response format for validation failures
   - **Risk**: Poor developer experience, unclear debugging path

6. **Solution Format Ambiguity**
   - Format shows `A1=TRI,A2=SQR` but no delimiter specification (comma? space? newline?)
   - **Action Required**: Standardize solution parsing format with clear delimiter rules
   - **Risk**: Parsing errors due to format ambiguity

**Strategic Concerns:**

7. **Dual Implementation Path**
   - Recommended approach suggests Browser Console API first, then CLI
   - **Question**: Do we need both? What's the actual use case?
   - **Action Required**: Validate that browser console API is sufficient for agent testing
   - **Risk**: Over-engineering if CLI isn't needed

8. **Testing Strategy Missing**
   - Document mentions "batch testing" but no test corpus or validation strategy
   - **Action Required**: Define test puzzle set (known solvable/unsolvable puzzles) for regression testing
   - **Risk**: Can't verify generator quality or catch regressions

9. **Difficulty Calibration Unclear**
   - Document mentions measuring "solve time/complexity programmatically" but no metrics defined
   - **Action Required**: Define difficulty metrics (constraint count? constraint types? grid size?)
   - **Risk**: Can't validate difficulty progression across levels

**Dependencies & Blockers:**

10. **Generator Documentation Gap**
    - Need to understand what constraint types generator actually produces
    - **Blocker**: Can't finalize text format without generator audit
    - **Action Required**: Map generator constraint types → text format operators

11. **Game State Access**
    - Browser Console API requires exposing game state, but unclear if current architecture supports this
    - **Blocker**: May need refactoring to expose puzzle state cleanly
    - **Action Required**: Audit `GameContext.tsx` and puzzle state management

12. **Validation Engine Architecture**
    - Need to decide: reuse existing game validation logic or build separate validator?
    - **Blocker**: Duplication risk if we build separate validator
    - **Action Required**: Evaluate existing constraint checking code in game components

### Recommended Solution Order

**Phase 1: Foundation (Week 1)**
1. ✅ Audit generator constraint types → map to text format
2. ✅ Build constraint validator (reuse game logic if possible)
3. ✅ Implement Browser Console API (`window.SchrodingersPuzzle.describe()`)
4. ✅ Test with 5-10 known puzzles to validate format

**Phase 2: Validation & Testing (Week 2)**
5. ✅ Create test puzzle corpus (20+ puzzles across all levels)
6. ✅ Add error handling and malformed input handling
7. ✅ Document solution format with clear delimiter rules
8. ✅ Validate generator produces solvable puzzles

**Phase 3: Scale & Polish (Week 3)**
9. ✅ Add CLI tool if browser API proves insufficient
10. ✅ Build difficulty metrics/calibration system
11. ✅ Create batch testing infrastructure
12. ✅ Document full API surface

### Key Questions to Answer

- [ ] Does the generator support all constraint types in the format spec?
- [ ] Can we reuse existing game validation logic, or need separate validator?
- [ ] Is browser console API sufficient, or do we need CLI for batch testing?
- [ ] What's the actual use case: agent testing, puzzle validation, or both?
- [ ] How do we measure puzzle difficulty programmatically?
- [ ] What happens when generator produces unsolvable puzzles?

### Success Metrics

- **Format Completeness**: 100% of generator constraint types mapped to text format
- **Validation Accuracy**: Validator correctly identifies all constraint violations
- **Agent Usability**: Agent can solve puzzles using text format without UI interaction
- **Test Coverage**: Test corpus covers all levels and constraint types
- **Performance**: Text-based validation completes in <10ms per puzzle

---

## Implementation Status

### ✅ CLI Tool (Completed)

A fully functional CLI tool has been implemented at `app/cli/puzzle-cli.ts`.

#### Usage

```bash
# From the app directory
cd app

# Start a new puzzle
bun run cli --userid=agent1 start --level=1 --seed=42

# Place a shape
bun run cli --userid=agent1 select --tile=A1 --shape=SQR

# Undo last move
bun run cli --userid=agent1 undo

# Reset to initial state
bun run cli --userid=agent1 reset

# Show current state
bun run cli --userid=agent1 status
```

#### Output Format

```
════════════════════════════════════════════════════════════
PUZZLE: Level 1, Seed 42
GRID: 2x2
MOVES: 0
════════════════════════════════════════════════════════════

BOARD:
     1   2  
  +---+---+
A | ? | ? |
  +---+---+
B | ? | ? |
  +---+---+

Legend: ? = Unknown (Cat), ■ = Square, ● = Circle, ▲ = Triangle
        * = Locked (pre-filled, cannot change)

CONSTRAINTS:
  1. ✓ A1 = Square
  2. ○ B1 ≠ Cat
  3. ○ A1 ≠ Cat
  4. ✓ B1 = Circle
  ...

STATUS: 6/10 satisfied, 0 violated, 4 in progress

════════════════════════════════════════════════════════════
```

#### State Persistence

Each `--userid` stores its game state in a separate JSON file at `app/cli/.states/<userid>.json`. This allows multiple agents to play simultaneously without conflicts.

---

## Next Steps

1. [ ] Implement `window.SchrodingersPuzzle.describe()` browser API
2. [ ] Add text export to existing puzzle generator
3. [x] ~~Create CLI wrapper for puzzle binary~~ (Implemented as TypeScript CLI)
4. [ ] Build test suite with known-solvable puzzles
5. [ ] Document constraint types used by generator

