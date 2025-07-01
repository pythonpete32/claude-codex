import type { Meta, StoryObj } from '@storybook/react';
import { GrepTool } from './grep-tool';

const meta = {
  title: 'Chat Items/Grep Tool',
  component: GrepTool,
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
} satisfies Meta<typeof GrepTool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pattern: 'useState',
    searchPath: './src',
    fileMatches: [
      {
        filePath: './src/components/App.tsx',
        totalMatches: 2,
        matches: [
          {
            line: 8,
            content: '  const [count, setCount] = useState(0);',
            matchStart: 29,
            matchEnd: 37,
          },
          {
            line: 12,
            content: '  const [name, setName] = useState("John");',
            matchStart: 27,
            matchEnd: 35,
          },
        ],
      },
      {
        filePath: './src/hooks/useCounter.ts',
        totalMatches: 1,
        matches: [
          {
            line: 4,
            content: '  const [value, setValue] = useState(initialValue);',
            matchStart: 31,
            matchEnd: 39,
          },
        ],
      },
    ],
    description: 'Found 3 matches in 2 files',
    status: 'completed',
    timestamp: '2024-06-29 01:45:12',
  },
};

export const NoMatches: Story = {
  args: {
    pattern: 'nonExistentFunction',
    searchPath: './src',
    fileMatches: [],
    description: 'No matches found',
    status: 'completed',
    timestamp: '2024-06-29 01:45:12',
  },
};

export const ManyMatches: Story = {
  args: {
    pattern: 'import',
    searchPath: './src',
    fileMatches: [
      {
        filePath: './src/components/Button.tsx',
        totalMatches: 3,
        matches: [
          {
            line: 1,
            content: "import React from 'react';",
            matchStart: 0,
            matchEnd: 6,
          },
          {
            line: 2,
            content: "import { ButtonProps } from './types';",
            matchStart: 0,
            matchEnd: 6,
          },
          {
            line: 3,
            content: "import styles from './Button.module.css';",
            matchStart: 0,
            matchEnd: 6,
          },
        ],
      },
      {
        filePath: './src/components/Card.tsx',
        totalMatches: 2,
        matches: [
          {
            line: 1,
            content: "import React from 'react';",
            matchStart: 0,
            matchEnd: 6,
          },
          {
            line: 2,
            content: "import { CardProps } from './types';",
            matchStart: 0,
            matchEnd: 6,
          },
        ],
      },
    ],
    description: 'Found 5 matches in 2 files',
    status: 'completed',
    timestamp: '2024-06-29 01:45:12',
  },
};