# Tutorial Design Report: Schrödinger's Shapes
**Date:** January 14, 2026  
**Author:** UI/UX Game Tutorial Expert Analysis  
**Status:** Design Specification

---

## Executive Summary

The ideal tutorial is invisible—players learn by doing, not by reading. Schrödinger's Shapes has a unique advantage: the quantum physics metaphor (cats in superposition, collapsing to shapes) provides a narrative framework that can make learning feel like discovery rather than instruction.

**Key Insight from Playtesting:** Human players rated interface clarity at 5/5 stars and solved Level 1 in 4 moves. The core interaction pattern (click cell → pick shape) is already intuitive. The tutorial should focus on *why* (constraint satisfaction) not *how* (clicking).

---

## Philosophy: Show, Don't Tell

### The Zero-Tutorial Ideal

The best puzzle games teach through constraints:
- **Portal**: First room has one button, one door—you learn by doing
- **The Witness**: No text, just visual patterns that escalate
- **Baba Is You**: Rules are objects in the world itself

**Schrödinger's Shapes already does this well.** The constraint panel with ✓/○/✗ feedback provides real-time learning. Players naturally experiment and see results.

### When Tutorials Fail

Tutorials become anti-patterns when they:
1. **Interrupt flow** — Modal dialogs that say "Click here!" break immersion
2. **Over-explain** — Treating players as incompetent
3. **Front-load information** — 5 screens of rules before playing
4. **Lack context** — Explaining mechanics before players care

---

## Recommended Approach: Progressive Disclosure

### Phase 1: Zero-Instruction First Contact

Let players dive straight into Level 1 with **no tutorial screens**.

**Why this works:**
- Playtest showed Level 1 is solvable in 4 moves
- Players rated interface clarity 5/5
- Direct "= Shape" constraints provide built-in guidance
- The constraint panel's checkmarks teach the win condition naturally

**Only intervention:** If a player is idle for 8+ seconds on Level 1, show a subtle pulse animation on a Cat cell with tooltip: *"Tap a cat to reveal its true form"*

### Phase 2: Just-in-Time Hints (Contextual Learning)

Introduce concepts exactly when needed, not before:

| Trigger | Hint | Mechanic Learned |
|---------|------|------------------|
| First Cat clicked | Shape picker appears with brief glow | Core interaction |
| First ✓ constraint achieved | Subtle particle burst on checkmark | Win condition feedback |
| First constraint becomes ✗ | Red pulse on violated row + constraint | Error awareness |
| Level 2 unlocked | "New constraint type: Row counts" (toast) | Count constraints |
| First locked cell encountered | Padlock shimmer + "Pre-determined" tooltip | Locked mechanics |

### Phase 3: Optional Deep Dive ("How to Play" Menu)

For players who *want* explicit instruction, provide an optional tutorial accessible from the main menu. This should be:
- **Skippable** — Never forced
- **Interactive** — Not just text
- **Replayable** — Accessible anytime

---

## Tutorial Content Structure

### Module 1: The Core Loop (15 seconds)

**Presented as:** Interactive mini-puzzle (1x2 grid)

```
Visual: Two Cat cells side by side
Constraint Panel: "A1 = Square"
```

**Guidance overlay:**
1. "Cats are in *superposition*—they could be any shape" (Cat wiggles)
2. "Tap a cat to collapse its state" (Arrow points to A1)
3. [Player taps, picker appears]
4. "Satisfy the constraint" (Picker highlights Square)
5. [Player selects Square, checkmark animates]
6. "When all constraints are ✓, you win!"

**Duration:** ~15 seconds of actual play

### Module 2: Reading Constraints (20 seconds)

**Presented as:** 2x2 puzzle with 3 constraint types

```
Constraints:
1. A1 = Circle      (cell constraint - direct)
2. A2 ≠ Square      (cell constraint - negation)  
3. Row B: 1 Triangle (count constraint)
```

**Animated breakdown:**
- Constraint 1: Grid icon highlights A1 → "This cell must be Circle"
- Constraint 2: Shows Square with ∅ overlay → "Not this shape"
- Constraint 3: Row highlights → "Exactly 1 triangle in this row"

**Key principle:** Show the constraint, then show what it *means* on the grid. Never abstract.

### Module 3: The Constraint Panel (10 seconds)

Quick tour using subtle spotlight effects:

1. **Progress bar** — "Your journey to solution"
2. **✓ Checkmark** — "Constraint satisfied—nice!"
3. **○ Circle** — "Not yet—keep going"
4. **✗ Cross** — "Broken! Adjust this shape"

**Skip trigger:** If player completes Module 2 quickly, auto-skip this module.

---

## What NOT to Do

### ❌ Avoid These Anti-Patterns

| Anti-Pattern | Why It Fails | Our Alternative |
|--------------|--------------|-----------------|
| **Forced tutorial before play** | Kills excitement, players skip/forget | Start playing immediately |
| **Text walls** | Nobody reads them | Visual demonstrations |
| **"Did you know?" popups** | Interrupts flow | Contextual tooltips only |
| **Hand-holding every level** | Condescending | Trust the player |
| **Explaining all constraints upfront** | Cognitive overload | Introduce as encountered |
| **Separate tutorial mode** | Doesn't feel "real" | Tutorial IS Level 1 |
| **Unskippable sequences** | Frustrates experienced players | Everything optional |
| **Abstract explanations** | "Constraints evaluate truthiness" | Show on the grid |

### ❌ Don't Over-Explain the Theme

The "Schrödinger's Cat" metaphor is charming but **don't lecture about quantum physics**. Let it be:
- Cat = Unknown
- Shapes = Possibilities
- Collapse = Decision

Players will intuit this. The metaphor is a vibe, not a lesson.

### ❌ Don't Explain What's Already Clear

From playtesting, these elements need **no explanation**:
- Clicking cells (intuitive)
- Shape picker (obvious affordances)
- Checkmark/X status (universal symbols)
- "Play Game" button (self-evident)

---

## Implementation Recommendations

### First-Time User Experience (FTUE)

```
Main Menu → "Play Game"
         ↓
    Level 1 loads (no delay)
         ↓
    [8s idle?] → Gentle pulse on Cat cell
         ↓
    Player clicks → Picker appears naturally
         ↓
    Player solves → Victory! + "That's the idea! Ready for more?"
         ↓
    Level 2 (slight constraint complexity increase)
```

### Tutorial Component Architecture

```tsx
// Suggested component structure
<TutorialProvider>
  <TutorialSpotlight target="cell-A1" /> {/* Highlights specific element */}
  <TutorialTooltip 
    anchor="constraint-1" 
    content="This cell must be a Circle"
    dismissOn="constraint-satisfied"
  />
  <TutorialProgress step={currentStep} total={3} />
</TutorialProvider>
```

### Hint System (Future Enhancement)

For stuck players (30+ seconds no progress):

1. **Level 1:** Auto-highlight the easiest constraint
2. **Level 2+:** "Need a hint?" button appears in corner
3. **Hint content:** Highlight which cells relate to unsatisfied constraints

---

## The "How to Play" Page Design

For players who click "How to Play" from Main Menu:

### Layout: Interactive Showcase

```
┌─────────────────────────────────────────────────┐
│  HOW TO PLAY                              [Skip]│
├─────────────────────────────────────────────────┤
│                                                 │
│     ┌─────┬─────┐        CONSTRAINTS            │
│     │ 🐱  │ 🐱  │        ───────────            │
│     ├─────┼─────┤        1. ○ A1 = ■            │
│     │ 🐱  │ 🐱  │        2. ○ B2 ≠ ●            │
│     └─────┴─────┘        3. ○ Row A: 1 ▲        │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ Tap a cat to collapse its superposition │    │
│  │           [Try it! ▶]                   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│            ● ● ○ ○ ○  (progress dots)           │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Sections (Swipeable/Tappable):

1. **The Cats** — "Every cell starts as a quantum cat—neither shape nor not-shape"
2. **The Shapes** — "Squares, Circles, Triangles—tap to transform"
3. **The Constraints** — "Rules to satisfy. Green ✓ = happy!"
4. **The Goal** — "All constraints green? You've collapsed the puzzle!"
5. **Try It** — Mini 2x2 puzzle

---

## Success Metrics

### How We Know the Tutorial Works

| Metric | Target | Measurement |
|--------|--------|-------------|
| Level 1 completion rate | >95% | Analytics |
| Time to first shape placed | <5s | Analytics |
| Tutorial skip rate | Informational (no target) | Analytics |
| "How to Play" click rate | <20% (means FTUE works) | Analytics |
| Player-reported confusion | "What do I do?" support tickets <1% | Feedback |

### A/B Testing Candidates

1. **With vs. without** idle-time hint pulse
2. **Tooltip style:** Floating vs. anchored
3. **First constraint:** Direct "= Shape" vs. negation "≠ Shape"

---

## Summary: The Perfect Onboarding

```
1. LET THEM PLAY IMMEDIATELY
   └── Level 1 is the tutorial

2. TRUST THE UI
   └── Checkmarks and X's teach win condition

3. CONTEXTUAL HINTS ONLY
   └── If stuck >8s, gentle guidance

4. OPTIONAL DEEP DIVE
   └── "How to Play" for the curious

5. THEME AS FLAVOR
   └── Quantum cats are charming, not educational
```

**The goal is not zero tutorial—it's a tutorial so well-integrated that players don't realize they're being taught.**

---

## Appendix: Inspiration from Great Puzzle Game Onboarding

### Portal (Valve)
- First room: One button, one door
- Teaches by constraining options
- **Takeaway:** Level 1 should have obvious solutions

### The Witness (Jonathan Blow)
- Zero text instructions
- Rules discovered through pattern recognition
- **Takeaway:** Visual feedback > verbal explanation

### Mini Metro (Dinosaur Polo Club)
- First game is playable with no tutorial
- Complexity added gradually
- **Takeaway:** Start simple, layer mechanics

### Baba Is You (Hempuli)
- Rules are physical objects
- Breaking rules teaches rules
- **Takeaway:** Let players break things safely

### Tetris Effect
- No tutorial—everyone knows Tetris
- For new players: Shapes are obvious, goal is obvious
- **Takeaway:** If your core loop is clear, trust it

---

*"The best tutorial is the one the player doesn't notice."*

