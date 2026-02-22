import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
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
  anchorRect: DOMRect | null;
  flipXY?: boolean;
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
  boardHeight: number,
  flipXY: boolean = false
): string => {
  if (isCountConstraint(constraint)) {
    const { type, index = 0 } = constraint;
    
    if (type === 'global') {
      return 'the entire board';
    }
    
    // When flipXY is active, data rows display as columns and vice versa
    const displayType = flipXY ? (type === 'row' ? 'column' : type === 'column' ? 'row' : type) : type;
    
    if (displayType === 'row') {
      return `row ${index + 1}`;
    }
    
    if (displayType === 'column') {
      return `column ${index + 1}`;
    }
  }
  
  if (isCellConstraint(constraint)) {
    const displayX = flipXY ? constraint.y : constraint.x;
    const displayY = flipXY ? constraint.x : constraint.y;
    return `cell (${displayX + 1}, ${displayY + 1})`;
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
  boardHeight: number,
  flipXY: boolean = false
): { description: string; currentState: string } => {
  const scope = getScopeDescription(constraint, boardWidth, boardHeight, flipXY);
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
 * Renders via portal to avoid layout issues and clipping
 */
export const ConstraintHover: React.FC<ConstraintHoverProps> = ({
  constraint,
  grid,
  status,
  boardWidth,
  boardHeight,
  anchorRect,
  flipXY = false
}) => {
  const { description, currentState } = generateExplanation(constraint, grid, boardWidth, boardHeight, flipXY);
  const statusMsg = getStatusMessage(status);
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' } | null>(null);

  const tooltipWidth = 288; // w-72 = 18rem = 288px
  const tooltipHeight = 120; // approximate height
  const gap = 8; // space between tooltip and anchor

  useEffect(() => {
    if (!anchorRect) {
      setPosition(null);
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate horizontal position (centered on anchor, clamped to viewport)
    let left = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;
    left = Math.max(8, Math.min(left, viewportWidth - tooltipWidth - 8));

    // Determine vertical placement - prefer above, fall back to below
    const spaceAbove = anchorRect.top;
    const spaceBelow = viewportHeight - anchorRect.bottom;

    let top: number;
    let placement: 'above' | 'below';

    if (spaceAbove >= tooltipHeight + gap) {
      // Position above
      top = anchorRect.top - tooltipHeight - gap;
      placement = 'above';
    } else if (spaceBelow >= tooltipHeight + gap) {
      // Position below
      top = anchorRect.bottom + gap;
      placement = 'below';
    } else {
      // Default to above, even if clipped
      top = Math.max(8, anchorRect.top - tooltipHeight - gap);
      placement = 'above';
    }

    setPosition({ top, left, placement });
  }, [anchorRect]);

  if (!anchorRect || !position) return null;

  const tooltip = (
    <motion.div
      initial={{ opacity: 0, y: position.placement === 'above' ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position.placement === 'above' ? 10 : -10 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[9999] w-72 pointer-events-none"
      style={{ 
        top: position.top,
        left: position.left,
      }}
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
      
      {/* Arrow pointing to anchor */}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent ${
          position.placement === 'above' 
            ? 'top-full border-t-4 border-t-cyan-500/50' 
            : 'bottom-full border-b-4 border-b-cyan-500/50'
        }`}
        style={{
          // Adjust arrow position to point at anchor center
          left: anchorRect.left + anchorRect.width / 2 - position.left,
        }}
      />
    </motion.div>
  );

  return createPortal(tooltip, document.body);
};

