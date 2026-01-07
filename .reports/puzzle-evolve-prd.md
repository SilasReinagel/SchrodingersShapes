# PRD: Nikoli-Style Unique Solution Puzzle Generation

## Vision

Transform Schrödinger's Shapes from "satisfy arbitrary constraints" to "discover the one stable quantum state." Every puzzle has exactly one solution. Every constraint is necessary. The Cat/superposition mechanic becomes the core deduction challenge.

---

## Problem Statement

**Current State:**
- Generator creates random solution → extracts facts → presents as constraints
- Puzzles have multiple valid solutions (often 100s)
- Constraints feel arbitrary ("there happen to be 3 squares")
- Players guess-and-check rather than deduce
- The superposition mechanic is underutilized

**Target State:**
- Every puzzle has exactly ONE solution
- Remove any constraint → multiple solutions exist (all constraints necessary)
- Players can deduce each move with certainty
- The question becomes: "Which cells MUST collapse? Which MUST remain Cats?"

---

## Core Mechanic Reframe

The Cat is not a wildcard—it's a **quantum superposition**. The puzzle asks:

> "Given these constraints, which is the ONE stable configuration where some cells remain in superposition and others collapse to definite shapes?"

This reframes gameplay from "counting shapes" to "resolving uncertainty."

---

## Requirements

### P0: Unique Solution Verification

**Solver Enhancement**
```typescript
interface SolverResult {
  solutionCount: number;      // 0, 1, or 2+ (stop counting at 2)
  solution?: GameBoard;       // The unique solution (if exactly 1)
  isUnique: boolean;          // solutionCount === 1
}
```

- Modify solver to count solutions (stop at 2 for efficiency)
- Return the solution board when unique
- Performance target: verify 4x4 puzzle uniqueness in <100ms

### P1: Constraint Necessity Verification

**For a puzzle to be valid:**
```
For each constraint C in puzzle.constraints:
  Remove C temporarily
  Solve puzzle
  Assert: solutionCount >= 2
  Restore C
```

Every constraint must be *load-bearing*. If removing one doesn't break uniqueness, the puzzle is over-constrained (boring).

### P2: Unique Solution Generator

**Algorithm: Iterative Constraint Addition**

```
function generateUniquePuzzle(config):
  board = allCatsBoard(config.width, config.height)
  constraints = [catCountConstraint(config.requiredSuperpositions)]
  
  while true:
    result = solveForUniqueness(board, constraints)
    
    if result.solutionCount === 1:
      if allConstraintsNecessary(constraints):
        return { board, constraints }
      else:
        removeUnnecessaryConstraints(constraints)
        
    if result.solutionCount === 0:
      backtrack() // Remove last constraint, try different one
      
    if result.solutionCount >= 2:
      constraint = findDiscriminatingConstraint(result.solutions)
      constraints.push(constraint)
```

**Key Insight:** Instead of describing a random solution, we *constrain toward* a unique solution by adding constraints that distinguish between multiple candidates.

### P3: Discriminating Constraint Selection

When multiple solutions exist, find a constraint that eliminates some but not all:

```typescript
function findDiscriminatingConstraint(
  solutions: GameBoard[], 
  existingConstraints: Constraint[]
): Constraint {
  // Find a fact true in SOME solutions but not ALL
  // This splits the solution space
  
  for (const fact of extractAllFacts(solutions[0])) {
    const matchCount = solutions.filter(s => factHolds(s, fact)).length;
    if (matchCount > 0 && matchCount < solutions.length) {
      return factToConstraint(fact);
    }
  }
}
```

---

## Difficulty Calibration

With unique solutions, difficulty becomes measurable:

| Metric | Definition |
|--------|------------|
| **Deduction Depth** | Max chain of "if X then Y then Z" reasoning |
| **Branch Factor** | Average choices to consider per cell |
| **Constraint Interaction** | # of constraints that must be considered simultaneously |

**Difficulty Levels:**

- **Level 1**: Single-constraint deductions ("Row 0 needs 2 circles, only 2 cells, done")
- **Level 2**: Two-constraint intersections ("This cell is in row AND column constraint")
- **Level 3**: Superposition reasoning ("This MUST stay Cat because collapsing breaks X and Y")
- **Level 4+**: Multi-step chains with backtracking

---

## Non-Goals (This PRD)

- Hint system ("what can I deduce next?")
- Puzzle rating/difficulty scoring algorithm
- Hand-crafted puzzle editor
- Puzzle sharing/import

---

## Technical Approach

### Phase 1: Solver Upgrade (Est: 4-6 hrs)
- Add `countSolutions(limit: number)` mode
- Return multiple solutions when found
- Optimize for "is unique?" query (stop at 2)

### Phase 2: Necessity Checker (Est: 2-3 hrs)
- Implement constraint removal test
- Integrate into puzzle validation

### Phase 3: Iterative Generator (Est: 6-8 hrs)
- Replace current generator with constraint-addition approach
- Implement discriminating constraint selection
- Add backtracking for dead-ends

### Phase 4: Difficulty Tuning (Est: 4-6 hrs)
- Ensure each difficulty level produces appropriate puzzles
- May need constraint type restrictions per level
- Validate solve times remain reasonable

---

## Success Criteria

1. **100% of generated puzzles have exactly 1 solution**
2. **100% of constraints are necessary** (remove any → multiple solutions)
3. **Solve time p95 < 500ms** for Level 5 puzzles
4. **Generation time p95 < 2s** per puzzle
5. **Player feedback**: "I knew my move was right" vs "I guessed"

---

## Open Questions

1. **Minimum constraints?** What's the fewest constraints needed for unique solution on each board size?

2. **Superposition as goal?** Should "exactly N cats" always be a constraint, or can it emerge from other constraints?

3. **Constraint vocabulary?** Current operators: exactly, at_least, at_most, none. Do we need more expressive constraints for interesting unique puzzles?

4. **Generation failures?** What if no unique solution exists for a constraint path? How often will we need to restart?

---

## Appendix: Example Transformation

**Current (Multiple Solutions):**
```
Constraints:
- Global: exactly 1 cat
- Global: exactly 3 squares  
- Row 0: at least 1 circle

Valid solutions: 47
Player experience: "I found A solution"
```

**Target (Unique Solution):**
```
Constraints:
- Global: exactly 1 cat
- Row 0: exactly 2 squares
- Column 1: exactly 1 circle
- Cell (0,2): not triangle

Valid solutions: 1
Player experience: "I SOLVED it"
```

The second puzzle can be deduced step-by-step. Each constraint eliminates possibilities until only one remains.

