import { Difficulty, PuzzleConfig } from "./types";

// Cat distribution is now handled probabilistically by LEVEL_CONFIGS in PuzzleGenerator.
// requiredSuperpositions is omitted here — only pass it as an explicit override.
export const DIFFICULTY_SETTINGS: Record<Difficulty, Omit<Required<PuzzleConfig>, 'requiredSuperpositions'>> = {
  level1: {
    width: 2,
    height: 2,
    difficulty: 'level1',
    minConstraints: 2,
    maxConstraints: 4,
  },
  level2: {
    width: 2,
    height: 3,
    difficulty: 'level2',
    minConstraints: 3,
    maxConstraints: 12,
  },
  level3: {
    width: 3,
    height: 3,
    difficulty: 'level3',
    minConstraints: 4,
    maxConstraints: 20,
  },
  level4: {
    width: 3,
    height: 4,
    difficulty: 'level4',
    minConstraints: 5,
    maxConstraints: 25,
  },
  level5: {
    width: 4,
    height: 4,
    difficulty: 'level5',
    minConstraints: 6,
    maxConstraints: 30,
  }
};
