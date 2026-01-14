import React from 'react';
import { motion } from 'framer-motion';

interface ActionButtonProps {
  label: string;
  onClick?: () => void;
  width?: number;
  height?: number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onClick,
  width = 100,
  height = 40,
}) => {
  const cornerRadius = 12;
  const buttonId = `action-btn-${label.toLowerCase()}`;

  return (
    <motion.button
      onClick={onClick}
      className="relative cursor-pointer"
      style={{
        width,
        height,
        background: 'transparent',
        border: 'none',
        padding: 0,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        style={{
          filter: 'drop-shadow(0 2px 8px rgba(79, 195, 247, 0.4))',
        }}
      >
        <defs>
          {/* Main gradient - cyan/blue */}
          <linearGradient id={`${buttonId}-fill`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5ac8fa" />
            <stop offset="50%" stopColor="#34a8d9" />
            <stop offset="100%" stopColor="#2d8abf" />
          </linearGradient>

          {/* Border gradient */}
          <linearGradient id={`${buttonId}-border`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dd8ff" />
            <stop offset="100%" stopColor="#2980b9" />
          </linearGradient>

          {/* Inner shadow for 3D effect */}
          <filter id={`${buttonId}-inner`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset dx="0" dy="2" in="blur" result="offsetBlur" />
            <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
          </filter>
        </defs>

        {/* Button shape */}
        <rect
          x="2"
          y="2"
          width={width - 4}
          height={height - 4}
          rx={cornerRadius}
          ry={cornerRadius}
          fill={`url(#${buttonId}-fill)`}
        />

        {/* Border */}
        <rect
          x="2"
          y="2"
          width={width - 4}
          height={height - 4}
          rx={cornerRadius}
          ry={cornerRadius}
          fill="none"
          stroke={`url(#${buttonId}-border)`}
          strokeWidth="2"
        />

        {/* Top highlight for 3D effect */}
        <rect
          x="10"
          y="5"
          width={width - 20}
          height="3"
          rx="1.5"
          fill="rgba(255, 255, 255, 0.25)"
        />
      </svg>

      {/* Button text */}
      <span
        className="absolute inset-0 flex items-center justify-center font-semibold tracking-wide"
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: '14px',
          color: '#ffffff',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        }}
      >
        {label}
      </span>
    </motion.button>
  );
};

