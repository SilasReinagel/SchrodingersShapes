import React from 'react';
import { ConstraintDefinition, isCountConstraint, isCellConstraint } from '../../game/types';

interface ScopeIconProps {
  constraint: ConstraintDefinition;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 gap-[1px]',
  md: 'w-11 h-11 gap-[2px]',
  lg: 'w-14 h-14 gap-[2px]',
};

const cellSizeClasses = {
  sm: 'rounded-[1px]',
  md: 'rounded-[2px]',
  lg: 'rounded-sm',
};

/**
 * ScopeIcon renders a 3×3 grid icon with highlighted regions
 * based on the constraint type:
 * - Row: highlights one horizontal row
 * - Column: highlights one vertical column
 * - Global: highlights all cells
 * - Cell: highlights one cell with crosshair overlay
 */
export const ScopeIcon: React.FC<ScopeIconProps> = ({ constraint, size = 'md' }) => {
  // Determine which cells should be highlighted
  const getHighlightedCells = (): Set<number> => {
    if (isCountConstraint(constraint)) {
      const { type, index = 0 } = constraint;
      
      if (type === 'global') {
        // All cells highlighted
        return new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      }
      
      if (type === 'row') {
        // Highlight entire row (index 0 = top, 1 = middle, 2 = bottom)
        const rowStart = index * 3;
        return new Set([rowStart, rowStart + 1, rowStart + 2]);
      }
      
      if (type === 'column') {
        // Highlight entire column (index 0 = left, 1 = middle, 2 = right)
        return new Set([index, index + 3, index + 6]);
      }
    }
    
    if (isCellConstraint(constraint)) {
      // Highlight single cell at (x, y)
      // Grid layout: row-major, so cell index = y * 3 + x
      const cellIndex = constraint.y * 3 + constraint.x;
      return new Set([cellIndex]);
    }
    
    return new Set();
  };

  const highlightedCells = getHighlightedCells();
  const isCellType = isCellConstraint(constraint);
  const isGlobalType = isCountConstraint(constraint) && constraint.type === 'global';

  return (
    <div className={`grid grid-cols-3 ${sizeClasses[size]} relative`}>
      {Array.from({ length: 9 }).map((_, i) => {
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

