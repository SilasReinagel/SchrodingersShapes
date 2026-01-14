# Puzzle Winnability Analysis

## Executive Summary

The puzzle generation system currently produces a significant percentage of unsolvable puzzles:
- **Level1**: 86% solvable (14% unsolvable)
- **Level2**: 84% solvable (16% unsolvable)
- **Level3**: 32% solvable (68% unsolvable!)

This report analyzes the root causes of unsolvable puzzle generation and proposes solution architectures.

---

## The Core Mechanics

Before analyzing the problems, let's understand the key mechanics:

### The Superposition Rule (CatShape)
The "Cat" shape is a superposition state that **counts as ALL shapes simultaneously** when evaluating constraints:

```typescript
// From utils.ts - Cat counts toward any shape
if (shape === undefined || cell.shape === shape || cell.shape === CatShape) {
  count++;
}
```

This means:
- A cell with Cat satisfies "at least 1 circle" AND "at least 1 square" AND "at least 1 triangle"
- But it also means "exactly 2 circles" counts Cats as circles

### Constraint Types
- **Global**: Count shapes across entire board
- **Row**: Count shapes in a specific row
- **Column**: Count shapes in a specific column

### Operators
- `exactly`: Must have exactly N
- `at_least`: Must have ≥ N
- `at_most`: Must have ≤ N
- `none`: Must have 0

---

## Causes of Unsolvable Puzzles

### 1. **Conflicting Global Exact Constraints**

The most common cause. When multiple `exactly` constraints are applied globally, they can be mathematically impossible.

**Example (3x3 board, 9 cells):**
```
Global: Exactly 5 circles
Global: Exactly 5 squares
Global: Exactly 2 cats (superpositions)
```

**Why it fails**: 
- 2 cats count as both circles AND squares
- Non-cat cells can only be ONE shape
- 5 circles + 5 squares = 10 shape requirements
- But only 9 cells - 2 cats = 7 non-cat cells
- 2 cats contribute to both counts, so: 2 + 7 ≥ 5 for circles, but same 7 cells must also satisfy squares
- If 5 circles needed and 2 are cats, need 3 more circle cells
- If 5 squares needed and 2 are cats, need 3 more square cells
- But 3 + 3 = 6 cells needed for specific shapes, leaving only 1 cell for triangles
- Total constraint may be impossible depending on other factors

### 2. **Row/Column Constraints Conflicting with Global**

**Example (2x2 board):**
```
Global: Exactly 2 circles
Row 0: None circles
Row 1: None circles
```

**Why it fails**: Can't have 2 circles if both rows forbid circles.

### 3. **The Cat Counting Paradox**

Since Cats count toward ALL shape counts simultaneously, they can cause conflicts:

**Example (2x2 board, 4 cells):**
```
Global: Exactly 1 cat (superposition)
Global: Exactly 2 circles
Global: Exactly 2 squares
```

**Why it fails**:
- 1 cell must be Cat (counts as circle AND square)
- Need 2 circles total: 1 cat + 1 circle cell = 2 ✓
- Need 2 squares total: 1 cat + 1 square cell = 2 ✓
- But that requires: 1 cat + 1 circle + 1 square = 3 cells
- Only 1 cell remains - must be triangle (or another shape)
- This works! But change to "Exactly 3 circles" and it breaks.

### 4. **Over-Constrained Small Boards**

Level1 uses a 2x2 (4 cells) board with 3 constraints. Level3 uses 3x3 (9 cells) with 5 constraints. The constraint density increases non-linearly with board size.

**Constraint Space Analysis:**
| Level | Cells | Constraints | Constraints/Cell |
|-------|-------|-------------|------------------|
| 1     | 4     | 3           | 0.75             |
| 2     | 6     | 4           | 0.67             |
| 3     | 9     | 5           | 0.56             |

But the *freedom* decreases because each constraint affects more potential interactions.

### 5. **`none` Operator Conflicts**

**Example:**
```
Row 0: None circles
Column 0: At least 1 circle in column 0
```

If cell (0,0) is in both row 0 and column 0, the circle for column 0 can't be at (0,0). Need another cell in column 0 that's not in row 0.

### 6. **Mathematical Impossibility from `at_most` + `at_least` on Same Shape**

**Example (row with 3 cells):**
```
Row 0: At most 1 circle
Global: At least 3 circles
```

With limited rows, this can be impossible to satisfy.

### 7. **Implicit Constraint Interactions**

The generator creates constraints independently without checking their combined satisfiability:

```typescript
// From PuzzleGenerator.ts - No cross-constraint validation
while (constraints.length < numConstraints) {
  const constraint = this.generateRandomConstraint(width, height, rng);
  if (this.isValidConstraint(constraint, constraints)) {
    constraints.push(constraint);
  }
}
```

The `isValidConstraint` only checks for duplicates, not logical satisfiability.

---

## Solution Classes

### Class 1: Generate-and-Test (Rejection Sampling)

**Approach**: Generate puzzles, verify solvability with solver, discard unsolvable ones.

```typescript
function generateSolvablePuzzle(config: PuzzleConfig, maxAttempts = 100): PuzzleDefinition | null {
  for (let i = 0; i < maxAttempts; i++) {
    const puzzle = PuzzleGenerator.generate(config);
    const solver = new PuzzleSolver(puzzle);
    const result = solver.solve();
    if (result.isSolvable) {
      return puzzle;
    }
  }
  return null; // Failed to generate solvable puzzle
}
```

**Pros:**
- Simple to implement
- Works with existing architecture
- No changes to constraint generation logic

**Cons:**
- Wasteful (generates many discarded puzzles)
- Performance degrades as solvability rate drops
- Level3 at 32% solvable means ~3 attempts per puzzle on average
- Higher levels could be worse

**Best for**: Quick fix, prototyping

---

### Class 2: Constraint Validation During Generation

**Approach**: Check constraint compatibility before adding new constraints.

```typescript
function isConstraintCompatible(
  newConstraint: ConstraintDefinition,
  existingConstraints: ConstraintDefinition[],
  boardSize: { width: number; height: number }
): boolean {
  // Check for direct conflicts
  // e.g., global "exactly 5 circles" + global "exactly 5 squares" on 4-cell board
  
  // Check row/column interactions with globals
  
  // Estimate remaining degrees of freedom
}
```

**Implementation Strategies:**

#### 2a. Sum Validation
Ensure `exactly` constraints don't exceed cell counts:
```typescript
const totalExactCounts = constraints
  .filter(c => c.rule.operator === 'exactly' && c.type === 'global')
  .reduce((sum, c) => sum + c.rule.count, 0);

// Account for cats counting multiple times
const catCount = constraints.find(c => 
  c.rule.shape === CatShape && c.rule.operator === 'exactly'
)?.rule.count ?? 0;

// Simplified validation
if (totalExactCounts - catCount * (shapes.length - 1) > totalCells) {
  return false; // Impossible
}
```

#### 2b. Constraint Graph Analysis
Model constraints as a graph and detect cycles/conflicts.

**Pros:**
- Prevents obviously impossible combinations
- Better than pure rejection

**Cons:**
- Complex to implement fully
- May still miss subtle conflicts
- NP-complete in general case (constraint satisfaction)

**Best for**: Reducing rejection rate, not eliminating it

---

### Class 3: Reverse Engineering (Solution-First)

**Approach**: Start with a valid solution state, then derive constraints that it satisfies.

```typescript
function generateFromSolution(config: PuzzleConfig): PuzzleDefinition {
  // 1. Generate a random valid board state
  const solution = generateRandomSolution(config);
  
  // 2. Analyze the solution to extract true facts
  const facts = extractFacts(solution);
  // e.g., "Row 0 has exactly 2 circles", "Global has 3 squares"
  
  // 3. Select a subset of facts as constraints
  const constraints = selectConstraints(facts, config);
  
  // 4. Create puzzle with all-cats initial state
  return {
    initialBoard: createCatBoard(config.width, config.height),
    constraints
  };
}
```

**Pros:**
- **Guaranteed solvable** (by construction)
- No rejection/retry needed
- Efficient generation

**Cons:**
- May generate "trivial" puzzles
- Need to ensure constraints are interesting/challenging
- Solution uniqueness not guaranteed (may have multiple solutions)

**Best for**: Production systems requiring 100% solvability

---

### Class 4: SAT/SMT Solver Integration

**Approach**: Model puzzle constraints as a SAT (Boolean Satisfiability) or SMT (Satisfiability Modulo Theories) problem and use a solver.

```typescript
function isSatisfiable(constraints: ConstraintDefinition[], board: BoardConfig): boolean {
  // Encode as SAT formula
  const formula = encodeAsSAT(constraints, board);
  
  // Use SAT solver (e.g., MiniSat, Z3)
  return satSolver.solve(formula);
}
```

**Encoding Example:**
- Variable `x_i_j_s` = true if cell (i,j) has shape s
- Clause: "exactly one shape per cell"
- Clause: constraint translations

**Pros:**
- Mathematically rigorous
- Can check satisfiability before presenting puzzle
- Can be used to verify solution uniqueness

**Cons:**
- Requires SAT solver library (size/complexity)
- Overkill for small puzzles
- Browser compatibility concerns

**Best for**: Complex constraint systems, verification

---

### Class 5: Iterative Relaxation

**Approach**: Generate constraints, test solvability, relax constraints until solvable.

```typescript
function generateWithRelaxation(config: PuzzleConfig): PuzzleDefinition {
  let puzzle = PuzzleGenerator.generate(config);
  
  while (!isSolvable(puzzle)) {
    puzzle = relaxConstraints(puzzle);
  }
  
  return puzzle;
}

function relaxConstraints(puzzle: PuzzleDefinition): PuzzleDefinition {
  // Options:
  // 1. Remove a random constraint
  // 2. Change "exactly" to "at_least" or "at_most"
  // 3. Reduce count values
  // 4. Remove row/column specificity (make global)
}
```

**Pros:**
- Always produces solvable puzzle
- Maintains difficulty better than pure rejection

**Cons:**
- May produce inconsistent difficulty
- Relaxation choices affect puzzle quality
- Still requires solver calls

**Best for**: Balancing solvability with constraint diversity

---

### Class 6: Constraint Templates

**Approach**: Pre-define known-good constraint patterns.

```typescript
const LEVEL1_TEMPLATES = [
  {
    constraints: [
      { type: 'global', rule: { shape: CatShape, count: 1, operator: 'exactly' }},
      { type: 'global', rule: { shape: SquareShape, count: 2, operator: 'exactly' }},
      { type: 'row', index: 0, rule: { shape: CircleShape, count: 1, operator: 'at_least' }}
    ]
  },
  // ... more templates
];

function generateFromTemplate(config: PuzzleConfig): PuzzleDefinition {
  const template = pickTemplate(config.difficulty);
  return instantiateTemplate(template, config);
}
```

**Pros:**
- 100% solvable (if templates verified)
- Predictable difficulty
- Fast generation

**Cons:**
- Limited variety
- Requires manual template creation
- Scaling to higher difficulties is labor-intensive

**Best for**: Curated puzzle experiences

---

## Recommended Approach

### Hybrid Strategy (Recommended)

Combine **Class 3 (Solution-First)** with **Class 1 (Generate-and-Test)** validation:

```typescript
function generateSolvablePuzzle(config: PuzzleConfig): PuzzleDefinition {
  // Primary: Solution-first approach
  for (let attempt = 0; attempt < 10; attempt++) {
    const puzzle = generateFromSolution(config);
    const solver = new PuzzleSolver(puzzle);
    const result = solver.solve();
    
    // Verify it has EXACTLY one solution (or acceptable range)
    if (result.isSolvable && result.correctSolutions <= 3) {
      return puzzle;
    }
  }
  
  // Fallback: Traditional with rejection
  return generateWithRejection(config, 100);
}
```

### Implementation Priority

1. **Immediate (Quick Win)**: Add Generate-and-Test wrapper around existing generator
2. **Short-term**: Implement Solution-First generation for guaranteed solvability
3. **Medium-term**: Add constraint validation to reduce rejection rate
4. **Long-term**: Consider SAT solver for complex verification (if needed)

---

## Appendix: Specific Bug Analysis

### Level3 Solvability Drop (32%)

Level3 has the sharpest drop because:

1. **3x3 board with 2 required superpositions**
2. **5 constraints** including complementary global constraints
3. **Code path for level2/level3** adds TWO global exact constraints:

```typescript
// PuzzleGenerator.ts lines 81-109
constraints.push({
  type: 'global',
  rule: { shape: shape1, count: count1, operator: 'exactly' }
});

constraints.push({
  type: 'global',
  rule: { shape: shape2, count: count2, operator: 'exactly' }
});
```

With `requiredSuperpositions: 2` and two `exactly` constraints on different shapes, plus the always-present cat constraint, conflicts are common.

### Potential Quick Fix for Level3

Change one global constraint from `exactly` to `at_least`:

```typescript
constraints.push({
  type: 'global',
  rule: {
    shape: shape2,
    count: count2,
    operator: 'at_least'  // Changed from 'exactly'
  }
});
```

This provides more flexibility while maintaining puzzle challenge.

---

## Conclusion

The unsolvable puzzle problem stems from **random constraint generation without satisfiability verification**. The constraints interact in complex ways, especially with the superposition mechanic where Cats count as all shapes.

The recommended path forward is:
1. **Immediate**: Wrap generation in a retry loop (quick fix)
2. **Proper solution**: Implement solution-first generation
3. **Quality assurance**: Add solver verification to ensure puzzles have acceptable solution counts


