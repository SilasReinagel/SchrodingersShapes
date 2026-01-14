# Clue/Constraint Visual Language

A design guide for intuitively communicating puzzle constraints in Schrödinger's Shapes.

---

## Constraint Types Overview

The game has two main constraint categories:

### Count Constraints (Scope + Count + Shape)
- **Row**: "Row 0 has exactly 2 circles"
- **Column**: "Column 2 has at least 1 triangle"
- **Global**: "The grid contains exactly 3 cats"

### Cell Constraints (Position + Shape)
- **Is**: "Cell (1,2) is a Circle"
- **Is Not**: "Cell (0,0) is not a Triangle"

---

## 1. Scope Indicators (Where does this apply?)

### Row Indicator
**Concept**: Horizontal band/strip highlighting

| Idea | Description |
|------|-------------|
| **Highlighted Row Strip** | A small 3×3 grid icon with one horizontal row glowing/highlighted in teal |
| **Horizontal Arrows** | `←→` arrows flanking the constraint, pointing left-right |
| **"R1" Label** | Simple row number label: R1, R2, R3 |
| **Horizontal Line Icon** | Three horizontal dashes `≡` or a thick horizontal line |

**Recommended**: Mini grid with highlighted row - most intuitive, shows exactly which row at a glance.

### Column Indicator  
**Concept**: Vertical band/strip highlighting

| Idea | Description |
|------|-------------|
| **Highlighted Column Strip** | A small 3×3 grid icon with one vertical column glowing/highlighted |
| **Vertical Arrows** | `↑↓` arrows flanking the constraint, pointing up-down |
| **"C1" Label** | Simple column number label: C1, C2, C3 |
| **Vertical Line Icon** | Three vertical bars `⦀` or a thick vertical line |

**Recommended**: Mini grid with highlighted column - mirrors the row indicator for consistency.

### Global Indicator
**Concept**: The entire board/grid

| Idea | Description |
|------|-------------|
| **Full Grid Glow** | A small 3×3 grid icon with ALL cells highlighted/glowing |
| **Globe/World Icon** | 🌐 or a simplified grid with circular encompassing line |
| **"All" Badge** | Text badge saying "ALL" or "GRID" |
| **Grid Outline** | Grid icon with a pulsing outer border emphasizing entirety |
| **Infinity Symbol** | ∞ to represent "everywhere" |

**Recommended**: Full grid with all cells subtly glowing - consistent with row/column system.

### Cell (Specific Position) Indicator
**Concept**: A single pinpointed cell

| Idea | Description |
|------|-------------|
| **Crosshair on Cell** | Mini grid with one cell marked with crosshairs ⊕ |
| **Pulsing Dot** | Single bright dot or pin at specific grid intersection |
| **Coordinate Badge** | "(1,2)" coordinate notation |
| **Magnifying Glass** | 🔍 focusing on one cell |
| **Cell Highlight** | Mini grid with single cell brightly highlighted, others dimmed |

**Recommended**: Mini grid with single cell highlighted and a subtle target/crosshair overlay.

---

## 2. Operators (How many? What relationship?)

### Exactly (=)
**Concept**: Precise, definite, no more no less

| Idea | Description |
|------|-------------|
| **Equals Sign** | Simple `=` symbol |
| **Bullseye** | 🎯 target hit dead center |
| **Lock Icon** | 🔒 locked in, exact |
| **Balanced Scale** | ⚖️ perfectly balanced |
| **Check + Number** | "✓2" meaning exactly 2 |

**Recommended**: Clean `=` sign - universally understood, minimal visual weight.

### At Least (≥)
**Concept**: Minimum threshold, "this many or more"

| Idea | Description |
|------|-------------|
| **Greater-Equal Symbol** | `≥` mathematical symbol |
| **Rising Arrow** | `↑` arrow pointing up from number |
| **Plus Sign Suffix** | "2+" meaning 2 or more |
| **Floor with Arrow** | `⌊` floor bracket with upward arrow |
| **Minimum Bar** | Horizontal bar with arrow extending right/up |

**Recommended**: `≥` symbol or "2+" notation - both instantly readable.

### At Most (≤)
**Concept**: Maximum cap, "this many or fewer"

| Idea | Description |
|------|-------------|
| **Less-Equal Symbol** | `≤` mathematical symbol |
| **Descending Arrow** | `↓` arrow capping downward |
| **Max Badge** | "max 2" or "2↓" |
| **Ceiling with Arrow** | `⌈` ceiling bracket with downward arrow |
| **Cap/Lid Icon** | Visual cap over the number |

**Recommended**: `≤` symbol - clean and mathematical, matches "at least" visually.

### None (0 / ∅)
**Concept**: Zero, forbidden, not allowed

| Idea | Description |
|------|-------------|
| **Crossed-Out Shape** | Shape with red ❌ or diagonal slash through it |
| **Zero with Slash** | `∅` empty set symbol |
| **🚫 Prohibition Sign** | Red circle with diagonal line |
| **Ghost/Faded Shape** | Very dim shape with "0" overlay |
| **"0×" Count** | Simple "0×" with shape |

**Recommended**: Crossed-out shape icon (diagonal red line through shape) - immediately clear as "forbidden."

### Is (Positive Cell Assertion)
**Concept**: This cell definitely contains this shape

| Idea | Description |
|------|-------------|
| **Checkmark + Shape** | ✓ next to shape icon |
| **Pin/Anchor** | 📌 pinning the shape to location |
| **Equals with Cell** | Cell coord `= ●` shape |
| **Solid Shape Icon** | Bold, solid, confident shape rendering |
| **Thumbs Up** | 👍 approval indicator |

**Recommended**: Simple `=` between cell indicator and shape - consistent with count constraints.

### Is Not (Negative Cell Assertion)
**Concept**: This cell definitely does NOT contain this shape

| Idea | Description |
|------|-------------|
| **X + Shape** | ✗ next to shape icon |
| **Crossed Shape** | Shape with diagonal slash |
| **Not-Equals** | `≠` symbol between cell and shape |
| **Red Border** | Shape with red/danger outline |
| **Ghost Shape** | Semi-transparent "banned" shape |

**Recommended**: `≠` symbol or crossed-out shape - mirrors "none" visual language.

---

## 3. Shape Icons

### Square ■
- Solid pastel blue square
- Rounded corners for friendliness
- Simple, geometric, stable feeling

### Circle ●
- Solid pastel pink circle
- Perfect roundness
- Soft, harmonious feeling

### Triangle ▲
- Solid pastel yellow triangle
- Points upward (stability)
- Dynamic, directional feeling

### Cat 🐱 (Superposition State)
- Stylized cat silhouette or face
- Subtle shimmer/glow effect suggesting quantum uncertainty
- Could pulse or have animated particles
- Color: Soft blue or multi-color gradient to suggest "all shapes"
- Optional: Question mark overlay `?` to emphasize uncertainty

**Visual Treatment Ideas for Cat**:
1. Cat silhouette with shape outlines orbiting it
2. Cat with "?" bubble
3. Cat composed of dotted/dashed lines (not solid - uncertain)
4. Cat with subtle rainbow/prismatic edge (superposition of states)

---

## 4. Count Representation

### Numeric Count Display

| Count | Visual Ideas |
|-------|--------------|
| **1** | Single dot, "1×", or just the shape |
| **2** | Two dots, "2×", or two stacked mini-shapes |
| **3** | Three dots, "3×", or three mini-shapes in a row |
| **4+** | Number + shape icon, avoid clutter |

**Recommended Format**: `{count}× {shape}` e.g., "2× ●" for "2 circles"

---

## 5. Constraint Satisfaction Status

### Satisfied ✓
**Concept**: Complete, correct, done

| Idea | Description |
|------|-------------|
| **Green Checkmark** | ✓ in green/teal |
| **Glowing Border** | Constraint row gets soft green glow |
| **Filled Indicator** | Progress bar fully filled |
| **Faded/Dimmed** | Satisfied constraints become subtle, unsatisfied stay bold |
| **Celebration Sparkle** | Tiny sparkle animation on completion |

### Not Satisfied / In Progress
**Concept**: Incomplete, needs attention

| Idea | Description |
|------|-------------|
| **No Icon** | Simply absence of checkmark |
| **Yellow Warning** | ⚠️ subtle warning if close but not met |
| **Progress Indicator** | "1/2" showing partial progress |
| **Pulsing Highlight** | Constraint gently pulses to draw attention |

### Violated (Impossible to Satisfy)
**Concept**: Error state, over the limit

| Idea | Description |
|------|-------------|
| **Red X** | ✗ in red |
| **Red Border** | Constraint row gets red warning border |
| **Shake Animation** | Subtle shake to indicate error |
| **Exceeded Indicator** | "3/2" in red showing over the limit |

---

## 6. Composite Constraint Examples

Here's how full constraints might look combining all elements:

### "Row 1: exactly 2 circles"
```
[Row1 Grid] = 2× ●      [✓]
```
Visual: Mini grid with row 1 highlighted → equals sign → "2×" → pink circle → green checkmark

### "Global: at least 1 cat"
```
[Full Grid] ≥ 1× 🐱     [✓]
```
Visual: Mini grid all glowing → greater-equal → "1×" → cat icon → green checkmark

### "Column 2: no triangles"
```
[Col2 Grid] = 0× ▲      [ ]
       or
[Col2 Grid] [🚫▲]       [ ]
```
Visual: Mini grid with col 2 highlighted → crossed-out yellow triangle → empty status

### "Cell (1,2) is a Circle"
```
[Cell Grid] = ●         [✓]
```
Visual: Mini grid with cell (1,2) crosshaired → equals → pink circle → checkmark

### "Cell (0,0) is not a Triangle"
```
[Cell Grid] ≠ ▲         [ ]
       or
[Cell Grid] [🚫▲]       [ ]
```
Visual: Mini grid with cell (0,0) crosshaired → not-equals or crossed triangle → status

---

## 7. Visual Hierarchy & Grouping

### Suggested Panel Layout (per constraint row)

```
┌─────────────────────────────────────────────────┐
│  [SCOPE]    [OPERATOR] [COUNT] [SHAPE]  [STATUS]│
│                                                 │
│  [grid]        =         2×      ●        ✓    │
└─────────────────────────────────────────────────┘
```

### Alternative Compact Layout

```
┌──────────────────────────────────┐
│ [grid-scope]  =  2×●         ✓  │
└──────────────────────────────────┘
```

### Color Coding Ideas

| Element | Color | Purpose |
|---------|-------|---------|
| Row scope | Teal horizontal gradient | Direction |
| Column scope | Teal vertical gradient | Direction |
| Global scope | Teal radial glow | Entirety |
| Cell scope | Teal point/dot | Precision |
| Satisfied | Green (#4CAF50) | Success |
| Violated | Red (#EF4444) | Error |
| In Progress | Neutral/white | Waiting |
| Shapes | Pastel (pink/blue/yellow) | Consistency |

---

## 8. Animation Ideas

### Scope Highlight on Hover
When hovering over a constraint, highlight the corresponding row/column/cell on the main grid.

### Satisfaction Transition
When a constraint becomes satisfied:
1. Brief pulse/flash
2. Checkmark appears with subtle bounce
3. Row dims slightly to reduce visual noise

### Violation Shake
When player makes a move that violates a constraint:
1. Constraint row shakes briefly
2. Red flash on the scope indicator
3. Helpful tooltip could appear

### Cat Shape Quantum Effect
Cat icons have subtle animated shimmer/particles suggesting superposition state.

---

## 9. Accessibility Considerations

- Don't rely solely on color - use icons and shapes
- High contrast mode should still be readable
- Screen reader labels for each constraint element
- Avoid tiny text - use icons where possible
- Consistent left-to-right reading order

---

## 10. Summary Recommendations

| Concept | Recommended Visual |
|---------|-------------------|
| Row scope | Mini grid, horizontal row highlighted |
| Column scope | Mini grid, vertical column highlighted |
| Global scope | Mini grid, all cells glowing |
| Cell scope | Mini grid, single cell + crosshair |
| Exactly | `=` symbol |
| At least | `≥` symbol or "n+" |
| At most | `≤` symbol |
| None | Crossed-out shape (🚫 style) |
| Is | `=` between cell and shape |
| Is not | `≠` or crossed shape |
| Count | `{n}×` format |
| Satisfied | Green checkmark ✓ |
| Violated | Red X or shake |
| Cat (superposition) | Cat icon with shimmer/? |

---

## Future Constraint Types to Consider

If the game expands, here are additional constraint types that might need visuals:

1. **Adjacency**: "No two circles adjacent" → Two circles with ≠ between them + adjacency icon
2. **Diagonal**: "Diagonal contains exactly 1 triangle" → Diagonal line across mini grid
3. **Relative**: "More circles than squares" → Circle > Square visual
4. **Symmetry**: "Grid must be symmetric" → Mirror/reflection icon
5. **Connected**: "All triangles must be connected" → Chain/link icon

---

*Design principle: Every visual should be understandable within 1-2 seconds by a new player. When in doubt, prefer clarity over cleverness.*

