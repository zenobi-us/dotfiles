# Issue tracker: Local shared context

Issues and PRDs for this repository live as Markdown files beneath `.scratch/` in the active Matt Pocock alignment root, outside the repository.

The system prompt MUST contain `<matt-pocock-context storage="shared" root="...">`. Resolve every path below against that absolute `root`. If shared storage is not active, stop and ask the user to run `/matt-context init`, then `/reload`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The PRD is `.scratch/<feature-slug>/PRD.md`
- Implementation issues are `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is recorded as a `Status:` line near the top of each issue file; resolve `docs/agents/triage-labels.md` against the same alignment root
- Comments and conversation history append to the bottom of the file under a `## Comments` heading
- Files MUST NOT be written to the repository's `.scratch/` directory

## When a skill says "publish to the issue tracker"

Create a new file beneath `<matt-pocock-context root>/.scratch/<feature-slug>/`, creating directories when needed.

## When a skill says "fetch the relevant ticket"

Read the referenced file beneath `<matt-pocock-context root>/.scratch/`. Reject paths that escape the alignment root.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` — the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
