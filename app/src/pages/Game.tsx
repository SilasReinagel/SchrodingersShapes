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
    handleNextPuzzle,
  } = useGame();

  // Show loading state if puzzle is not yet initialized
  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl">Loading puzzle...</div>
      </div>
    );
  }

  if (!puzzle) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-screen text-text-primary relative overflow-hidden flex flex-col">
        <TopBar />

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-2 relative z-10 flex items-center justify-center overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-8 w-full max-h-[calc(100vh-120px)]">
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
            <div className="w-full lg:w-96 max-h-[calc(100vh-140px)] overflow-y-auto flex-shrink-0">
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
          onNextPuzzle={handleNextPuzzle}
        />
      </div>
      <BottomBar />
    </div>
  );
}; 