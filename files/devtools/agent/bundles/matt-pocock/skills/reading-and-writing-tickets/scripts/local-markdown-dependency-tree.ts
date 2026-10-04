#!/usr/bin/env -S mise exec -- bun run --install=fallback

const usage = "Usage: local-markdown-dependency-tree.ts RESOLVED_TRACKER_ROOT";
const args = process.argv.slice(2);
if (args[0] === "--help" || args[0] === "-h") {
  console.log(usage);
  process.exit(args.length === 1 ? 0 : 2);
}
if (args.length !== 1 || !args[0].startsWith("/")) {
  console.error(usage);
  console.error("Pass the absolute tracker root returned by shared-context.");
  process.exit(2);
}

const root = args[0];
const query = `
  import "github.com/harehare/okf.mq" |
  map(
    walk_files(root, "**/*.md"),
    fn(file): okf::okf_parse(read_file(root + "/" + file))["frontmatter"];
  )
`;
const result = Bun.spawnSync(
  [
    "mq",
    "--allow-http-import",
    `--allow-read=${root}`,
    "--args",
    "root",
    root,
    "-I",
    "null",
    "-F",
    "json",
    query,
  ],
  { stdout: "pipe", stderr: "pipe" },
);

if (result.exitCode !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.exitCode || 1);
}

let parsed: unknown;
try {
  parsed = JSON.parse(new TextDecoder().decode(result.stdout));
} catch {
  console.error("local ticket graph: mq returned invalid JSON");
  process.exit(1);
}

try {
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const tickets = rows.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(`ticket ${index + 1} has invalid YAML frontmatter`);
    }

    const frontmatter = row as Record<string, unknown>;
    const id = stringValue(frontmatter.id, "id", index);
    const title = stringValue(frontmatter.title, "title", index);
    const rawBlockers = frontmatter.blocked_by ?? [];
    if (!Array.isArray(rawBlockers)) {
      throw new Error(`ticket ${index + 1} has a non-list blocked_by value`);
    }

    return {
      id,
      title,
      blockedBy: rawBlockers.map((blocker, blockerIndex) =>
        stringValue(blocker, `blocked_by item ${blockerIndex + 1}`, index)
      ),
    };
  });

  const ids = new Set<string>();
  for (const ticket of tickets) {
    if (ids.has(ticket.id)) throw new Error(`duplicate ticket ID: ${ticket.id}`);
    ids.add(ticket.id);
  }

  tickets.sort((left, right) => left.id.localeCompare(right.id));
  if (tickets.length === 0) {
    console.log("No ticket Markdown files found.");
    process.exit(0);
  }

  const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  for (const ticket of tickets) {
    console.log(`. #${ticket.id} ${ticket.title}`);
    for (const blockerId of ticket.blockedBy) {
      const blocker = byId.get(blockerId);
      const title = blocker ? ` ${blocker.title}` : " [not found in ticket directory]";
      console.log(`  . blocked by #${blockerId}${title}`);
    }
  }
} catch (error: unknown) {
  console.error(`local ticket graph: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

function stringValue(value: unknown, field: string, index: number): string {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  throw new Error(`ticket ${index + 1} has no valid ${field} in YAML frontmatter`);
}
