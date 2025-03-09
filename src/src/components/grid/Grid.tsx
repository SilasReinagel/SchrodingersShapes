import { motion } from 'framer-motion';
import { Grid as GridType } from '../../game/types';
import { Shape } from '../shapes/Shape';

interface GridProps {
  grid: GridType;
  onCellClick: (row: number, col: number) => void;
}

export const Grid: React.FC<GridProps> = ({ grid, onCellClick }) => {
  return (
    <div className="grid gap-2" style={{ 
      gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))`
    }}>
      {grid.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <motion.div
            key={`${rowIndex}-${colIndex}`}
            className="aspect-square bg-gray-100 rounded-lg shadow-sm cursor-pointer hover:bg-gray-200 transition-colors"
            whileTap={{ scale: 0.95 }}
            onClick={() => onCellClick(rowIndex, colIndex)}
          >
            <Shape type={cell.shape} isLocked={cell.locked} />
          </motion.div>
        ))
      ))}
    </div>
  );
}; 