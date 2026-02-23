import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ConstraintDefinition, 
  ConstraintState,
  GameBoard,
  isCountConstraint, 
  isCellConstraint, 
  CatShape,
  ShapeId 
} from '../../game/types';
import { ScopeIcon } from './ScopeIcon';
import { OperatorDisplay } from './OperatorDisplay';
import { ShapeIcon } from './ShapeIcon';
import { ConstraintHover } from './ConstraintHover';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

// Re-export for backwards compatibility
export type { ConstraintState };

interface ConstraintRowProps {
  constraint: ConstraintDefinition;
  status: ConstraintState;
  index: number;
  boardWidth: number;
  boardHeight: number;
  grid: GameBoard;
  flipXY?: boolean;
}

/**
 * Get the operator from a constraint
 * When count is 0, display as "≠" instead of "= 0×"
 */
const getOperator = (constraint: ConstraintDefinition): 'exactly' | 'at_least' | 'at_most' | 'none' | 'is' | 'is_not' => {
  if (isCountConstraint(constraint)) {
    // If count is 0, treat it as 'none' to display "≠" instead of "= 0×"
    if (constraint.rule.count === 0) {
      return 'none';
    }
    return constraint.rule.operator;
  }
  if (isCellConstraint(constraint)) {
    return constraint.rule.operator;
  }
  return 'exactly';
};

/**
 * Get the shape from a constraint
 */
const getShape = (constraint: ConstraintDefinition): ShapeId => {
  if (isCountConstraint(constraint)) {
    return constraint.rule.shape ?? CatShape;
  }
  if (isCellConstraint(constraint)) {
    return constraint.rule.shape;
  }
  return CatShape;
};

/**
 * Get the count display for a constraint
 */
const getCountDisplay = (constraint: ConstraintDefinition): string | null => {
  if (isCountConstraint(constraint)) {
    const { operator, count } = constraint.rule;
    
    // When count is 0, we display "≠" instead of "= 0×" or "0×"
    if (count === 0 || operator === 'none') {
      return null;
    }
    
    return `${count}×`;
  }
  
  // Cell constraints don't show count
  return null;
};

/**
 * Check if shape should show forbidden overlay
 */
const isForbidden = (_constraint: ConstraintDefinition): boolean => {
  // Don't show forbidden overlay when operator displays "≠" symbol
  // The ≠ symbol itself is sufficient to indicate the constraint
  return false;
};

/**
 * ConstraintRow renders a single constraint with:
 * [ScopeIcon] [OperatorDisplay] [Count?] [ShapeIcon] [StatusIcon]
 */
export const ConstraintRow: React.FC<ConstraintRowProps> = ({ 
  constraint, 
  status, 
  index,
  boardWidth,
  boardHeight,
  grid,
  flipXY = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (rowRef.current) {
      setAnchorRect(rowRef.current.getBoundingClientRect());
    }
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setAnchorRect(null);
  }, []);
  
  const operator = getOperator(constraint);
  const shapeId = getShape(constraint);
  const countDisplay = getCountDisplay(constraint);
  const forbidden = isForbidden(constraint);

  // Background tint based on status
  const statusBgClass = status === 'satisfied'
    ? 'bg-green-500/10'
    : status === 'violated'
      ? 'bg-rose-500/10'
      : 'bg-transparent';

  return (
    <motion.div
      ref={rowRef}
      initial={{ x: 20, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        ...(status === 'violated' && {
          x: [0, -4, 4, -2, 2, 0]
        })
      }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.1,
        ...(status === 'violated' && {
          x: { duration: 0.4, ease: 'easeInOut' }
        })
      }}
      className={`
        relative flex items-center gap-3 px-2 py-1.5 rounded-lg
        transition-colors duration-200
        ${statusBgClass}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence>
        {isHovered && (
          <ConstraintHover
            constraint={constraint}
            grid={grid}
            status={status}
            boardWidth={boardWidth}
            boardHeight={boardHeight}
            anchorRect={anchorRect}
            flipXY={flipXY}
          />
        )}
      </AnimatePresence>
      {/* Scope indicator (grid matching board size) */}
      <div className="flex-shrink-0">
        <ScopeIcon constraint={constraint} boardWidth={boardWidth} boardHeight={boardHeight} size="md" flipXY={flipXY} />
      </div>
      
      {/* Operator and count */}
      <div className="flex items-center gap-2 text-2xl md:text-3xl font-nunito font-bold flex-1" style={{ color: '#88c9f0' }}>
        <OperatorDisplay operator={operator} className="text-2xl md:text-3xl" />
        {countDisplay && (
          <span className="tabular-nums text-2xl md:text-3xl">{countDisplay}</span>
        )}
        <ShapeIcon shapeId={shapeId} forbidden={forbidden} size="lg" />
      </div>
      
      {/* Status indicator - larger, bolder checkmarks */}
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        {status === 'satisfied' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <CheckIcon className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" strokeWidth={3} />
          </motion.div>
        )}
        {status === 'violated' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <XMarkIcon className="w-8 h-8 text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.6)]" strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
