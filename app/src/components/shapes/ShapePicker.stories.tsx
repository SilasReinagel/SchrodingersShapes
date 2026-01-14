import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { LayoutGroup } from 'framer-motion';
import { ShapePicker, PICKER_WIDTH, PICKER_HEIGHT } from './ShapePicker';

const meta = {
  title: 'Components/Shapes/ShapePicker',
  component: ShapePicker,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a1628' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'object',
      description: 'Position of the picker (x, y coordinates)',
    },
    cellRect: {
      control: 'object',
      description: 'Cell bounds for the emanating glass effect',
    },
    targetCellId: {
      control: 'text',
      description: 'Unique ID for the target cell (used for layoutId animations)',
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
    position: { x: 200, y: 200 },
    cellRect: { x: 400, y: 250, width: 100, height: 100 },
    targetCellId: 'cell-0-0',
    onSelect: () => {},
    onClose: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    // Center picker on cell
    const cellCenterX = args.cellRect.x + args.cellRect.width / 2;
    const cellCenterY = args.cellRect.y + args.cellRect.height / 2;
    const pickerX = cellCenterX - PICKER_WIDTH / 2;
    const pickerY = cellCenterY - PICKER_HEIGHT / 2;
    
    return (
      <LayoutGroup>
        <div 
          className="relative w-full h-screen"
          style={{ 
            background: 'linear-gradient(135deg, #0a1628 0%, #162447 50%, #1f4068 100%)',
          }}
        >
          {/* Mock cell indicator */}
          <div 
            className="absolute border-2 border-cyan-500/50 rounded-lg"
            style={{
              left: args.cellRect.x,
              top: args.cellRect.y,
              width: args.cellRect.width,
              height: args.cellRect.height,
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
            }}
          />
          
          {isOpen && (
            <ShapePicker
              position={{ x: pickerX, y: pickerY }}
              cellRect={args.cellRect}
              targetCellId={args.targetCellId}
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
            className="absolute top-4 left-4 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium shadow-lg hover:bg-cyan-400 transition-colors"
            style={{
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
            }}
          >
            Show Picker
          </button>
        </div>
      </LayoutGroup>
    );
  },
};

export const Centered: Story = {
  args: {
    position: { x: 300, y: 200 },
    cellRect: { x: 380, y: 340, width: 100, height: 100 },
    targetCellId: 'cell-1-1',
    onSelect: () => {},
    onClose: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    // Center both cell and picker in viewport
    const cellX = window.innerWidth / 2 - 50;
    const cellY = window.innerHeight / 2 - 50;
    const pickerX = window.innerWidth / 2 - PICKER_WIDTH / 2;
    const pickerY = window.innerHeight / 2 - PICKER_HEIGHT / 2;
    
    return (
      <LayoutGroup>
        <div 
          className="relative w-full h-screen flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #0a1628 0%, #162447 50%, #1f4068 100%)',
          }}
        >
          {/* Mock cell indicator */}
          <div 
            className="absolute border-2 border-cyan-500/50 rounded-lg"
            style={{
              left: cellX,
              top: cellY,
              width: 100,
              height: 100,
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
            }}
          />
          
          {isOpen && (
            <ShapePicker
              position={{ x: pickerX, y: pickerY }}
              cellRect={{ x: cellX, y: cellY, width: 100, height: 100 }}
              targetCellId={args.targetCellId}
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
            className="absolute top-4 left-4 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium shadow-lg hover:bg-cyan-400 transition-colors"
            style={{
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
            }}
          >
            Show Picker
          </button>
        </div>
      </LayoutGroup>
    );
  },
};

export const WithDarkBackground: Story = {
  args: {
    position: { x: 300, y: 150 },
    cellRect: { x: 380, y: 290, width: 100, height: 100 },
    targetCellId: 'cell-2-2',
    onSelect: () => {},
    onClose: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    // Center picker on cell
    const cellCenterX = args.cellRect.x + args.cellRect.width / 2;
    const cellCenterY = args.cellRect.y + args.cellRect.height / 2;
    const pickerX = cellCenterX - PICKER_WIDTH / 2;
    const pickerY = cellCenterY - PICKER_HEIGHT / 2;
    
    return (
      <LayoutGroup>
        <div 
          className="relative w-full h-screen"
          style={{ 
            backgroundImage: 'url(/art/lab_bg_01_dk.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Mock cell indicator */}
          <div 
            className="absolute border-2 border-cyan-500/50 rounded-lg"
            style={{
              left: args.cellRect.x,
              top: args.cellRect.y,
              width: args.cellRect.width,
              height: args.cellRect.height,
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
            }}
          />
          
          {isOpen && (
            <ShapePicker
              position={{ x: pickerX, y: pickerY }}
              cellRect={args.cellRect}
              targetCellId={args.targetCellId}
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
            className="absolute top-4 left-4 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium shadow-lg hover:bg-cyan-400 transition-colors"
            style={{
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
            }}
          >
            Show Picker
          </button>
        </div>
      </LayoutGroup>
    );
  },
};
