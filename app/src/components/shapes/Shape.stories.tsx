import type { Meta, StoryObj } from '@storybook/react-vite';
import { Shape } from './Shape';
import { CatShape, SquareShape, CircleShape, TriangleShape } from '../../game/types';

const meta = {
  title: 'Components/Shapes/Shape',
  component: Shape,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: [CatShape, SquareShape, CircleShape, TriangleShape],
      mapping: {
        'Cat': CatShape,
        'Square': SquareShape,
        'Circle': CircleShape,
        'Triangle': TriangleShape,
      },
      description: 'The type of shape to display',
    },
    isLocked: {
      control: 'boolean',
      description: 'Whether the shape is locked (reduced opacity)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Shape>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cat: Story = {
  args: {
    type: CatShape,
    isLocked: false,
  },
  render: (args) => (
    <div className="w-24 h-24">
      <Shape {...args} />
    </div>
  ),
};

export const Square: Story = {
  args: {
    type: SquareShape,
    isLocked: false,
  },
  render: (args) => (
    <div className="w-24 h-24">
      <Shape {...args} />
    </div>
  ),
};

export const Circle: Story = {
  args: {
    type: CircleShape,
    isLocked: false,
  },
  render: (args) => (
    <div className="w-24 h-24">
      <Shape {...args} />
    </div>
  ),
};

export const Triangle: Story = {
  args: {
    type: TriangleShape,
    isLocked: false,
  },
  render: (args) => (
    <div className="w-24 h-24">
      <Shape {...args} />
    </div>
  ),
};

export const Locked: Story = {
  args: {
    type: SquareShape,
    isLocked: true,
  },
  render: (args) => (
    <div className="w-24 h-24">
      <Shape {...args} />
    </div>
  ),
};

export const AllShapes: Story = {
  args: {
    type: CatShape,
    isLocked: false,
  },
  render: () => (
    <div className="flex gap-8 items-center">
      <div className="w-24 h-24">
        <Shape type={CatShape} />
      </div>
      <div className="w-24 h-24">
        <Shape type={SquareShape} />
      </div>
      <div className="w-24 h-24">
        <Shape type={CircleShape} />
      </div>
      <div className="w-24 h-24">
        <Shape type={TriangleShape} />
      </div>
    </div>
  ),
};

