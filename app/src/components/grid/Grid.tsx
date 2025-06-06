import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { GameBoard, ShapeId } from '../../game/types';
import { Shape } from '../shapes/Shape';
import { ShapePicker } from '../shapes/ShapePicker';

interface GridProps {
  grid: GameBoard;
  onCellClick: (row: number, col: number) => void;
  onShapeSelect: (row: number, col: number, shape: ShapeId) => void;
}

interface PickerState {
  isOpen: boolean;
  position: { x: number; y: number };
  row: number;
  col: number;
}

export const Grid: React.FC<GridProps> = ({ grid, onCellClick, onShapeSelect }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [picker, setPicker] = useState<PickerState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    row: 0,
    col: 0
  });

  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    const cell = grid[row][col];
    if (cell.shape === 0 && !cell.locked) { // 0 is CatShape
      const cellElement = event.currentTarget as HTMLElement;
      const rect = cellElement.getBoundingClientRect();
      const gridRect = gridRef.current?.getBoundingClientRect() || rect;
      
      // Get picker dimensions (assuming our standard sizes from ShapePicker)
      const PICKER_WIDTH = 3 * 56 + 36; // 3 buttons (w-14=56px) + gaps and padding
      const PICKER_HEIGHT = 56 + 24; // 1 button height + padding
      const GAP = 12; // Space between cell and picker
      
      // Calculate position relative to the grid
      const x = rect.left - gridRect.left + (rect.width / 2) - (PICKER_WIDTH / 2);
      const y = rect.top - gridRect.top - PICKER_HEIGHT - GAP;

      setPicker({
        isOpen: true,
        position: { x, y },
        row,
        col
      });
    }
    onCellClick(row, col);
  };

  // Get grid dimensions
  const height = grid.length;
  const width = grid[0].length;

  // Calculate cell size based on screen size and grid dimensions
  const getCellSize = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
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
  };

  const cellSize = getCellSize();
  const gap = Math.max(8, cellSize * 0.1); // Gap proportional to cell size, minimum 8px

  return (
    <motion.div
      ref={gridRef}
      className="floating-panel relative flex items-center justify-center p-4 sm:p-6"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        width: 'fit-content',
        height: 'fit-content',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      <div 
        className="grid"
        style={{ 
          gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
          gap: `${gap}px`,
          width: 'fit-content',
          height: 'fit-content'
        }}
      >
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className={`grid-cell ${cell.shape === 0 && !cell.locked ? 'cursor-pointer' : ''}`}
              style={{ 
                width: `${cellSize}px`, 
                height: `${cellSize}px` 
              }}
              whileHover={cell.shape === 0 && !cell.locked ? { scale: 1.02 } : undefined}
              whileTap={cell.shape === 0 && !cell.locked ? { scale: 0.98 } : undefined}
              onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
            >
              <Shape type={cell.shape} isLocked={cell.locked} />
            </motion.div>
          ))
        ))}
      </div>

      {picker.isOpen && (
        <ShapePicker
          position={picker.position}
          onSelect={(shape) => {
            onShapeSelect(picker.row, picker.col, shape);
            setPicker(prev => ({ ...prev, isOpen: false }));
          }}
          onClose={() => setPicker(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </motion.div>
  );
}; 