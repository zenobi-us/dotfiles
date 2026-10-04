#!/usr/bin/env -S mise exec -- bun run --install=fallback

const args = process.argv.slice(2);
if (args[0] === "--help" || args[0] === "-h") {
  console.log("Usage: github-dependency-tree.ts OWNER/REPO");
  process.exit(args.length === 1 ? 0 : 2);
}
if (args.length !== 1) {
  console.error("Usage: github-dependency-tree.ts OWNER/REPO");
  process.exit(2);
}

const issues = Bun.spawnSync(
  [
    "gh",
    "issue",
    "list",
    "--repo",
    args[0],
    "--state",
    "all",
    "--limit",
    "1000",
    "--json",
    "number,title,blockedBy",
  ],
  {
    stdout: "pipe",
    stderr: "pipe",
  },
);
if (issues.exitCode !== 0) {
  process.stderr.write(issues.stderr);
  process.exit(issues.exitCode || 1);
}

const query = `
  import "github.com/harehare/okf.mq" |
  map(., fn(ticket):
    join(
      [". #" + to_string(ticket["number"]) + " " + ticket["title"]] +
      map(ticket["blockedBy"], fn(blocker):
        "  . blocked by #" + to_string(blocker["number"]) + " " + blocker["title"];
      ),
      "\\n"
    );
  ) |
  join("\\n")
`;

const formatted = Bun.spawnSync(
  ["mq", "--allow-http-import", "-I", "json", "-F", "text", query],
  {
    stdin: issues.stdout,
    stdout: "pipe",
    stderr: "pipe",
  },
);
if (formatted.exitCode !== 0) {
  process.stderr.write(formatted.stderr);
  process.exit(formatted.exitCode || 1);
}
process.stdout.write(formatted.stdout);
