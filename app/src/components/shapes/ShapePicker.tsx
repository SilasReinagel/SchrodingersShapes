import { createPortal } from 'react-dom';
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
  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <motion.div
          className="fixed backdrop-blur-sm rounded-2xl flex gap-3 p-3"
          style={{
            left: position.x,
            top: position.y,
            zIndex: 100,
            background: 'rgba(79, 195, 247, 0.2)',
            border: '2px solid rgba(79, 195, 247, 0.5)',
            boxShadow: '0 0 30px rgba(79, 195, 247, 0.5), 0 10px 30px rgba(0, 0, 0, 0.5)'
          }}
          initial={{ scale: 0.9, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 8 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <div 
            className="absolute left-1/2 bottom-0 w-3 h-3 transform -translate-x-1/2 translate-y-1/2 rotate-45"
            style={{ 
              background: 'rgba(79, 195, 247, 0.2)',
              borderBottom: '2px solid rgba(79, 195, 247, 0.5)',
              borderRight: '2px solid rgba(79, 195, 247, 0.5)',
              backdropFilter: 'blur(8px)'
            }}
          />

          {shapes.map((shape) => (
            <motion.button
              key={shape}
              className="w-14 h-14 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: 'rgba(79, 195, 247, 0.1)',
                border: '1px solid rgba(79, 195, 247, 0.3)'
              }}
              whileHover={{ 
                scale: 1.1,
                background: 'rgba(79, 195, 247, 0.3)',
                boxShadow: '0 0 15px rgba(79, 195, 247, 0.5)'
              }}
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
    </AnimatePresence>,
    document.body
  );
}; 