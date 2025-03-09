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
        initial={{ opacity: 0.5 }}
        animate={{ opacity: isLocked ? 0.5 : 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      >
        ?
      </motion.div>
    );
  }

  const shapeStyles: Record<Exclude<ShapeType, 'cat'>, ShapeStyle> = {
    square: {
      className: 'bg-[--shape-square] rounded-sm',
      element: motion.div
    },
    circle: {
      className: 'bg-[--shape-circle] rounded-full',
      element: motion.div
    },
    triangle: {
      className: 'bg-[--shape-triangle]',
      element: motion.div,
      style: {
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
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
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  );
}; 