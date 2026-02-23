import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShapeId, SquareShape, CircleShape, TriangleShape } from '../../game/types';

interface ShapePickerProps {
  position: { x: number; y: number };
  cellRect: { x: number; y: number; width: number; height: number }; // Cell bounds for emanating effect
  targetCellId: string; // Unique ID for the target cell (for layoutId animation)
  onSelect: (shape: Exclude<ShapeId, 0>) => void;
  onClose: () => void;
}

const shapes: Exclude<ShapeId, 0>[] = [SquareShape, CircleShape, TriangleShape];

const shapeImages: Record<Exclude<ShapeId, 0>, string> = {
  [SquareShape]: '/art/square_01.png',
  [CircleShape]: '/art/circle_01.png',
  [TriangleShape]: '/art/triangle_01.png',
};

// Neon color scheme
const NEON_CYAN = '#00E5FF';
const NEON_CYAN_DIM = 'rgba(0, 229, 255, 0.3)';
const GLASS_BG = 'rgba(15, 25, 45, 0.85)';
const GLASS_BORDER = 'rgba(0, 229, 255, 0.4)';

// Picker dimensions (70% larger than original)
// Original: buttons 64px, gap 12px, padding 16px
// New: buttons 109px (~110), gap 20px, padding 28px
const BUTTON_SIZE = 110;
const BUTTON_GAP = 20;
const PADDING = 28;
const SHAPE_SIZE = 82; // Inner shape image size

export const PICKER_WIDTH = 3 * BUTTON_SIZE + 2 * BUTTON_GAP + 2 * PADDING; // ~486
export const PICKER_HEIGHT = BUTTON_SIZE + 2 * PADDING; // ~166

export const ShapePicker: React.FC<ShapePickerProps> = ({ 
  position, 
  onSelect, 
  onClose 
}) => {
  // Glass panel extends beyond the picker for the emanating effect
  const GLASS_EXTEND = 40;
  const glassWidth = PICKER_WIDTH + GLASS_EXTEND * 2;
  const glassHeight = PICKER_HEIGHT + GLASS_EXTEND * 2;

  return createPortal(
    <AnimatePresence>
      {/* Backdrop overlay */}
      <motion.div 
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        {/* Emanating Glass Panel - radiates outward from behind the picker */}
        <motion.div
          className="fixed pointer-events-none"
          style={{
            left: position.x - GLASS_EXTEND,
            top: position.y - GLASS_EXTEND,
            width: glassWidth,
            height: glassHeight,
            zIndex: 99,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring",
            damping: 20,
            stiffness: 200,
          }}
        >
          {/* SVG for the emanating glass shape */}
          <svg 
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${glassWidth} ${glassHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              {/* Radial gradient for the glass fill - emanates from center */}
              <radialGradient id="glassRadialGradient" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="rgba(25, 50, 80, 0.9)" />
                <stop offset="40%" stopColor="rgba(20, 40, 70, 0.7)" />
                <stop offset="70%" stopColor="rgba(15, 30, 55, 0.4)" />
                <stop offset="100%" stopColor="rgba(10, 20, 40, 0.1)" />
              </radialGradient>
              
              {/* Glow filter */}
              <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Hexagon pattern */}
              <pattern id="hexPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path 
                  d="M20 0l17.32 10v20L20 40 2.68 30v-20z" 
                  fill="none" 
                  stroke="rgba(0, 229, 255, 0.12)" 
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>

            {/* Outer glow ellipse */}
            <motion.ellipse
              cx={glassWidth / 2}
              cy={glassHeight / 2}
              rx={glassWidth / 2 - 5}
              ry={glassHeight / 2 - 5}
              fill="url(#glassRadialGradient)"
              filter="url(#glowFilter)"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* Hex pattern overlay */}
            <motion.ellipse
              cx={glassWidth / 2}
              cy={glassHeight / 2}
              rx={glassWidth / 2 - 10}
              ry={glassHeight / 2 - 10}
              fill="url(#hexPattern)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            />

            {/* Inner border glow */}
            <motion.ellipse
              cx={glassWidth / 2}
              cy={glassHeight / 2}
              rx={glassWidth / 2 - 20}
              ry={glassHeight / 2 - 20}
              fill="none"
              stroke="rgba(0, 229, 255, 0.15)"
              strokeWidth="1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            />

            {/* Animated pulse ring */}
            <motion.ellipse
              cx={glassWidth / 2}
              cy={glassHeight / 2}
              fill="none"
              stroke="rgba(0, 229, 255, 0.3)"
              strokeWidth="2"
              initial={{ rx: glassWidth / 4, ry: glassHeight / 4, opacity: 0.8 }}
              animate={{ 
                rx: [glassWidth / 4, glassWidth / 2 - 10],
                ry: [glassHeight / 4, glassHeight / 2 - 10],
                opacity: [0.6, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </svg>
        </motion.div>

        {/* Glass Panel Container - the main picker */}
        <motion.div
          className="fixed rounded-3xl overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            zIndex: 100,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ 
            type: "spring",
            damping: 20,
            stiffness: 300,
            mass: 0.8
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hexagonal pattern background */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0l34.64 20v40L40 80 5.36 60V20z' fill='none' stroke='%2300E5FF' stroke-width='1' stroke-opacity='0.3'/%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px',
            }}
          />
          
          {/* Glass effect layer */}
          <div 
            className="absolute inset-0"
            style={{
              background: GLASS_BG,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          />
          
          {/* Neon border glow */}
          <div 
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              border: `3px solid ${GLASS_BORDER}`,
              boxShadow: `
                0 0 30px ${NEON_CYAN_DIM},
                0 0 60px rgba(0, 229, 255, 0.2),
                inset 0 2px 2px rgba(255, 255, 255, 0.1)
              `,
            }}
          />

          {/* Shape buttons container */}
          <div 
            className="relative flex items-center justify-center"
            style={{ 
              gap: `${BUTTON_GAP}px`, 
              padding: `${PADDING}px` 
            }}
          >
            {shapes.map((shape, index) => (
              <motion.button
                key={shape}
                className="relative rounded-2xl flex items-center justify-center cursor-pointer group"
                style={{
                  width: `${BUTTON_SIZE}px`,
                  height: `${BUTTON_SIZE}px`,
                  background: 'rgba(0, 229, 255, 0.08)',
                  border: `2px solid ${GLASS_BORDER}`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  damping: 15,
                  stiffness: 400
                }}
                whileHover={{ 
                  scale: 1.08,
                  boxShadow: `
                    0 0 25px ${NEON_CYAN_DIM},
                    0 0 40px rgba(0, 229, 255, 0.3),
                    inset 0 0 30px rgba(0, 229, 255, 0.1)
                  `,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(shape)}
              >
                {/* Button glow overlay on hover */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background: `radial-gradient(circle at center, ${NEON_CYAN_DIM} 0%, transparent 70%)`,
                  }}
                />
                
                <div
                  className="relative z-10"
                  style={{
                    width: `${SHAPE_SIZE}px`,
                    height: `${SHAPE_SIZE}px`,
                  }}
                >
                  <img 
                    src={shapeImages[shape]} 
                    alt={`Shape ${shape}`}
                    className="w-full h-full object-contain"
                    style={{
                      filter: `drop-shadow(0 0 8px ${NEON_CYAN}) drop-shadow(0 0 16px rgba(0, 229, 255, 0.5))`,
                    }}
                  />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
