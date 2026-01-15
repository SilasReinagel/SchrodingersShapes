
# Skill: Playtest Schrödinger's Shapes using the browser UI and dev server

# Command: Browser Playtest

When the user asks you to run a browser playtest or test the game in the browser, follow this procedure to playtest Schrödinger's Shapes through the actual web UI.

## Prerequisites

- The app directory: `app/`
- Dev server command: `bun dev` (runs on http://localhost:5173)
- MCP browser tools available: `cursor-browser-extension` or `cursor-ide-browser`

## Playtest Procedure

### Step 1: Start the Dev Server

First, check if the dev server is already running by looking at the terminals folder. If not running, start it:

```bash
cd app && bun dev
```

Run this as a background process. The server runs on **http://localhost:5173** by default.

### Step 2: Navigate to the Game

Use the MCP browser tools to navigate to the game:

1. Navigate to `http://localhost:5173`
2. Wait for the page to fully load
3. Take a screenshot to verify the main menu is visible

### Step 3: Start a Puzzle

1. Click the appropriate level button (Level 1-5) on the main menu
2. Wait for the puzzle to load
3. Take a screenshot to see the initial puzzle state

### Step 4: Understand the UI Layout

The game UI consists of:
- **Grid**: The main puzzle board with cells containing shapes (■ Square, ● Circle, ▲ Triangle, ? Unknown/Cat)
- **Constraints Panel**: Right side showing constraint rules with status indicators (✓ satisfied, ✗ violated, ○ in progress)
- **Top Bar**: Shows the game title and timer
- **Bottom Bar**: Contains controls (undo, reset, menu)

### Step 5: Solve the Puzzle

To interact with the puzzle:

1. **Click a cell** to select it (opens shape picker)
2. **Click a shape** from the picker to place it in the cell
3. After each move, observe:
   - Which constraints changed status
   - If any constraints are now violated (✗)
4. Use **undo** if you made a mistake
5. Continue until all constraints show ✓

### Step 6: Document the Playtest

After completing puzzles, write a playtest report to `.playtest/` folder.

**File naming**: `.playtest/YYYY-MM-DD-<persona-name>-<age>.md`

Example: `.playtest/2026-01-15-browser-agent.md`

Include in the report:
- Session summary (levels played, results)
- Screenshots of interesting states
- Any UI/UX issues discovered
- Bugs or unexpected behavior
- Constraint clarity observations
- Overall experience rating

## Tips for Browser Playtesting

1. **Take screenshots after each major action** for documentation
2. **Pay attention to animations** - wait for them to complete before clicking
3. **Check constraint feedback** - the panel updates in real-time
4. **Test edge cases**: Try invalid placements, rapid clicking, undo/reset
5. **Note any visual issues**: Overlapping elements, hard-to-read text, etc.

## Playtest Checklist

- [ ] Main menu loads correctly
- [ ] Level selection works
- [ ] Grid displays properly
- [ ] Shape picker appears on cell click
- [ ] Shapes can be placed
- [ ] Constraints update correctly
- [ ] Undo/Reset work
- [ ] Victory modal shows on completion
- [ ] Timer functions
- [ ] No console errors

## Report Template

```markdown
# Browser Playtest Report
**Date:** [Date]
**Agent:** Browser Playtest Agent
**Duration:** [Time spent]
**Levels Tested:** [List]

---

## Session Summary
| Level | Result | Issues Found |
|-------|--------|--------------|
| 1 | ✅/❌ | None/Description |

---

## UI/UX Observations
### Positives ✅
- [What worked well]

### Issues ⚠️
- [Problems encountered]

---

## Screenshots
[Include relevant screenshots with descriptions]

---

## Recommendations
| Priority | Issue | Suggestion |
|----------|-------|------------|
| High/Med/Low | Description | Fix suggestion |
```
