import { ChevronDown, ChevronRight } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export interface JsonDisplayProps {
	data: any
	maxDepth?: number
	collapsible?: boolean
	className?: string
}

export interface ParseResult {
	success: boolean
	data: any
	error?: string
}

/**
 * Safely parse JSON with error handling
 * Never throws, always returns result object
 */
export function safeParseJSON(text: string): ParseResult {
	try {
		const data = JSON.parse(text)
		return { success: true, data }
	} catch (error) {
		return {
			success: false,
			data: null,
			error: error instanceof Error ? error.message : "Invalid JSON",
		}
	}
}

/**
 * Pretty-print JSON with consistent formatting
 * Handles circular references, undefined values
 */
export function formatJSON(obj: any, indent: number = 2): string {
	try {
		// Handle circular references and undefined values
		const replacer = (key: string, value: any) => {
			if (value === undefined) return "[undefined]"
			if (value === null) return null
			if (typeof value === "function") return "[function]"
			if (typeof value === "symbol") return "[symbol]"
			return value
		}

		return JSON.stringify(obj, replacer, indent)
	} catch (error) {
		return "[Error formatting JSON: " + (error instanceof Error ? error.message : "Unknown error") + "]"
	}
}

/**
 * Get appropriate color for JSON value type
 */
function getValueColor(value: any): string {
	if (value === null) return "text-gray-500"
	if (typeof value === "string") return "text-green-600"
	if (typeof value === "number") return "text-blue-600"
	if (typeof value === "boolean") return "text-orange-600"
	if (Array.isArray(value)) return "text-purple-600"
	if (typeof value === "object") return "text-gray-700"
	return "text-gray-600"
}

/**
 * Recursive JSON tree component
 */
const JsonTree: React.FC<{
	data: any
	depth: number
	maxDepth: number
	collapsible: boolean
	keyName?: string
}> = ({ data, depth, maxDepth, collapsible, keyName }) => {
	const [isExpanded, setIsExpanded] = useState(depth < 2) // Auto-expand first 2 levels

	if (depth > maxDepth) {
		return <span className="text-gray-500 italic">...</span>
	}

	// Primitive values
	if (data === null || typeof data !== "object") {
		return <span className={cn("font-mono text-sm", getValueColor(data))}>{JSON.stringify(data)}</span>
	}

	// Arrays
	if (Array.isArray(data)) {
		if (data.length === 0) {
			return <span className="text-gray-500 font-mono">[]</span>
		}

		if (!collapsible || depth >= maxDepth) {
			return (
				<span className="font-mono text-sm">
					[<span className="text-gray-500">{data.length} items</span>]
				</span>
			)
		}

		return (
			<div className="font-mono text-sm">
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
				>
					{isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}[{data.length}]
				</button>
				{isExpanded && (
					<div className="ml-4 border-l border-gray-200 pl-2">
						{data.slice(0, 10).map((item, index) => (
							<div key={index} className="flex">
								<span className="text-gray-500 mr-2">{index}:</span>
								<JsonTree data={item} depth={depth + 1} maxDepth={maxDepth} collapsible={collapsible} />
							</div>
						))}
						{data.length > 10 && <div className="text-gray-500 italic">... and {data.length - 10} more items</div>}
					</div>
				)}
			</div>
		)
	}

	// Objects
	const keys = Object.keys(data)
	if (keys.length === 0) {
		return <span className="text-gray-500 font-mono">{"{}"}</span>
	}

	if (!collapsible || depth >= maxDepth) {
		return (
			<span className="font-mono text-sm">
				{"{"}
				<span className="text-gray-500">{keys.length} keys</span>
				{"}"}
			</span>
		)
	}

	return (
		<div className="font-mono text-sm">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="flex items-center gap-1 text-gray-700 hover:text-gray-900"
			>
				{isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
				{"{"}
				{keys.length}
				{"}"}
			</button>
			{isExpanded && (
				<div className="ml-4 border-l border-gray-200 pl-2">
					{keys.slice(0, 10).map((key) => (
						<div key={key} className="flex">
							<span className="text-blue-700 mr-2">"{key}":</span>
							<JsonTree
								data={data[key]}
								depth={depth + 1}
								maxDepth={maxDepth}
								collapsible={collapsible}
								keyName={key}
							/>
						</div>
					))}
					{keys.length > 10 && <div className="text-gray-500 italic">... and {keys.length - 10} more keys</div>}
				</div>
			)}
		</div>
	)
}

/**
 * Syntax-highlighted JSON display
 * Collapsible tree view with syntax highlighting
 */
export const JsonDisplay: React.FC<JsonDisplayProps> = ({ data, maxDepth = 5, collapsible = true, className }) => {
	// Handle invalid data
	if (data === undefined) {
		return (
			<div className={cn("bg-gray-50 rounded p-3 border", className)}>
				<span className="text-gray-500 italic">No data</span>
			</div>
		)
	}

	return (
		<div className={cn("bg-gray-50 rounded p-3 border overflow-auto", className)}>
			<JsonTree data={data} depth={0} maxDepth={maxDepth} collapsible={collapsible} />
		</div>
	)
}
