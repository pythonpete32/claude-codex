import type { Meta, StoryObj } from '@storybook/react';
import { LsTool } from './ls-tool';

const meta = {
  title: 'Chat Items/LS Tool',
  component: LsTool,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['pending', 'completed', 'error'],
    },
    showHidden: {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof LsTool>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleFiles = [
  {
    name: '.git',
    type: 'directory' as const,
    hidden: true,
    permissions: 'drwxr-xr-x',
    modified: '2024-06-28 23:45',
  },
  {
    name: '.env',
    type: 'file' as const,
    size: 245,
    hidden: true,
    extension: '.env',
    permissions: '-rw-r--r--',
    modified: '2024-06-28 10:30',
  },
  {
    name: 'node_modules',
    type: 'directory' as const,
    permissions: 'drwxr-xr-x',
    modified: '2024-06-28 15:22',
  },
  {
    name: 'src',
    type: 'directory' as const,
    permissions: 'drwxr-xr-x',
    modified: '2024-06-28 23:40',
  },
  {
    name: 'package.json',
    type: 'file' as const,
    size: 1520,
    extension: '.json',
    permissions: '-rw-r--r--',
    modified: '2024-06-28 22:15',
  },
  {
    name: 'README.md',
    type: 'file' as const,
    size: 2847,
    extension: '.md',
    permissions: '-rw-r--r--',
    modified: '2024-06-28 18:30',
  },
  {
    name: 'App.tsx',
    type: 'file' as const,
    size: 892,
    extension: '.tsx',
    permissions: '-rw-r--r--',
    modified: '2024-06-28 23:45',
  },
  {
    name: 'vite.config.ts',
    type: 'file' as const,
    size: 456,
    extension: '.ts',
    permissions: '-rw-r--r--',
    modified: '2024-06-28 20:10',
  },
];

export const Default: Story = {
  args: {
    path: '/Users/user/atomic-codex/packages/ui-components',
    files: sampleFiles,
    description: 'List directory contents',
    status: 'completed',
    timestamp: '2024-06-28 23:45:12',
  },
};

export const GridView: Story = {
  args: {
    path: '/Users/user/projects/react-app',
    files: sampleFiles,
    description: 'Directory listing in grid view',
    status: 'completed',
    timestamp: '2024-06-28 23:45:12',
  },
};

export const WithHiddenFiles: Story = {
  args: {
    path: '/Users/user/atomic-codex',
    files: sampleFiles,
    description: 'Show hidden files and directories',
    status: 'completed',
    showHidden: true,
    timestamp: '2024-06-28 23:45:12',
  },
};

export const LargeDirectory: Story = {
  args: {
    path: '/Users/user/large-project',
    files: [
      ...sampleFiles,
      {
        name: 'components',
        type: 'directory' as const,
        permissions: 'drwxr-xr-x',
        modified: '2024-06-28 20:00',
      },
      {
        name: 'utils',
        type: 'directory' as const,
        permissions: 'drwxr-xr-x',
        modified: '2024-06-28 19:45',
      },
      {
        name: 'assets',
        type: 'directory' as const,
        permissions: 'drwxr-xr-x',
        modified: '2024-06-28 18:20',
      },
      {
        name: 'logo.png',
        type: 'file' as const,
        size: 45678,
        extension: '.png',
        permissions: '-rw-r--r--',
        modified: '2024-06-28 16:30',
      },
      {
        name: 'video.mp4',
        type: 'file' as const,
        size: 12345678,
        extension: '.mp4',
        permissions: '-rw-r--r--',
        modified: '2024-06-28 14:15',
      },
      {
        name: 'archive.zip',
        type: 'file' as const,
        size: 567890,
        extension: '.zip',
        permissions: '-rw-r--r--',
        modified: '2024-06-28 12:00',
      },
      {
        name: 'music.mp3',
        type: 'file' as const,
        size: 4567890,
        extension: '.mp3',
        permissions: '-rw-r--r--',
        modified: '2024-06-28 11:30',
      },
    ],
    description: 'Large directory with many file types',
    status: 'completed',
    timestamp: '2024-06-28 23:45:12',
  },
};

export const EmptyDirectory: Story = {
  args: {
    path: '/Users/user/empty-folder',
    files: [],
    description: 'Empty directory listing',
    status: 'completed',
    timestamp: '2024-06-28 23:45:12',
  },
};

export const ErrorState: Story = {
  args: {
    path: '/Users/user/protected-folder',
    files: [],
    description: 'Permission denied',
    status: 'error',
    timestamp: '2024-06-28 23:45:12',
  },
};

export const PendingState: Story = {
  args: {
    path: '/Users/user/loading-folder',
    files: [],
    description: 'Scanning directory...',
    status: 'pending',
    timestamp: '2024-06-28 23:45:12',
  },
};

export const InteractiveExample: Story = {
  args: {
    path: '/Users/user/atomic-codex/packages/ui-components',
    files: sampleFiles,
    description: 'Click on files and directories',
    status: 'completed',
    timestamp: '2024-06-28 23:45:12',
    onPathClick: (path: string) => {
      console.log('Path clicked:', path);
    },
    onFileClick: (file: any) => {
      console.log('File clicked:', file.name);
    },
  },
};