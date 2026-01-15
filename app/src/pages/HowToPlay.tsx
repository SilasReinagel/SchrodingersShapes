import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { Shape } from '../components/shapes/Shape';
import { 
  CatShape, 
  SquareShape, 
  CircleShape, 
  TriangleShape,
  ShapeId,
  Cell,
  ConstraintDefinition 
} from '../game/types';

// Tutorial step definitions
type TutorialStepId = 'cats' | 'shapes' | 'constraints' | 'goal' | 'try_it';

interface TutorialStepData {
  id: TutorialStepId;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

// Mini puzzle state for the "Try It" step
interface MiniPuzzleState {
  board: Cell[][];
  constraints: ConstraintDefinition[];
  selectedCell: { row: number; col: number } | null;
  isSolved: boolean;
}

const initialMiniPuzzle: MiniPuzzleState = {
  board: [
    [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
    [{ shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
  ],
  constraints: [
    { type: 'cell', x: 0, y: 0, rule: { shape: SquareShape, operator: 'is' } },
    { type: 'cell', x: 1, y: 1, rule: { shape: CircleShape, operator: 'is' } },
  ],
  selectedCell: null,
  isSolved: false,
};

// Check if a constraint is satisfied
const isConstraintSatisfied = (constraint: ConstraintDefinition, board: Cell[][]): boolean => {
  if (constraint.type === 'cell') {
    const cell = board[constraint.y]?.[constraint.x];
    if (!cell) return false;
    
    if (constraint.rule.operator === 'is') {
      return cell.shape === constraint.rule.shape;
    } else {
      return cell.shape !== constraint.rule.shape && cell.shape !== CatShape;
    }
  }
  return false;
};

// Shape Picker for mini puzzle
const MiniShapePicker: React.FC<{
  onSelect: (shape: ShapeId) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  const shapes: ShapeId[] = [SquareShape, CircleShape, TriangleShape];
  
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flex gap-3 p-4 rounded-2xl"
        style={{
          background: 'rgba(15, 25, 45, 0.95)',
          border: '2px solid rgba(0, 229, 255, 0.4)',
          boxShadow: '0 0 40px rgba(0, 229, 255, 0.4)',
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        onClick={(e) => e.stopPropagation()}
      >
        {shapes.map((shape) => (
          <motion.button
            key={shape}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center"
            style={{
              width: '72px',
              height: '72px',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '2px solid rgba(0, 229, 255, 0.3)',
            }}
            whileHover={{ scale: 1.1, background: 'rgba(0, 229, 255, 0.25)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(shape)}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14">
              <Shape type={shape} />
            </div>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

// Mini Puzzle Grid for the "Try It" step
const MiniPuzzleGrid: React.FC<{
  puzzle: MiniPuzzleState;
  onCellClick: (row: number, col: number) => void;
  onShapeSelect: (shape: ShapeId) => void;
  onClosePicker: () => void;
}> = ({ puzzle, onCellClick, onShapeSelect, onClosePicker }) => {
  const { board, selectedCell } = puzzle;
  
  return (
    <div className="relative">
      <div 
        className="grid grid-cols-2 gap-3 p-5 rounded-2xl"
        style={{
          background: 'rgba(30, 40, 60, 0.8)',
          border: '2px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '0 0 30px rgba(0, 229, 255, 0.15)',
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isCat = cell.shape === CatShape;
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            
            return (
              <motion.button
                key={`${rowIndex}-${colIndex}`}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl flex items-center justify-center ${
                  isCat ? 'cursor-pointer' : 'cursor-default'
                }`}
                style={{
                  backgroundImage: 'url(/art/shape_cell_01.png)',
                  backgroundSize: '100% 100%',
                  border: isSelected ? '3px solid #00E5FF' : '3px solid transparent',
                  boxShadow: isSelected ? '0 0 15px rgba(0, 229, 255, 0.5)' : 'none',
                }}
                whileHover={isCat ? { scale: 1.05 } : undefined}
                whileTap={isCat ? { scale: 0.95 } : undefined}
                onClick={() => isCat && onCellClick(rowIndex, colIndex)}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20">
                  <Shape type={cell.shape} />
                </div>
              </motion.button>
            );
          })
        )}
      </div>
      
      <AnimatePresence>
        {selectedCell && (
          <MiniShapePicker
            onSelect={onShapeSelect}
            onClose={onClosePicker}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Mini Constraints Panel
const MiniConstraintsPanel: React.FC<{
  constraints: ConstraintDefinition[];
  board: Cell[][];
}> = ({ constraints, board }) => {
  const getConstraintLabel = (constraint: ConstraintDefinition): string => {
    if (constraint.type === 'cell') {
      const col = String.fromCharCode(65 + constraint.y); // A, B, etc.
      const row = constraint.x + 1;
      const shapeName = ['Cat', 'Square', 'Circle', 'Triangle'][constraint.rule.shape];
      const op = constraint.rule.operator === 'is' ? '=' : '≠';
      return `${col}${row} ${op} ${shapeName}`;
    }
    return '';
  };

  return (
    <div 
      className="space-y-3 p-5 rounded-2xl min-w-[180px]"
      style={{
        background: 'rgba(30, 40, 60, 0.8)',
        border: '2px solid rgba(0, 229, 255, 0.3)',
        boxShadow: '0 0 30px rgba(0, 229, 255, 0.15)',
      }}
    >
      <div className="text-sm text-cyan-400 font-semibold uppercase tracking-wider mb-4">
        Constraints
      </div>
      {constraints.map((constraint, index) => {
        const satisfied = isConstraintSatisfied(constraint, board);
        
        return (
          <div 
            key={index}
            className="flex items-center gap-3 text-base"
          >
            <motion.span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                satisfied 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
              }`}
              animate={satisfied ? { scale: [1, 1.2, 1] } : undefined}
              transition={{ duration: 0.3 }}
            >
              {satisfied ? '✓' : '○'}
            </motion.span>
            <span className="text-white/90 font-medium">{getConstraintLabel(constraint)}</span>
          </div>
        );
      })}
    </div>
  );
};

export const HowToPlay: React.FC = () => {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [miniPuzzle, setMiniPuzzle] = useState<MiniPuzzleState>(initialMiniPuzzle);
  
  // Handle cell click in mini puzzle
  const handleCellClick = useCallback((row: number, col: number) => {
    setMiniPuzzle(prev => ({
      ...prev,
      selectedCell: prev.selectedCell?.row === row && prev.selectedCell?.col === col 
        ? null 
        : { row, col },
    }));
  }, []);
  
  // Handle shape selection in mini puzzle
  const handleShapeSelect = useCallback((shape: ShapeId) => {
    setMiniPuzzle(prev => {
      if (!prev.selectedCell) return prev;
      
      const newBoard = prev.board.map((row, rowIndex) =>
        row.map((cell, colIndex) =>
          rowIndex === prev.selectedCell!.row && colIndex === prev.selectedCell!.col
            ? { ...cell, shape }
            : cell
        )
      );
      
      // Check if puzzle is solved
      const allSatisfied = prev.constraints.every(c => isConstraintSatisfied(c, newBoard));
      
      return {
        ...prev,
        board: newBoard,
        selectedCell: null,
        isSolved: allSatisfied,
      };
    });
  }, []);
  
  // Close picker
  const handleClosePicker = useCallback(() => {
    setMiniPuzzle(prev => ({ ...prev, selectedCell: null }));
  }, []);
  
  // Reset mini puzzle
  const resetMiniPuzzle = useCallback(() => {
    setMiniPuzzle(initialMiniPuzzle);
  }, []);

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
    {
      id: 'try_it',
      title: 'Try It!',
      subtitle: 'Your first quantum collapse',
      content: (
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <MiniPuzzleGrid
              puzzle={miniPuzzle}
              onCellClick={handleCellClick}
              onShapeSelect={handleShapeSelect}
              onClosePicker={handleClosePicker}
            />
            <MiniConstraintsPanel
              constraints={miniPuzzle.constraints}
              board={miniPuzzle.board}
            />
          </div>
          
          <AnimatePresence mode="wait">
            {miniPuzzle.isSolved ? (
              <motion.div
                key="success"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <motion.div
                  className="text-4xl"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                >
                  🎉
                </motion.div>
                <p className="text-green-400 font-semibold text-lg">You've got it!</p>
                <button
                  onClick={() => navigate('/game')}
                  className="px-6 py-3 rounded-xl font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)',
                    boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
                  }}
                >
                  Start Playing →
                </button>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                className="text-white/60 text-sm text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Tap the cats and select shapes to satisfy both constraints
              </motion.p>
            )}
          </AnimatePresence>
          
          {!miniPuzzle.isSolved && (
            <button
              onClick={resetMiniPuzzle}
              className="text-cyan-400/60 hover:text-cyan-400 text-sm underline"
            >
              Reset puzzle
            </button>
          )}
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
          
          {isLastStep && !miniPuzzle.isSolved && (
            <Link to="/game">
              <motion.button
                className="px-6 py-3 rounded-xl font-semibold border border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Skip to Game
              </motion.button>
            </Link>
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

