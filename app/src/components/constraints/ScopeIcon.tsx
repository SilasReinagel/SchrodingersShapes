import React from 'react';
import { ConstraintDefinition, isCountConstraint, isCellConstraint } from '../../game/types';

interface ScopeIconProps {
  constraint: ConstraintDefinition;
  boardWidth: number;
  boardHeight: number;
  size?: 'sm' | 'md' | 'lg';
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
  size = 'md' 
}) => {
  const totalCells = boardWidth * boardHeight;

  // Determine which cells should be highlighted
  const getHighlightedCells = (): Set<number> => {
    if (isCountConstraint(constraint)) {
      const { type, index = 0 } = constraint;
      
      if (type === 'global') {
        // All cells highlighted
        return new Set(Array.from({ length: totalCells }, (_, i) => i));
      }
      
      if (type === 'row') {
        // Highlight entire row (index 0 = top row, etc.)
        const rowStart = index * boardWidth;
        return new Set(Array.from({ length: boardWidth }, (_, i) => rowStart + i));
      }
      
      if (type === 'column') {
        // Highlight entire column (index 0 = left column, etc.)
        return new Set(Array.from({ length: boardHeight }, (_, i) => index + i * boardWidth));
      }
    }
    
    if (isCellConstraint(constraint)) {
      // Highlight single cell at (x, y)
      // Grid layout: row-major, so cell index = y * boardWidth + x
      const cellIndex = constraint.y * boardWidth + constraint.x;
      return new Set([cellIndex]);
    }
    
    return new Set();
  };

  const highlightedCells = getHighlightedCells();
  const isCellType = isCellConstraint(constraint);

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

