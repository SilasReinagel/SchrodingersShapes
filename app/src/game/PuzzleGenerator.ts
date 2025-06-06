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
    const totalCells = width * height;

    // Based on difficulty, add different types of clever constraints
    if (config.difficulty === 'level1') {
      // Easy level: Simple counting constraints and one global exact constraint
      const globalShape = this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)];
      const minCount = config.requiredSuperpositions; // Must be at least the number of cats
      const maxCount = Math.floor(totalCells / 2); // Use at most half the board
      const globalCount = Math.max(minCount, Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount);

      constraints.push({
        type: 'global',
        rule: {
          shape: globalShape,
          count: globalCount,
          operator: 'exactly'
        }
      });

      while (constraints.length < numConstraints) {
        const constraint = this.generateRandomConstraint(width, height);
        if (this.isValidConstraint(constraint, constraints)) {
          constraints.push(constraint);
        }
      }
    } else if (config.difficulty === 'level2' || config.difficulty === 'level3') {
      // Medium levels: Add complementary global constraints
      const shape1 = this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)];
      const shape2 = this.SHAPES.filter(s => s !== shape1)[Math.floor(Math.random() * (this.SHAPES.length - 1))];
      
      // Ensure counts are at least the number of required cats (since cats count as all shapes)
      const minCount = config.requiredSuperpositions;
      const maxCount = Math.floor(totalCells / 2);
      const count1 = Math.max(minCount, Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount);
      const count2 = Math.max(minCount, Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount);
      
      constraints.push({
        type: 'global',
        rule: {
          shape: shape1,
          count: count1,
          operator: 'exactly'
        }
      });

      constraints.push({
        type: 'global',
        rule: {
          shape: shape2,
          count: count2,
          operator: 'exactly'
        }
      });

      // Add some row/column constraints
      while (constraints.length < numConstraints) {
        const constraint = this.generateRandomConstraint(width, height);
        if (this.isValidConstraint(constraint, constraints)) {
          constraints.push(constraint);
        }
      }
    } else {
      // Hard levels: Use at_least/at_most constraints instead of exact constraints for shapes
      // This prevents impossible combinations with exact cat requirements
      
      // Add some global at_least constraints that work with cats
      const numGlobalConstraints = Math.min(2, this.SHAPES.length);
      const shuffledShapes = [...this.SHAPES].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < numGlobalConstraints; i++) {
        const shape = shuffledShapes[i];
        const minCount = config.requiredSuperpositions; // At least the number of cats
        const count = Math.max(minCount, Math.floor(totalCells / 4) + 1);
        
        constraints.push({
          type: 'global',
          rule: {
            shape,
            count,
            operator: 'at_least'
          }
        });
      }

      // Add some row/column constraints
      while (constraints.length < numConstraints) {
        const constraint = this.generateRandomConstraint(width, height);
        if (this.isValidConstraint(constraint, constraints)) {
          constraints.push(constraint);
        }
      }
    }

    return constraints;
  }

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

  private static isValidConstraint(newConstraint: ConstraintDefinition, existingConstraints: ConstraintDefinition[]): boolean {
    // Don't allow duplicate constraints on the same row/column/shape
    return !existingConstraints.some(constraint =>
      constraint.type === newConstraint.type &&
      constraint.index === newConstraint.index &&
      constraint.rule.shape === newConstraint.rule.shape
    );
  }

  private static getRandomOperator(): ConstraintDefinition['rule']['operator'] {
    const operators: ConstraintDefinition['rule']['operator'][] = ['exactly', 'at_least', 'at_most', 'none'];
    return operators[Math.floor(Math.random() * operators.length)];
  }

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