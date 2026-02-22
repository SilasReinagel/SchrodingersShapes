import React from 'react';
import { ConstraintDefinition, isCountConstraint, isCellConstraint } from '../../game/types';

interface ScopeIconProps {
  constraint: ConstraintDefinition;
  boardWidth: number;
  boardHeight: number;
  size?: 'sm' | 'md' | 'lg';
  flipXY?: boolean;
}

// Base sizes for a 3x3 grid - we scale proportionally for other sizes
const baseSizes = {
  sm: { container: 32, gap: 1 },
  md: { container: 44, gap: 2 },
  lg: { container: 56, gap: 2 },
};

const cellSizeClasses = {
  sm: 'rounded-[1px]',
  md: 'rounded-[2px]',
  lg: 'rounded-sm',
};

/**
 * ScopeIcon renders a grid icon matching the board dimensions with highlighted regions
 * based on the constraint type:
 * - Row: highlights one horizontal row
 * - Column: highlights one vertical column
 * - Global: highlights all cells
 * - Cell: highlights one cell with crosshair overlay
 */
export const ScopeIcon: React.FC<ScopeIconProps> = ({ 
  constraint, 
  boardWidth, 
  boardHeight, 
  size = 'md',
  flipXY = false
}) => {
  const totalCells = boardWidth * boardHeight;

  // When flipXY is active, data rows are display columns and vice versa.
  // boardWidth/boardHeight are already display-swapped by the parent,
  // so we just need to swap the constraint's row↔column interpretation.
  const getHighlightedCells = (): Set<number> => {
    if (isCountConstraint(constraint)) {
      const { type, index = 0 } = constraint;
      
      if (type === 'global') {
        return new Set(Array.from({ length: totalCells }, (_, i) => i));
      }
      
      const displayType = flipXY ? (type === 'row' ? 'column' : type === 'column' ? 'row' : type) : type;
      
      if (displayType === 'row') {
        const rowStart = index * boardWidth;
        return new Set(Array.from({ length: boardWidth }, (_, i) => rowStart + i));
      }
      
      if (displayType === 'column') {
        return new Set(Array.from({ length: boardHeight }, (_, i) => index + i * boardWidth));
      }
    }
    
    if (isCellConstraint(constraint)) {
      const displayX = flipXY ? constraint.y : constraint.x;
      const displayY = flipXY ? constraint.x : constraint.y;
      const cellIndex = displayY * boardWidth + displayX;
      return new Set([cellIndex]);
    }
    
    return new Set();
  };

  const highlightedCells = getHighlightedCells();
  const isCellType = isCellConstraint(constraint);
  const isGlobal = isCountConstraint(constraint) && constraint.type === 'global';

  // Calculate dimensions - keep aspect ratio matching the board
  const { container: baseContainer, gap } = baseSizes[size];
  const maxDimension = Math.max(boardWidth, boardHeight);
  const cellSizeBase = (baseContainer - (maxDimension - 1) * gap) / maxDimension;
  
  const containerWidth = cellSizeBase * boardWidth + (boardWidth - 1) * gap;
  const containerHeight = cellSizeBase * boardHeight + (boardHeight - 1) * gap;

  return (
    <div 
      className="grid relative"
      style={{
        gridTemplateColumns: `repeat(${boardWidth}, 1fr)`,
        gridTemplateRows: `repeat(${boardHeight}, 1fr)`,
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        gap: `${gap}px`,
        // Add a border around the entire grid for global constraints
        ...(isGlobal && {
          outline: '2px solid #88c9f0',
          outlineOffset: '1px',
          borderRadius: '3px',
        }),
      }}
    >
      {Array.from({ length: totalCells }).map((_, i) => {
        const isHighlighted = highlightedCells.has(i);
        const isCellTarget = isCellType && isHighlighted;
        
        return (
          <div
            key={i}
            className={`
              ${cellSizeClasses[size]}
              transition-colors duration-200
              ${isCellTarget ? 'relative' : ''}
            `}
            style={{
              backgroundColor: isHighlighted ? '#88c9f0' : '#467095',
              boxShadow: isHighlighted ? '0 0 3px rgba(136, 201, 240, 0.5)' : 'none',
              // Add a visible border to cells to show grid structure
              // especially important for global constraints where all cells are same color
              border: isHighlighted ? '1px solid rgba(70, 112, 149, 0.6)' : 'none',
            }}
          >
            {/* Crosshair overlay for cell constraints */}
            {isCellTarget && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-full h-[2px] bg-amber-400/80" />
                <div className="absolute w-[2px] h-full bg-amber-400/80" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

