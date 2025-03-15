import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import { Game } from './pages/Game';
import { MainMenu } from './pages/MainMenu';
import { Designer } from './pages/Designer';

export const App: React.FC = () => {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/game" element={<Game />} />
        <Route path="/designer" element={<Designer />} />
        <Route path="/tutorial" element={<Navigate to="/game" replace />} /> {/* TODO: Add tutorial page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameProvider>
  );
};