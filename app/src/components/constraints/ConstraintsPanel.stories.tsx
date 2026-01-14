import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConstraintsPanel } from './ConstraintsPanel';
import { GameBoard, CatShape, SquareShape, CircleShape, TriangleShape } from '../../game/types';

const meta = {
  title: 'Components/Constraints/ConstraintsPanel',
  component: ConstraintsPanel,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1e1b4b' },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConstraintsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper function to create a grid
const createGrid = (width: number, height: number): GameBoard => {
  const grid: GameBoard = [];
  for (let row = 0; row < height; row++) {
    grid[row] = [];
    for (let col = 0; col < width; col++) {
      grid[row][col] = {
        shape: CatShape,
        locked: false,
      };
    }
  }
  return grid;
};

export const SingleConstraint: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: SquareShape,
          count: 2,
          operator: 'exactly',
        },
      },
    ],
    grid: createGrid(3, 3),
    boardWidth: 3,
    boardHeight: 3,
  },
};

export const MultipleConstraints: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: SquareShape,
          count: 2,
          operator: 'exactly',
        },
      },
      {
        type: 'row',
        index: 0,
        rule: {
          shape: CircleShape,
          count: 1,
          operator: 'at_least',
        },
      },
      {
        type: 'column',
        index: 1,
        rule: {
          shape: TriangleShape,
          count: 0,
          operator: 'none',
        },
      },
    ],
    grid: createGrid(3, 3),
    boardWidth: 3,
    boardHeight: 3,
  },
};

export const AllOperators: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: SquareShape,
          count: 2,
          operator: 'exactly',
        },
      },
      {
        type: 'row',
        index: 0,
        rule: {
          shape: CircleShape,
          count: 1,
          operator: 'at_least',
        },
      },
      {
        type: 'row',
        index: 1,
        rule: {
          shape: TriangleShape,
          count: 2,
          operator: 'at_most',
        },
      },
      {
        type: 'column',
        index: 0,
        rule: {
          shape: SquareShape,
          count: 0,
          operator: 'none',
        },
      },
    ],
    grid: createGrid(3, 3),
    boardWidth: 3,
    boardHeight: 3,
  },
};

export const SatisfiedConstraints: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: SquareShape,
          count: 2,
          operator: 'exactly',
        },
      },
      {
        type: 'row',
        index: 0,
        rule: {
          shape: CircleShape,
          count: 1,
          operator: 'at_least',
        },
      },
    ],
    grid: [
      [{ shape: SquareShape, locked: false }, { shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      [{ shape: CatShape, locked: false }, { shape: TriangleShape, locked: false }, { shape: CatShape, locked: false }],
      [{ shape: CircleShape, locked: false }, { shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
    ],
    boardWidth: 3,
    boardHeight: 3,
  },
};

export const ViolatedConstraints: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: SquareShape,
          count: 1,
          operator: 'exactly',
        },
      },
      {
        type: 'column',
        index: 0,
        rule: {
          shape: TriangleShape,
          count: 0,
          operator: 'none',
        },
      },
      {
        type: 'row',
        index: 2,
        rule: {
          shape: CircleShape,
          count: 1,
          operator: 'at_most',
        },
      },
    ],
    grid: [
      [{ shape: SquareShape, locked: false }, { shape: SquareShape, locked: false }, { shape: SquareShape, locked: false }],
      [{ shape: TriangleShape, locked: false }, { shape: CircleShape, locked: false }, { shape: CatShape, locked: false }],
      [{ shape: CircleShape, locked: false }, { shape: CircleShape, locked: false }, { shape: CircleShape, locked: false }],
    ],
    boardWidth: 3,
    boardHeight: 3,
  },
};

export const CellConstraints: Story = {
  args: {
    constraints: [
      {
        type: 'cell',
        x: 0,
        y: 0,
        rule: {
          shape: SquareShape,
          operator: 'is',
        },
      },
      {
        type: 'cell',
        x: 1,
        y: 1,
        rule: {
          shape: CircleShape,
          operator: 'is_not',
        },
      },
      {
        type: 'cell',
        x: 2,
        y: 0,
        rule: {
          shape: TriangleShape,
          operator: 'is',
        },
      },
    ],
    grid: [
      [{ shape: SquareShape, locked: false }, { shape: CatShape, locked: false }, { shape: TriangleShape, locked: false }],
      [{ shape: CatShape, locked: false }, { shape: SquareShape, locked: false }, { shape: CatShape, locked: false }],
      [{ shape: CircleShape, locked: false }, { shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
    ],
    boardWidth: 3,
    boardHeight: 3,
  },
};

export const MixedConstraints: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: SquareShape,
          count: 2,
          operator: 'exactly',
        },
      },
      {
        type: 'row',
        index: 0,
        rule: {
          shape: CircleShape,
          count: 1,
          operator: 'at_least',
        },
      },
      {
        type: 'cell',
        x: 1,
        y: 1,
        rule: {
          shape: TriangleShape,
          operator: 'is_not',
        },
      },
      {
        type: 'cell',
        x: 0,
        y: 2,
        rule: {
          shape: CircleShape,
          operator: 'is',
        },
      },
    ],
    grid: createGrid(3, 3),
    boardWidth: 3,
    boardHeight: 3,
  },
};

export const AllScopeTypes: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: CatShape,
          count: 3,
          operator: 'exactly',
        },
      },
      {
        type: 'row',
        index: 1,
        rule: {
          shape: CircleShape,
          count: 2,
          operator: 'exactly',
        },
      },
      {
        type: 'column',
        index: 2,
        rule: {
          shape: TriangleShape,
          count: 1,
          operator: 'at_least',
        },
      },
      {
        type: 'cell',
        x: 0,
        y: 0,
        rule: {
          shape: SquareShape,
          operator: 'is',
        },
      },
    ],
    grid: createGrid(3, 3),
    boardWidth: 3,
    boardHeight: 3,
  },
};

// Stories demonstrating different board sizes

export const Board2x2: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: SquareShape,
          count: 2,
          operator: 'exactly',
        },
      },
      {
        type: 'row',
        index: 0,
        rule: {
          shape: CircleShape,
          count: 1,
          operator: 'at_least',
        },
      },
      {
        type: 'column',
        index: 1,
        rule: {
          shape: TriangleShape,
          count: 0,
          operator: 'none',
        },
      },
    ],
    grid: createGrid(2, 2),
    boardWidth: 2,
    boardHeight: 2,
  },
};

export const Board3x2: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: SquareShape,
          count: 3,
          operator: 'exactly',
        },
      },
      {
        type: 'row',
        index: 1,
        rule: {
          shape: CircleShape,
          count: 1,
          operator: 'at_least',
        },
      },
      {
        type: 'column',
        index: 2,
        rule: {
          shape: TriangleShape,
          count: 1,
          operator: 'exactly',
        },
      },
      {
        type: 'cell',
        x: 0,
        y: 0,
        rule: {
          shape: SquareShape,
          operator: 'is',
        },
      },
    ],
    grid: createGrid(3, 2),
    boardWidth: 3,
    boardHeight: 2,
  },
};

export const Board4x3: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: SquareShape,
          count: 4,
          operator: 'exactly',
        },
      },
      {
        type: 'row',
        index: 2,
        rule: {
          shape: CircleShape,
          count: 2,
          operator: 'at_least',
        },
      },
      {
        type: 'column',
        index: 3,
        rule: {
          shape: TriangleShape,
          count: 1,
          operator: 'exactly',
        },
      },
      {
        type: 'cell',
        x: 2,
        y: 1,
        rule: {
          shape: CircleShape,
          operator: 'is_not',
        },
      },
    ],
    grid: createGrid(4, 3),
    boardWidth: 4,
    boardHeight: 3,
  },
};

export const Board4x4: Story = {
  args: {
    constraints: [
      {
        type: 'global',
        rule: {
          shape: SquareShape,
          count: 5,
          operator: 'exactly',
        },
      },
      {
        type: 'row',
        index: 3,
        rule: {
          shape: CircleShape,
          count: 2,
          operator: 'at_least',
        },
      },
      {
        type: 'column',
        index: 0,
        rule: {
          shape: TriangleShape,
          count: 2,
          operator: 'exactly',
        },
      },
      {
        type: 'cell',
        x: 3,
        y: 3,
        rule: {
          shape: SquareShape,
          operator: 'is',
        },
      },
    ],
    grid: createGrid(4, 4),
    boardWidth: 4,
    boardHeight: 4,
  },
};
