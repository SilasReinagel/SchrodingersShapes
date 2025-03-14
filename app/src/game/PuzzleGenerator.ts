import { DIFFICULTY_SETTINGS } from './DifficultySettings';
import { ShapeId, GameBoard, ConstraintDefinition, PuzzleConfig, PuzzleDefinition, CatShape, SquareShape, CircleShape, TriangleShape } from './types';

export class PuzzleGenerator {
  private static readonly SHAPES: ShapeId[] = [SquareShape, CircleShape, TriangleShape];
  
  public static generate(config: Partial<PuzzleConfig> = {}): PuzzleDefinition {
    const fullConfig = this.getFullConfig(config);
    const initialBoard = this.initializeGrid(
      fullConfig.width, 
      fullConfig.height
    );
    const constraints = this.generateConstraints(fullConfig);
    
    return {
      initialBoard,
      constraints
    };
  }

  private static initializeGrid(width: number, height: number): GameBoard {
    return Array(height).fill(null).map(() =>
      Array(width).fill(null).map(() => ({
        shape: CatShape,
        locked: false
      }))
    );
  }

  private static generateConstraints(config: Required<PuzzleConfig>): ConstraintDefinition[] {
    const constraints: ConstraintDefinition[] = [];
    const numConstraints = Math.floor(
      Math.random() * (config.maxConstraints - config.minConstraints + 1) + config.minConstraints
    );

    // Always add the required superpositions constraint
    constraints.push({
      type: 'global',
      rule: {
        shape: CatShape,
        count: config.requiredSuperpositions,
        operator: 'exactly'
      }
    });

    // Get board dimensions
    const width = config.width;
    const height = config.height;

    // Generate random constraints
    while (constraints.length < numConstraints) {
      const constraint = this.generateRandomConstraint(width, height);
      if (this.isValidConstraint(constraint, constraints)) {
        constraints.push(constraint);
      }
    }

    return constraints;
  }

  /**
   * Generate a random constraint
   */
  private static generateRandomConstraint(width: number, height: number): ConstraintDefinition {
    const type = Math.random() < 0.5 ? 'row' : 'column';
    const index = Math.floor(Math.random() * (type === 'row' ? height : width));
    const shape = this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)];
    const operator = this.getRandomOperator();
    
    // Get the size of the dimension we're constraining
    const dimensionSize = type === 'row' ? width : height;
    
    // Adjust count based on operator to ensure meaningful constraints
    let count: number;
    if (operator === 'at_most') {
      // For "at most", ensure count is less than size to make it a meaningful constraint
      const maxCount = Math.min(dimensionSize - 1, 2);
      count = maxCount > 0 ? Math.floor(Math.random() * maxCount) + 1 : 1;
    } else if (operator === 'at_least') {
      // For "at least", ensure count is at least 1 but not equal to size
      count = Math.floor(Math.random() * (dimensionSize - 1)) + 1;
    } else if (operator === 'exactly') {
      // For "exactly", any count between 1 and size is meaningful
      count = Math.floor(Math.random() * dimensionSize) + 1;
    } else { // 'none'
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
  private static isValidConstraint(newConstraint: ConstraintDefinition, existingConstraints: ConstraintDefinition[]): boolean {
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
  private static getRandomOperator(): ConstraintDefinition['rule']['operator'] {
    const operators: ConstraintDefinition['rule']['operator'][] = ['exactly', 'at_least', 'at_most', 'none'];
    return operators[Math.floor(Math.random() * operators.length)];
  }

  /**
   * Get full configuration by merging provided config with defaults
   */
  private static getFullConfig(partialConfig: Partial<PuzzleConfig>): Required<PuzzleConfig> {
    const difficulty = partialConfig.difficulty;
    if (!difficulty) {
      throw new Error('Difficulty is required');
    }
    return {
      ...DIFFICULTY_SETTINGS[difficulty],
      ...partialConfig
    };
  }
} 