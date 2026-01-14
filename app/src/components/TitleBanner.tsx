import React from 'react';
import { BannerShape } from './BannerShape';
import { GLOW_COLORS } from '../constants/glowColors';

export const TitleBanner: React.FC = () => {
  return (
    <div 
      className="fixed top-0 left-0 z-20 pointer-events-auto"
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(79, 195, 247, 0.3)) drop-shadow(0 0 20px rgba(10, 26, 58, 0.8))',
      }}
    >
      {/* SVG Banner Shape */}
      <BannerShape 
        height={72}
        diagonalInset={32}
        cornerRadius={20}
        id="title-banner" 
      />
      
      {/* Content overlay */}
      <div 
        className="absolute flex items-center gap-2 px-3"
        style={{
          top: '-6px',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {/* Cat favicon */}
        <div 
          className="relative w-10 h-10 flex items-center justify-center"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(100, 150, 255, 0.6))',
          }}
        >
          <img 
            src="/art/cat_icon_512.png" 
            alt="Schrödinger's Cat"
            className="w-10 h-10 object-contain"
          />
        </div>
        
        {/* Title text */}
        <h1
          className="text-xl font-bold tracking-wide ml-2"
          style={{
            color: '#B0E0FF',
            textShadow: `0 0 10px ${GLOW_COLORS.primary}, 0 0 20px ${GLOW_COLORS.secondary}`,
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}
        >
          Schrödinger's Shapes
        </h1>
      </div>
    </div>
  );
};
