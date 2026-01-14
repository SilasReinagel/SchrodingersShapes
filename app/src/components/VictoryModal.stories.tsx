import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { VictoryModal } from './VictoryModal';
import ReactModal from 'react-modal';

// Set app element for ReactModal
if (typeof document !== 'undefined') {
  ReactModal.setAppElement('#root');
}

const meta = {
  title: 'Components/VictoryModal',
  component: VictoryModal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    moves: {
      control: 'number',
      description: 'Number of moves taken',
    },
    time: {
      control: 'text',
      description: 'Time taken (format: MM:SS)',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal is closed',
    },
    onNextLevel: {
      action: 'next-level',
      description: 'Callback when next level is requested',
    },
  },
} satisfies Meta<typeof VictoryModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    moves: 15,
    time: '02:34',
    onClose: () => {},
    onNextLevel: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(args.isOpen);
    
    return (
      <>
        <VictoryModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            args.onClose();
            setIsOpen(false);
          }}
          onNextLevel={() => {
            args.onNextLevel();
            setIsOpen(false);
          }}
        />
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Show Victory Modal
          </button>
        )}
      </>
    );
  },
};

export const LowMoves: Story = {
  args: {
    isOpen: true,
    moves: 8,
    time: '01:12',
    onClose: () => {},
    onNextLevel: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <>
        <VictoryModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            args.onClose();
            setIsOpen(false);
          }}
          onNextLevel={() => {
            args.onNextLevel();
            setIsOpen(false);
          }}
        />
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Show Victory Modal
          </button>
        )}
      </>
    );
  },
};

export const HighMoves: Story = {
  args: {
    isOpen: true,
    moves: 42,
    time: '05:23',
    onClose: () => {},
    onNextLevel: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <>
        <VictoryModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            args.onClose();
            setIsOpen(false);
          }}
          onNextLevel={() => {
            args.onNextLevel();
            setIsOpen(false);
          }}
        />
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Show Victory Modal
          </button>
        )}
      </>
    );
  },
};

export const LongTime: Story = {
  args: {
    isOpen: true,
    moves: 25,
    time: '12:45',
    onClose: () => {},
    onNextLevel: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <>
        <VictoryModal
          {...args}
          isOpen={isOpen}
          onClose={() => {
            args.onClose();
            setIsOpen(false);
          }}
          onNextLevel={() => {
            args.onNextLevel();
            setIsOpen(false);
          }}
        />
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Show Victory Modal
          </button>
        )}
      </>
    );
  },
};

