import type { Meta, StoryObj } from "@storybook/react";
import { EditTool } from "./edit-tool";

const meta = {
	title: "Chat Items/Edit Tool",
	component: EditTool,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		status: {
			control: { type: "select" },
			options: ["pending", "completed", "error"],
		},
	},
} satisfies Meta<typeof EditTool>;

export default meta;
type Story = StoryObj<typeof meta>;

const oldCode = `import React from 'react';
import { Button } from './button';

export const App = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Hello World</h1>
      <Button onClick={() => setCount(count + 1)}>
        Count: {count}
      </Button>
    </div>
  );
};`;

const newCode = `import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export const App = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Hello World</h1>
      <Button 
        onClick={() => setCount(count + 1)}
        variant="default"
      >
        Count: {count}
      </Button>
    </div>
  );
};`;

export const Default: Story = {
	args: {
		filePath: "/Users/user/project/src/App.tsx",
		oldContent: oldCode,
		newContent: newCode,
		description: "Updated imports and added styling classes",
		status: "completed",
		timestamp: "2024-06-28 23:45:12",
	},
};

export const SimpleEdit: Story = {
	args: {
		filePath: "/Users/user/project/config.json",
		oldContent: '{\n  "name": "old-project",\n  "version": "1.0.0"\n}',
		newContent: '{\n  "name": "new-project",\n  "version": "1.1.0"\n}',
		description: "Updated project name and version",
		status: "completed",
		timestamp: "2024-06-28 23:45:12",
	},
};

export const LargeFileEdit: Story = {
	args: {
		filePath: "/Users/user/project/src/components/LargeComponent.tsx",
		oldContent: oldCode,
		newContent: newCode,
		description: "Major refactoring of component structure",
		status: "completed",
		timestamp: "2024-06-28 23:45:12",
	},
};

export const ErrorState: Story = {
	args: {
		filePath: "/Users/user/project/src/broken.tsx",
		description: "Failed to apply edit - file is read-only",
		status: "error",
		timestamp: "2024-06-28 23:45:12",
	},
};

export const PendingState: Story = {
	args: {
		filePath: "/Users/user/project/src/pending.tsx",
		description: "Applying changes...",
		status: "pending",
		timestamp: "2024-06-28 23:45:12",
	},
};
