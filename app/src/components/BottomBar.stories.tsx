import type { Meta, StoryObj } from '@storybook/react-vite';
import { BottomBar } from './BottomBar';
import { GameProvider } from '../contexts/GameContext';

const meta = {
  title: 'Components/BottomBar',
  component: BottomBar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <GameProvider>
        <Story />
      </GameProvider>
    ),
  ],
} satisfies Meta<typeof BottomBar>;

export default meta;
type Story = StoryObj<typeof BottomBar>;

export const Default: Story = {
  render: () => (
    <div className="relative w-full h-screen">
      <div className="pb-16 p-8">
        <p className="text-text-primary">Content above the BottomBar</p>
      </div>
      <BottomBar />
    </div>
  ),
};

export const Standalone: Story = {
  render: () => (
    <div className="relative w-full h-screen flex items-end">
      <BottomBar />
    </div>
  ),
};

