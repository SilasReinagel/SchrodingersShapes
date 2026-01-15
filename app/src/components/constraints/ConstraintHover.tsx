import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ConstraintDefinition, 
  GameBoard,
  ConstraintState,
  isCountConstraint, 
  isCellConstraint,
  CatShape,
  ShapeId,
  ShapeNames
} from '../../game/types';
import { getCellsInScope } from './constraintStatus';

interface ConstraintHoverProps {
  constraint: ConstraintDefinition;
  grid: GameBoard;
  status: ConstraintState;
  boardWidth: number;
  boardHeight: number;
}

/**
 * Count shapes in cells, returning detailed counts
 */
const countShapesDetailed = (
  cells: { shape: number }[], 
  targetShape: number | undefined
): { matching: number; cats: number; committed: number; total: number } => {
  let matching = 0;
  let cats = 0;
  let committed = 0;

  cells.forEach(cell => {
    if (cell.shape === CatShape) {
      cats++;
      if (targetShape !== undefined && targetShape !== CatShape) {
        matching++; // Cat counts as matching for "at least" purposes
      }
    } else if (targetShape === undefined || cell.shape === targetShape) {
      matching++;
      committed++;
    }
  });

  return { matching, cats, committed, total: cells.length };
};

/**
 * Get shape name for display
 */
const getShapeName = (shapeId: ShapeId): string => {
  return ShapeNames[shapeId] || 'Unknown';
};

/**
 * Get scope description
 */
const getScopeDescription = (
  constraint: ConstraintDefinition,
  boardWidth: number,
  boardHeight: number
): string => {
  if (isCountConstraint(constraint)) {
    const { type, index = 0 } = constraint;
    
    if (type === 'global') {
      return 'the entire board';
    }
    
    if (type === 'row') {
      // Convert 0-indexed to 1-indexed for display
      return `row ${index + 1}`;
    }
    
    if (type === 'column') {
      // Convert 0-indexed to 1-indexed for display
      return `column ${index + 1}`;
    }
  }
  
  if (isCellConstraint(constraint)) {
    // Convert 0-indexed to 1-indexed for display
    return `cell (${constraint.x + 1}, ${constraint.y + 1})`;
  }
  
  return 'unknown scope';
};

/**
 * Get operator description
 */
const getOperatorDescription = (constraint: ConstraintDefinition): string => {
  if (isCountConstraint(constraint)) {
    const { operator, count } = constraint.rule;
    
    if (operator === 'exactly') {
      return `exactly ${count}`;
    }
    
    if (operator === 'at_least') {
      return `at least ${count}`;
    }
    
    if (operator === 'at_most') {
      return `at most ${count}`;
    }
    
    if (operator === 'none' || count === 0) {
      return 'no';
    }
  }
  
  if (isCellConstraint(constraint)) {
    const { operator } = constraint.rule;
    return operator === 'is' ? 'is' : 'is not';
  }
  
  return 'unknown';
};

/**
 * Generate English explanation of constraint
 */
const generateExplanation = (
  constraint: ConstraintDefinition,
  grid: GameBoard,
  boardWidth: number,
  boardHeight: number
): { description: string; currentState: string } => {
  const scope = getScopeDescription(constraint, boardWidth, boardHeight);
  const cells = getCellsInScope(grid, constraint);
  
  if (isCountConstraint(constraint)) {
    const { rule } = constraint;
    const shapeName = rule.shape !== undefined ? getShapeName(rule.shape) : 'shapes';
    const operatorDesc = getOperatorDescription(constraint);
    
    const { matching, cats, committed, total } = countShapesDetailed(cells, rule.shape);
    
    // Build description
    let description = '';
    if (rule.operator === 'none' || rule.count === 0) {
      // "No X" constraint
      description = `In ${scope}, there must be no ${shapeName.toLowerCase()}${rule.shape !== undefined ? 's' : ''}.`;
    } else {
      description = `In ${scope}, there must be ${operatorDesc} ${shapeName.toLowerCase()}${rule.shape !== undefined ? (rule.count === 1 ? '' : 's') : ' (any shape)'}.`;
    }
    
    // Build current state
    let currentState = '';
    if (rule.shape !== undefined) {
      if (committed > 0) {
        currentState = `Currently: ${committed} ${shapeName.toLowerCase()}${committed === 1 ? '' : 's'}`;
        if (cats > 0) {
          currentState += ` and ${cats} cat${cats === 1 ? '' : 's'} (could become ${shapeName.toLowerCase()}${cats === 1 ? '' : 's'})`;
        }
      } else if (cats > 0) {
        currentState = `Currently: ${cats} cat${cats === 1 ? '' : 's'} (could become ${shapeName.toLowerCase()}${cats === 1 ? '' : 's'})`;
      } else {
        currentState = `Currently: 0 ${shapeName.toLowerCase()}s`;
      }
    } else {
      // Counting all shapes (unusual case)
      currentState = `Currently: ${total} cell${total === 1 ? '' : 's'} total`;
    }
    
    return { description, currentState };
  }
  
  if (isCellConstraint(constraint)) {
    const { rule } = constraint;
    const shapeName = getShapeName(rule.shape);
    const cell = grid[constraint.y]?.[constraint.x];
    
    const operatorDesc = rule.operator === 'is' ? 'must be' : 'must not be';
    const description = `Cell (${constraint.x + 1}, ${constraint.y + 1}) ${operatorDesc} a ${shapeName.toLowerCase()}.`;
    
    let currentState = '';
    if (cell) {
      const currentShapeName = getShapeName(cell.shape);
      if (cell.shape === CatShape) {
        currentState = `Currently: Cat (could become ${shapeName.toLowerCase()})`;
      } else {
        currentState = `Currently: ${currentShapeName}`;
      }
    } else {
      currentState = 'Currently: Empty';
    }
    
    return { description, currentState };
  }
  
  return { description: 'Unknown constraint', currentState: '' };
};

/**
 * Get status message
 */
const getStatusMessage = (status: ConstraintState): { text: string; color: string } => {
  switch (status) {
    case 'satisfied':
      return { text: '✓ Satisfied', color: 'text-emerald-400' };
    case 'violated':
      return { text: '✗ Violated', color: 'text-rose-400' };
    case 'in_progress':
      return { text: '○ In Progress', color: 'text-amber-400' };
    default:
      return { text: '? Unknown', color: 'text-gray-400' };
  }
};

/**
 * ConstraintHover displays a tooltip with English explanation of the constraint
 */
export const ConstraintHover: React.FC<ConstraintHoverProps> = ({
  constraint,
  grid,
  status,
  boardWidth,
  boardHeight
}) => {
  const { description, currentState } = generateExplanation(constraint, grid, boardWidth, boardHeight);
  const statusMsg = getStatusMessage(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-72 pointer-events-none"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      <div className="bg-slate-900/95 border border-cyan-500/50 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        {/* Description */}
        <p className="text-sm text-cyan-100 mb-2 leading-relaxed">
          {description}
        </p>
        
        {/* Current State */}
        {currentState && (
          <p className="text-xs text-slate-300 mb-2 border-t border-slate-700 pt-2">
            {currentState}
          </p>
        )}
        
        {/* Status */}
        <div className={`text-xs font-semibold ${statusMsg.color} border-t border-slate-700 pt-2`}>
          {statusMsg.text}
        </div>
      </div>
      
      {/* Arrow pointing down */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-cyan-500/50" />
    </motion.div>
  );
};

