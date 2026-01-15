import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialTooltipProps {
  isVisible: boolean;
  content: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
  targetRect: DOMRect | null;
  onDismiss?: () => void;
}

/**
 * TutorialTooltip renders a styled tooltip anchored to a target element.
 * Used for contextual hints during the tutorial.
 */
export const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
  isVisible,
  content,
  position,
  targetRect,
  onDismiss,
}) => {
  if (!targetRect) return null;

  // Calculate tooltip position based on anchor position
  const getTooltipStyle = (): React.CSSProperties => {
    const offset = 16;
    
    switch (position) {
      case 'top':
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.top - offset,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.bottom + offset,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          left: targetRect.left - offset,
          top: targetRect.top + targetRect.height / 2,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          left: targetRect.right + offset,
          top: targetRect.top + targetRect.height / 2,
          transform: 'translateY(-50%)',
        };
    }
  };

  // Arrow pointing toward the target
  const getArrowStyle = (): React.CSSProperties => {
    const base = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
    };

    switch (position) {
      case 'top':
        return {
          ...base,
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid rgba(0, 229, 255, 0.4)',
        };
      case 'bottom':
        return {
          ...base,
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid rgba(0, 229, 255, 0.4)',
        };
      case 'left':
        return {
          ...base,
          right: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: '8px solid rgba(0, 229, 255, 0.4)',
        };
      case 'right':
        return {
          ...base,
          left: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: '8px solid rgba(0, 229, 255, 0.4)',
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed z-50 pointer-events-auto"
          style={getTooltipStyle()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={onDismiss}
        >
          <div 
            className="relative px-4 py-3 rounded-xl text-white text-sm max-w-xs"
            style={{
              background: 'rgba(15, 25, 45, 0.95)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {content}
            <div style={getArrowStyle()} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

