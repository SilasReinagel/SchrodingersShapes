import { motion } from 'framer-motion';
import { ShapeId, CatShape, SquareShape, CircleShape, TriangleShape } from '../../game/types';

interface ShapeProps {
  type: ShapeId;
  className?: string;
  isLocked?: boolean;
}

type ShapeStyle = {
  image: string;
  className: string;
};

export const Shape: React.FC<ShapeProps> = ({ type, className = '', isLocked = false }) => {
  if (type === CatShape) {
    return (
      <motion.div
        className={`cat ${className} ${isLocked ? 'opacity-50' : ''}`}
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

  return (
    <motion.div
      className={`shape ${style.className} ${className} ${isLocked ? 'opacity-50' : ''} relative`}
      initial={{ scale: 0.8, opacity: isLocked ? 0.5 : 0 }}
      animate={{ scale: 1, opacity: isLocked ? 0.5 : 1 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    >
      {/* Glitch effect overlay */}
      <div 
        className="absolute inset-0 pointer-events-none glitch-overlay"
        style={{
          background: `
            linear-gradient(90deg, transparent 0%, rgba(255, 0, 0, 0.3) 50%, transparent 100%),
            linear-gradient(0deg, transparent 0%, rgba(0, 217, 255, 0.3) 50%, transparent 100%)
          `,
          mixBlendMode: 'screen',
          opacity: 0.6
        }}
      />
      <img 
        src={style.image} 
        alt={String(type)} 
        className="w-full h-full object-contain p-1 relative z-10"
        style={{
          filter: 'drop-shadow(0 0 4px rgba(255, 0, 0, 0.5)) drop-shadow(0 0 4px rgba(0, 217, 255, 0.5))'
        }}
      />
    </motion.div>
  );
}; 