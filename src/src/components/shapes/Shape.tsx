import { motion } from 'framer-motion';
import { Shape as ShapeType } from '../../game/types';

interface ShapeProps {
  type: ShapeType;
  className?: string;
  isLocked?: boolean;
}

type ShapeStyle = {
  className: string;
  element: typeof motion.div;
  style?: React.CSSProperties;
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
        <span className="text-4xl lg:text-6xl">?</span>
      </motion.div>
    );
  }

  const shapeStyles: Record<Exclude<ShapeType, 'cat'>, ShapeStyle> = {
    square: {
      className: 'bg-shape-square w-4/5 h-4/5 rounded-xl',
      element: motion.div,
      style: {
        boxShadow: '0 4px 12px rgba(255, 181, 186, 0.2)'
      }
    },
    circle: {
      className: 'bg-shape-circle w-4/5 h-4/5 rounded-full',
      element: motion.div,
      style: {
        boxShadow: '0 4px 12px rgba(168, 216, 255, 0.2)'
      }
    },
    triangle: {
      className: 'bg-shape-triangle w-4/5 h-4/5',
      element: motion.div,
      style: {
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        boxShadow: '0 4px 12px rgba(255, 229, 180, 0.2)'
      }
    }
  };

  const { element: Element, className: shapeClassName, style } = shapeStyles[type];

  return (
    <Element
      className={`shape ${shapeClassName} ${className} ${isLocked ? 'opacity-50' : ''}`}
      style={style}
      initial={{ scale: 0.8, opacity: isLocked ? 0.5 : 0 }}
      animate={{ scale: 1, opacity: isLocked ? 0.5 : 1 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    />
  );
}; 