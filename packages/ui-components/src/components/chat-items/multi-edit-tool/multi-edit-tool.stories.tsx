import type { Meta, StoryObj } from '@storybook/react';
import { MultiEditTool } from './multi-edit-tool';

const meta = {
  title: 'Chat Items/Multi Edit Tool',
  component: MultiEditTool,
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
} satisfies Meta<typeof MultiEditTool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fileEdits: [
      {
        filePath: './src/components/Button.tsx',
        oldContent: `import React from 'react';

export const Button = ({ children }) => {
  return <button>{children}</button>;
};`,
        newContent: `import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary' 
}) => {
  return (
    <button className={\`btn btn-\${variant}\`}>
      {children}
    </button>
  );
};`,
      },
      {
        filePath: './src/components/Card.tsx',
        oldContent: `export const Card = ({ title, content }) => (
  <div>
    <h3>{title}</h3>
    <p>{content}</p>
  </div>
);`,
        newContent: `export interface CardProps {
  title: string;
  content: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  content, 
  className 
}) => (
  <div className={\`card \${className || ''}\`}>
    <h3 className="card-title">{title}</h3>
    <p className="card-content">{content}</p>
  </div>
);`,
      },
    ],
    description: 'Added TypeScript types and styling to components',
    status: 'completed',
    timestamp: '2024-06-29 01:45:12',
  },
};

export const SingleFile: Story = {
  args: {
    fileEdits: [
      {
        filePath: './src/config.json',
        oldContent: `{
  "name": "old-app",
  "version": "1.0.0"
}`,
        newContent: `{
  "name": "new-app",
  "version": "1.1.0",
  "description": "Updated application"
}`,
      },
    ],
    description: 'Updated configuration file',
    status: 'completed',
    timestamp: '2024-06-29 01:45:12',
  },
};

export const ManyFiles: Story = {
  args: {
    fileEdits: [
      {
        filePath: './src/utils/helpers.ts',
        oldContent: 'export const formatDate = (date) => date.toString();',
        newContent: 'export const formatDate = (date: Date): string => date.toISOString();',
      },
      {
        filePath: './src/utils/validation.ts',
        oldContent: 'export const isValid = (value) => !!value;',
        newContent: 'export const isValid = (value: unknown): boolean => !!value;',
      },
      {
        filePath: './src/utils/constants.ts',
        oldContent: 'export const API_URL = "http://localhost";',
        newContent: 'export const API_URL = "https://api.example.com";',
      },
    ],
    description: 'Added TypeScript types across utility files',
    status: 'completed',
    timestamp: '2024-06-29 01:45:12',
  },
};