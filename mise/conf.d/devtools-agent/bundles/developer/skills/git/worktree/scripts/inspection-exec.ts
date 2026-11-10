// UI refreshes share repository observations, never document bytes or action authorization.
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";

/** Create once per inspection sweep. Action preparation must use the original executor. */
export function createInspectionExecutor(exec: Exec, defaultCwd: string): Exec {
  const observations = new Map<string, ReturnType<Exec>>();
  return (command, args, cwd = defaultCwd) => {
    if (!isObservation(command, args)) return exec(command, args, cwd);
    const key = JSON.stringify([command, args, cwd]);
    let observation = observations.get(key);
    if (!observation) {
      observation = exec(command, args, cwd);
      observations.set(key, observation);
    }
    return observation;
  };
}

const gitObservations: Readonly<Record<string, true>> = {
  "rev-parse": true, log: true, show: true, "diff-tree": true, "merge-base": true, "ls-remote": true, status: true,
};

function isObservation(command: string, args: string[]): boolean {
  if (command === "gh") return args[0] === "pr" && args[1] === "list";
  if (command !== "git" && command !== "wt") return false;
  let index = 0;
  while (index < args.length) {
    const argument = args[index];
    if (argument === "-C" || command === "wt" && argument === "--config-set") index += 2;
    else if (command === "git" && argument === "--no-optional-locks") index++;
    else break;
  }
  const operation = args[index];
  if (command === "wt") return operation === "list";
  return operation !== undefined && (Object.hasOwn(gitObservations, operation) || operation === "branch" && args[index + 1] === "--show-current" && args.length === index + 2);
}
