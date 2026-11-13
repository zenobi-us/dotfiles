import { describe, expect, test } from "bun:test";
import { recordAgentActivity, agentActivitySummary } from "../mods/shared-context/agent-model.js";

const repository = "/work/repo";
const ticket = { id: "viewer", ref: "tracker/tickets/viewer.md", status: "claimed" };
const research = { id: "storage", ref: "tracker/tickets/storage.md", documentType: "research", status: "draft" };
const initiative = { id: "evidence", ref: "tracker/initiatives/evidence/index.md", ticketIds: ["viewer", "viewer", "storage"] };
const snapshot = { tickets: [ticket, research], initiatives: [initiative] };
const agent = (address: string, status = "working") => ({ address, status, title: "Same title does not establish ownership" });
const terminal = (address: string, ref?: string, parent?: string, cwd = repository) => ({
  address, state: "live", parent,
  argv: ref ? ["omp", "--cwd", cwd, `/skill:worktree start ${JSON.stringify(ref)}\n\nUser request: ${JSON.stringify(research.ref)}`] : ["omp"],
});

function addresses(result: Map<string, { address: string }[]>, ref: string) {
  return result.get(ref)?.map((entry: { address: string }) => entry.address) ?? [];
}

describe("live agents associated with canonical records", () => {
  test("uses the exact launch selector, not references in the user request or the agent title", () => {
    const result = recordAgentActivity(snapshot, [agent("t1"), agent("t2")], [terminal("t1", ticket.ref), terminal("t2")], repository);
    expect(addresses(result, ticket.ref)).toEqual(["t1"]);
    expect(addresses(result, research.ref)).toEqual([]);
    expect(addresses(result, initiative.ref)).toEqual(["t1"]);
  });

  test("inherits through headless parents but an explicit different target takes precedence", () => {
    const result = recordAgentActivity(snapshot, [agent("child"), agent("other", "blocked")], [
      terminal("root", ticket.ref), terminal("middle", undefined, "root"), terminal("child", undefined, "middle"), terminal("other", research.ref, "root"),
    ], repository);
    expect(addresses(result, ticket.ref)).toEqual(["child"]);
    expect(addresses(result, research.ref)).toEqual(["other"]);
    expect(addresses(result, initiative.ref)).toEqual(["child", "other"]);
  });

  test("does not inherit when a child explicitly targets another repository or an unknown record", () => {
    const result = recordAgentActivity(snapshot, [agent("foreign"), agent("unknown")], [
      terminal("root", ticket.ref), terminal("foreign", ticket.ref, "root", "/work/other"), terminal("unknown", "tracker/tickets/missing.md", "root"),
    ], repository);
    expect(result.size).toBe(0);
  });

  test("removes idle, done, disappeared, and finished agents without changing recorded states", () => {
    const list = [terminal("t1", ticket.ref), terminal("t2", ticket.ref), { ...terminal("t3", ticket.ref), state: "finished" }];
    expect(addresses(recordAgentActivity(snapshot, [agent("t1"), agent("t2", "blocked")], list, repository), ticket.ref)).toEqual(["t1", "t2"]);
    expect(recordAgentActivity(snapshot, [agent("t1", "idle"), agent("t2", "done"), agent("t3"), agent("missing")], list, repository).size).toBe(0);
    expect(ticket.status).toBe("claimed");
    expect(research.status).toBe("draft");
  });

  test("deduplicates initiative members and direct initiative associations by terminal address", () => {
    const result = recordAgentActivity(snapshot, [agent("root"), agent("child"), agent("child")], [terminal("root", initiative.ref), terminal("child", ticket.ref, "root")], repository);
    expect(addresses(result, initiative.ref)).toEqual(["root", "child"]);
    expect(addresses(result, ticket.ref)).toEqual(["child"]);
  });

  test("isolates machine-qualified addresses and terminates cyclic parent relationships", () => {
    const all = [terminal("t1", ticket.ref), terminal("remote/t1", research.ref), terminal("cycle-a", undefined, "cycle-b"), terminal("cycle-b", undefined, "cycle-a")];
    const visible = [agent("t1"), agent("remote/t1", "blocked"), agent("cycle-a")];
    expect(addresses(recordAgentActivity(snapshot, visible, all, repository), ticket.ref)).toEqual(["t1"]);
    expect(addresses(recordAgentActivity(snapshot, visible, all, repository), research.ref)).toEqual([]);
    expect(addresses(recordAgentActivity(snapshot, visible, all, repository, "remote"), research.ref)).toEqual(["remote/t1"]);
  });

  test("associates research actions without interpreting research as an implementation workflow", () => {
    const launched = terminal("research");
    launched.argv = ["omp", "--cwd", repository, `/skill:ask-matt ${JSON.stringify(research.ref)}\n\nUser request: \"Compare stores\"`];
    const result = recordAgentActivity(snapshot, [agent("research", "blocked")], [launched], repository);
    expect(addresses(result, research.ref)).toEqual(["research"]);
    expect(agentActivitySummary(result.get(research.ref)!)).toBe("1 needs input");
  });

  test("associates harness-neutral launches by the target marker and repository folder", () => {
    const launch = (address: string, folder: string, ref: string) => ({ address, state: "live", argv: ["env", "-C", folder, `SHARED_CONTEXT_TARGET=${ref}`, "/usr/bin/claude", "--", "@/home/q/prompt.md"] });
    const result = recordAgentActivity(snapshot, [agent("here"), agent("there")], [launch("here", repository, ticket.ref), launch("there", "/work/other", research.ref)], repository);
    expect(addresses(result, ticket.ref)).toEqual(["here"]);
    expect(addresses(result, research.ref)).toEqual([]);
  });
});
