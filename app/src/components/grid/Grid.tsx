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
  
  // Calculate the appropriate cell size based on grid dimensions
  // This helps ensure non-square grids display properly
  const isWide = width > height;
  const cellSizeClass = isWide 
    ? "w-full h-auto" 
    : "w-auto h-full";

  return (
    <motion.div
      ref={gridRef}
      className="floating-panel w-full h-full relative"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div 
        className={`grid h-full w-full gap-1 sm:gap-2 md:gap-3 p-2 sm:p-3 md:p-4 mx-auto ${cellSizeClass}`}
        style={{ 
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
          aspectRatio: `${width} / ${height}`,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className={`grid-cell p-1 sm:p-2 md:p-3 ${cell.shape === 0 && !cell.locked ? 'cursor-pointer' : ''}`}
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