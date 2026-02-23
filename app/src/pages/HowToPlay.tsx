import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Shape } from '../components/shapes/Shape';
import { 
  CatShape, 
  SquareShape, 
  CircleShape, 
  TriangleShape,
} from '../game/types';

type TutorialStepId = 'cats' | 'shapes' | 'constraints' | 'goal';

interface TutorialStepData {
  id: TutorialStepId;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

export const HowToPlay: React.FC = () => {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Tutorial steps content
  const steps: TutorialStepData[] = [
    {
      id: 'cats',
      title: 'The Quantum Cats',
      subtitle: 'They exist in superposition',
      content: (
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            className="w-32 h-32 relative"
            animate={{ 
              rotateY: [0, 360],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            <Shape type={CatShape} />
          </motion.div>
          <p className="text-center text-white/80 max-w-sm leading-relaxed">
            Every cell starts as a <span className="text-cyan-400 font-semibold">quantum cat</span>—neither 
            shape nor not-shape. Like Schrödinger's famous thought experiment, the cat exists in 
            all possibilities at once.
          </p>
          <div className="flex gap-4 mt-4">
            <motion.span 
              className="text-4xl"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🐱
            </motion.span>
            <span className="text-2xl text-white/40">=</span>
            <span className="text-4xl">❓</span>
          </div>
        </div>
      ),
    },
    {
      id: 'shapes',
      title: 'The Shapes',
      subtitle: 'Collapse the superposition',
      content: (
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-6">
            {[SquareShape, CircleShape, TriangleShape].map((shape, i) => (
              <motion.div
                key={shape}
                className="w-20 h-20"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.2, type: "spring" }}
              >
                <Shape type={shape} />
              </motion.div>
            ))}
          </div>
          <p className="text-center text-white/80 max-w-sm leading-relaxed">
            <span className="text-cyan-400 font-semibold">Tap a cat</span> to collapse its wave function 
            into one of three shapes: <span className="text-yellow-400">Square</span>, <span className="text-blue-400">Circle</span>, 
            or <span className="text-pink-400">Triangle</span>.
          </p>
          <motion.div
            className="flex items-center gap-4 mt-4"
            animate={{ x: [-5, 5, -5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-3xl">👆</span>
            <span className="text-white/60">→</span>
            <div className="w-12 h-12"><Shape type={CatShape} /></div>
            <span className="text-white/60">→</span>
            <div className="w-12 h-12"><Shape type={SquareShape} /></div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'constraints',
      title: 'The Constraints',
      subtitle: 'Rules of the quantum realm',
      content: (
        <div className="flex flex-col items-center gap-6">
          <div 
            className="p-4 rounded-xl space-y-3"
            style={{
              background: 'rgba(30, 40, 60, 0.8)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span className="text-white/80">A1 = Square</span>
              <span className="text-green-400/60 text-sm">satisfied</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-bold">○</span>
              <span className="text-white/80">B2 ≠ Circle</span>
              <span className="text-gray-400/60 text-sm">in progress</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-red-400 font-bold">✗</span>
              <span className="text-white/80">Row A: 1 Triangle</span>
              <span className="text-red-400/60 text-sm">violated</span>
            </div>
          </div>
          <p className="text-center text-white/80 max-w-sm leading-relaxed">
            Each puzzle has <span className="text-cyan-400 font-semibold">constraints</span> that must be satisfied. 
            Watch the checkmarks update in real-time as you place shapes!
          </p>
        </div>
      ),
    },
    {
      id: 'goal',
      title: 'The Goal',
      subtitle: 'All constraints green = victory!',
      content: (
        <div className="flex flex-col items-center gap-6">
          <motion.div
            className="text-6xl"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎉
          </motion.div>
          <div className="flex gap-2">
            {['✓', '✓', '✓', '✓'].map((check, i) => (
              <motion.span
                key={i}
                className="text-2xl text-green-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15, type: "spring" }}
              >
                {check}
              </motion.span>
            ))}
          </div>
          <p className="text-center text-white/80 max-w-sm leading-relaxed">
            When <span className="text-green-400 font-semibold">all constraints</span> show a green checkmark, 
            you've successfully collapsed the quantum puzzle! 
            Each level gets progressively more challenging.
          </p>
        </div>
      ),
    },
  ];

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className="min-h-screen text-white relative overflow-hidden flex flex-col">
      <TopBar />
      
      {/* Background gradient */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(0, 229, 255, 0.08) 0%, transparent 50%)',
        }}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-24 flex flex-col items-center justify-center">
        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStepIndex
                  ? 'bg-cyan-400 scale-125'
                  : index < currentStepIndex
                  ? 'bg-cyan-400/50'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            className="w-full max-w-lg"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <motion.h2 
                className="text-3xl font-bold mb-2"
                style={{ 
                  fontFamily: "'Fredoka', sans-serif",
                  textShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
                }}
              >
                {currentStep.title}
              </motion.h2>
              <p className="text-cyan-400/80">{currentStep.subtitle}</p>
            </div>
            
            <div className="min-h-[300px] flex items-center justify-center">
              {currentStep.content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex gap-4 mt-8">
          {!isFirstStep && (
            <motion.button
              onClick={() => setCurrentStepIndex(prev => prev - 1)}
              className="px-6 py-3 rounded-xl font-semibold border border-white/20 hover:border-white/40 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ← Back
            </motion.button>
          )}
          
          {!isLastStep && (
            <motion.button
              onClick={() => setCurrentStepIndex(prev => prev + 1)}
              className="px-6 py-3 rounded-xl font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Next →
            </motion.button>
          )}
          
          {isLastStep && (
            <motion.button
              onClick={() => navigate('/game')}
              className="px-6 py-3 rounded-xl font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start Playing →
            </motion.button>
          )}
        </div>

        {/* Skip link at bottom */}
        {!isLastStep && (
          <Link 
            to="/game" 
            className="mt-8 text-white/40 hover:text-white/60 text-sm underline"
          >
            Skip tutorial
          </Link>
        )}
      </main>
    </div>
  );
};

