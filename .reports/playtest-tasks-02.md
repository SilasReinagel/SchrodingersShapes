# Playtest Tasks Report #02
**Date:** January 14, 2026  
**Source:** Playtest Report - Alex (Age 18)  
**Status:** Action Required

---

## PM Reflection: What We Must Solve

### Critical Assessment

**The Bottom Line:** We have a **puzzle generation failure** that produces trivial puzzles disguised as logic games. Players are given solutions directly rather than puzzles to solve. This is not a tuning issue—it's a fundamental flaw in constraint generation that will cause immediate player boredom.

**Player Quote:**
> "Most constraints are direct assignments ('A1 = Square'). This removes the puzzle element entirely - I'm just following instructions rather than solving anything."

### The Good News

Alex rated our **Clarity 5/5 stars**. The UI, feedback systems, and visual design are working excellently:
- ✅ Grid display is easy to read
- ✅ Real-time constraint checkmarks
- ✅ Progress counter ("X/Y satisfied")
- ✅ Locked cell indicators
- ✅ Symbol legend

**We don't need to change the UI. We need to fix what's inside it.**

---

## Issue Severity Matrix

| Issue | Severity | Impact | Owner | Priority | Status |
|-------|----------|--------|-------|----------|--------|
| **Direct assignment overload** | 🔴 Critical | Removes puzzle entirely | Programmer | **P0 - Must Fix** | Blocking |
| **No difficulty progression** | 🔴 Critical | Kills replayability | Designer + Programmer | **P0 - Must Fix** | Blocking |
| **Missing deduction chains** | 🟠 High | No "aha!" moments | Designer | **P1 - Should Fix** | Core experience |
| **Redundant "≠ Cat" spam** | 🟡 Medium | Visual clutter | Programmer | **P2 - Should Fix** | Polish |
| **Count constraints underused** | 🟡 Medium | Lost puzzle depth | Designer | **P2 - Should Fix** | Enhancement |

---

## What We MUST Solve (P0 - Ship Blockers)

### 1. **Direct Assignment Overload** ⚠️ **BLOCKING RELEASE**

**The Problem:**
- 80%+ of constraints are direct "Cell = Shape" assignments
- Players read constraints → place shapes → done
- No logical deduction required

**Evidence from Playtest:**
| Level | Grid Size | Direct Assignments | Cells Requiring Deduction |
|-------|-----------|-------------------|---------------------------|
| 1 | 2×2 (4 cells) | 3/4 cells | 1 cell |
| 2 | 2×3 (6 cells) | 5/6 cells | 1 cell |
| 3 | 3×3 (9 cells) | 8/9 cells | 1 cell |

**Why This Matters:**
- 🎯 **Core game loop broken** - Not a puzzle, just data entry
- 😴 **Zero engagement** - Mentally equivalent to copy-typing
- 🚪 **Immediate churn** - "Why play a puzzle with no puzzle?"

**Required Fix (Programmer):**
```
Current: Generate constraint → if it directly solves a cell, keep it
Needed:  Generate constraint → if it directly solves a cell, DISCARD it
```

**Success Criteria:**
- ≤20% of cells solvable via direct assignment
- Remaining cells require cross-referencing 2+ constraints

---

### 2. **No Difficulty Progression** ⚠️ **BLOCKING RELEASE**

**The Problem:**
- Level 3 (3×3) felt identical to Level 1 (2×2) in difficulty
- Grid size increases, but logical complexity doesn't
- Player rated all 3 levels between 2-3/10 difficulty

**Why This Matters:**
- 📉 **Flat challenge curve** - No sense of progress
- 🎮 **No skill growth** - Players don't improve
- 🔁 **Zero replayability** - "Why play Level 5 if it's the same as Level 1?"

**Required Fix (Designer + Programmer):**

| Level | Target Difficulty | Deduction Steps | Max Direct Assignments |
|-------|------------------|-----------------|------------------------|
| 1-2 | Tutorial | 1-2 | 50% of cells |
| 3-4 | Easy | 2-3 | 30% of cells |
| 5-6 | Medium | 3-4 | 15% of cells |
| 7-8 | Hard | 4-6 | 5% of cells |
| 9+ | Expert | 6+ | 0% |

**Success Criteria:**
- Each level tier feels distinctly harder than the previous
- Player should fail at least once on their first attempt at Medium+ levels

---

## What We SHOULD Solve (P1 - Core Experience)

### 3. **Missing "Aha!" Moments**

**The Problem:**
No puzzle required:
- Cross-referencing multiple constraints
- Process of elimination
- Working backwards from count constraints

**Why This Matters:**
- 🧠 **No dopamine hit** - The satisfaction of puzzles comes from breakthroughs
- 🎯 **No skill expression** - Smart players can't feel smart

**Required Fix (Designer):**

Define **Deduction Patterns** for the generator to target:

| Pattern | Example | Difficulty |
|---------|---------|------------|
| **Elimination** | "Not A, not B, must be C" | Easy |
| **Cross-reference** | "Row has 2 circles + Col has 0 circles = this cell isn't circle" | Medium |
| **Chain deduction** | "If A1=X, then B1≠X, so B1=Y, therefore C1..." | Hard |
| **Count constraint** | "Row needs exactly 2 triangles, 1 placed, 2 cells left, both must be..." | Hard |

**Success Criteria:**
- Each puzzle (Level 3+) requires at least one "aha!" moment to solve
- Players report satisfaction from solving, not just completing

---

## What We SHOULD Solve (P2 - Polish)

### 4. **Redundant "≠ Cat" Constraint Spam**

**The Problem:**
- ~50% of constraints are "X ≠ Cat"
- Adds visual clutter without puzzle depth
- "X ≠ Cat" just means "X needs a shape" (obvious)

**Evidence:**
> Level 1 had 4 "≠ Cat" constraints out of 10 total (40%)
> Level 3 had 10 "≠ Cat" constraints out of 20 total (50%)

**Required Fix (Programmer):**
- Option A: Don't generate "≠ Cat" constraints (they're implied)
- Option B: Collapse into single "These cells need shapes: A1, B2, C3"
- Option C: Hide "≠ Cat" under an "advanced" toggle

**Success Criteria:**
- Constraint list is 50% shorter
- Every visible constraint provides meaningful information

---

### 5. **Count Constraints Underused**

**The Problem:**
- "Exactly N" and "At least N" constraints exist but are rarely decision-forcing
- When present, other constraints already determined the outcome

**Evidence:**
> "Row/Column count constraints existed but were mostly redundant"

**Required Fix (Designer):**
- Count constraints should be the PRIMARY mechanism for harder levels
- Reduce direct cell constraints, increase row/column/region counting

**Example of Good Count Usage:**
```
Given:
- Row A: exactly 2 Triangles
- Col 1: exactly 1 Triangle  
- A1 = Triangle (locked)

Player must deduce:
- A2 or A3 is a Triangle (Row A needs 2)
- But Col 1 already has its Triangle (A1)
- So Col 2 or Col 3 must have Row A's second Triangle
```

---

## Recommended Action Plan

### Sprint 1 (This Week) - **CRITICAL FIXES**

**Goal:** Make puzzles actual puzzles

#### For Programmer:
1. **Modify constraint generator** (4-6 hours)
   - Add "direct assignment ratio" parameter
   - Reject constraints that directly solve cells beyond threshold
   - Implement per-level difficulty settings

2. **Reduce "≠ Cat" spam** (1-2 hours)
   - Either filter out or collapse these constraints

#### For Designer:
3. **Define difficulty curve** (2 hours)
   - Specify per-level targets (see table in P0.2)
   - Document required deduction patterns per tier

**Deliverable:** Level 3+ requires actual thinking to solve

---

### Sprint 2 (Next Week) - **QUALITY IMPROVEMENTS**

4. **Implement deduction patterns** (Designer + Programmer)
   - Generator should target specific puzzle patterns
   - Test each level for "aha!" moments

5. **Balance count constraints**
   - Make row/column counts the primary challenge at higher levels

**Deliverable:** Each difficulty tier feels distinct

---

### Sprint 3+ (Future) - **ENHANCEMENTS**

6. Hint system (becomes valuable once puzzles are hard)
7. Puzzle analytics (track which constraints players use)
8. Dynamic difficulty adjustment

---

## Risk Assessment

**If we don't fix P0 issues:**
- ❌ **Immediate churn** - "This isn't a puzzle"
- ❌ **Negative reviews** - "Too easy, boring"
- ❌ **No engagement loop** - Nothing to master

**If we fix P0 issues only:**
- ✅ **Actual puzzles** - Requires thought
- ✅ **Clear progression** - Levels feel different
- ⚠️ **May over-correct** - Tune carefully

**If we fix P0 + P1-P2:**
- ✅ **Satisfying experience** - "Aha!" moments
- ✅ **Replayable** - Worth mastering
- ✅ **Streamable/shareable** - Interesting to watch

---

## Key Insights

1. **UI is NOT the problem** - Don't touch it, it's excellent
2. **Generator algorithm needs fundamental changes** - Not parameter tuning
3. **Difficulty = constraint interaction, not constraint count**
4. **Direct assignments are the enemy** - They bypass the game
5. **Count constraints are underutilized gold** - More counting, less telling

---

## Conclusion

**We have a beautiful, well-designed interface wrapped around a non-puzzle.** The constraint generator is essentially giving players the answer key alongside the test. 

The fix is conceptually simple but algorithmically non-trivial: **stop generating constraints that directly solve cells.** Force players to deduce through elimination, cross-referencing, and counting.

**Recommendation:** Programmer focuses on generator algorithm changes. Designer focuses on defining what "hard" actually means in terms of required deduction steps. Reconvene with new playtest once Sprint 1 is complete.

---

## Task Checklist

### P0 - Ship Blockers (Must Fix Before Next Playtest)

- [ ] **Direct Assignment Overload**
  - [ ] Add direct-assignment ratio parameter to generator
  - [ ] Implement rejection of over-solving constraints
  - [ ] Test: ≤20% direct assignments on Level 3+

- [ ] **Difficulty Progression**
  - [ ] Define difficulty curve (Designer)
  - [ ] Implement per-level difficulty settings (Programmer)
  - [ ] Test: Level 5 feels harder than Level 3

### P1 - Core Experience (Should Fix This Sprint)

- [ ] **"Aha!" Moment Generation**
  - [ ] Document target deduction patterns
  - [ ] Generator targets specific pattern types
  - [ ] Test: Each Level 3+ has at least one multi-step deduction

### P2 - Polish (Should Fix Soon)

- [ ] **"≠ Cat" Constraint Cleanup**
  - [ ] Filter or collapse redundant constraints
  - [ ] Test: Constraint list 50% shorter

- [ ] **Count Constraint Utilization**
  - [ ] Increase row/col/region count constraints
  - [ ] Ensure counts are decision-forcing, not redundant
  - [ ] Test: Count constraints required for solution on Level 5+

---

## Appendix: Player Ratings Reference

| Category | Score | Notes |
|----------|-------|-------|
| Clarity | ⭐⭐⭐⭐⭐ | Interface is excellent |
| Challenge | ⭐☆☆☆☆ | Far too easy |
| Fun | ⭐⭐☆☆☆ | Satisfying to complete, not satisfying to solve |
| Replayability | ⭐⭐☆☆☆ | Would try harder levels |

**Overall Score:** 5/20

**Target After Fixes:** 16/20+

