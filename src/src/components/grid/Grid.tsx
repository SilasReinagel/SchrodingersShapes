import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { Grid as GridType, Shape as ShapeType } from '../../game/types';
import { Shape } from '../shapes/Shape';
import { ShapePicker } from '../shapes/ShapePicker';

interface GridProps {
  grid: GridType;
  onCellClick: (row: number, col: number) => void;
  onShapeSelect: (row: number, col: number, shape: ShapeType) => void;
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
    if (cell.shape === 'cat' && !cell.locked) {
      const cellElement = event.currentTarget as HTMLElement;
      const rect = cellElement.getBoundingClientRect();
      const gridRect = gridRef.current?.getBoundingClientRect() || rect;
      
      // Get picker dimensions (assuming our standard sizes from ShapePicker)
      const PICKER_WIDTH = 3 * 56 +36; // 3 buttons (w-14=56px) + gaps and padding
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

  return (
    <motion.div
      ref={gridRef}
      className="floating-panel w-full h-full relative"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div 
        className="grid h-full gap-2 md:gap-3 p-3 md:p-4" 
        style={{ 
          gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))`
        }}
      >
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              className={`grid-cell p-2 md:p-3 ${cell.shape === 'cat' && !cell.locked ? 'cursor-pointer' : ''}`}
              whileHover={cell.shape === 'cat' && !cell.locked ? { scale: 1.02 } : undefined}
              whileTap={cell.shape === 'cat' && !cell.locked ? { scale: 0.98 } : undefined}
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