# Clue Visuals V1 - Implementation Plan

Based on the analysis in `clue-visuals.md`, here are the final design decisions and implementation roadmap.

---

## Design Decisions (V1)

### Scope Indicators
We'll use **mini 3×3 grid icons** with highlighted regions. This is intuitive and visually consistent.

| Scope | Visual Treatment |
|-------|------------------|
| **Row** | 3×3 grid with one horizontal row highlighted in teal |
| **Column** | 3×3 grid with one vertical column highlighted in teal |
| **Global** | 3×3 grid with ALL cells highlighted (brighter glow) |
| **Cell** | 3×3 grid with ONE cell highlighted + subtle crosshair/target marker |

**Grid Icon Specs**:
- Size: 48×48px (w-12 h-12)
- Cell spacing: 2px gap
- Default cell: `bg-slate-600/40` (dim)
- Highlighted cell: `bg-teal-400/80` (bright)
- Grid rendered as CSS, no image assets needed

### Operators
Text-based operators keep it clean and mathematical:

| Operator | Display | Example |
|----------|---------|---------|
| **exactly** | `=` | `= 2×` |
| **at_least** | `≥` | `≥ 1×` |
| **at_most** | `≤` | `≤ 3×` |
| **none** | `= 0×` + crossed shape | `= 0× ▲` (with slash overlay) |
| **is** | `=` | `= ●` |
| **is_not** | `≠` | `≠ ▲` |

### Shape Icons
Reuse existing `Shape` component at smaller size. For "forbidden" shapes, add a red diagonal slash overlay.

| Shape | Icon | Notes |
|-------|------|-------|
| Square | Existing `square_01.png` | Scale down to 24×24px |
| Circle | Existing `circle_01.png` | Scale down to 24×24px |
| Triangle | Existing `triangle_01.png` | Scale down to 24×24px |
| Cat | Existing `cat_01.png` or `favicon.png` | Scale down, add subtle pulse animation |

### Satisfaction Status
| Status | Visual |
|--------|--------|
| **Satisfied** | Green checkmark (existing ✓) + subtle green tint on row |
| **In Progress** | No icon, neutral state |
| **Violated** | Red X icon + red tint on row (future: shake animation) |

---

## What We Already Have

### Art Assets ✓
- [x] `square_01.png` - Square shape
- [x] `circle_01.png` - Circle shape  
- [x] `triangle_01.png` - Triangle shape
- [x] `cat_01.png` - Cat shape
- [x] `panel_constraint_01.png` - Constraint panel frame
- [x] `favicon.png` - Small cat icon

### Code ✓
- [x] `Shape` component - Renders shapes with animation
- [x] `ConstraintsPanel` - Basic panel structure
- [x] `GridIcon` - Basic 3×3 grid (needs enhancement)
- [x] Constraint types defined in `types.ts`
- [x] `getConstraintStatus` utility function

---

## What Needs to Be Coded

### 1. Enhanced `ScopeIcon` Component
**Priority: HIGH** | **Effort: Medium**

Replace the basic `GridIcon` with a smarter `ScopeIcon` that renders differently based on constraint type:

```tsx
interface ScopeIconProps {
  constraint: ConstraintDefinition;
  size?: 'sm' | 'md' | 'lg';
}
```

**Features**:
- Row constraints: Highlight row `index` (0, 1, or 2)
- Column constraints: Highlight column `index` (0, 1, or 2)
- Global constraints: Highlight all cells
- Cell constraints: Highlight single cell at `(x, y)` with crosshair overlay

**Implementation**:
- Pure CSS/Tailwind - no image assets needed
- Use `bg-teal-400/80` for highlighted cells
- Use `bg-slate-600/40` for dim cells
- Add subtle CSS crosshair for cell constraints

### 2. `OperatorDisplay` Component
**Priority: HIGH** | **Effort: Low**

Display the correct operator symbol:

```tsx
interface OperatorDisplayProps {
  operator: 'exactly' | 'at_least' | 'at_most' | 'none' | 'is' | 'is_not';
}
```

**Mapping**:
- `exactly` → `=`
- `at_least` → `≥`
- `at_most` → `≤`
- `none` → `=` (with count of 0)
- `is` → `=`
- `is_not` → `≠`

### 3. `ShapeIcon` Component (Enhanced)
**Priority: MEDIUM** | **Effort: Low**

Small shape icon for constraint panel:

```tsx
interface ShapeIconProps {
  shapeId: ShapeId;
  forbidden?: boolean;  // Adds red slash overlay
  size?: 'sm' | 'md';
}
```

**Features**:
- Render shape at constrained size (24×24px default)
- Optional `forbidden` prop adds diagonal red slash

### 4. Update `ConstraintsPanel` 
**Priority: HIGH** | **Effort: Medium**

Refactor to use new components and handle all constraint types properly:

```tsx
// Constraint row structure:
// [ScopeIcon] [OperatorDisplay] [Count] [ShapeIcon] [StatusIcon]
```

**Changes needed**:
- Replace `GridIcon` with `ScopeIcon`
- Add `OperatorDisplay` 
- Handle `at_least`, `at_most`, `none` operators
- Handle `is` and `is_not` cell constraints
- Add violation state (red X when over limit)

### 5. Violation Detection Enhancement
**Priority: MEDIUM** | **Effort: Medium**

Update `getConstraintStatus` or create new function to return three states:

```ts
type ConstraintState = 'satisfied' | 'in_progress' | 'violated';
```

This allows showing red indicators when a constraint is impossible to satisfy (e.g., already have 3 circles when max is 2).

### 6. Hover Interaction (Optional V1.1)
**Priority: LOW** | **Effort: Medium**

When hovering over a constraint, highlight the corresponding row/column/cell on the main grid. Requires:
- Lifting hover state to parent component
- Passing highlight info to `Grid` component
- CSS highlight styling on grid cells

---

## Art Assets Needed

### Required for V1
| Asset | Description | Format | Priority |
|-------|-------------|--------|----------|
| None | All scope indicators will be CSS-based | - | - |

### Nice to Have (V1.1+)
| Asset | Description | Format | Priority |
|-------|-------------|--------|----------|
| `icon_crosshair.svg` | Subtle crosshair for cell constraints | SVG | Low |
| `icon_forbidden_slash.svg` | Red diagonal slash for "none"/"is_not" | SVG | Low |

> **Note**: The crosshair and forbidden slash can be done with pure CSS initially. SVG assets are optional polish.

---

## Implementation Order

### Phase 1: Core Components
1. [ ] Create `ScopeIcon` component with row/column/global/cell variants
2. [ ] Create `OperatorDisplay` component
3. [ ] Create `ShapeIcon` wrapper with forbidden overlay support

### Phase 2: Panel Integration  
4. [ ] Refactor `ConstraintsPanel` to use new components
5. [ ] Add proper formatting for all operator types
6. [ ] Test with different constraint combinations

### Phase 3: Status Enhancement
7. [ ] Add violation state detection
8. [ ] Add red X icon for violated constraints
9. [ ] Optional: Add subtle animations (shake on violation, pulse on satisfaction)

### Phase 4: Polish (V1.1)
10. [ ] Hover-to-highlight grid interaction
11. [ ] Smooth transitions when status changes
12. [ ] Accessibility labels

---

## File Structure

```
app/src/components/constraints/
├── ConstraintsPanel.tsx      # Main panel (refactor)
├── ConstraintsPanel.stories.tsx
├── ScopeIcon.tsx             # NEW - Grid scope indicator
├── OperatorDisplay.tsx       # NEW - Operator symbol
├── ShapeIcon.tsx             # NEW - Small shape with forbidden support
├── ConstraintRow.tsx         # NEW - Single constraint row
└── index.ts                  # Exports
```

---

## Visual Mockup (ASCII)

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  ┌───┬───┬───┐                                     │
│  │░░░│░░░│░░░│   =  2×  ●                    ✓    │
│  ├───┼───┼───┤                                     │
│  │▓▓▓│▓▓▓│▓▓▓│   (Row 1 highlighted)               │
│  ├───┼───┼───┤                                     │
│  │░░░│░░░│░░░│                                     │
│  └───┴───┴───┘                                     │
│                                                    │
│  ┌───┬───┬───┐                                     │
│  │░░░│▓▓▓│░░░│   ≤  1×  ▲                    ✓    │
│  ├───┼───┼───┤                                     │
│  │░░░│▓▓▓│░░░│   (Column 1 highlighted)            │
│  ├───┼───┼───┤                                     │
│  │░░░│▓▓▓│░░░│                                     │
│  └───┴───┴───┘                                     │
│                                                    │
│  ┌───┬───┬───┐                                     │
│  │▓▓▓│▓▓▓│▓▓▓│   =  3×  🐱                   ✓    │
│  ├───┼───┼───┤                                     │
│  │▓▓▓│▓▓▓│▓▓▓│   (Global - all highlighted)        │
│  ├───┼───┼───┤                                     │
│  │▓▓▓│▓▓▓│▓▓▓│                                     │
│  └───┴───┴───┘                                     │
│                                                    │
│  ┌───┬───┬───┐                                     │
│  │░░░│░░░│░░░│   ≠  ▲̶                             │
│  ├───┼───┼───┤                                     │
│  │░░░│⊕▓▓│░░░│   (Cell 1,1 with crosshair)         │
│  ├───┼───┼───┤                                     │
│  │░░░│░░░│░░░│                                     │
│  └───┴───┴───┘                                     │
│                                                    │
└────────────────────────────────────────────────────┘

Legend:
  ░░░ = Dim cell (bg-slate-600/40)
  ▓▓▓ = Highlighted cell (bg-teal-400/80)
  ⊕   = Crosshair overlay for cell constraints
  ▲̶   = Shape with forbidden slash
```

---

## Success Criteria

- [ ] Players can instantly understand what area each constraint applies to
- [ ] All operators (=, ≥, ≤, ≠) are clearly distinguishable  
- [ ] Satisfied/violated states are visually obvious
- [ ] No new art assets required for V1
- [ ] Component is responsive and works on mobile
- [ ] All TypeScript types are properly defined

---

## Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Core Components | 2-3 hours |
| Phase 2: Panel Integration | 1-2 hours |
| Phase 3: Status Enhancement | 1 hour |
| Phase 4: Polish | 2+ hours |
| **Total V1** | **4-6 hours** |

