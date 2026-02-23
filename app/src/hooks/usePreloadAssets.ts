import { useEffect, useState } from 'react';

const GAME_IMAGES = [
  '/art/lab_bg_01_dk.jpg',
  '/art/cat_01.png',
  '/art/cat_icon_512.png',
  '/art/square_01.png',
  '/art/circle_01.png',
  '/art/triangle_01.png',
  '/art/board_3x2_sliceable.png',
  '/art/shape_cell_01.png',
  '/art/panel_constraint_01.png',
  '/art/banner_underlay_01.png',
];

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function usePreloadAssets() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all(GAME_IMAGES.map(preloadImage)).then(() => setReady(true));
  }, []);

  return ready;
}
