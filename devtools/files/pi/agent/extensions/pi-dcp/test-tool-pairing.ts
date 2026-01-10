/**
 * Test script for tool-pairing rule
 * 
 * Run with: bun run test-tool-pairing.ts
 */

import { applyPruningWorkflow } from "./src/workflow";
import { registerRule } from "./src/registry";
import { deduplicationRule } from "./src/rules/deduplication";
import { toolPairingRule } from "./src/rules/tool-pairing";
import { recencyRule } from "./src/rules/recency";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { DcpConfigWithPruneRuleObjects } from "./src/types";

// Register rules
registerRule(deduplicationRule);
registerRule(toolPairingRule);
registerRule(recencyRule);

// Create test messages that simulate the problematic scenario
const testMessages: AgentMessage[] = [
	// Message 0: User request
	{
		role: "user",
		content: "Please read the file",
	} as AgentMessage,

	// Message 1: Assistant with tool_use
	{
		role: "assistant",
		content: [
			{ type: "text", text: "I'll read the file for you." },
			{
				type: "tool_use",
				id: "toolu_01ABC123",
				name: "read",
				input: { path: "test.txt" },
			},
		],
	} as AgentMessage,

	// Message 2: Tool result
	{
		role: "user",
		content: [
			{
				type: "tool_result",
				tool_use_id: "toolu_01ABC123",
				content: "File contents here",
			},
		],
	} as AgentMessage,

	// Message 3: Another assistant message (duplicate of message 1 - should be pruned)
	{
		role: "assistant",
		content: [
			{ type: "text", text: "I'll read the file for you." },
			{
				type: "tool_use",
				id: "toolu_01ABC123",
				name: "read",
				input: { path: "test.txt" },
			},
		],
	} as AgentMessage,

	// Message 4: Another tool result (duplicate - would be pruned but tool_use must stay)
	{
		role: "user",
		content: [
			{
				type: "tool_result",
				tool_use_id: "toolu_01ABC123",
				content: "File contents here",
			},
		],
	} as AgentMessage,

	// Message 5: User message
	{
		role: "user",
		content: "Thanks!",
	} as AgentMessage,

	// Message 6: Assistant with different tool_use
	{
		role: "assistant",
		content: [
			{ type: "text", text: "I'll write the file." },
			{
				type: "tool_use",
				id: "toolu_01XYZ789",
				name: "write",
				input: { path: "output.txt", content: "data" },
			},
		],
	} as AgentMessage,

	// Message 7: Tool result for write
	{
		role: "user",
		content: [
			{
				type: "tool_result",
				tool_use_id: "toolu_01XYZ789",
				content: "File written successfully",
			},
		],
	} as AgentMessage,
];

// Configuration
const config: DcpConfigWithPruneRuleObjects = {
	enabled: true,
	debug: true,
	rules: [deduplicationRule, toolPairingRule, recencyRule],
	keepRecentCount: 3, // Keep last 3 messages
};

console.log("=== Testing Tool Pairing Protection ===\n");
console.log(`Original message count: ${testMessages.length}\n`);

console.log("Messages:");
testMessages.forEach((msg, i) => {
	console.log(`  [${i}] ${msg.role}${msg.role === "assistant" ? " (tool_use: " + (msg.content as any[]).find((p) => p.type === "tool_use")?.id + ")" : ""}`);
	if (msg.role === "user" && Array.isArray(msg.content)) {
		const toolResult = (msg.content as any[]).find((p) => p.type === "tool_result");
		if (toolResult) {
			console.log(`      (tool_result for: ${toolResult.tool_use_id})`);
		}
	}
});

console.log("\n=== Running Pruning Workflow ===\n");

const result = applyPruningWorkflow(testMessages, config);

console.log(`\n=== Results ===`);
console.log(`Pruned: ${testMessages.length - result.length} messages`);
console.log(`Kept: ${result.length} messages\n`);

console.log("Kept messages:");
result.forEach((msg, i) => {
	const originalIndex = testMessages.indexOf(msg);
	console.log(`  [${originalIndex}] ${msg.role}`);
	if (Array.isArray(msg.content)) {
		const toolUse = (msg.content as any[]).find((p) => p?.type === "tool_use");
		const toolResult = (msg.content as any[]).find((p) => p?.type === "tool_result");
		if (toolUse) {
			console.log(`      ↳ tool_use: ${toolUse.id}`);
		}
		if (toolResult) {
			console.log(`      ↳ tool_result for: ${toolResult.tool_use_id}`);
		}
	}
});

// Verify pairing integrity
console.log("\n=== Verifying Pairing Integrity ===\n");

let isValid = true;
const toolUseIds = new Set<string>();

for (let i = 0; i < result.length; i++) {
	const msg = result[i];

	if (Array.isArray(msg.content)) {
		// Collect tool_use IDs
		for (const part of msg.content as any[]) {
			if (part?.type === "tool_use" && part.id) {
				toolUseIds.add(part.id);
				console.log(`✓ Found tool_use: ${part.id} at index ${testMessages.indexOf(msg)}`);
			}
		}

		// Check tool_result has matching tool_use
		for (const part of msg.content as any[]) {
			if (part?.type === "tool_result" && part.tool_use_id) {
				if (toolUseIds.has(part.tool_use_id)) {
					console.log(`✓ Found matching tool_result for: ${part.tool_use_id} at index ${testMessages.indexOf(msg)}`);
				} else {
					console.log(`✗ ERROR: Orphaned tool_result for: ${part.tool_use_id} at index ${testMessages.indexOf(msg)}`);
					isValid = false;
				}
			}
		}
	}
}

if (isValid) {
	console.log("\n✅ All tool_use/tool_result pairs are intact!");
} else {
	console.log("\n❌ FAILED: Broken tool_use/tool_result pairing detected!");
	process.exit(1);
}

console.log("\n=== Test Passed ===");
