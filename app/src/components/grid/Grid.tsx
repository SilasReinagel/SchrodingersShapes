import { motion, LayoutGroup } from 'framer-motion';
import { useState, useRef, useMemo, useEffect } from 'react';
import { GameBoard, ShapeId, CatShape } from '../../game/types';
import { Shape } from '../shapes/Shape';
import { ShapePicker, PICKER_WIDTH, PICKER_HEIGHT } from '../shapes/ShapePicker';
import { createGridGlowFilter } from '../../constants/glowColors';

interface GridProps {
  grid: GameBoard;
  onCellClick: (row: number, col: number) => void;
  onShapeSelect: (row: number, col: number, shape: ShapeId) => void;
}

interface PickerState {
  isOpen: boolean;
  position: { x: number; y: number };
  cellRect: { x: number; y: number; width: number; height: number };
  row: number;
  col: number;
  cellId: string;
  selectedShape: ShapeId | null;
}

// Board padding for the sliceable frame (x = horizontal, y = vertical)
const BOARD_PADDING_X = 30;
const BOARD_PADDING_Y = 56;

// 9-slice border image settings
// The slice value determines how much of each corner is preserved (in pixels from the source image)
// board_3x2_sliceable.png is 1024x768, corners appear to be ~60px
const BORDER_SLICE = 60;

// Content Y offset to account for asymmetric padding in the board image (top has more than bottom)
const CONTENT_OFFSET_Y = 5;

export const Grid: React.FC<GridProps> = ({ grid, onCellClick, onShapeSelect }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [picker, setPicker] = useState<PickerState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    cellRect: { x: 0, y: 0, width: 0, height: 0 },
    row: 0,
    col: 0,
    cellId: '',
    selectedShape: null
  });

  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    const cell = grid[row][col];
    if (cell.shape === CatShape && !cell.locked) {
      const cellElement = event.currentTarget as HTMLElement;
      const rect = cellElement.getBoundingClientRect();
      
      // Calculate cell center
      const cellCenterX = rect.left + rect.width / 2;
      const cellCenterY = rect.top + rect.height / 2;
      
      // Position picker centered on cell (same center X and Y)
      const x = cellCenterX - PICKER_WIDTH / 2;
      const y = cellCenterY - PICKER_HEIGHT / 2;

      const cellId = `cell-${row}-${col}`;

      setPicker({
        isOpen: true,
        position: { x, y },
        cellRect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        row,
        col,
        cellId,
        selectedShape: null
      });
    }
    onCellClick(row, col);
  };

  const handleShapeSelect = (shape: Exclude<ShapeId, 0>) => {
    // Store the selected shape and close picker
    setPicker(prev => ({ 
      ...prev, 
      isOpen: false,
      selectedShape: shape 
    }));
    
    // Trigger the shape selection (this updates the grid state)
    onShapeSelect(picker.row, picker.col, shape);
  };

  // Get grid dimensions
  const height = grid.length;
  const width = grid[0].length;

  // Memoize viewport size to avoid recalculating on every render
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const handleResize = () => {
      // Debounce resize events to avoid excessive recalculations
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewportSize({ width: window.innerWidth, height: window.innerHeight });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Memoize cell size calculation to avoid recalculating on every render
  const cellSize = useMemo(() => {
    const viewportWidth = viewportSize.width;
    const viewportHeight = viewportSize.height;
    
    // Base cell sizes for different screen sizes
    let baseCellSize: number;
    if (viewportWidth < 640) { // mobile
      baseCellSize = Math.min(80, (viewportWidth - 80) / Math.max(width, height));
    } else if (viewportWidth < 1024) { // tablet
      baseCellSize = Math.min(100, (viewportWidth - 200) / Math.max(width, height));
    } else { // desktop
      baseCellSize = Math.min(120, (viewportHeight - 200) / Math.max(width, height));
    }
    
    return Math.max(60, baseCellSize); // Minimum cell size of 60px
  }, [viewportSize.width, viewportSize.height, width, height]);
  const gap = Math.max(8, cellSize * 0.1); // Gap proportional to cell size, minimum 8px
  const paddingX = BOARD_PADDING_X;
  const paddingY = BOARD_PADDING_Y;

  // Calculate the total grid content size
  const gridContentWidth = width * cellSize + (width - 1) * gap;
  const gridContentHeight = height * cellSize + (height - 1) * gap;

  // Generate cellId for layoutId matching
  const getCellId = (row: number, col: number) => `cell-${row}-${col}`;

  return (
    <LayoutGroup>
      {/* Wrapper div with margin to allow glow to show - glow extends ~30px outward */}
      {/* Using inline-flex to ensure proper sizing while allowing overflow */}
      <div style={{ margin: '40px', display: 'inline-flex', overflow: 'visible' }}>
        <motion.div
          ref={gridRef}
          className="board-frame relative flex items-center justify-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            width: gridContentWidth + paddingX * 2,
            height: gridContentHeight + paddingY * 2,
            maxWidth: '100%',
            maxHeight: '100%',
            padding: `${paddingY}px ${paddingX}px`,
            // 9-slice border image - corners stay fixed, edges and center stretch
            borderStyle: 'solid',
            borderWidth: `${paddingY}px ${paddingX}px`,
            borderImageSource: 'url(/art/board_3x2_sliceable.png)',
            borderImageSlice: `${BORDER_SLICE} fill`,
            borderImageRepeat: 'stretch',
            // Use only filter drop-shadow - follows the actual rendered shape
            // box-shadow creates rectangular glow that doesn't match rounded corners
            filter: createGridGlowFilter(),
          }}
        >
          {/* Animated diagonal shine overlay - covers frame + board (hidden for now)
          <motion.div
            className="absolute pointer-events-none z-20 overflow-hidden"
            style={{ 
              top: `-${paddingY}px`,
              left: `-${paddingX}px`,
              right: `-${paddingX}px`,
              bottom: `-${paddingY}px`,
              borderRadius: '16px',
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 6,
                ease: 'easeInOut',
              }}
              style={{
                background: `linear-gradient(
                  135deg,
                  transparent 0%,
                  transparent 42%,
                  rgba(255, 255, 255, 0.15) 46%,
                  rgba(255, 255, 255, 0.35) 50%,
                  rgba(255, 255, 255, 0.15) 54%,
                  transparent 58%,
                  transparent 100%
                )`,
                width: '100%',
                height: '100%',
              }}
            />
          </motion.div>
          */}
          <div 
            className="grid relative z-10"
            style={{ 
              gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
              gap: `${gap}px`,
              width: 'fit-content',
            height: 'fit-content',
            transform: `translateY(${CONTENT_OFFSET_Y}px)`,
          }}
        >
          {grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const cellId = getCellId(rowIndex, colIndex);
              const isPickerTarget = picker.cellId === cellId;
              const shouldUseLayoutId = isPickerTarget && picker.selectedShape !== null;
              
              return (
                <motion.div
                  key={cellId}
                  className={`grid-cell-art ${cell.shape === CatShape && !cell.locked ? 'cursor-pointer' : ''}`}
                  style={{ 
                    width: `${cellSize}px`, 
                    height: `${cellSize}px`,
                    backgroundImage: 'url(/art/shape_cell_01.png)',
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }}
                  whileHover={cell.shape === CatShape && !cell.locked ? { scale: 1.02 } : undefined}
                  whileTap={cell.shape === CatShape && !cell.locked ? { scale: 0.98 } : undefined}
                  onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                >
                  <Shape 
                    type={cell.shape} 
                    isLocked={cell.locked}
                    layoutId={shouldUseLayoutId ? `shape-${cellId}-${picker.selectedShape}` : undefined}
                  />
                </motion.div>
              );
            })
          ))}
        </div>

        {picker.isOpen && (
          <ShapePicker
            position={picker.position}
            cellRect={picker.cellRect}
            targetCellId={picker.cellId}
            onSelect={handleShapeSelect}
            onClose={() => setPicker(prev => ({ ...prev, isOpen: false }))}
          />
        )}
        </motion.div>
      </div>
    </LayoutGroup>
  );
};
