import React from 'react';

interface BannerShapeProps {
  width?: number;
  height?: number;
  diagonalInset?: number;
  cornerRadius?: number;
  flipped?: boolean;
  id?: string;
}

export const BannerShape: React.FC<BannerShapeProps> = ({
  width = 380,
  height = 72,
  flipped = false,
}) => {
  return (
    <div
      className="block"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: 'url(/art/banner_underlay_01.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        transform: flipped ? 'scaleX(-1)' : undefined,
        paddingBottom: '10px',
        boxSizing: 'border-box',
      }}
    />
  );
};

