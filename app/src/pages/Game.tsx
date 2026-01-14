import React from 'react';
import { Grid } from '../components/grid/Grid';
import { ConstraintsPanel } from '../components/constraints/ConstraintsPanel';
import { VictoryModal } from '../components/VictoryModal';
import { TopBar } from '../components/TopBar';
import { BottomBar } from '../components/BottomBar';
import { useGame } from '../contexts/GameContext';

export const Game: React.FC = () => {
  const {
    puzzle,
    showVictory,
    isLoaded,
    timer,
    handleCellClick,
    handleShapeSelect,
    handleCloseVictory,
    handleNextLevel,
  } = useGame();

  // Show loading state if puzzle is not yet initialized
  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="text-xl text-white">Loading puzzle...</div>
      </div>
    );
  }

  if (!puzzle) return null;

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
          <div className="flex items-center justify-center gap-8 w-full h-full max-w-[1800px]">
            {/* Left spacer for symmetry on large screens */}
            <div className="hidden xl:block flex-1" />
            
            {/* Puzzle Grid - Centered */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <Grid 
                grid={puzzle.currentBoard}
                onCellClick={handleCellClick}
                onShapeSelect={handleShapeSelect}
              />
            </div>
            
            {/* Constraints Panel - Right side */}
            <div 
              className="flex-shrink-0 flex items-center justify-center h-full"
              style={{
                width: 'clamp(280px, 25vw, 400px)',
                maxHeight: 'calc(100vh - 200px)',
              }}
            >
              <ConstraintsPanel 
                constraints={puzzle.definition.constraints} 
                grid={puzzle.currentBoard}
                boardWidth={puzzle.currentBoard[0]?.length ?? 0}
                boardHeight={puzzle.currentBoard.length}
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
    </div>
  );
};
