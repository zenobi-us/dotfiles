// Live activity is UI state, not workflow evidence. Match canonical launch targets, never titles or folders.
// Headless parents supply associations only; displayed activity always comes from Herdr's agents().
export function recordAgentActivity(snapshot, agents, terminals, repository, machine = null) {
  const records = new Map([...snapshot.tickets, ...snapshot.initiatives.filter(record => !record.group)].map(record => [record.ref, record]));
  const live = new Map(terminals.filter(terminal => terminal.state === "live" && terminalMachine(terminal.address) === (machine ?? "")).map(terminal => [terminal.address, terminal]));
  const targets = new Map(), resolving = new Set();
  const result = new Map();
  for (const agent of agents) {
    if (agent.status !== "working" && agent.status !== "blocked") continue;
    const ref = resolveTarget(agent.address, live, records, repository, targets, resolving);
    if (!ref) continue;
    const entries = result.get(ref) ?? new Map();
    entries.set(agent.address, { ...agent, recordRef: ref });
    result.set(ref, entries);
  }
  const tickets = new Map(snapshot.tickets.map(record => [record.id, record]));
  for (const initiative of snapshot.initiatives) {
    if (initiative.group) continue;
    const entries = new Map(result.get(initiative.ref));
    for (const id of initiative.ticketIds) {
      const member = tickets.get(id);
      if (member) for (const [address, agent] of result.get(member.ref) ?? []) entries.set(address, agent);
    }
    if (entries.size) result.set(initiative.ref, entries);
  }
  return new Map([...result].map(([ref, entries]) => [ref, [...entries.values()]]));
}

export function agentActivitySummary(agents) {
  const working = agents.filter(agent => agent.status === "working").length, waiting = agents.length - working;
  return [working ? `${working} working` : "", waiting ? `${waiting} ${waiting === 1 ? "needs" : "need"} input` : ""].filter(Boolean).join(" · ");
}

function resolveTarget(address, terminals, records, repository, targets, resolving) {
  if (targets.has(address)) return targets.get(address);
  const terminal = terminals.get(address);
  if (!terminal || resolving.has(address)) return null;
  resolving.add(address);
  const direct = launchTarget(terminal.argv ?? [], repository);
  // An explicit target outside this snapshot must not inherit a different parent target.
  const ref = direct !== undefined ? records.has(direct) ? direct : null : resolveTarget(terminal.parent, terminals, records, repository, targets, resolving);
  resolving.delete(address);
  targets.set(address, ref);
  return ref;
}

// Current launches: env -C <repository> SHARED_CONTEXT_TARGET=<ref> <agent argv>. See data.ts prepare().
// Earlier OMP launches put --cwd and the /skill: prompt in argv; their terminals can still be live.
function launchTarget(argv, repository) {
  if (argv[0] === "env") {
    const marker = argv.find(argument => typeof argument === "string" && argument.startsWith("SHARED_CONTEXT_TARGET="));
    if (marker !== undefined) return argv[argv.indexOf("-C") + 1] === repository ? marker.slice("SHARED_CONTEXT_TARGET=".length) : null;
  }
  const cwd = argv.indexOf("--cwd");
  for (const argument of argv) {
    if (typeof argument !== "string") continue;
    const firstLine = argument.split("\n", 1)[0];
    const match = /^\/skill:(?:worktree (?:start|review|fix|finish|submit)|ask-matt|grill-with-docs|to-tickets|prototype) ("(?:[^"\\]|\\.)*")\s*$/.exec(firstLine);
    if (!match) continue;
    if (cwd < 0 || argv[cwd + 1] !== repository) return null;
    try { return JSON.parse(match[1]); }
    catch { return null; }
  }
  return undefined;
}

function terminalMachine(address) {
  const slash = address.indexOf("/");
  return slash < 0 ? "" : address.slice(0, slash);
}
