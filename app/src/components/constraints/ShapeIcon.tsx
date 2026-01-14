import React from 'react';
import { ShapeId, CatShape, SquareShape, CircleShape, TriangleShape } from '../../game/types';

interface ShapeIconProps {
  shapeId: ShapeId;
  forbidden?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

/**
 * Basic SVG shapes for constraint display
 */
const SquareSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const CircleSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const TriangleSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <polygon points="12,2 22,22 2,22" />
  </svg>
);

const CatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img 
    src="/art/cat_icon_512.png" 
    alt="Cat shape" 
    className={className}
    style={{ objectFit: 'contain' }}
  />
);

/**
 * ShapeIcon renders a small SVG shape icon for constraint displays
 * with optional "forbidden" overlay (red diagonal slash)
 */
export const ShapeIcon: React.FC<ShapeIconProps> = ({ 
  shapeId, 
  forbidden = false, 
  size = 'md' 
}) => {
  const shapeColor = '#88c9f0';
  
  const renderShape = () => {
    switch (shapeId) {
      case CatShape:
        return <CatIcon className="w-full h-full" />;
      case SquareShape:
        return <SquareSVG className="w-full h-full" />;
      case CircleShape:
        return <CircleSVG className="w-full h-full" />;
      case TriangleShape:
        return <TriangleSVG className="w-full h-full" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`${sizeClasses[size]} relative flex-shrink-0`}
      style={{ color: shapeColor }}
    >
      {renderShape()}
      {forbidden && <ForbiddenOverlay />}
    </div>
  );
};

/**
 * ForbiddenOverlay renders a red diagonal slash
 * to indicate "none" or "is_not" constraints
 */
const ForbiddenOverlay: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div 
      className="absolute w-[140%] h-[3px] bg-rose-500 rounded-full shadow-[0_0_4px_rgba(244,63,94,0.8)]"
      style={{
        transform: 'rotate(-45deg)',
      }}
    />
  </div>
);

