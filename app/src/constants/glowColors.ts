/**
 * Shared glow color constants matching the TitleBanner text glow
 */
export const GLOW_COLORS = {
  // Primary glow color - lighter blue (matches TitleBanner textShadow)
  primary: 'rgba(176, 224, 255, 0.9)',
  // Secondary glow color - medium blue (matches TitleBanner textShadow)
  secondary: 'rgba(79, 195, 247, 0.6)',
} as const;

/**
 * Creates a drop-shadow filter string for consistent glow effects
 * Works better with border-image than box-shadow
 */
export const createGlowFilter = (): string => {
  return `drop-shadow(0 0 10px ${GLOW_COLORS.primary}) drop-shadow(0 0 20px ${GLOW_COLORS.secondary}) drop-shadow(0 0 30px ${GLOW_COLORS.secondary})`;
};

/**
 * Creates a box-shadow string for glow effects (when filter doesn't work)
 */
export const createGlowBoxShadow = (): string => {
  return `0 0 10px ${GLOW_COLORS.primary}, 0 0 20px ${GLOW_COLORS.secondary}, 0 0 30px ${GLOW_COLORS.secondary}`;
};

/**
 * Creates a reduced-intensity glow filter for Grid component
 */
export const createGridGlowFilter = (): string => {
  // Reduced opacity: 0.9 -> 0.5, 0.6 -> 0.3, 0.6 -> 0.2
  return `drop-shadow(0 0 10px rgba(176, 224, 255, 0.5)) drop-shadow(0 0 20px rgba(79, 195, 247, 0.3)) drop-shadow(0 0 30px rgba(79, 195, 247, 0.2))`;
};

/**
 * Creates a reduced-intensity box-shadow for Grid component
 */
export const createGridGlowBoxShadow = (): string => {
  // Reduced opacity: 0.9 -> 0.5, 0.6 -> 0.3, 0.6 -> 0.2
  return `0 0 10px rgba(176, 224, 255, 0.5), 0 0 20px rgba(79, 195, 247, 0.3), 0 0 30px rgba(79, 195, 247, 0.2)`;
};

