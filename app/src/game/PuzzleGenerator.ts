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

    // Based on difficulty, add different types of clever constraints
    if (config.difficulty === 'level1') {
      // Easy level: Simple counting constraints
      while (constraints.length < numConstraints) {
        const constraint = this.generateRandomConstraint(width, height);
        if (this.isValidConstraint(constraint, constraints)) {
          constraints.push(constraint);
        }
      }
    } else if (config.difficulty === 'level2') {
      // Medium level: Add complementary constraints that encourage cat usage
      const row = Math.floor(Math.random() * height);
      const shape1 = this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)];
      const shape2 = this.SHAPES.filter(s => s !== shape1)[Math.floor(Math.random() * (this.SHAPES.length - 1))];
      
      // Add two constraints that seem contradictory but can be solved with cats
      // Make sure the count is achievable with cats
      const count = Math.min(Math.floor(width / 2), 1); // At most 1 for each shape to ensure solvability
      
      constraints.push({
        type: 'row',
        index: row,
        rule: {
          shape: shape1,
          count,
          operator: 'exactly'
        }
      });

      constraints.push({
        type: 'row',
        index: row,
        rule: {
          shape: shape2,
          count,
          operator: 'exactly'
        }
      });

      // Fill remaining constraints with simpler ones
      while (constraints.length < numConstraints) {
        const constraint = this.generateRandomConstraint(width, height);
        if (this.isValidConstraint(constraint, constraints)) {
          constraints.push(constraint);
        }
      }
    } else {
      // Hard levels: Add overlapping requirements and relative quantity constraints
      
      // Add intersecting constraints that suggest cat placement
      const intersectRow = Math.floor(Math.random() * height);
      const intersectCol = Math.floor(Math.random() * width);
      const intersectShape = this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)];
      
      // Make sure the intersection point is achievable
      constraints.push({
        type: 'row',
        index: intersectRow,
        rule: {
          shape: intersectShape,
          count: 1,
          operator: 'exactly'
        }
      });

      constraints.push({
        type: 'column',
        index: intersectCol,
        rule: {
          shape: intersectShape,
          count: 1,
          operator: 'exactly'
        }
      });

      // Add a relative quantity constraint that's achievable
      const shape1 = this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)];
      const shape2 = this.SHAPES.filter(s => s !== shape1)[0];
      
      // Make sure the counts are achievable
      const maxShape1Count = Math.floor((width * height) / 4); // At most 1/4 of the grid
      
      constraints.push({
        type: 'global',
        rule: {
          shape: shape1,
          count: maxShape1Count,
          operator: 'at_most'
        }
      });

      constraints.push({
        type: 'global',
        rule: {
          shape: shape2,
          count: 1,
          operator: 'at_least'
        }
      });

      // Fill remaining constraints with simpler ones
      while (constraints.length < numConstraints) {
        const constraint = this.generateRandomConstraint(width, height);
        if (this.isValidConstraint(constraint, constraints)) {
          constraints.push(constraint);
        }
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
    
    // Adjust count based on operator to ensure meaningful and achievable constraints
    let count: number;
    if (operator === 'at_most') {
      // For "at most", ensure count is achievable
      const maxCount = Math.min(Math.floor(dimensionSize / 2), 2);
      count = maxCount > 0 ? Math.floor(Math.random() * maxCount) + 1 : 1;
    } else if (operator === 'at_least') {
      // For "at least", ensure count is reasonable
      count = 1; // Start with just requiring 1 to make it more likely to be solvable
    } else if (operator === 'exactly') {
      // For "exactly", keep counts low to ensure solvability
      count = 1;
    } else { // 'none'
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