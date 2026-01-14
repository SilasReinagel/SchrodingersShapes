import React from 'react';

interface HamburgerMenuButtonProps {
  onClick?: () => void;
  size?: number;
}

export const HamburgerMenuButton: React.FC<HamburgerMenuButtonProps> = ({
  onClick,
  size = 28,
}) => {
  const lineWidth = size * 0.7;
  const lineHeight = 2.5;
  const gap = 5;

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110"
      style={{
        width: size + 8,
        height: size + 8,
        background: 'transparent',
        border: 'none',
      }}
      aria-label="Menu"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        <defs>
          <linearGradient id="hamburger-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5a7eb8" />
            <stop offset="50%" stopColor="#7a9ed8" />
            <stop offset="100%" stopColor="#5a7eb8" />
          </linearGradient>
        </defs>

        {/* Three horizontal lines */}
        {[0, 1, 2].map((i) => {
          const y = (size - (3 * lineHeight + 2 * gap)) / 2 + i * (lineHeight + gap);
          return (
            <rect
              key={i}
              x={(size - lineWidth) / 2}
              y={y}
              width={lineWidth}
              height={lineHeight}
              rx={lineHeight / 2}
              fill="url(#hamburger-line-gradient)"
            />
          );
        })}
      </svg>
    </button>
  );
};

