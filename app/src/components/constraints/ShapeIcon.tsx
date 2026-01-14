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

const CatSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    {/* Simple cat silhouette - head with ears */}
    <path d="M4 10 L4 4 L8 8 L16 8 L20 4 L20 10 C20 15 17 20 12 20 C7 20 4 15 4 10 Z" />
    {/* Eyes */}
    <circle cx="9" cy="12" r="1.5" fill="#1a1a2e" />
    <circle cx="15" cy="12" r="1.5" fill="#1a1a2e" />
  </svg>
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
        return <CatSVG className="w-full h-full" />;
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

