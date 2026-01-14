import React from 'react';
import { BannerShape } from './BannerShape';

export const AuthorBanner: React.FC = () => {
  return (
    <div 
      className="fixed top-0 right-0 z-30 pointer-events-auto"
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(79, 195, 247, 0.3)) drop-shadow(0 0 20px rgba(10, 26, 58, 0.8))',
      }}
    >
      {/* Flipped Banner Shape */}
      <BannerShape 
        width={220}
        height={52}
        diagonalInset={32}
        cornerRadius={20}
        flipped={true}
        id="author-banner"
      />
      
      {/* Content overlay */}
      <div 
        className="absolute flex items-center justify-center pl-6"
        style={{
          top: '-3px',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <span 
          className="text-xs"
          style={{
            color: 'rgba(178, 189, 201, 0.8)',
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          a game by Silas Reinagel
        </span>
      </div>
    </div>
  );
};

