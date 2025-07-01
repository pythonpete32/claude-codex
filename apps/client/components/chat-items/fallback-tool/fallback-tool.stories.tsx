import type { Meta, StoryObj } from "@storybook/react";
import { FallbackTool } from "./fallback-tool";

const meta = {
	title: "Chat Items/Fallback Tool",
	component: FallbackTool,
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
} satisfies Meta<typeof FallbackTool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UnknownTool: Story = {
	args: {
		toolUse: {
			id: "toolu_01UnknownTool123",
			name: "custom_analysis_tool",
			input: {
				query: "analyze this data",
				format: "json",
				parameters: {
					depth: 3,
					includeMetadata: true,
				},
			},
		},
		toolResult: {
			stdout: [
				{
					type: "text",
					text: '{\n  "analysis": "completed",\n  "results": {\n    "score": 0.85,\n    "confidence": "high",\n    "recommendations": ["optimize queries", "add caching"]\n  },\n  "metadata": {\n    "processingTime": "2.3s",\n    "version": "1.2.0"\n  }\n}',
				},
			],
			stderr: "",
			interrupted: false,
			isError: false,
		},
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
};

export const MCPTool: Story = {
	args: {
		toolUse: {
			id: "toolu_01MCPTool456",
			name: "mcp__weather__get_forecast",
			input: {
				location: "San Francisco, CA",
				days: 5,
				units: "metric",
			},
		},
		toolResult: {
			stdout: [
				{
					type: "text",
					text: "Weather forecast for San Francisco, CA:\n\nDay 1: Sunny, 22°C\nDay 2: Partly cloudy, 20°C\nDay 3: Rainy, 18°C\nDay 4: Cloudy, 19°C\nDay 5: Sunny, 24°C",
				},
			],
			stderr: "",
			interrupted: false,
			isError: false,
		},
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
};

export const ToolWithError: Story = {
	args: {
		toolUse: {
			id: "toolu_01ErrorTool789",
			name: "database_query_tool",
			input: {
				query: "SELECT * FROM non_existent_table",
				database: "production",
			},
		},
		toolResult: {
			stdout: [],
			stderr: "Error: Table 'non_existent_table' doesn't exist in database 'production'",
			interrupted: false,
			isError: true,
		},
		status: "error",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
};

export const PendingTool: Story = {
	args: {
		toolUse: {
			id: "toolu_01PendingTool000",
			name: "long_running_analysis",
			input: {
				dataset: "large_dataset.csv",
				algorithm: "machine_learning",
			},
		},
		status: "pending",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
};

export const ToolWithNoInput: Story = {
	args: {
		toolUse: {
			id: "toolu_01NoInput111",
			name: "system_status_check",
		},
		toolResult: {
			stdout: [
				{
					type: "text",
					text: "System Status: All services operational\nUptime: 99.9%\nLast check: 2025-06-29T01:35:07.522Z",
				},
			],
			stderr: "",
			interrupted: false,
			isError: false,
		},
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
};

export const InterruptedTool: Story = {
	args: {
		toolUse: {
			id: "toolu_01Interrupted222",
			name: "file_processing_tool",
			input: {
				file_path: "/large/file/to/process.dat",
				operation: "compress",
			},
		},
		toolResult: {
			stdout: [
				{
					type: "text",
					text: "Processing started...\nCompleted: 45%\nOperation interrupted by user request",
				},
			],
			stderr: "",
			interrupted: true,
			isError: false,
		},
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
};

export const ComplexInput: Story = {
	args: {
		toolUse: {
			id: "toolu_01Complex333",
			name: "advanced_configuration_tool",
			input: {
				config: {
					server: {
						host: "localhost",
						port: 8080,
						ssl: true,
						certificates: {
							cert: "/path/to/cert.pem",
							key: "/path/to/key.pem",
						},
					},
					database: {
						type: "postgresql",
						connection: {
							host: "db.example.com",
							port: 5432,
							database: "myapp",
							username: "admin",
						},
						pool: {
							min: 5,
							max: 20,
						},
					},
					features: ["auth", "logging", "metrics"],
					debug: false,
				},
			},
		},
		toolResult: {
			stdout: [
				{
					type: "text",
					text: "Configuration applied successfully\nServer started on https://localhost:8080\nDatabase connection established\nAll features enabled",
				},
			],
			stderr: "",
			interrupted: false,
			isError: false,
		},
		status: "completed",
		timestamp: "2025-06-29T01:35:07.522Z",
	},
};
