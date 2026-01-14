import React from 'react';
import { motion } from 'framer-motion';
import { ConstraintDefinition, GameBoard } from '../../game/types';
import { getConstraintStates } from './constraintStatus';
import { ConstraintRow } from './ConstraintRow';
import { createGlowFilter } from '../../constants/glowColors';

interface ConstraintsPanelProps {
  constraints: ConstraintDefinition[];
  grid: GameBoard;
  boardWidth: number;
  boardHeight: number;
}

/**
 * ConstraintsPanel displays all puzzle constraints with:
 * - Scope indicators (3×3 grid icons showing row/column/global/cell)
 * - Operator symbols (=, ≥, ≤, ≠)
 * - Shape icons with forbidden overlays when needed
 * - Status indicators (checkmark, X, or empty)
 */
export const ConstraintsPanel: React.FC<ConstraintsPanelProps> = ({ 
  constraints, 
  grid,
  boardWidth,
  boardHeight
}) => {
  const constraintStates = getConstraintStates(grid, constraints);

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Outer wrapper with padding for glow effect visibility */}
      <div className="p-8">
        <div 
          className="p-4 md:p-5 space-y-2 overflow-y-auto overflow-x-hidden"
          style={{
            borderImageSource: 'url(/art/panel_constraint_01.png)',
            borderImageSlice: '64 fill',
            borderImageWidth: '0.5',
            borderImageRepeat: 'stretch',
            borderStyle: 'solid',
            borderWidth: '55px',
            maxHeight: 'calc(100vh - 240px)',
            // Use filter drop-shadow for consistent glow that works with border-image
            filter: createGlowFilter(),
          }}
        >
          {constraints.map((constraint, index) => (
            <ConstraintRow
              key={index}
              constraint={constraint}
              status={constraintStates[index]}
              index={index}
              boardWidth={boardWidth}
              boardHeight={boardHeight}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
