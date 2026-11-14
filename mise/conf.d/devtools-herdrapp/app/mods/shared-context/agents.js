// Core owns agent lifetime; the app only attaches the returned machine-qualified terminal.
import { hc, terminals } from "herdr";

export async function startAgent(where, prepared) {
  const args = ["run", "--json", "--bg", "--no-parent", "--no-notify", "--keep", "--cwd", prepared.repository, "--label", `shared-context.target=${prepared.recordRef}`];
  if (where.machine) args.push("--on", where.machine);
  const output = await hc([...args, "--", ...prepared.argv]);
  if (output.code !== 0) throw new Error(output.stderr || output.stdout || "Core could not start the agent.");
  const terminal = JSON.parse(output.stdout);
  if (typeof terminal.address !== "string" || !terminal.address) throw new Error("Core did not return an agent terminal address.");
  const address = where.machine && !terminal.address.includes("/") ? `${where.machine}/${terminal.address}` : terminal.address;
  if (terminal.state !== "live") {
    await stopAgent(address);
    throw new Error(`Agent exited during startup (${terminal.exit_code ?? terminal.reason ?? "unknown reason"}).`);
  }
  return address;
}

export async function stopAgent(address) {
  const killed = await hc(["kill", "--json", address]);
  if (killed.code !== 0) throw new Error(killed.stderr || killed.stdout || `Could not stop ${address}.`);
  const removed = await hc(["rm", "--json", address]);
  if (removed.code !== 0) throw new Error(removed.stderr || removed.stdout || `Could not remove ${address}.`);
}

export function waitForAgent(view, address, cx) {
  return new Promise((resolve, reject) => {
    const waiting = { address, resolve, reject };
    view.agentWaiter = waiting;
    observeAgentLaunch(view);
    cx.timer.after(15000, () => {
      if (view.agentWaiter !== waiting) return;
      view.agentWaiter = null;
      reject(new Error("The app did not observe the new Core terminal. Reconnect the machine before trying again."));
    });
    cx.notify();
  });
}

export function observeAgentLaunch(view) {
  const waiting = view.agentWaiter;
  if (!waiting) return;
  const terminal = terminals().find(item => item.address === waiting.address);
  if (!terminal) return;
  view.agentWaiter = null;
  if (terminal.state !== "live") waiting.reject(new Error("The agent exited before the app could attach its terminal."));
  else waiting.resolve(waiting.address);
}

export function cancelAgentWait(view) {
  if (!view.agentWaiter) return;
  const waiting = view.agentWaiter;
  view.agentWaiter = null;
  waiting.reject(new Error("The selected action changed while its terminal was starting."));
}
