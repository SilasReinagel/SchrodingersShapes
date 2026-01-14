import React from 'react';

interface BottomBarContainerProps {
  width?: number;
  height?: number;
  cornerRadius?: number;
  id?: string;
  children?: React.ReactNode;
}

export const BottomBarContainer: React.FC<BottomBarContainerProps> = ({
  width = 800,
  height = 64,
  cornerRadius = 32,
  id = 'bottom-bar',
  children,
}) => {
  const gradientId = `${id}-gradient`;
  const borderGlowId = `${id}-borderGlow`;
  const innerShadowId = `${id}-innerShadow`;

  return (
    <div className="relative" style={{ width, height }}>
      {/* SVG Container Shape */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(79, 195, 247, 0.2)) drop-shadow(0 0 20px rgba(43, 47, 118, 0.6))',
        }}
      >
        <defs>
          {/* Main gradient fill - deep purple */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3d2b6b" />
            <stop offset="50%" stopColor="#2a1f4e" />
            <stop offset="100%" stopColor="#1e1640" />
          </linearGradient>

          {/* Border gradient - purple glow */}
          <linearGradient id={borderGlowId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b5b95" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#4a3f7a" stopOpacity="1" />
            <stop offset="100%" stopColor="#3d2b6b" stopOpacity="0.8" />
          </linearGradient>

          {/* Inner shadow filter */}
          <filter id={innerShadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feComponentTransfer in="SourceAlpha">
              <feFuncA type="table" tableValues="1 0" />
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="3" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feFlood floodColor="#8b7bb8" floodOpacity="0.3" />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main pill/stadium shape */}
        <rect
          x="2"
          y="2"
          width={width - 4}
          height={height - 4}
          rx={cornerRadius}
          ry={cornerRadius}
          fill={`url(#${gradientId})`}
          filter={`url(#${innerShadowId})`}
        />

        {/* Border stroke */}
        <rect
          x="2"
          y="2"
          width={width - 4}
          height={height - 4}
          rx={cornerRadius}
          ry={cornerRadius}
          fill="none"
          stroke={`url(#${borderGlowId})`}
          strokeWidth="3"
        />

        {/* Top highlight */}
        <rect
          x="20"
          y="4"
          width={width - 40}
          height="2"
          rx="1"
          fill="rgba(139, 123, 184, 0.4)"
        />
      </svg>

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center px-4">
        {children}
      </div>
    </div>
  );
};

