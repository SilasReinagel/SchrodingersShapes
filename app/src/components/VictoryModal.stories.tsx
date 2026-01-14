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
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0e27' }],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
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
            className="absolute top-4 left-4 px-4 py-2 bg-cyan-500 text-white rounded"
          >
            Show Victory Modal
          </button>
        )}
      </>
    );
  },
};

export const QuickTime: Story = {
  args: {
    isOpen: true,
    time: '00:45',
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
            className="absolute top-4 left-4 px-4 py-2 bg-cyan-500 text-white rounded"
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
            className="absolute top-4 left-4 px-4 py-2 bg-cyan-500 text-white rounded"
          >
            Show Victory Modal
          </button>
        )}
      </>
    );
  },
};

