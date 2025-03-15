import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { BottomBar } from '../components/BottomBar';
import { CatShape } from '../game/types';
import { Shape } from '../components/shapes/Shape';

export const MainMenu: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-screen text-text-primary relative overflow-hidden flex flex-col">
        <TopBar />

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-2 relative z-10 flex items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center justify-center w-full max-w-2xl">
            {/* Animated Cat Shape */}
            <motion.div 
              className="mb-12 relative"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                duration: 1.5,
                bounce: 0.5
              }}
            >
              {/* Background glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-shape-square via-shape-circle to-shape-triangle rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Cat Shape */}
              <motion.div
                className="relative w-48 h-48 md:w-64 md:h-64"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Shape type={CatShape} />
              </motion.div>
            </motion.div>

            {/* Menu Options */}
            <motion.div
              className="w-full space-y-4 mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link to="/game" className="block">
                <motion.button
                  className="w-full py-4 px-8 bg-panel-bg text-text-primary rounded-xl font-bold text-lg hover:bg-cell-hover transition-colors border border-cell-border"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Play Game
                </motion.button>
              </Link>

              <Link to="/tutorial" className="block">
                <motion.button
                  className="w-full py-4 px-8 bg-panel-bg text-text-primary rounded-xl font-bold text-lg hover:bg-cell-hover transition-colors border border-cell-border"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  How to Play
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}; 