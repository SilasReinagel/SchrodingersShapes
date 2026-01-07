import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ShapePicker } from './ShapePicker';

const meta = {
  title: 'Components/Shapes/ShapePicker',
  component: ShapePicker,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'object',
      description: 'Position of the picker (x, y coordinates)',
    },
    onSelect: {
      action: 'selected',
      description: 'Callback when a shape is selected',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when the picker is closed',
    },
  },
} satisfies Meta<typeof ShapePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    position: { x: 400, y: 300 },
    onSelect: () => {},
    onClose: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <div className="relative w-full h-screen">
        {isOpen && (
          <ShapePicker
            {...args}
            position={args.position}
            onSelect={(shape) => {
              args.onSelect(shape);
              setIsOpen(false);
            }}
            onClose={() => {
              args.onClose();
              setIsOpen(false);
            }}
          />
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Show Picker
        </button>
      </div>
    );
  },
};

export const Centered: Story = {
  args: {
    position: { x: 400, y: 300 },
    onSelect: () => {},
    onClose: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <div className="relative w-full h-screen flex items-center justify-center">
        {isOpen && (
          <ShapePicker
            {...args}
            position={{ x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 50 }}
            onSelect={(shape) => {
              args.onSelect(shape);
              setIsOpen(false);
            }}
            onClose={() => {
              args.onClose();
              setIsOpen(false);
            }}
          />
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Show Picker
        </button>
      </div>
    );
  },
};

