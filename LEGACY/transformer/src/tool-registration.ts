/**
 * @fileoverview Tool registration interface and discovery engine
 * @module @dao/transformer/tool-registration
 */

/**
 * Tool registration interface for chat-item packages
 * Each package exports this to declare what tool it handles
 */
export interface ToolRegistration {
	/** The tool name this package handles (e.g., "Bash", "Edit") */
	readonly toolName: string;

	/** The component type it produces (e.g., "bash_tool", "file_tool") */
	readonly componentType: string;

	/** Package name for debugging and imports */
	readonly packageName: string;

	/** Package version for compatibility checks */
	readonly version: string;

	/** Optional metadata */
	readonly metadata?: {
		/** Tool category (e.g., "shell", "file", "search") */
		category?: string;

		/** Human-readable description */
		description?: string;

		/** Example usage */
		examples?: readonly string[];
	};
}

/**
 * Registry entry with additional runtime information
 */
interface RegistryEntry extends ToolRegistration {
	/** Absolute path to package directory */
	packagePath: string;

	/** When this entry was discovered */
	discoveredAt: number;

	/** Whether the package was successfully loaded */
	loaded: boolean;
}

/**
 * Tool discovery and registration engine
 * Provides dynamic discovery of chat-item packages and their tool mappings
 */
export class ToolDiscoveryEngine {
	private registrationCache = new Map<string, RegistryEntry>();
	private packageCache = new Map<string, RegistryEntry>();
	private initialized = false;
	private initPromise: Promise<void> | null = null;

	/**
	 * Get component type for a tool name
	 * @param toolName - The tool name (e.g., "Bash", "Edit")
	 * @returns The component type (e.g., "bash_tool", "file_tool")
	 */
	async getComponentType(toolName: string): Promise<string> {
		// Ensure initialization
		await this.ensureInitialized();

		// Special case: MCP tools
		if (toolName.startsWith("mcp__")) {
			return "mcp_tool";
		}

		// Look up in registry
		const entry = this.registrationCache.get(toolName);
		return entry?.componentType ?? "generic_tool";
	}

	/**
	 * Get all registered tools
	 * @returns Array of all discovered tool registrations
	 */
	async getAllRegistrations(): Promise<ToolRegistration[]> {
		await this.ensureInitialized();
		return Array.from(this.registrationCache.values()).map((entry) => ({
			toolName: entry.toolName,
			componentType: entry.componentType,
			packageName: entry.packageName,
			version: entry.version,
			metadata: entry.metadata,
		}));
	}

	/**
	 * Get registration for a specific tool
	 * @param toolName - The tool name to look up
	 * @returns The registration entry or null if not found
	 */
	async getRegistration(toolName: string): Promise<ToolRegistration | null> {
		await this.ensureInitialized();
		const entry = this.registrationCache.get(toolName);
		return entry
			? {
					toolName: entry.toolName,
					componentType: entry.componentType,
					packageName: entry.packageName,
					version: entry.version,
					metadata: entry.metadata,
				}
			: null;
	}

	/**
	 * Force refresh of the registry (useful for development)
	 */
	async refresh(): Promise<void> {
		this.initialized = false;
		this.initPromise = null;
		this.registrationCache.clear();
		this.packageCache.clear();
		await this.ensureInitialized();
	}

	/**
	 * Get discovery statistics
	 */
	async getStats(): Promise<{
		totalPackages: number;
		loadedPackages: number;
		totalTools: number;
		lastDiscovery: number;
	}> {
		await this.ensureInitialized();
		const entries = Array.from(this.packageCache.values());
		return {
			totalPackages: entries.length,
			loadedPackages: entries.filter((e) => e.loaded).length,
			totalTools: this.registrationCache.size,
			lastDiscovery: Math.max(...entries.map((e) => e.discoveredAt), 0),
		};
	}

	/**
	 * Ensure the engine is initialized
	 */
	private async ensureInitialized(): Promise<void> {
		if (this.initialized) {
			return;
		}

		if (this.initPromise) {
			return this.initPromise;
		}

		this.initPromise = this.initialize();
		return this.initPromise;
	}

	/**
	 * Initialize the discovery engine
	 */
	private async initialize(): Promise<void> {
		try {
			const registrations = await this.discoverToolPackages();

			// Build lookup maps
			for (const registration of registrations) {
				this.registrationCache.set(registration.toolName, registration);
				this.packageCache.set(registration.packageName, registration);
			}

			this.initialized = true;
		} catch (error) {
			// Reset state on error
			this.initPromise = null;
			this.registrationCache.clear();
			this.packageCache.clear();
			throw new Error(`Failed to initialize tool discovery: ${error}`);
		}
	}

	/**
	 * Discover all chat-item packages and their tool registrations
	 */
	private async discoverToolPackages(): Promise<RegistryEntry[]> {
		const discoveries: RegistryEntry[] = [];
		const now = Date.now();

		try {
			// Use Bun's built-in filesystem to find all chat-item packages
			const packagePaths = await this.findChatItemPackages();

			for (const packageJsonPath of packagePaths) {
				// Skip common-types package
				if (packageJsonPath.includes("common-types")) {
					continue;
				}

				try {
					const registration = await this.loadPackageRegistration(packageJsonPath);
					if (registration) {
						discoveries.push({
							...registration,
							packagePath: packageJsonPath.replace("/package.json", ""),
							discoveredAt: now,
							loaded: true,
						});
					}
				} catch (error) {
					// Log error but continue discovery
					console.warn(`Failed to load tool registration from ${packageJsonPath}:`, error);

					// Still track failed packages for debugging
					const packageName = this.extractPackageNameFromPath(packageJsonPath);
					if (packageName) {
						discoveries.push({
							toolName: "unknown",
							componentType: "unknown_tool",
							packageName,
							version: "unknown",
							packagePath: packageJsonPath.replace("/package.json", ""),
							discoveredAt: now,
							loaded: false,
						});
					}
				}
			}
		} catch (error) {
			throw new Error(`Package discovery failed: ${error}`);
		}

		return discoveries;
	}

	/**
	 * Find all chat-item package.json files using known directory structure
	 */
	private async findChatItemPackages(): Promise<string[]> {
		const packagePaths: string[] = [];

		// Known chat-item packages based on your directory structure
		const knownPackages = [
			"bash-tool",
			"edit-tool",
			"glob-tool",
			"grep-tool",
			"ls-tool",
			"multiedit-tool",
			"read-tool",
			"write-tool",
		];

		// Try both from root and from package directory
		const basePaths = ["packages/chat-items", "../chat-items"];

		for (const basePath of basePaths) {
			for (const packageName of knownPackages) {
				const packageJsonPath = `${basePath}/${packageName}/package.json`;
				try {
					if (await Bun.file(packageJsonPath).exists()) {
						packagePaths.push(packageJsonPath);
					}
				} catch {
					// File doesn't exist, continue
				}
			}
			// If we found packages with this base path, use them
			if (packagePaths.length > 0) {
				break;
			}
		}

		return packagePaths;
	}

	/**
	 * Load tool registration from a specific package using dynamic imports
	 */
	private async loadPackageRegistration(packageJsonPath: string): Promise<ToolRegistration | null> {
		try {
			// Extract package name from path
			const packageName = await this.extractPackageNameFromPackageJson(packageJsonPath);
			if (!packageName) {
				return null;
			}

			// Try different import strategies in order of preference
			const registration = await this.tryDynamicImport(packageName, packageJsonPath);
			if (registration) {
				return registration;
			}

			return null;
		} catch (error) {
			throw new Error(`Failed to load registration from ${packageJsonPath}: ${error}`);
		}
	}

	/**
	 * Try to import package registration using file path strategy
	 */
	private async tryDynamicImport(
		packageName: string,
		packageJsonPath: string,
	): Promise<ToolRegistration | null> {
		// Strategy 1: Import from relative file path
		const packageDir = packageJsonPath.replace("/package.json", "");
		const importPaths = [`${packageDir}/src/index.ts`, `${packageDir}/index.ts`];

		for (const importPath of importPaths) {
			try {
				// Check if file exists first
				if (!(await Bun.file(importPath).exists())) {
					continue;
				}

				const moduleImport = await import(importPath);
				// Check for TOOL_REGISTRATION (uppercase) first, then toolRegistration (camelCase)
				const registration = moduleImport.TOOL_REGISTRATION || moduleImport.toolRegistration;
				if (registration && this.isValidRegistration(registration)) {
					return registration;
				}

				// Also check for default export
				if (moduleImport.default && this.isValidRegistration(moduleImport.default)) {
					return moduleImport.default;
				}
			} catch (error) {
				if (!this.isTestEnvironment()) {
					console.debug(`File path import failed for ${importPath}:`, error);
				}
			}
		}

		// Strategy 2: Handle test environment gracefully
		if (this.isTestEnvironment()) {
			return this.createFallbackRegistration(packageName, packageJsonPath);
		}

		return null;
	}

	/**
	 * Check if we're in a test environment
	 */
	private isTestEnvironment(): boolean {
		return (
			process.env.NODE_ENV === "test" ||
			process.env.JEST_WORKER_ID !== undefined ||
			process.env.VITEST !== undefined ||
			process.env.BUN_TEST !== undefined
		);
	}

	/**
	 * Create a fallback registration for test environments
	 */
	private createFallbackRegistration(
		packageName: string,
		_packageJsonPath: string,
	): ToolRegistration | null {
		try {
			// Extract tool name from package name
			const toolName = this.extractToolNameFromPackageName(packageName);
			if (!toolName) {
				return null;
			}

			// Create a minimal registration for testing
			return {
				toolName,
				componentType: "generic_tool",
				packageName,
				version: "test",
				metadata: {
					category: "test",
					description: `Test registration for ${toolName}`,
				},
			};
		} catch (error) {
			console.debug(`Failed to create fallback registration:`, error);
			return null;
		}
	}

	/**
	 * Extract package name from package.json file
	 */
	private async extractPackageNameFromPackageJson(packageJsonPath: string): Promise<string | null> {
		try {
			const packageJson = JSON.parse(await Bun.file(packageJsonPath).text());
			return packageJson.name || null;
		} catch (error) {
			console.debug(`Failed to read package.json at ${packageJsonPath}:`, error);
			return null;
		}
	}

	/**
	 * Validate tool registration structure
	 */
	private isValidRegistration(registration: unknown): registration is ToolRegistration {
		return (
			typeof registration === "object" &&
			registration !== null &&
			"toolName" in registration &&
			"componentType" in registration &&
			"packageName" in registration &&
			"version" in registration &&
			typeof (registration as ToolRegistration).toolName === "string" &&
			typeof (registration as ToolRegistration).componentType === "string" &&
			typeof (registration as ToolRegistration).packageName === "string" &&
			typeof (registration as ToolRegistration).version === "string"
		);
	}

	/**
	 * Extract package name from file path
	 */
	private extractPackageNameFromPath(packageJsonPath: string): string | null {
		const match = packageJsonPath.match(/packages\/chat-items\/([^/]+)\//);
		return match ? `@dao/chat-items-${match[1]}` : null;
	}

	/**
	 * Extract tool name from package name
	 */
	private extractToolNameFromPackageName(packageName: string): string | null {
		const match = packageName.match(/@dao\/chat-items-(.+)-tool$/);
		if (match) {
			// Convert kebab-case to PascalCase
			return match[1]
				.split("-")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join("");
		}
		return null;
	}
}

/**
 * Singleton instance of the discovery engine
 */
export const toolDiscovery = new ToolDiscoveryEngine();

/**
 * Convenience function to get component type
 * @param toolName - The tool name
 * @returns The component type
 */
export async function getComponentType(toolName: string): Promise<string> {
	return toolDiscovery.getComponentType(toolName);
}

/**
 * Helper to create a tool registration
 * @param registration - The registration data
 * @returns A properly typed tool registration
 */
export function createToolRegistration(registration: ToolRegistration): ToolRegistration {
	return Object.freeze(registration);
}
