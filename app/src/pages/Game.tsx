import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Grid } from '../components/grid/Grid';
import { computeBoardFrameHeight } from '../components/grid/boardSizing';
import { ConstraintsPanel } from '../components/constraints/ConstraintsPanel';
import { VictoryModal } from '../components/VictoryModal';
import { TopBar } from '../components/TopBar';
import { BottomBar } from '../components/BottomBar';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';

export const Game: React.FC = () => {
  const {
    puzzle,
    puzzleSolved,
    showVictory,
    isLoaded,
    timer,
    difficulty,
    handleCellClick,
    handleShapeSelect,
    handleNextLevel,
  } = useGame();
  
  const { resetIdleTimer, markTutorialComplete, isFirstTimeUser } = useTutorial();
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useWindowSize();

  // Board frame visual height — same formula Grid uses, so panels match exactly
  const boardFrameHeight = useMemo(
    () => computeBoardFrameHeight(width, height),
    [width, height]
  );
  
  // Detect if we're on desktop (viewport width >= 1024px)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Flip XY for Level 2 and Level 4 on desktop
  const shouldFlipXY = isDesktop && (difficulty === 'level2' || difficulty === 'level4');
  
  // Wrap click handlers to reset tutorial idle timer
  const handleCellClickWithTutorial = (row: number, col: number) => {
    resetIdleTimer();
    handleCellClick(row, col);
  };
  
  const handleShapeSelectWithTutorial = (row: number, col: number, shape: Parameters<typeof handleShapeSelect>[2]) => {
    resetIdleTimer();
    handleShapeSelect(row, col, shape);
  };
  
  // Mark tutorial complete when player wins for the first time
  useEffect(() => {
    if (showVictory && isFirstTimeUser) {
      markTutorialComplete();
    }
  }, [showVictory, isFirstTimeUser, markTutorialComplete]);

  // Show loading state if puzzle is not yet initialized
  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="text-xl text-white">Loading puzzle...</div>
      </div>
    );
  }

  if (!puzzle) return null;
  
  // Use wider constraint panel when there are many constraints
  const hasManyConstraints = puzzle.definition.constraints.length > 6;

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Overlay Layer - Title & Author (z-30) */}
      <TopBar />
      
      {/* Overlay Layer - Footer Controls (z-30) */}
      <BottomBar />

      {/* Main Game Layer - Full viewport, behind overlays */}
      <main className="w-full h-full flex items-center justify-center text-white">
        {/* Symmetric Game Layout Container */}
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{
            // Padding to keep content away from overlay areas
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '40px',
            paddingRight: '40px',
          }}
        >
          {/* Game Content - Grid on left/center, Constraints on right */}
          <div className="flex items-center justify-center gap-12 w-full h-full max-w-[1800px]">
            {/* Left spacer for symmetry on large screens */}
            <div className="hidden xl:block flex-1" />
            
            {/* Puzzle Grid - Centered with victory highlight */}
            <div ref={gridContainerRef} className="flex-shrink-0 flex items-center justify-center relative overflow-visible">
              {puzzleSolved && (
                <motion.div
                  className="absolute rounded-3xl pointer-events-none"
                  style={{
                    top: -20,
                    right: -20,
                    bottom: -20,
                    left: -20,
                    border: '3px solid rgba(79, 195, 247, 0.6)',
                    background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.06), rgba(255, 181, 186, 0.04))',
                  }}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    boxShadow: [
                      '0 0 24px rgba(79, 195, 247, 0.5), 0 0 48px rgba(255, 181, 186, 0.35), inset 0 0 30px rgba(79, 195, 247, 0.1)',
                      '0 0 48px rgba(79, 195, 247, 0.7), 0 0 96px rgba(255, 181, 186, 0.5), inset 0 0 40px rgba(79, 195, 247, 0.15)',
                      '0 0 24px rgba(79, 195, 247, 0.5), 0 0 48px rgba(255, 181, 186, 0.35), inset 0 0 30px rgba(79, 195, 247, 0.1)',
                    ],
                  }}
                  transition={{
                    boxShadow: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 },
                  }}
                />
              )}
              <Grid 
                grid={puzzle.currentBoard}
                onCellClick={handleCellClickWithTutorial}
                onShapeSelect={handleShapeSelectWithTutorial}
                flipXY={shouldFlipXY}
              />
            </div>
            
            {/* Constraints Panel - Right side, phone frame matches board frame height */}
            <div 
              className="flex-shrink-0 flex flex-col min-h-0"
              style={{
                width: hasManyConstraints ? 'clamp(480px, 35vw, 580px)' : 'clamp(280px, 25vw, 400px)',
                height: boardFrameHeight + 64,
              }}
            >
              <ConstraintsPanel 
                constraints={puzzle.definition.constraints} 
                grid={puzzle.currentBoard}
                boardWidth={puzzle.currentBoard[0]?.length ?? 0}
                boardHeight={puzzle.currentBoard.length}
                flipXY={shouldFlipXY}
              />
            </div>
            
            {/* Right spacer for symmetry - hidden, constraints takes this space */}
            <div className="hidden xl:block flex-1" />
          </div>
        </div>
      </main>

      {/* Victory celebration: confetti + lock overlay (before modal) */}
      {puzzleSolved && (
        <>
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
            initialVelocityY={-5}
            colors={['#4FC3F7', '#FFB5BA', '#FFE5B4', '#00D9FF', '#FF00FF']}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 25,
            }}
          />
          <div
            className="fixed inset-0 z-20"
            aria-hidden="true"
            style={{ pointerEvents: 'auto' }}
          />
        </>
      )}

      {/* Victory Modal */}
      <VictoryModal
        isOpen={showVictory}
        time={timer}
        onNextLevel={handleNextLevel}
      />
      
      {/* Tutorial Overlay - Shows idle hint for first-time users */}
      {/* Disabled for now - no tutorial UI in main game */}
      {/* <TutorialOverlay gridRef={gridContainerRef} /> */}
    </div>
  );
};
