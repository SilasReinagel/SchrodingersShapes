# Design Thinking: Puzzle Generation Overhaul

**Date:** January 14, 2026  
**Context:** Response to Playtest Tasks Report #02  
**Status:** Design Phase

---

## 1. Empathize: Understanding the Player Experience

### What Players Want from a Puzzle Game

| Need | Description | Our Current State |
|------|-------------|-------------------|
| **Challenge** | Mental effort required | ❌ Almost none |
| **Discovery** | "Aha!" moments | ❌ Missing entirely |
| **Progress** | Feeling of mastery | ❌ Flat curve |
| **Satisfaction** | Reward for thinking | ❌ No thinking required |

### The Core Emotional Journey of a Good Puzzle

```
Confusion → Analysis → Insight → Verification → Satisfaction
    ↑           ↑          ↑           ↑            ↑
   "Hmm"    "Let me     "Oh!"     "Yes,       "I did it!"
            think..."              that works"
```

**Our Current Journey:**
```
Read → Place → Done
  ↑      ↑       ↑
 "Ok"  "Ok"   "That's it?"
```

### Root Cause Analysis

The playtest revealed our puzzle generator is essentially providing an **answer key disguised as clues**. When a constraint says "A1 = Square", it's not a clue—it's an instruction.

**Good puzzle games give you tools to find the answer.**  
**We're giving you the answer and calling it a tool.**

---

## 2. Define: The Real Problem

### Problem Statement

> Our constraint generator prioritizes "informativeness" (how much a constraint reveals) when it should prioritize "deductive necessity" (how much thinking a constraint requires).

### Why This Happens (Technical Root Cause)

Looking at `algo/src/generator.c` and `app/src/game/PuzzleGenerator.ts`:

```c
// Current scoring - HIGHER = more likely to be selected
case FACT_CELL_IS:
    score = 100;  // Direct answer!
    if (fact->shape != SHAPE_CAT) score += 20;
    break;
    
case FACT_CELL_IS_NOT:
    if (fact->shape == SHAPE_CAT) {
        score = 120;  // HIGHEST priority - explains the "≠ Cat" spam
    }
    break;
```

**The scoring system rewards constraints that REVEAL the most.**  
**It should reward constraints that REQUIRE THE MOST DEDUCTION.**

### Information Theory Perspective

| Constraint Type | Information Revealed | Deduction Required |
|-----------------|---------------------|-------------------|
| `A1 = Square` | 100% (cell solved) | 0 steps |
| `A1 ≠ Cat` | 25% (1 option eliminated) | 0 steps |
| `Row A: exactly 2 Triangles` | 0% directly | 1-3 steps |
| `Row A: 2 Triangles` + `Col 1: 0 Triangles` | 0% directly | 2-4 steps |

**Insight:** The best constraints are those where the information is *latent*—only revealed through cross-referencing with other constraints.

---

## 3. Ideate: Possible Solutions

### Approach A: Scoring Inversion (Simple, Incomplete)

**Concept:** Invert the scoring to prefer indirect constraints.

```c
// Inverted scoring
case FACT_CELL_IS:
    score = 10;  // Lowest - direct answer
    break;
    
case FACT_ROW_COUNT:
case FACT_COL_COUNT:
    score = 100;  // Highest - requires cross-referencing
    break;
```

**Pros:** Simple to implement  
**Cons:** Doesn't guarantee deduction chains; may produce unsolvable-feeling puzzles

### Approach B: Deduction Depth Measurement (Complex, Complete)

**Concept:** For each constraint set, simulate solving and measure how many deduction steps are required.

```typescript
interface DeductionMetrics {
  directSolves: number;      // Cells solved by single constraint
  eliminationSolves: number; // Cells solved by eliminating options
  crossRefSolves: number;    // Cells solved by 2+ constraint intersection
  chainDepth: number;        // Longest chain of dependent deductions
}

function evaluateConstraintSet(constraints): DeductionMetrics {
  // Run a logical solver that tracks HOW it solves
  // Reject sets where directSolves > threshold
}
```

**Pros:** Guarantees puzzle quality; tunable per difficulty  
**Cons:** Computationally expensive; requires deduction-tracking solver

### Approach C: Constraint Type Quotas (Medium, Practical)

**Concept:** Enforce hard limits on constraint types per difficulty.

```typescript
const DIFFICULTY_QUOTAS = {
  level1: { maxCellIs: 2, maxCellIsNot: 2, minCounts: 1 },
  level2: { maxCellIs: 1, maxCellIsNot: 2, minCounts: 2 },
  level3: { maxCellIs: 0, maxCellIsNot: 2, minCounts: 3 },
  level4: { maxCellIs: 0, maxCellIsNot: 1, minCounts: 4 },
  level5: { maxCellIs: 0, maxCellIsNot: 0, minCounts: 5 },
};
```

**Pros:** Predictable; easy to tune; immediate improvement  
**Cons:** Doesn't measure actual deduction depth; may be too rigid

### Approach D: Hybrid (Quotas + Validation) ⭐ **RECOMMENDED**

**Concept:** Combine quotas with a simple deduction validator.

1. **Generate with quotas** - Limit direct constraints by level
2. **Validate deduction depth** - Reject puzzles that solve too easily
3. **Iterate** - Regenerate if validation fails

```typescript
function generatePuzzle(level: number): Puzzle {
  const quota = DIFFICULTY_QUOTAS[level];
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const puzzle = generateWithQuotas(quota);
    const metrics = measureDeductionDepth(puzzle);
    
    if (metrics.directSolves <= quota.maxDirectSolves &&
        metrics.minChainDepth >= quota.requiredChainDepth) {
      return puzzle;
    }
  }
  
  throw new Error('Failed to generate suitable puzzle');
}
```

---

## 4. Prototype: Technical Specification

### Phase 1: Immediate Fix (Scoring Adjustment)

**Goal:** Reduce direct assignment spam with minimal code changes.

```c
// generator.c - Modified scoring
static int score_fact(const Fact* fact, const GeneratorConfig* config, 
                      int* cell_is_count, int* cell_is_not_cat_count) {
    int score = 0;
    
    switch (fact->type) {
        case FACT_CELL_IS:
            // Heavy penalty if we already have enough direct assignments
            if (*cell_is_count >= config->max_cell_is) {
                score = -1000;  // Effectively skip
            } else {
                score = 30;  // Much lower than before
                (*cell_is_count)++;
            }
            break;
            
        case FACT_CELL_IS_NOT:
            if (fact->shape == SHAPE_CAT) {
                // Limit "is not cat" spam
                if (*cell_is_not_cat_count >= config->max_is_not_cat) {
                    score = -1000;
                } else {
                    score = 40;  // Much lower than before
                    (*cell_is_not_cat_count)++;
                }
            } else {
                score = 70;  // "is not [concrete shape]" is more interesting
            }
            break;
            
        case FACT_ROW_COUNT:
        case FACT_COL_COUNT:
            // Promote row/column constraints
            score = 100;
            // Boundary counts (0 or full) are very powerful
            if (fact->count == 0 || fact->count == config->width) {
                score += 30;
            }
            break;
            
        case FACT_GLOBAL_COUNT:
            score = 60;
            break;
    }
    
    return score;
}
```

**New config parameters:**

```c
typedef struct {
    // ... existing fields ...
    int max_cell_is;        // Max "A1 = Square" constraints
    int max_is_not_cat;     // Max "A1 ≠ Cat" constraints
    int min_count_constraints; // Min row/col/global count constraints
} GeneratorConfig;

// Level configs with quotas
static const struct {
    int max_cell_is;
    int max_is_not_cat;
    int min_count_constraints;
} LEVEL_QUOTAS[] = {
    {0, 0, 0},     // Placeholder
    {2, 2, 1},     // Level 1: Tutorial - some hand-holding
    {1, 2, 2},     // Level 2: Easy - minimal hand-holding
    {0, 1, 3},     // Level 3: Medium - no direct assignments
    {0, 0, 4},     // Level 4: Hard - pure deduction
    {0, 0, 5},     // Level 5: Expert - complex deduction
};
```

### Phase 2: Deduction Validator (New Component)

**Goal:** Measure and enforce puzzle quality.

```typescript
// app/src/game/DeductionValidator.ts

export interface DeductionMetrics {
  totalCells: number;
  directlySolvableCells: number;     // Solved by single constraint
  eliminationSolvableCells: number;  // Solved by "not A, not B, must be C"
  crossReferenceSolvableCells: number; // Solved by 2+ constraint intersection
  requiresChainDeduction: number;    // Solved by "if A then B then C"
  maxChainDepth: number;             // Longest deduction chain
}

export interface DifficultyRequirements {
  maxDirectRatio: number;      // Max % cells solvable directly
  minChainDepth: number;       // Minimum required chain depth
  minCrossReferences: number;  // Minimum cross-reference solves
}

export const DIFFICULTY_REQUIREMENTS: Record<Difficulty, DifficultyRequirements> = {
  level1: { maxDirectRatio: 0.75, minChainDepth: 1, minCrossReferences: 0 },
  level2: { maxDirectRatio: 0.50, minChainDepth: 1, minCrossReferences: 1 },
  level3: { maxDirectRatio: 0.30, minChainDepth: 2, minCrossReferences: 2 },
  level4: { maxDirectRatio: 0.15, minChainDepth: 3, minCrossReferences: 3 },
  level5: { maxDirectRatio: 0.00, minChainDepth: 4, minCrossReferences: 4 },
};

export function validatePuzzleDifficulty(
  puzzle: PuzzleDefinition,
  level: Difficulty
): { valid: boolean; metrics: DeductionMetrics; failureReason?: string } {
  const metrics = measureDeduction(puzzle);
  const requirements = DIFFICULTY_REQUIREMENTS[level];
  
  const directRatio = metrics.directlySolvableCells / metrics.totalCells;
  
  if (directRatio > requirements.maxDirectRatio) {
    return {
      valid: false,
      metrics,
      failureReason: `Direct ratio ${(directRatio * 100).toFixed(0)}% exceeds max ${(requirements.maxDirectRatio * 100).toFixed(0)}%`
    };
  }
  
  if (metrics.maxChainDepth < requirements.minChainDepth) {
    return {
      valid: false,
      metrics,
      failureReason: `Chain depth ${metrics.maxChainDepth} below minimum ${requirements.minChainDepth}`
    };
  }
  
  if (metrics.crossReferenceSolvableCells < requirements.minCrossReferences) {
    return {
      valid: false,
      metrics,
      failureReason: `Cross-references ${metrics.crossReferenceSolvableCells} below minimum ${requirements.minCrossReferences}`
    };
  }
  
  return { valid: true, metrics };
}
```

### Phase 3: "≠ Cat" Constraint Cleanup

**Option A: Filter During Generation (Recommended)**

Don't generate `is_not_cat` constraints at all—they're implied by the puzzle rules.

```c
// In extract_facts()
for (uint8_t shape = SHAPE_CAT; shape <= SHAPE_TRIANGLE; shape++) {
    if (shape != cell_shape) {
        // SKIP "is not cat" - it's implied by game rules
        if (shape == SHAPE_CAT) continue;
        
        facts[num_facts++] = (Fact){
            .type = FACT_CELL_IS_NOT,
            .shape = shape,
            .x = x,
            .y = y
        };
    }
}
```

**Option B: Collapse in Display**

Keep internally but display as single constraint:

```
Before: "A1 ≠ Cat", "B2 ≠ Cat", "C1 ≠ Cat"
After:  "These cells must have shapes: A1, B2, C1"
```

---

## 5. Test: Validation Criteria

### Success Metrics by Level

| Level | Max Direct Solves | Min Chain Depth | Target Player Rating |
|-------|------------------|-----------------|---------------------|
| 1 | 75% | 1 | "Good tutorial" |
| 2 | 50% | 1 | "Makes sense" |
| 3 | 30% | 2 | "That was tricky!" |
| 4 | 15% | 3 | "Had to think hard" |
| 5 | 0% | 4+ | "Finally got it!" |

### Testing Protocol

1. **Automated Testing**
   - Generate 100 puzzles per level
   - Measure deduction metrics
   - Assert metrics meet requirements

2. **Playtest Validation**
   - Recruiter 3 new testers (varied puzzle experience)
   - Each plays Levels 1-5
   - Rate difficulty 1-10 per level
   - Target: Monotonically increasing ratings

3. **Regression Testing**
   - Ensure unique solutions still guaranteed
   - Measure generation time (should not increase >50%)

### Test Cases

```typescript
describe('PuzzleGenerator', () => {
  describe('difficulty progression', () => {
    it('should limit direct assignments based on level', () => {
      for (const level of [1, 2, 3, 4, 5]) {
        const puzzle = PuzzleGenerator.generate({ difficulty: `level${level}` });
        const metrics = measureDeduction(puzzle);
        const maxDirect = DIFFICULTY_REQUIREMENTS[`level${level}`].maxDirectRatio;
        
        expect(metrics.directlySolvableCells / metrics.totalCells)
          .toBeLessThanOrEqual(maxDirect);
      }
    });
    
    it('should require chain deduction at higher levels', () => {
      const level5Puzzle = PuzzleGenerator.generate({ difficulty: 'level5' });
      const metrics = measureDeduction(level5Puzzle);
      
      expect(metrics.maxChainDepth).toBeGreaterThanOrEqual(4);
    });
  });
  
  describe('constraint quality', () => {
    it('should not generate excessive "≠ Cat" constraints', () => {
      const puzzle = PuzzleGenerator.generate({ difficulty: 'level3' });
      const isNotCatCount = puzzle.constraints.filter(
        c => c.type === 'cell' && c.rule.operator === 'is_not' && c.rule.shape === 'cat'
      ).length;
      
      expect(isNotCatCount).toBeLessThanOrEqual(1);
    });
    
    it('should prioritize count constraints at higher levels', () => {
      const puzzle = PuzzleGenerator.generate({ difficulty: 'level5' });
      const countConstraints = puzzle.constraints.filter(
        c => c.type === 'row' || c.type === 'column' || c.type === 'global'
      ).length;
      
      expect(countConstraints).toBeGreaterThan(puzzle.constraints.length * 0.5);
    });
  });
});
```

---

## 6. Implementation Roadmap

### Sprint 1: Critical Fixes (This Week)

| Task | Effort | Owner | Priority |
|------|--------|-------|----------|
| Modify scoring to penalize cell_is constraints | 2h | Programmer | P0 |
| Add constraint type quotas to generator config | 2h | Programmer | P0 |
| Filter out "≠ Cat" constraints | 1h | Programmer | P0 |
| Update LEVEL_CONFIGS with new quotas | 1h | Designer + Programmer | P0 |
| Manual playtest verification | 2h | Team | P0 |

**Deliverable:** Level 3+ requires actual deduction

### Sprint 2: Quality Improvements (Next Week)

| Task | Effort | Owner | Priority |
|------|--------|-------|----------|
| Implement DeductionValidator | 4h | Programmer | P1 |
| Add deduction metrics to generation loop | 2h | Programmer | P1 |
| Create automated puzzle quality tests | 2h | Programmer | P1 |
| Tune difficulty requirements | 2h | Designer | P1 |
| Second playtest session | 3h | Team | P1 |

**Deliverable:** Validated difficulty progression

### Sprint 3: Polish (Following Week)

| Task | Effort | Owner | Priority |
|------|--------|-------|----------|
| Optimize constraint display (collapse similar) | 2h | Programmer | P2 |
| Add "chain deduction" targeting for hard levels | 4h | Programmer | P2 |
| Performance optimization | 2h | Programmer | P2 |
| Final playtest validation | 3h | Team | P2 |

**Deliverable:** Ship-ready puzzle generation

---

## 7. Risk Mitigation

### Risk: Generation Takes Too Long

**Mitigation:** 
- Set MAX_ATTEMPTS per difficulty
- Fall back to slightly easier requirements if timeout
- Cache validated puzzles

### Risk: Over-Correction (Too Hard)

**Mitigation:**
- Start with conservative requirements
- Tune based on playtest feedback
- Keep Level 1-2 as genuine tutorials

### Risk: Unique Solution Not Guaranteed

**Mitigation:**
- Keep existing uniqueness solver
- Add constraints as needed for uniqueness AFTER deduction validation
- Log and monitor generation success rate

---

## 8. Summary

### The Core Insight

**Before:** Generator asks "Which constraints reveal the solution?"  
**After:** Generator asks "Which constraints require the most thinking to solve?"

### Key Changes

1. **Scoring Inversion** - Penalize direct cell assignments
2. **Type Quotas** - Hard limits per difficulty level
3. **"≠ Cat" Cleanup** - Remove obvious/redundant constraints
4. **Deduction Validation** - Measure and enforce puzzle quality

### Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Player Challenge Rating | 2/10 | 6-8/10 |
| "Aha!" Moments per Puzzle | 0 | 1-3 |
| Constraint List Length | ~20 | ~10 |
| Difficulty Variance (L1→L5) | None | Clear progression |

### Next Steps

1. **Programmer:** Implement Phase 1 scoring changes
2. **Designer:** Finalize quota tables and requirements
3. **Team:** Schedule next playtest for end of Sprint 1

---

*"A puzzle isn't a puzzle if you can read the answer. It's a puzzle when you have to think to find it."*

