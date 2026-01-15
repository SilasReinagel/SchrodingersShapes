import { motion } from 'framer-motion';
import { ShapeId, CatShape, SquareShape, CircleShape, TriangleShape } from '../../game/types';

interface ShapeProps {
  type: ShapeId;
  className?: string;
  isLocked?: boolean;
  layoutId?: string; // Optional layoutId for shared element animations
}

type ShapeStyle = {
  image: string;
  className: string;
};

// Neon effect colors
const NEON_CYAN = '#00E5FF';

export const Shape: React.FC<ShapeProps> = ({ type, className = '', layoutId }) => {
  if (type === CatShape) {
    return (
      <motion.div
        className={`cat ${className}`}
        style={{ pointerEvents: 'none' }}
        initial={{ rotate: 0 }}
        animate={{ 
          rotate: [-5, 5, -5]
        }}
        transition={{ 
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <img 
          src="/art/cat_01.png" 
          alt="?" 
          className="w-full h-full object-contain p-2"
          style={{ pointerEvents: 'none' }}
        />
      </motion.div>
    );
  }

  // Map numeric shape IDs to their styles
  const shapeStyles = new Map<ShapeId, ShapeStyle>([
    [SquareShape, {
      image: '/art/square_01.png',
      className: 'w-4/5 h-4/5'
    }],
    [CircleShape, {
      image: '/art/circle_01.png',
      className: 'w-4/5 h-4/5'
    }],
    [TriangleShape, {
      image: '/art/triangle_01.png',
      className: 'w-4/5 h-4/5'
    }]
  ]);

  const style = shapeStyles.get(type);
  if (!style) {
    console.error(`No style found for shape type: ${type}`);
    return null;
  }

  // Use layoutId if provided for shared element transitions
  const shapeContent = (
    <img 
      src={style.image} 
      alt={String(type)} 
      className="w-full h-full object-contain p-1 relative z-10"
      style={{
        filter: `drop-shadow(0 0 6px ${NEON_CYAN}) drop-shadow(0 0 4px rgba(0, 229, 255, 0.4))`,
      }}
    />
  );

  // If we have a layoutId, wrap the image in a motion.div with that layoutId
  // This enables the "fly to slot" animation from the picker
  if (layoutId) {
    return (
      <motion.div
        className={`shape ${style.className} ${className} relative flex items-center justify-center`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          layoutId={layoutId}
          className="w-full h-full"
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
        >
          {shapeContent}
        </motion.div>
      </motion.div>
    );
  }

  // Regular rendering without layoutId (for backward compatibility)
  return (
    <motion.div
      className={`shape ${style.className} ${className} relative flex items-center justify-center`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    >
      {shapeContent}
    </motion.div>
  );
};
