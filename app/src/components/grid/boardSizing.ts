const BOARD_PADDING_Y = 56;
const REFERENCE_ROWS = 4;
const REFERENCE_GAP_RATIO = 0.1;

/**
 * Computes the visual height of the board frame for any viewport size.
 * All board sizes scale to the same reference height (based on a 4-row grid).
 */
export function computeBoardFrameHeight(viewportWidth: number, viewportHeight: number): number {
  let targetCellSize: number;
  if (viewportWidth < 640) {
    targetCellSize = Math.min(80, (viewportWidth - 80) / REFERENCE_ROWS);
  } else if (viewportWidth < 1024) {
    targetCellSize = Math.min(100, (viewportWidth - 200) / REFERENCE_ROWS);
  } else {
    targetCellSize = Math.min(120, (viewportHeight - 200) / REFERENCE_ROWS);
  }
  targetCellSize = Math.max(60, targetCellSize);

  const targetGap = Math.max(8, targetCellSize * REFERENCE_GAP_RATIO);
  return REFERENCE_ROWS * targetCellSize + (REFERENCE_ROWS - 1) * targetGap + BOARD_PADDING_Y * 2;
}
