import { Difficulty, PuzzleConfig } from "./types";

// Level configurations matching C implementation in algo/src/generator.c
export const DIFFICULTY_SETTINGS: Record<Difficulty, Required<PuzzleConfig>> = {
  level1: {
    width: 2,
    height: 2,
    difficulty: 'level1',
    minConstraints: 2,
    maxConstraints: 10,
    requiredSuperpositions: 0
  },
  level2: {
    width: 2,
    height: 3,
    difficulty: 'level2',
    minConstraints: 3,
    maxConstraints: 12,
    requiredSuperpositions: 0
  },
  level3: {
    width: 3,
    height: 3,
    difficulty: 'level3',
    minConstraints: 4,
    maxConstraints: 20,
    requiredSuperpositions: 1
  },
  level4: {
    width: 3,
    height: 4,
    difficulty: 'level4',
    minConstraints: 5,
    maxConstraints: 25,
    requiredSuperpositions: 1
  },
  level5: {
    width: 4,
    height: 4,
    difficulty: 'level5',
    minConstraints: 6,
    maxConstraints: 30,
    requiredSuperpositions: 2
  }
};
