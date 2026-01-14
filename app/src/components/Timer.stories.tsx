import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timer } from './Timer';

const meta = {
  title: 'Components/Timer',
  component: Timer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    time: {
      control: 'text',
      description: 'The time string to display (format: MM:SS)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Timer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    time: '00:00',
  },
};

export const Running: Story = {
  args: {
    time: '05:23',
  },
};

export const LongTime: Story = {
  args: {
    time: '12:45',
  },
};

export const WithStyling: Story = {
  args: {
    time: '03:15',
    className: 'text-text-primary font-bold text-lg',
  },
};

