import { motion, AnimatePresence } from 'framer-motion';
import { ShapeId } from '../../game/types';
import { Shape } from './Shape';

interface ShapePickerProps {
  position: { x: number; y: number };
  onSelect: (shape: Exclude<ShapeId, 0>) => void;
  onClose: () => void;
}

const shapes: Exclude<ShapeId, 0>[] = [1, 2, 3];

export const ShapePicker: React.FC<ShapePickerProps> = ({ position, onSelect, onClose }) => {
  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <motion.div
          className="absolute bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/20 flex gap-3 p-3"
          style={{
            left: position.x,
            top: position.y,
            zIndex: 100
          }}
          initial={{ scale: 0.9, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 8 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <div 
            className="absolute left-1/2 bottom-0 w-3 h-3 bg-white/95 border-b border-r border-gray-100/20 transform -translate-x-1/2 translate-y-1/2 rotate-45"
            style={{ backdropFilter: 'blur(8px)' }}
          />

          {shapes.map((shape) => (
            <motion.button
              key={shape}
              className="w-14 h-14 rounded-xl hover:bg-white flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(shape)}
            >
              <div className="w-12 h-12">
                <Shape type={shape} />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}; 