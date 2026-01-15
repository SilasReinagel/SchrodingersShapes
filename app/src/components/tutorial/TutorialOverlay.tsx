import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '../../contexts/TutorialContext';

interface TutorialOverlayProps {
  gridRef: React.RefObject<HTMLDivElement>;
}

/**
 * TutorialOverlay provides subtle visual hints for first-time users.
 * 
 * When idle for 8+ seconds on Level 1, shows a pulsing highlight on 
 * the first Cat cell with a tooltip saying "Tap a cat to reveal its true form"
 */
export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ gridRef }) => {
  const { shouldShowIdleHint, resetIdleTimer, markHintSeen, hasSeenHint } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Find the first cat cell when hint should show
  useEffect(() => {
    if (!shouldShowIdleHint || hasSeenHint('idle_pulse')) {
      setIsVisible(false);
      return;
    }

    const findFirstCatCell = () => {
      if (!gridRef.current) return null;
      
      // Find all cells with the "cursor-pointer" class (clickable cats)
      const catCells = gridRef.current.querySelectorAll('.grid-cell-art.cursor-pointer');
      return catCells[0] as HTMLElement | null;
    };

    const catCell = findFirstCatCell();
    if (catCell) {
      const rect = catCell.getBoundingClientRect();
      setTargetRect(rect);
      setIsVisible(true);
    }
  }, [shouldShowIdleHint, gridRef, hasSeenHint]);

  // Handle user interaction - dismiss the hint
  useEffect(() => {
    if (!isVisible) return;

    const handleInteraction = () => {
      setIsVisible(false);
      markHintSeen('idle_pulse');
      resetIdleTimer();
    };

    // Listen for any click/tap to dismiss
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [isVisible, markHintSeen, resetIdleTimer]);

  if (!isVisible || !targetRect) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-40">
        {/* Pulsing ring around the target cell */}
        <motion.div
          className="absolute rounded-lg"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Outer glow ring */}
          <div 
            className="absolute inset-0 rounded-lg"
            style={{
              border: '3px solid #00E5FF',
              boxShadow: `
                0 0 20px rgba(0, 229, 255, 0.6),
                0 0 40px rgba(0, 229, 255, 0.4),
                inset 0 0 20px rgba(0, 229, 255, 0.2)
              `,
            }}
          />
        </motion.div>

        {/* Expanding pulse rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-lg border-2 border-cyan-400"
            style={{
              left: targetRect.left - 8,
              top: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ 
              opacity: 0,
              scale: 1.5,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Tooltip */}
        <motion.div
          className="absolute"
          style={{
            left: targetRect.left + targetRect.width / 2,
            top: targetRect.bottom + 20,
            transform: 'translateX(-50%)',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <div 
            className="px-4 py-2 rounded-xl text-white text-sm font-medium whitespace-nowrap"
            style={{
              background: 'rgba(15, 25, 45, 0.95)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
            }}
          >
            <span className="text-cyan-400">Tap</span> a cat to reveal its true form
            
            {/* Arrow pointing up */}
            <div 
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '8px solid rgba(0, 229, 255, 0.4)',
              }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

