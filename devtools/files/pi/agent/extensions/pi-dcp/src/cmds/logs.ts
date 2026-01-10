/**
 * /dcp-logs command - View pi-dcp logs
 *
 * Shows recent log entries and provides information about log file locations.
 */

import type { PiCommand } from "@mariozechner/pi-agent-core";
import { getLogger } from "../logger";
import { readFileSync, existsSync, statSync } from "fs";

export const dcpLogsCommand: PiCommand = {
	name: "dcp-logs",
	description: "View pi-dcp extension logs",
	args: [
		{
			name: "lines",
			description: "Number of lines to show (default: 50)",
			type: "number",
			required: false,
		},
		{
			name: "file",
			description: "Show specific backup file (0=current, 1-5=backups)",
			type: "number",
			required: false,
		},
	],
	fn: async (args) => {
		const logger = getLogger();
		const linesToShow = (args.lines as number) || 50;
		const fileIndex = (args.file as number) ?? 0;

		// Get all log files
		const allLogFiles = logger.getAllLogFiles();
		
		if (allLogFiles.length === 0) {
			return "📋 No log files found. Logs will be created when extension runs.";
		}

		// Validate file index
		if (fileIndex < 0 || fileIndex >= allLogFiles.length) {
			return `❌ Invalid file index. Available: 0 (current) to ${allLogFiles.length - 1} (oldest backup)`;
		}

		const logFilePath = allLogFiles[fileIndex];
		
		if (!existsSync(logFilePath)) {
			return `❌ Log file not found: ${logFilePath}`;
		}

		// Get file info
		const stats = statSync(logFilePath);
		const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

		// Read the file
		const content = readFileSync(logFilePath, "utf8");
		const lines = content.split("\n").filter(line => line.trim());
		
		// Get last N lines
		const recentLines = lines.slice(-linesToShow);

		// Build response
		let response = `📋 **pi-dcp Logs**\n\n`;
		response += `**File:** \`${logFilePath}\`\n`;
		response += `**Size:** ${fileSizeMB} MB\n`;
		response += `**Total Lines:** ${lines.length}\n`;
		response += `**Showing:** Last ${recentLines.length} lines\n\n`;
		response += "---\n\n";
		response += "```\n";
		response += recentLines.join("\n");
		response += "\n```\n\n";
		
		// Show available files
		if (allLogFiles.length > 1) {
			response += "\n**Available log files:**\n";
			allLogFiles.forEach((file, idx) => {
				const size = existsSync(file) ? (statSync(file).size / (1024 * 1024)).toFixed(2) : "0";
				const label = idx === 0 ? "current" : `backup ${idx}`;
				response += `- ${idx}: ${label} (${size} MB)\n`;
			});
			response += "\nUse `/dcp-logs --file <number>` to view a specific file.";
		}

		return response;
	},
};
