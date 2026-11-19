#!/usr/bin/env -S mise x -- bun --install=fallback
// Resolves the current adapter and prints the same recovery decision as the explorer.
import { resolveSharedContext } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import type { TicketRecord } from "../../../../../matt-pocock/skills/reading-and-writing-tickets/scripts/model";
import type { TicketWorkflow } from "./model";
import { recoveryDecision } from "./recovery";
import type { RecoveryDecision } from "./recovery";
import { loadExplorerSnapshot, loadTicketWorkflow } from "./workflow";
import { formatInspection, inspectionBlockers } from "./inspection-blockers";
import type { InspectionBlocker } from "./inspection-blockers";

export async function inspectTicket(ref: string, exec: Exec, cwd = process.cwd()): Promise<{ ticket: TicketRecord; workflow: TicketWorkflow; decision: RecoveryDecision; blockers: InspectionBlocker[] }> {
  const context = await resolveSharedContext(exec, cwd);
  if (!context) throw new Error("Inspection requires a repository with a canonical origin and configured ticket adapter.");
  if (context.error) throw new Error(context.error);
  const snapshot = await loadExplorerSnapshot(context, exec, { ref });
  const ticket = snapshot.tickets.find(ticket => ticket.ref === ref);
  if (!ticket) throw new Error("No ticket matches the canonical reference. Use the resolved ticket adapter's exact reference.");
  const workflow = await loadTicketWorkflow(context, ticket, exec);
  const decision = recoveryDecision(ticket, snapshot, workflow);
  return { ticket, workflow, decision, blockers: inspectionBlockers(workflow, decision) };
}

export async function runInspectCommand(ref: string, json: boolean): Promise<void> {
  const exec: Exec = async (command, args, cwd) => {
    const child = Bun.spawn([command, ...args], { cwd, stdout: "pipe", stderr: "pipe", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
    const timer = setTimeout(() => child.kill("SIGTERM"), 30_000);
    try {
      const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
      return { stdout: code === 0 ? stdout : `${stdout}\n${stderr}`, code };
    } finally { clearTimeout(timer); }
  };
  try {
    const result = await inspectTicket(ref, exec);
    console.log(json ? JSON.stringify(result, null, 2) : formatInspection(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) console.log(JSON.stringify({ error: message }));
    else console.error(message);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const refs = args.filter(arg => arg !== "--json");
  if (refs.length !== 1 || refs[0]!.startsWith("-")) {
    console.error("Usage: inspect.ts <canonical-ticket-ref> [--json]");
    process.exitCode = 1;
  } else await runInspectCommand(refs[0]!, args.includes("--json"));
}
