#!/usr/bin/env -S mise exec -- bun run --install=fallback
/**
 * The one entry point of the `pr` skill's scripts.
 *
 *   pr.ts meta [--json] [<target-branch>]
 *   pr.ts branch validate [<branch>] [--require-ticket] [--json]
 *   pr.ts branch build <type> <description...> [--ticket <KEY>] [--json]
 *   pr.ts threads list [<pr>] [--json] [--ignore-author <login>]
 *   pr.ts threads reply <thread-id> --body-file <path>
 *   pr.ts threads resolve <thread-id>
 *   pr.ts threads comment [<pr>] --path <file> --line <n> --body-file <path> [--side RIGHT|LEFT]
 *   pr.ts watch [<pr>] [--max-wait <minutes>] [--interval <seconds>]
 *
 * Run it from inside the repository it should act on: every command finds the repository
 * with `git rev-parse --show-toplevel`.
 */
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { TYPES, build, currentBranch, validate } from "./commands/branch.ts";
import { collectMeta, formatHuman as formatMeta } from "./commands/meta.ts";
import {
  commentOnLine,
  formatHuman as formatThreads,
  ghPath,
  listThreads,
  parsePrRef,
  replyToThread,
  resolveThread,
  resolvePr,
} from "./commands/threads.ts";
import { COPILOT_REVIEWED_BASES, DEFAULTS, EXIT_CODES, snapshotReader, watch } from "./commands/watch.ts";

const TICKET = /^[A-Z][A-Z0-9]+-\d+$/;

const print = (json: boolean, value: unknown, human: string): void => {
  console.log(json ? JSON.stringify(value) : human);
};

/** Any command that talks to GitHub reports a failure the same way: stderr, exit 1. */
async function guard(work: () => Promise<number>): Promise<void> {
  try {
    process.exitCode = await work();
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}

const app = new Crust("pr").meta({
  description: "Branch names, PR metadata, review threads and PR watching for the `pr` skill.",
});

const metaCmd = app
  .sub("meta")
  .meta({ description: "One JSON object: branch, target, upstream, working tree, diff and the existing PR." })
  .args([{ name: "target-branch", type: "string", description: "Target branch; default: the repository's default branch." }])
  .flags({ json: { type: "boolean", description: "Print JSON instead of a human-readable snapshot." } })
  .run(({ args, flags }) =>
    guard(async () => {
      const meta = await collectMeta(args["target-branch"]);
      print(flags.json === true, meta, formatMeta(meta));
      return 0;
    }),
  );

const branchCmd = app.sub("branch").meta({ description: "Check a branch name against the convention, or build one." });

const branchValidate = branchCmd
  .sub("validate")
  .meta({ description: "Exit 0 when the name is valid, 1 when it is not. With no <branch>, read the current one." })
  .args([{ name: "branch", type: "string", description: "Branch name to check; default: the current branch." }])
  .flags({
    "require-ticket": { type: "boolean", description: "Fail a name that carries no ticket key." },
    json: { type: "boolean", description: "Print the full verdict as JSON." },
  })
  .run(({ args, flags }) =>
    guard(async () => {
      const branch = args.branch ?? (await currentBranch());
      const verdict = validate(branch, { requireTicket: flags["require-ticket"] === true });
      if (flags.json === true) console.log(JSON.stringify(verdict));
      else if (verdict.valid) console.log(`ok: ${branch}`);
      else console.error([`invalid: ${branch}`, ...verdict.errors.map((line) => `  - ${line}`)].join("\n"));
      return verdict.valid ? 0 : 1;
    }),
  );

const branchBuild = branchCmd
  .sub("build")
  .meta({ description: "Build a valid branch name from a type, a description and an optional ticket key." })
  .args([
    { name: "type", type: "string", required: true, choices: TYPES, description: "Branch type prefix." },
    { name: "description", type: "string", required: true, variadic: true, description: "What the branch does, in words." },
  ])
  .flags({
    ticket: { type: "string", description: "Issue key to put in front of the slug, as in ABC-123." },
    json: { type: "boolean", description: "Print the full verdict as JSON." },
  })
  .run(({ args, flags }) =>
    guard(async () => {
      if (flags.ticket !== undefined && !TICKET.test(flags.ticket)) {
        console.error(`Error: --ticket must look like ABC-123, got: ${flags.ticket}`);
        return 2;
      }
      const branch = build(args.type, args.description.join(" "), flags.ticket);
      const verdict = validate(branch);
      print(flags.json === true, verdict, branch);
      return verdict.valid ? 0 : 1;
    }),
  );

const threadsCmd = app.sub("threads").meta({ description: "Review threads and PR comments through the GitHub API." });

const threadsList = threadsCmd
  .sub("list")
  .meta({ description: "Every review thread, plus the top-level comments and review bodies from reviewers." })
  .args([{ name: "pr", type: "string", description: "PR number or URL; default: the current branch's open PR." }])
  .flags({
    json: { type: "boolean", description: "Print JSON instead of a human-readable summary." },
    "ignore-author": { type: "string", multiple: true, description: "Treat this login as automation, not a reviewer. Repeat it for several." },
  })
  .run(({ args, flags }) =>
    guard(async () => {
      const result = await listThreads(args.pr === undefined ? undefined : parsePrRef(args.pr), flags["ignore-author"] ?? []);
      print(flags.json === true, result, formatThreads(result));
      return 0;
    }),
  );

const threadsReply = threadsCmd
  .sub("reply")
  .meta({ description: "Reply to one review thread with the contents of a file." })
  .args([{ name: "thread-id", type: "string", required: true, description: "Thread id from `threads list`." }])
  .flags({ "body-file": { type: "string", required: true, description: "File holding the reply markdown." } })
  .run(({ args, flags }) =>
    guard(async () => {
      console.log(JSON.stringify(await replyToThread(args["thread-id"], flags["body-file"])));
      return 0;
    }),
  );

const threadsResolve = threadsCmd
  .sub("resolve")
  .meta({ description: "Mark one review thread resolved." })
  .args([{ name: "thread-id", type: "string", required: true, description: "Thread id from `threads list`." }])
  .run(({ args }) =>
    guard(async () => {
      console.log(JSON.stringify(await resolveThread(args["thread-id"])));
      return 0;
    }),
  );

const threadsComment = threadsCmd
  .sub("comment")
  .meta({ description: "Start a new review thread on one line of the diff." })
  .args([{ name: "pr", type: "string", description: "PR number or URL; default: the current branch's open PR." }])
  .flags({
    path: { type: "string", required: true, description: "File to comment on, repository-relative." },
    line: { type: "number", required: true, description: "Line number inside the PR's diff." },
    side: { type: "string", choices: ["RIGHT", "LEFT"], default: "RIGHT", description: "RIGHT is the new code, LEFT the removed code." },
    "body-file": { type: "string", required: true, description: "File holding the comment markdown." },
  })
  .run(({ args, flags }) =>
    guard(async () => {
      if (!Number.isInteger(flags.line) || flags.line < 1) {
        console.error(`Error: --line must be a positive whole number, got: ${flags.line}`);
        return 2;
      }
      const result = await commentOnLine({
        pr: args.pr === undefined ? undefined : parsePrRef(args.pr),
        path: flags.path,
        line: flags.line,
        side: flags.side,
        bodyFile: flags["body-file"],
      });
      console.log(JSON.stringify(result));
      return 0;
    }),
  );

const watchCmd = app
  .sub("watch")
  .meta({
    description:
      "Poll a PR until its checks, Copilot review and reviewer comments settle. Prints one JSON event. Exit: 0 done, 10 action-needed, 11 timeout, 12 closed.",
  })
  .args([{ name: "pr", type: "string", description: "PR number or URL; default: the current branch's open PR." }])
  .flags({
    "max-wait": { type: "number", default: DEFAULTS.maxWait, description: 'Minutes before the event becomes "timeout".' },
    interval: { type: "number", default: DEFAULTS.interval, description: "Seconds between two polls." },
    "copilot-wait": { type: "number", default: DEFAULTS.copilotWait, description: "Minutes after the PR opened to stop waiting for the Copilot review." },
    "copilot-bases": {
      type: "string",
      default: COPILOT_REVIEWED_BASES.join(","),
      description: 'Base branches that get a Copilot review. "none" waits for no review.',
    },
    "ignore-author": { type: "string", multiple: true, description: "Treat this login as automation, not a reviewer. Repeat it for several." },
    since: { type: "string", description: "Report reviewer comments after this ISO time; default: the commit time of the PR head." },
  })
  .run(({ args, flags }) =>
    guard(async () => {
      for (const name of ["max-wait", "interval", "copilot-wait"] as const) {
        const value = flags[name];
        if (!Number.isFinite(value) || value <= 0) {
          console.error(`Error: --${name} needs a positive number, got: ${value}`);
          return 2;
        }
      }
      if (flags.since !== undefined && Number.isNaN(Date.parse(flags.since))) {
        console.error(`Error: --since needs an ISO time, got: ${flags.since}`);
        return 2;
      }
      const bases = flags["copilot-bases"];
      const options = {
        pr: args.pr === undefined ? undefined : parsePrRef(args.pr),
        maxWait: flags["max-wait"],
        interval: flags.interval,
        copilotWait: flags["copilot-wait"],
        copilotBases: bases === "none" ? [] : bases.split(",").map((base) => base.trim()).filter(Boolean),
        ignoreAuthors: flags["ignore-author"] ?? [],
        since: flags.since,
      };
      const gh = ghPath();
      const target = await resolvePr(gh, options.pr);
      const result = await watch(options, { fetchSnapshot: snapshotReader(gh, target, options.ignoreAuthors) });
      console.log(JSON.stringify(result));
      return EXIT_CODES[result.event] ?? 1;
    }),
  );

await app
  .use(helpPlugin())
  .command(metaCmd)
  .command(branchCmd.command(branchValidate).command(branchBuild))
  .command(threadsCmd.command(threadsList).command(threadsReply).command(threadsResolve).command(threadsComment))
  .command(watchCmd)
  .execute();
