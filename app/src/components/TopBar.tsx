import React from 'react';
import { TitleBanner } from './TitleBanner';
import { AuthorBanner } from './AuthorBanner';

export const TopBar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 w-full h-16 flex items-center justify-between px-4 md:px-6 z-10 bg-transparent pointer-events-none">
      {/* Left: Title Banner */}
      <TitleBanner />
      {/* Right: Author Banner */}
      <AuthorBanner />
    </header>
  );
};