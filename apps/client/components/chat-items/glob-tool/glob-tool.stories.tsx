import type { Meta, StoryObj } from '@storybook/react';
import { GlobTool } from './glob-tool';

const meta = {
  title: 'Chat Items/Glob Tool',
  component: GlobTool,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['pending', 'completed', 'error'],
    },
  },
} satisfies Meta<typeof GlobTool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pattern: '**/*.tsx',
    matches: [
      {
        filePath: './src/components/Button.tsx',
        isDirectory: false,
      },
      {
        filePath: './src/components/Card.tsx',
        isDirectory: false,
      },
      {
        filePath: './src/pages/Home.tsx',
        isDirectory: false,
      },
      {
        filePath: './src/pages/About.tsx',
        isDirectory: false,
      },
    ],
    description: 'Found 4 TypeScript React files',
    status: 'completed',
    timestamp: '2024-06-29 01:45:12',
  },
};

export const WithDirectories: Story = {
  args: {
    pattern: 'src/**',
    matches: [
      {
        filePath: './src/components',
        isDirectory: true,
      },
      {
        filePath: './src/components/Button.tsx',
        isDirectory: false,
      },
      {
        filePath: './src/components/Card.tsx',
        isDirectory: false,
      },
      {
        filePath: './src/hooks',
        isDirectory: true,
      },
      {
        filePath: './src/hooks/useCounter.ts',
        isDirectory: false,
      },
      {
        filePath: './src/utils',
        isDirectory: true,
      },
      {
        filePath: './src/utils/helpers.ts',
        isDirectory: false,
      },
    ],
    description: 'Found 7 items (3 directories, 4 files)',
    status: 'completed',
    timestamp: '2024-06-29 01:45:12',
  },
};

export const NoMatches: Story = {
  args: {
    pattern: '**/*.xyz',
    matches: [],
    description: 'No files found matching pattern',
    status: 'completed',
    timestamp: '2024-06-29 01:45:12',
  },
};

export const ConfigFiles: Story = {
  args: {
    pattern: '**/.*rc*',
    matches: [
      {
        filePath: './.eslintrc.js',
        isDirectory: false,
      },
      {
        filePath: './.prettierrc',
        isDirectory: false,
      },
      {
        filePath: './packages/ui/.eslintrc.json',
        isDirectory: false,
      },
    ],
    description: 'Found 3 configuration files',
    status: 'completed',
    timestamp: '2024-06-29 01:45:12',
  },
};