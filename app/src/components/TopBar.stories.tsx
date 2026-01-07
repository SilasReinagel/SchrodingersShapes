import type { Meta, StoryObj } from '@storybook/react-vite';
import { TopBar } from './TopBar';

const meta = {
  title: 'Components/TopBar',
  component: TopBar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="relative w-full h-screen">
      <TopBar />
      <div className="pt-16 p-8">
        <p className="text-text-primary">Content below the TopBar</p>
      </div>
    </div>
  ),
};

export const Standalone: Story = {
  render: () => <TopBar />,
};

