import React from 'react';
import { motion } from 'framer-motion';

interface SparkleProps {
  size?: number;
  color?: string;
  delay?: number;
}

export const Sparkle: React.FC<SparkleProps> = ({
  size = 12,
  color = '#b8d4ff',
  delay = 0,
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="inline-block"
      initial={{ scale: 0.8, opacity: 0.6 }}
      animate={{
        scale: [0.8, 1, 0.8],
        opacity: [0.6, 1, 0.6],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    >
      {/* Four-pointed star sparkle */}
      <path
        d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"
        fill={color}
        style={{
          filter: `drop-shadow(0 0 3px ${color})`,
        }}
      />
    </motion.svg>
  );
};

