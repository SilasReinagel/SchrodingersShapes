import { motion } from 'framer-motion';
import { Shape as ShapeType } from '../../game/types';

interface ShapeProps {
  type: ShapeType;
  className?: string;
  isLocked?: boolean;
}

type ShapeStyle = {
  image: string;
  className: string;
};

export const Shape: React.FC<ShapeProps> = ({ type, className = '', isLocked = false }) => {
  if (type === 'cat') {
    return (
      <motion.div
        className={`cat ${className} ${isLocked ? 'opacity-50' : ''}`}
        initial={{ opacity: 0.5, scale: 0.9 }}
        animate={{ 
          opacity: [0.5, 0.8, 0.5],
          scale: [0.9, 1, 0.9]
        }}
        transition={{ 
          duration: 2,
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

  const shapeStyles: Record<Exclude<ShapeType, 'cat'>, ShapeStyle> = {
    square: {
      image: '/art/square_01.png',
      className: 'w-4/5 h-4/5'
    },
    circle: {
      image: '/art/circle_01.png',
      className: 'w-4/5 h-4/5'
    },
    triangle: {
      image: '/art/triangle_01.png',
      className: 'w-4/5 h-4/5'
    }
  };

  const { image, className: shapeClassName } = shapeStyles[type];

  return (
    <motion.div
      className={`shape ${shapeClassName} ${className} ${isLocked ? 'opacity-50' : ''}`}
      initial={{ scale: 0.8, opacity: isLocked ? 0.5 : 0 }}
      animate={{ scale: 1, opacity: isLocked ? 0.5 : 1 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    >
      <img 
        src={image} 
        alt={type} 
        className="w-full h-full object-contain p-1"
      />
    </motion.div>
  );
}; 