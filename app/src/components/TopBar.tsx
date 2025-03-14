import React from 'react';

export const TopBar: React.FC = () => {
  return (
    <header className="w-full h-16 bg-panel-bg flex items-center justify-between px-4 md:px-6">
      {/* Left: Game Title */}
      <h1 className="font-montserrat font-bold text-xl md:text-2xl text-text-primary">
        Schrödinger's Shapes
      </h1>

      {/* Center: Author Credit */}
      <div className="font-inter text-sm text-text-secondary">
        game by Silas Reinagel
      </div>
    </header>
  );
}; 