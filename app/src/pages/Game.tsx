import React, { useState, useEffect, useRef } from 'react';
import { Grid } from '../components/grid/Grid';
import { ConstraintsPanel } from '../components/constraints/ConstraintsPanel';
import { VictoryModal } from '../components/VictoryModal';
import { TopBar } from '../components/TopBar';
import { BottomBar } from '../components/BottomBar';
import { useGame } from '../contexts/GameContext';
import { useTutorial } from '../contexts/TutorialContext';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';

export const Game: React.FC = () => {
  const {
    puzzle,
    showVictory,
    isLoaded,
    timer,
    difficulty,
    handleCellClick,
    handleShapeSelect,
    handleCloseVictory,
    handleNextLevel,
  } = useGame();
  
  const { resetIdleTimer, markTutorialComplete, isFirstTimeUser } = useTutorial();
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
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
            
            {/* Puzzle Grid - Centered */}
            <div ref={gridContainerRef} className="flex-shrink-0 flex items-center justify-center">
              <Grid 
                grid={puzzle.currentBoard}
                onCellClick={handleCellClickWithTutorial}
                onShapeSelect={handleShapeSelectWithTutorial}
                flipXY={shouldFlipXY}
              />
            </div>
            
            {/* Constraints Panel - Right side */}
            <div 
              className="flex-shrink-0 flex items-center justify-center h-full"
              style={{
                width: hasManyConstraints ? 'clamp(480px, 35vw, 580px)' : 'clamp(280px, 25vw, 400px)',
                maxHeight: 'calc(100vh - 200px)',
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

      {/* Victory Modal */}
      <VictoryModal
        isOpen={showVictory}
        onClose={handleCloseVictory}
        time={timer}
        onNextLevel={handleNextLevel}
      />
      
      {/* Tutorial Overlay - Shows idle hint for first-time users */}
      <TutorialOverlay gridRef={gridContainerRef} />
    </div>
  );
};
