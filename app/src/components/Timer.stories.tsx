import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timer } from './Timer';
import { useRef } from 'react';

const meta = {
  title: 'Components/Timer',
  component: Timer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isPlaying: {
      control: 'boolean',
      description: 'Whether the timer is currently running',
    },
  },
} satisfies Meta<typeof Timer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stopped: Story = {
  args: {
    isPlaying: false,
  },
};

export const Running: Story = {
  args: {
    isPlaying: true,
  },
};

export const Interactive: Story = {
  render: (args) => {
    const timerRef = useRef<{ getTime: () => string }>(null);
    
    return (
      <div className="space-y-4">
        <Timer {...args} ref={timerRef} />
        <button
          onClick={() => {
            const time = timerRef.current?.getTime();
            alert(`Current time: ${time}`);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Get Time
        </button>
      </div>
    );
  },
  args: {
    isPlaying: true,
  },
};

