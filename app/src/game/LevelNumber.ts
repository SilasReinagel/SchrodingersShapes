import type { Difficulty } from './types';

/**
 * Level Number System
 * 
 * Encodes difficulty and seed into a single level number.
 * Format: DSSSS where D = difficulty (1-5), SSSS = seed (0000-9999)
 * 
 * Examples:
 * - 10000 = Difficulty 1, Seed 0
 * - 21005 = Difficulty 2, Seed 1005
 * - 35000 = Difficulty 3, Seed 5000
 * - 49999 = Difficulty 4, Seed 9999
 */

const SEEDS_PER_DIFFICULTY = 10000;

const DIFFICULTY_TO_NUMBER: Record<Difficulty, number> = {
  level1: 1,
  level2: 2,
  level3: 3,
  level4: 4,
  level5: 5,
};

const NUMBER_TO_DIFFICULTY: Record<number, Difficulty> = {
  1: 'level1',
  2: 'level2',
  3: 'level3',
  4: 'level4',
  5: 'level5',
};

/**
 * Encodes a difficulty and seed into a level number
 */
export const encodeLevelNumber = (difficulty: Difficulty, seed: number): number => {
  const diffNum = DIFFICULTY_TO_NUMBER[difficulty];
  const clampedSeed = Math.max(0, Math.min(SEEDS_PER_DIFFICULTY - 1, seed));
  return diffNum * SEEDS_PER_DIFFICULTY + clampedSeed;
};

/**
 * Decodes a level number into difficulty and seed
 */
export const decodeLevelNumber = (levelNumber: number): { difficulty: Difficulty; seed: number } => {
  const diffNum = Math.floor(levelNumber / SEEDS_PER_DIFFICULTY);
  const seed = levelNumber % SEEDS_PER_DIFFICULTY;
  
  // Clamp difficulty to valid range
  const clampedDiffNum = Math.max(1, Math.min(5, diffNum));
  const difficulty = NUMBER_TO_DIFFICULTY[clampedDiffNum];
  
  return { difficulty, seed };
};

/**
 * Gets the next level number (increments by 1)
 * When seed reaches 9999, wraps to 0 and increments difficulty
 * When difficulty 5 seed 9999 is reached, wraps to difficulty 1 seed 0
 */
export const getNextLevelNumber = (currentLevelNumber: number): number => {
  const { difficulty, seed } = decodeLevelNumber(currentLevelNumber);
  const diffNum = DIFFICULTY_TO_NUMBER[difficulty];
  
  if (seed >= SEEDS_PER_DIFFICULTY - 1) {
    // Wrap to next difficulty
    const nextDiffNum = diffNum >= 5 ? 1 : diffNum + 1;
    return nextDiffNum * SEEDS_PER_DIFFICULTY;
  }
  
  return currentLevelNumber + 1;
};

/**
 * Gets the starting level number for a difficulty
 */
export const getStartingLevelNumber = (difficulty: Difficulty): number => {
  return encodeLevelNumber(difficulty, 0);
};

/**
 * Gets the difficulty number (1-5) from a Difficulty type
 */
export const getDifficultyNumber = (difficulty: Difficulty): number => {
  return DIFFICULTY_TO_NUMBER[difficulty];
};

/**
 * Gets the previous level number (decrements by 1)
 * When seed reaches 0, wraps to 9999 and decrements difficulty
 * When difficulty 1 seed 0 is reached, wraps to difficulty 5 seed 9999
 */
export const getPreviousLevelNumber = (currentLevelNumber: number): number => {
  const { difficulty, seed } = decodeLevelNumber(currentLevelNumber);
  const diffNum = DIFFICULTY_TO_NUMBER[difficulty];
  
  if (seed <= 0) {
    const prevDiffNum = diffNum <= 1 ? 5 : diffNum - 1;
    return prevDiffNum * SEEDS_PER_DIFFICULTY + (SEEDS_PER_DIFFICULTY - 1);
  }
  
  return currentLevelNumber - 1;
};

/**
 * Formats a level number for display as "D-SSSS"
 */
export const formatLevelNumber = (levelNumber: number): string => {
  const { difficulty, seed } = decodeLevelNumber(levelNumber);
  const diffNum = DIFFICULTY_TO_NUMBER[difficulty];
  return `${diffNum}-${seed.toString().padStart(4, '0')}`;
};


