import { motion } from 'framer-motion';
import { Grid as GridType } from '../../game/types';
import { Shape } from '../shapes/Shape';

interface GridProps {
  grid: GridType;
  onCellClick: (row: number, col: number) => void;
}

export const Grid: React.FC<GridProps> = ({ grid, onCellClick }) => {
  return (
    <motion.div
      className="floating-panel w-full h-full"
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
              className="grid-cell p-2 md:p-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCellClick(rowIndex, colIndex)}
            >
              <Shape type={cell.shape} isLocked={cell.locked} />
            </motion.div>
          ))
        ))}
      </div>
    </motion.div>
  );
}; 