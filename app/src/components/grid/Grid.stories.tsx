import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid } from './Grid';
import { GameBoard, CatShape, SquareShape, CircleShape, TriangleShape } from '../../game/types';

const meta = {
  title: 'Components/Grid/Grid',
  component: Grid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onCellClick: {
      action: 'cell-clicked',
      description: 'Callback when a cell is clicked',
    },
    onShapeSelect: {
      action: 'shape-selected',
      description: 'Callback when a shape is selected',
    },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper function to create a grid
const createGrid = (width: number, height: number, pattern?: GameBoard): GameBoard => {
  if (pattern) return pattern;
  
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

export const Empty2x2: Story = {
  args: {
    grid: createGrid(2, 2),
    onCellClick: (row, col) => console.log('Cell clicked:', row, col),
    onShapeSelect: (row, col, shape) => console.log('Shape selected:', row, col, shape),
  },
};

export const Empty3x3: Story = {
  args: {
    grid: createGrid(3, 3),
    onCellClick: (row, col) => console.log('Cell clicked:', row, col),
    onShapeSelect: (row, col, shape) => console.log('Shape selected:', row, col, shape),
  },
};

export const WithShapes: Story = {
  args: {
    grid: [
      [{ shape: SquareShape, locked: false }, { shape: CatShape, locked: false }, { shape: CircleShape, locked: false }],
      [{ shape: CatShape, locked: false }, { shape: TriangleShape, locked: false }, { shape: CatShape, locked: false }],
      [{ shape: CircleShape, locked: false }, { shape: CatShape, locked: false }, { shape: SquareShape, locked: false }],
    ],
    onCellClick: (row, col) => console.log('Cell clicked:', row, col),
    onShapeSelect: (row, col, shape) => console.log('Shape selected:', row, col, shape),
  },
};

export const WithLockedCells: Story = {
  args: {
    grid: [
      [{ shape: SquareShape, locked: true }, { shape: CatShape, locked: false }, { shape: CircleShape, locked: true }],
      [{ shape: CatShape, locked: false }, { shape: TriangleShape, locked: true }, { shape: CatShape, locked: false }],
      [{ shape: CircleShape, locked: false }, { shape: CatShape, locked: false }, { shape: SquareShape, locked: true }],
    ],
    onCellClick: (row, col) => console.log('Cell clicked:', row, col),
    onShapeSelect: (row, col, shape) => console.log('Shape selected:', row, col, shape),
  },
};

export const LargeGrid: Story = {
  args: {
    grid: createGrid(5, 5),
    onCellClick: (row, col) => console.log('Cell clicked:', row, col),
    onShapeSelect: (row, col, shape) => console.log('Shape selected:', row, col, shape),
  },
};

