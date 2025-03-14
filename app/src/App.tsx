import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Game } from './pages/Game';
import { Designer } from './pages/Designer';
import { GameProvider } from './contexts/GameContext';

const App = () => {
  return (
    <div className="min-h-screen bg-background font-inter">
      <BrowserRouter>
        <GameProvider>
          <Routes>
            <Route path="/" element={<Game />} />
            <Route path="/designer" element={<Designer />} />
          </Routes>
        </GameProvider>
      </BrowserRouter>
    </div>
  );
};

export default App;