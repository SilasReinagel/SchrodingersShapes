import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConstraintsPanel } from './ConstraintsPanel';
import { GameBoard, CatShape, SquareShape, CircleShape, TriangleShape } from '../../game/types';

const meta = {
  title: 'Components/Constraints/ConstraintsPanel',
  component: ConstraintsPanel,
  parameters: {
    layout: 'centered',
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
    ],
    grid: [
      [{ shape: SquareShape, locked: false }, { shape: SquareShape, locked: false }, { shape: CircleShape, locked: false }],
      [{ shape: CatShape, locked: false }, { shape: TriangleShape, locked: false }, { shape: CatShape, locked: false }],
      [{ shape: CircleShape, locked: false }, { shape: CatShape, locked: false }, { shape: CatShape, locked: false }],
    ],
  },
};

