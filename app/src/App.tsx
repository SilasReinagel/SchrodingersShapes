import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { Game } from './pages/Game';
import { MainMenu } from './pages/MainMenu';
import { Designer } from './pages/Designer';
import { HowToPlay } from './pages/HowToPlay';
import { PerformanceProfiler, useProfilerToggle } from './components/PerformanceProfiler';
import { usePreloadAssets } from './hooks/usePreloadAssets';

const AppContent: React.FC = () => {
  const profilerEnabled = useProfilerToggle();
  usePreloadAssets();

  return (
    <>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/game" element={<Game />} />
        <Route path="/designer" element={<Designer />} />
        <Route path="/tutorial" element={<HowToPlay />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PerformanceProfiler enabled={profilerEnabled} />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <TutorialProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </TutorialProvider>
  );
};