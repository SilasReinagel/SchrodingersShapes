import { Difficulty, PuzzleConfig } from "./types";

export const DIFFICULTY_SETTINGS: Record<Difficulty, Required<PuzzleConfig>> = {
  level1: {
    width: 2,
    height: 2,
    difficulty: 'level1',
    minConstraints: 3,
    maxConstraints: 3,
    requiredSuperpositions: 1
  },
  level2: {
    width: 3,
    height: 2,
    difficulty: 'level2',
    minConstraints: 4,
    maxConstraints: 4,
    requiredSuperpositions: 1
  },
  level3: {
    width: 3,
    height: 3,
    difficulty: 'level3',
    minConstraints: 5,
    maxConstraints: 5,
    requiredSuperpositions: 2
  },
  level4: {
    width: 4,
    height: 3,
    difficulty: 'level4',
    minConstraints: 6,
    maxConstraints: 6,
    requiredSuperpositions: 2
  },
  level5: {
    width: 4,
    height: 4,
    difficulty: 'level5',
    minConstraints: 7,
    maxConstraints: 7,
    requiredSuperpositions: 3
  }
};
