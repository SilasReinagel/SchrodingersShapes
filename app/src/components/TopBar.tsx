import React from 'react';
import { TitleBanner } from './TitleBanner';
import { AuthorBanner } from './AuthorBanner';

export const TopBar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-30 pointer-events-none">
      {/* Left: Title Banner */}
      <TitleBanner />
      {/* Right: Author Banner */}
      <AuthorBanner />
    </header>
  );
};