import type { Meta, StoryObj } from "@storybook/react";
import { BashTool } from "./bash-tool";
// import { AllFixtures } from '@dao/chat-items-bash-tool';

const meta = {
  title: "Chat Items/Bash Tool",
  component: BashTool,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: { type: "select" },
      options: ["pending", "running", "completed", "error"],
    },
    animated: {
      control: { type: "boolean" },
    },
    showCopyButton: {
      control: { type: "boolean" },
    },
  },
} satisfies Meta<typeof BashTool>;

export default meta;
type Story = StoryObj<typeof meta>;

// TODO: Use create mock data. we ahve changed the source and just need to work on the presentation
const realFixture = AllFixtures.successfulCommand;

export const Default: Story = {
  args: {
    command: realFixture.toolCall.tool.input.command,
    description: realFixture.toolCall.tool.input.description,
    output:
      typeof realFixture.toolResult.toolUseResult === "object"
        ? realFixture.toolResult.toolUseResult?.stdout || ""
        : "",
    status: "completed",
    timestamp: realFixture.toolCall.timestamp,
    animated: false,
  },
};

export const Animated: Story = {
  args: {
    command: "npm install --save react framer-motion",
    description: "Installing React dependencies with animations",
    output:
      "added 245 packages, and audited 1337 packages in 3s\n\n54 packages are looking for funding\n  run `npm fund` for details\n\nfound 0 vulnerabilities",
    status: "completed",
    duration: 3247,
    timestamp: "2024-06-28 23:45:12",
    animated: true,
  },
};

export const Running: Story = {
  args: {
    command: "bun test --watch",
    description: "Running tests in watch mode",
    status: "running",
    animated: true,
  },
};

export const LongOutput: Story = {
  args: {
    command: 'find . -name "*.ts" | head -20',
    description: "Finding TypeScript files",
    output:
      "./src/components/ui/button.ts\n./src/components/ui/card.ts\n./src/components/ui/input.ts\n./src/components/chat-items/bash-tool/bash-tool.ts\n./src/components/chat-items/ls-tool/ls-tool.ts\n./src/components/chat-items/read-tool/read-tool.ts\n./src/components/chat-items/edit-tool/edit-tool.ts\n./src/components/chat-items/grep-tool/grep-tool.ts\n./src/lib/utils.ts\n./src/hooks/useDebounce.ts\n./src/types/index.ts\n./tests/components/button.test.ts\n./tests/components/card.test.ts\n./tests/utils.test.ts\n./build/types/index.d.ts\n./build/components/index.d.ts",
    status: "completed",
    duration: 156,
    timestamp: "2024-06-28 23:45:12",
  },
};

export const Error: Story = {
  args: {
    command: "npm run build:prod",
    description: "Building for production",
    output:
      "Error: Command failed with exit code 1\n\nTypeError: Cannot read property 'length' of undefined\n    at buildComponent (build.js:42:18)\n    at Object.build (build.js:156:22)\n    at async Promise.all (index 0)",
    status: "error",
    duration: 1200,
    timestamp: "2024-06-28 23:45:12",
  },
};

export const Pending: Story = {
  args: {
    command: "docker build -t myapp .",
    description: "Building Docker image",
    status: "pending",
    timestamp: "2024-06-28 23:45:12",
  },
};
