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

  const shapeStyles: Record<number, ShapeStyle> = {
    [SquareShape]: {
      image: '/art/square_01.png',
      className: 'w-4/5 h-4/5'
    },
    [CircleShape]: {
      image: '/art/circle_01.png',
      className: 'w-4/5 h-4/5'
    },
    [TriangleShape]: {
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
        alt={String(type)} 
        className="w-full h-full object-contain p-1"
      />
    </motion.div>
  );
}; 