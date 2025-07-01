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
			options: ["pending", "completed", "failed", "in_progress", "interrupted"],
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
		toolUse: {
			type: "tool_use",
			id: "toolu_01234567890abcdef",
			name: "Edit",
			input: {
				file_path: "/Users/user/project/src/App.tsx",
				old_string: oldCode,
				new_string: newCode,
			},
		},
		status: "completed",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			stdout:
				"The file /Users/user/project/src/App.tsx has been updated. Here's the result of running `cat -n` on a snippet of the edited file:\n     1→import React, { useState } from 'react';\n     2→import { Button } from '@/components/ui/button';\n     3→\n     4→export const App = () => {\n     5→  const [count, setCount] = useState(0);",
			stderr: "",
			interrupted: false,
			isImage: false,
			isError: false,
		},
	},
};

export const SimpleEdit: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "toolu_01SimpleEditExample",
			name: "Edit",
			input: {
				file_path: "/Users/user/project/config.json",
				old_string: '{\n  "name": "old-project",\n  "version": "1.0.0"\n}',
				new_string: '{\n  "name": "new-project",\n  "version": "1.1.0"\n}',
			},
		},
		status: "completed",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			stdout:
				'The file /Users/user/project/config.json has been updated. Here\'s the result of running `cat -n` on a snippet of the edited file:\n     1→{\n     2→  "name": "new-project",\n     3→  "version": "1.1.0"\n     4→}',
			stderr: "",
			interrupted: false,
			isImage: false,
			isError: false,
		},
	},
};

export const WithReplaceAll: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "toolu_01ReplaceAllExample",
			name: "Edit",
			input: {
				file_path: "/Users/user/project/src/components/LargeComponent.tsx",
				old_string: oldCode,
				new_string: newCode,
				replace_all: true,
			},
		},
		status: "completed",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			stdout:
				"The file /Users/user/project/src/components/LargeComponent.tsx has been updated. All 3 instances replaced.",
			stderr: "",
			interrupted: false,
			isImage: false,
			isError: false,
		},
	},
};

export const ErrorState: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "toolu_01ErrorExample",
			name: "Edit",
			input: {
				file_path: "/Users/user/project/src/broken.tsx",
				old_string: "const old = 'value';",
				new_string: "const new = 'value';",
			},
		},
		status: "failed",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			stdout: "",
			stderr: "Error: Permission denied - file is read-only",
			interrupted: false,
			isImage: false,
			isError: true,
		},
	},
};

export const PendingState: Story = {
	args: {
		toolUse: {
			type: "tool_use",
			id: "toolu_01PendingExample",
			name: "Edit",
			input: {
				file_path: "/Users/user/project/src/pending.tsx",
				old_string: "const old = 'value';",
				new_string: "const new = 'value';",
			},
		},
		status: "pending",
		timestamp: "2024-06-28T23:45:12.000Z",
		toolResult: {
			stdout: "",
			stderr: "",
			interrupted: false,
			isImage: false,
			isError: false,
		},
	},
};
