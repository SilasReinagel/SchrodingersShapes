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
      <div className="h-screen flex items-center justify-center bg-transparent">
        <div className="text-xl text-white">Loading puzzle...</div>
      </div>
    );
  }

  if (!puzzle) return null;

  return (
    <div className="flex flex-col min-h-screen bg-transparent overflow-x-hidden">
      <div className="h-screen text-white relative overflow-x-hidden flex flex-col">
        <TopBar />

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-2 relative z-10 flex items-center justify-center pt-20 pb-20">
          <div className="flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-8 w-full max-h-[calc(100vh-120px)] relative overflow-x-hidden">
            {/* Puzzle Grid Container */}
            <div className="w-full lg:w-auto flex-shrink-0 flex justify-center lg:flex-1">
              <div className="w-full max-w-2xl lg:max-w-4xl h-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                <Grid 
                  grid={puzzle.currentBoard}
                  onCellClick={handleCellClick}
                  onShapeSelect={handleShapeSelect}
                />
              </div>
            </div>

            {/* Constraints Panel */}
            {/* TODO: Mobile layout - needs positioning strategy for smaller screens */}
            <div 
              className="w-full lg:fixed overflow-y-auto overflow-x-hidden flex-shrink-0"
              style={{
                // On wide layouts (lg breakpoint and above), anchor to right by 60/1920 of viewport width
                // 60/1920 = 3.125% of viewport width (60px on 1920px viewport)
                // Width is 520/1920 of viewport width (520px on 1920px viewport)
                // Vertically centered, max height is 80vh
                right: 'calc(60 / 1920 * 100vw)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 'clamp(0px, calc(520 / 1920 * 100vw), calc(520 / 1920 * 100vw))',
                maxWidth: 'calc(100vw - calc(60 / 1920 * 100vw) - 1rem)',
                maxHeight: '80vh',
              }}
            >
              <ConstraintsPanel 
                constraints={puzzle.definition.constraints} 
                grid={puzzle.currentBoard}
              />
            </div>
          </div>
        </main>

        {/* Victory Modal */}
        <VictoryModal
          isOpen={showVictory}
          onClose={handleCloseVictory}
          moves={puzzle.getMoveCount()}
          time={timer}
          onNextLevel={handleNextLevel}
        />
      </div>
      <BottomBar />
    </div>
  );
}; 