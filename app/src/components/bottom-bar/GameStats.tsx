import React from 'react';
import { Sparkle } from './Sparkle';

interface GameStatsProps {
  time: string;
  moves: number;
}

export const GameStats: React.FC<GameStatsProps> = ({ time, moves }) => {
  const statsId = 'game-stats';
  const containerWidth = 280;
  const containerHeight = 44;
  const cornerRadius = 22;

  return (
    <div className="relative" style={{ width: containerWidth, height: containerHeight }}>
      {/* SVG Container */}
      <svg
        width={containerWidth}
        height={containerHeight}
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
        className="absolute inset-0"
      >
        <defs>
          {/* Dark inner gradient */}
          <linearGradient id={`${statsId}-fill`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a1535" />
            <stop offset="100%" stopColor="#0f0d1f" />
          </linearGradient>

          {/* Border gradient */}
          <linearGradient id={`${statsId}-border`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a3f7a" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#3d2b6b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4a3f7a" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Background pill shape */}
        <rect
          x="1"
          y="1"
          width={containerWidth - 2}
          height={containerHeight - 2}
          rx={cornerRadius}
          ry={cornerRadius}
          fill={`url(#${statsId}-fill)`}
        />

        {/* Border */}
        <rect
          x="1"
          y="1"
          width={containerWidth - 2}
          height={containerHeight - 2}
          rx={cornerRadius}
          ry={cornerRadius}
          fill="none"
          stroke={`url(#${statsId}-border)`}
          strokeWidth="1.5"
        />
      </svg>

      {/* Stats content */}
      <div className="absolute inset-0 flex items-center justify-between px-5">
        {/* TIME section */}
        <div className="flex items-center gap-2">
          <span
            className="font-semibold tracking-wide"
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '14px',
              color: '#a8b8d8',
            }}
          >
            TIME:
          </span>
          <span
            className="font-bold tracking-wide"
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '14px',
              color: '#b8d4ff',
            }}
          >
            {time}
          </span>
        </div>

        {/* MOVES section */}
        <div className="flex items-center gap-2">
          <span
            className="font-semibold tracking-wide"
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '14px',
              color: '#a8b8d8',
            }}
          >
            MOVES:
          </span>
          <span
            className="font-bold tracking-wide"
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '14px',
              color: '#b8d4ff',
            }}
          >
            {moves}
          </span>
          <Sparkle size={14} color="#b8d4ff" delay={0} />
        </div>
      </div>
    </div>
  );
};

