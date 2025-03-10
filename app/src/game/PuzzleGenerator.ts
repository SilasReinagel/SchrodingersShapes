import { Shape, Grid, Constraint, PuzzleConfig, Puzzle, Difficulty } from './types';

export class PuzzleGenerator {
  private static readonly SHAPES: Exclude<Shape, 'cat'>[] = ['square', 'circle', 'triangle'];
  
  private static readonly DIFFICULTY_SETTINGS: Record<Difficulty, Required<PuzzleConfig>> = {
    easy: {
      size: 2,
      difficulty: 'easy',
      minConstraints: 2,
      maxConstraints: 3,
      requiredSuperpositions: 1
    },
    medium: {
      size: 3,
      difficulty: 'medium',
      minConstraints: 3,
      maxConstraints: 5,
      requiredSuperpositions: 2
    },
    hard: {
      size: 4,
      difficulty: 'hard',
      minConstraints: 4,
      maxConstraints: 7,
      requiredSuperpositions: 3
    }
  };

  /**
   * Generate a new puzzle based on the provided configuration
   */
  public static generate(config: Partial<PuzzleConfig> = {}): Puzzle {
    const fullConfig = this.getFullConfig(config);
    const grid = this.initializeGrid(fullConfig.size);
    const constraints = this.generateConstraints(fullConfig);
    
    return {
      grid,
      constraints,
      config: fullConfig
    };
  }

  /**
   * Initialize an empty grid with all cells in superposition
   */
  private static initializeGrid(size: number): Grid {
    return Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        shape: 'cat',
        locked: false,
        allowedShapes: new Set(this.SHAPES)
      }))
    );
  }

  /**
   * Generate constraints based on the configuration
   */
  private static generateConstraints(config: Required<PuzzleConfig>): Constraint[] {
    const constraints: Constraint[] = [];
    const numConstraints = Math.floor(
      Math.random() * (config.maxConstraints - config.minConstraints + 1) + config.minConstraints
    );

    // Always add the required superpositions constraint
    constraints.push({
      type: 'global',
      rule: {
        shape: 'cat',
        count: config.requiredSuperpositions,
        operator: 'exactly'
      }
    });

    // Generate random constraints
    while (constraints.length < numConstraints) {
      const constraint = this.generateRandomConstraint(config.size);
      if (this.isValidConstraint(constraint, constraints)) {
        constraints.push(constraint);
      }
    }

    return constraints;
  }

  /**
   * Generate a random constraint
   */
  private static generateRandomConstraint(size: number): Constraint {
    const type = Math.random() < 0.5 ? 'row' : 'column';
    const index = Math.floor(Math.random() * size);
    const shape = Math.random() < 0.75 ? this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)] : undefined;
    const operator = this.getRandomOperator();
    
    // Adjust count based on operator to ensure meaningful constraints
    let count: number;
    if (operator === 'at_most') {
      // For "at most", ensure count is less than size to make it a meaningful constraint
      const maxCount = shape ? Math.min(size - 1, 2) : size - 1;
      count = maxCount > 0 ? Math.floor(Math.random() * maxCount) + 1 : 1;
    } else if (operator === 'at_least') {
      // For "at least", ensure count is at least 1 but not equal to size
      count = Math.floor(Math.random() * (size - 1)) + 1;
    } else if (operator === 'exactly') {
      // For "exactly", any count between 1 and size is meaningful
      count = Math.floor(Math.random() * size) + 1;
    } else {
      // For "none", count is always 0
      count = 0;
    }

    return {
      type,
      index,
      rule: {
        shape,
        count,
        operator
      }
    };
  }

  /**
   * Check if a constraint is valid and doesn't conflict with existing constraints
   */
  private static isValidConstraint(newConstraint: Constraint, existingConstraints: Constraint[]): boolean {
    // Don't allow duplicate constraints on the same row/column
    return !existingConstraints.some(constraint =>
      constraint.type === newConstraint.type &&
      constraint.index === newConstraint.index &&
      constraint.rule.shape === newConstraint.rule.shape
    );
  }

  /**
   * Get a random constraint operator
   */
  private static getRandomOperator(): Constraint['rule']['operator'] {
    const operators: Constraint['rule']['operator'][] = ['exactly', 'at_least', 'at_most', 'none'];
    return operators[Math.floor(Math.random() * operators.length)];
  }

  /**
   * Get full configuration by merging provided config with defaults
   */
  private static getFullConfig(partialConfig: Partial<PuzzleConfig>): Required<PuzzleConfig> {
    const difficulty = partialConfig.difficulty || 'medium';
    return {
      ...this.DIFFICULTY_SETTINGS[difficulty],
      ...partialConfig
    };
  }
} 