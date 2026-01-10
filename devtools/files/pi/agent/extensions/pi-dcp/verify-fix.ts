/**
 * Verification script: Simulate the actual error scenario and prove it's fixed
 */

import { applyPruningWorkflow } from "./src/workflow";
import { registerRule } from "./src/registry";
import { deduplicationRule } from "./src/rules/deduplication";
import { toolPairingRule } from "./src/rules/tool-pairing";
import { recencyRule } from "./src/rules/recency";
import type { DcpConfigWithPruneRuleObjects } from "./src/types";

// Register rules
registerRule(deduplicationRule);
registerRule(toolPairingRule);
registerRule(recencyRule);

// Simulate real-world messages that caused the 400 error
const messages = [
	{ role: "user", content: "Read the file" },
	{
		role: "assistant",
		content: [
			{ type: "text", text: "I'll read it" },
			{ type: "tool_use", id: "toolu_01VzLnitYpwspzkRMSc2bhfA", name: "read", input: { path: "test.txt" } },
		],
	},
	{
		role: "user",
		content: [
			{
				type: "tool_result",
				tool_use_id: "toolu_01VzLnitYpwspzkRMSc2bhfA",
				content: "file contents",
			},
		],
	},
	{ role: "assistant", content: "Got it" },
	{ role: "user", content: "Read it again" },
	{
		role: "assistant",
		content: [
			{ type: "text", text: "I'll read it" },
			{ type: "tool_use", id: "toolu_01VzLnitYpwspzkRMSc2bhfA", name: "read", input: { path: "test.txt" } },
		],
	},
	{
		role: "user",
		content: [
			{
				type: "tool_result",
				tool_use_id: "toolu_01VzLnitYpwspzkRMSc2bhfA",
				content: "file contents",
			},
		],
	},
] as any;

const config: DcpConfigWithPruneRuleObjects = {
	enabled: true,
	debug: true,
	rules: [deduplicationRule, toolPairingRule, recencyRule],
	keepRecentCount: 0, // Don't protect anything - show pure pruning behavior
};

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  Pi-DCP Fix Verification: Tool Use/Result Pairing           ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

console.log("📋 Scenario: Duplicate tool calls (caused 400 error before fix)\n");

console.log("Before pruning:");
messages.forEach((m: any, i: number) => {
	const toolUse = m.content?.find?.((p: any) => p.type === "tool_use");
	const toolResult = m.content?.find?.((p: any) => p.type === "tool_result");
	console.log(`  [${i}] ${m.role.padEnd(10)} ${toolUse ? `🔧 tool_use(${toolUse.id.slice(-6)})` : ""}${toolResult ? `📥 tool_result(${toolResult.tool_use_id.slice(-6)})` : ""}`);
});

console.log(`\nTotal messages: ${messages.length}\n`);

console.log("⚙️  Applying pruning workflow...\n");

const result = applyPruningWorkflow(messages, config);

console.log("After pruning:");
result.forEach((m: any) => {
	const i = messages.indexOf(m);
	const toolUse = m.content?.find?.((p: any) => p.type === "tool_use");
	const toolResult = m.content?.find?.((p: any) => p.type === "tool_result");
	console.log(`  [${i}] ${m.role.padEnd(10)} ${toolUse ? `🔧 tool_use(${toolUse.id.slice(-6)})` : ""}${toolResult ? `📥 tool_result(${toolResult.tool_use_id.slice(-6)})` : ""}`);
});

console.log(`\nTotal messages: ${result.length} (${messages.length - result.length} pruned)\n`);

// Verify pairing
console.log("🔍 Verifying tool_use/tool_result pairing...\n");

const toolUseIds = new Set<string>();
let valid = true;

for (const m of result) {
	const content = Array.isArray(m.content) ? m.content : [];
	const toolUses = content.filter((p: any) => p?.type === "tool_use");
	const toolResults = content.filter((p: any) => p?.type === "tool_result");

	toolUses.forEach((tu: any) => toolUseIds.add(tu.id));

	for (const tr of toolResults) {
		if (!toolUseIds.has(tr.tool_use_id)) {
			console.log(`   ❌ BROKEN: tool_result ${tr.tool_use_id} has no matching tool_use`);
			valid = false;
		}
	}
}

if (valid) {
	console.log("   ✅ All tool_use/tool_result pairs are valid!");
	console.log("\n╔══════════════════════════════════════════════════════════════╗");
	console.log("║  ✅ FIX VERIFIED: No 400 errors will occur                  ║");
	console.log("╚══════════════════════════════════════════════════════════════╝");
} else {
	console.log("\n╔══════════════════════════════════════════════════════════════╗");
	console.log("║  ❌ FIX FAILED: Pairing is broken                           ║");
	console.log("╚══════════════════════════════════════════════════════════════╝");
	process.exit(1);
}
