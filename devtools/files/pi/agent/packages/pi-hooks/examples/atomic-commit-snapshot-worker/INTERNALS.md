# Snapshot autocommit internals

Everything below is implementation contract for the `atomic-commit-snapshot-worker` example. Read [`README.md`](./README.md) first for the wiring; come here when you want to understand the capture contract, branch generation, quarantine semantics, env vars, or debugging.

## How it works

This setup gives you one hook, one worker, and one SQLite queue per worktree. It watches file edits, snapshots them into git objects, then replays them as real commits after a short quiet window.

If you want the short version:

- `snapshot-hook.py` captures `file.changed` payloads and queues them.
- `snapshot-worker.py` drains the queue and publishes commits.
- `snapshot_shared.py` coordinates branch generation and same-branch ownership through repo-common-dir shared state.
- Each worktree gets its own isolated state under its private git dir.
- Exact capture is guaranteed only for supported hook surfaces and supported worktree or branch topologies.
- Incomplete payload surfaces are best-effort. Unsupported branch or worktree topologies are rejected early or quarantined later, not replayed in a degraded mode.
- Built-in AI commit messages are optional. If AI is off or skipped, the worker uses `SNAPSHOTD_COMMIT_MESSAGE_CMD` if configured, otherwise deterministic commit messages.

## What it does

There are three files:

- `snapshot-hook.py`
  - Reads hook payload JSON from stdin
  - Figures out which files changed
  - Hashes current file contents into git blobs
  - Consults shared branch state before enqueue
  - Writes an event plus `path_tail` updates in one `BEGIN IMMEDIATE` transaction
  - Wakes the live worker with `SIGUSR1`, or spawns one if needed

- `snapshot-worker.py`
  - Waits for a quiet window
  - Replays pending events onto the current branch tip using a temporary git index
  - Publishes with `git update-ref` compare-and-swap
  - Uses a two-phase publish so crashes can be recovered on restart

- `snapshot_shared.py`
  - Resolves the repo root, worktree git dir, and repo-common-dir
  - Maintains shared per-branch registry state in the repo common dir
  - Rejects unsupported same-branch multi-worktree ownership
  - Tracks branch generation so rewritten or recreated branches can quarantine stale local queue state

Why split it this way? The hook stays cheap and fast. It just captures state. The worker does the expensive part later, once edits settle down. The shared helper exists because the queue is still worktree-local, but branch ownership and generation now need one repo-scoped source of truth.

## Where state lives

If you copy this example out of the repo, keep `snapshot-hook.py`, `snapshot-worker.py`, and `snapshot_shared.py` together in the same directory. By default, the hook finds the worker via `__file__`. If you need to override it, set:

```bash
export SNAPSHOTD_WORKER_PATH=/abs/path/to/snapshot-worker.py
```

Make the executable entrypoints executable:

```bash
chmod +x snapshot-hook.py snapshot-worker.py
```

Each worktree stores its own state inside its private git dir.

Examples:

- main worktree: `/path/to/repo/.git`
- linked worktree: `/path/to/repo/.git/worktrees/<name>`

The hook and worker create these paths automatically:

| Path | Purpose |
|------|---------|
| `<git-dir>/ai-snapshotd/snapshotd.db` | SQLite queue, WAL mode |
| `<git-dir>/ai-snapshotd/worker.lock` | Singleton worker lock |
| `<git-dir>/ai-snapshotd/worker.index` | Temporary git index for replay |
| `<git-dir>/ai-snapshotd/logs/hook.log` | Rotated hook debug log |
| `<git-dir>/ai-snapshotd/logs/worker.log` | Rotated worker debug log |
| `<git-dir>/ai-snapshotd.incompatible-<stamp>-<pid>/` | Quarantined local state from an incompatible older schema |
| `<git-common-dir>/ai-snapshotd/branch-registry/*.json` | Shared branch owner plus generation registry |
| `<git-common-dir>/ai-snapshotd/branch-registry/*.lock` | Per-branch coordination locks |

This isolation matters. Five projects with three worktrees each means fifteen independent queues and fifteen independent workers, not one shared bottleneck. The queue is still worktree-local, but branch ownership and branch generation are now coordinated through repo-common-dir shared state. That shared registry exists to keep replay safe, not to make same-branch multi-worktree replay a supported topology.

### Local versus shared state

The implementation is now intentionally hybrid:

- **Worktree-local state** stays in `snapshotd.db`
  - `events`
  - `event_ops`
  - `path_tail`
  - `reconcile_pending`
  - `worker_state`
- **Repo-shared state** lives under `branch-registry/`
  - current branch owner worktree
  - branch head observed by the snapshot system
  - branch generation / incarnation tracking

That means the system still replays from one local queue per worktree, but it no longer treats `branch_ref` alone as enough identity for safe replay.

If the hook or worker finds an incompatible older local schema, it now quarantines that worktree-local `ai-snapshotd/` directory once and recreates a fresh current-state DB automatically. Shared `branch-registry/` state is left alone.

## How it works now

### 1. Capture path

1. `snapshot-hook.py` resolves the repo root, worktree git dir, and repo common dir.
2. It asks `snapshot_shared.py` for the current branch registry entry.
3. If the same branch is actively owned elsewhere, capture is rejected instead of silently enqueueing unsafe work.
4. The hook stores the event in the local queue with both:
   - `branch_ref`
   - `branch_generation`
5. Local shadow state such as `path_tail` is also keyed by branch generation, so old shadow state cannot be reused after a rewrite unnoticed.

### 2. Replay path

1. `snapshot-worker.py` reads only the local worktree queue.
2. Before replay, it refreshes shared branch registry state.
3. It replays only rows whose `branch_generation` still matches the shared generation and whose `base_head` ancestry is still valid.
4. If the branch was rewritten or the topology is unsupported, the worker settles those rows as `blocked_conflict` instead of replaying them.

### 3. Why this is three files now

Before, the example could treat the worktree-local SQLite DB as the whole state model. After adding branch generation and same-branch ownership guards, that was no longer enough.

So the responsibilities are now split like this:

- `snapshot-hook.py`: capture and local enqueue
- `snapshot-worker.py`: replay, publish, and reconcile
- `snapshot_shared.py`: repo-shared branch identity and ownership checks

That third file is not a second queue. It is the minimal shared coordination layer needed to keep the existing local queue model safe.

## Event states

The worker uses these states. `blocked_conflict` is the settled state for rows that no longer replay safely, including stale branch-generation or unsupported-topology cases.

| State | Meaning |
|------|---------|
| `pending` | Captured and waiting to replay |
| `publishing` | Commit objects are built and `update-ref` is next |
| `published` | The branch now includes the event |
| `blocked_conflict` | Replay was rejected because the state no longer matches. In the target contract, this is also the settled quarantine state for unsupported topology or stale branch generations. |
| `failed` | Hard error during replay or commit creation |

`publishing` is intentionally transient. If the worker crashes between `update-ref` and DB settlement, startup recovery checks whether the target commit made it into history and fixes the state from there.

## Capture contract

The system has to be explicit about when a queued event is exact, when it is best-effort, and when it must be quarantined instead of replayed.

This section defines the operating contract for this example. The queue is still per-worktree, but replay safety depends on shared branch ownership and branch generation checks in addition to local serialized same-path capture.

Best-effort applies only to incomplete source payloads. Unsupported branch or worktree topology is **not** best-effort; it is a quarantine case.

Canonical handling rule:

- If unsupported topology is detected **before enqueue**, the hook should reject the capture and record the failure visibly.
- If unsupported topology or a stale generation is discovered **after enqueue**, the worker should quarantine the row by settling it as `blocked_conflict` with an explicit reason.

### Exact versus best-effort sources

| Source | Capture fidelity | Notes |
|------|------------------|-------|
| `pi-hooks` `file.changed` payloads with explicit `changes[]` | Exact for the structured entries the payload reports | This is the preferred PI surface. The payload names the changed paths directly, so the hook can snapshot those paths without guessing. If the payload also adds extra `files[]` entries, those extras are additive best-effort hints rather than part of the exact structured operation set. |
| `pi-hooks` `file.changed` payloads with `files[]` only and no structured `changes[]` | Best-effort | The event identifies candidate paths, but it does not preserve the exact operation set. |
| Payloads that expose only inferred paths instead of a full structured edit set | Best-effort | The hook snapshots current contents of the discovered paths, but it cannot prove those paths are the complete edit set. |

If a source is best-effort, the system should say that plainly. It should not claim exact per-edit replay semantics for that event.

### Supported worktree and branch matrix

| Topology | Status | Why |
|---------|--------|-----|
| One worktree editing one checked-out branch | Supported for exact capture when the source is exact | The queue, worker, index, and branch checkout all belong to the same worktree. |
| Multiple worktrees in the same repo on different branches | Supported, with one independent queue per worktree | Branch refs differ, so the worktrees do not need cross-worktree branch coordination. |
| Multiple worktrees in the same repo on the **same** branch | Unsupported for autocommit replay | Branch refs are shared across worktrees but queue state is not. The hook should reject before enqueue when it can detect this early; otherwise the worker must quarantine instead of guessing. |
| Unborn branch / empty repo with no `HEAD` commit yet | Unsupported | The hook cannot record a stable `base_head` generation anchor before the first commit exists. |
| Detached HEAD | Unsupported | The hook skips capture because there is no symbolic branch ref to own the event stream. |

### Branch generation and quarantine semantics

- `events.base_head` is the capture-time ancestry anchor.
- The implementation also uses a shared branch-incarnation signal in repo-common-dir state so branch delete-and-recreate can be distinguished from an ordinary fast-forward on the same branch name.
- A queued event is safe to replay only while the live branch still belongs to the same branch generation as that ancestry anchor plus incarnation signal.
- Fast-forward commits after capture are allowed. They stay in the same generation.
- If the branch is reset, rebased, force-moved, deleted, or recreated so the live tip is no longer a descendant of `base_head`, the queued event is stale.
- Deleting and recreating a branch starts a new generation even if the recreated ref later points to the same commit or a descendant. A new ref incarnation must not inherit the old pending queue implicitly.
- Stale or unsupported events must be quarantined by settling them as `blocked_conflict` with an explicit generation or topology reason. They must not be silently retried against the new branch incarnation.

The enforced contract is exact capture only in supported modes, explicit best-effort labeling for inferred paths, and quarantine instead of opportunistic replay when branch identity is no longer trustworthy.

### Mixed-fidelity events

One payload can mix exact structured operations and best-effort hints. For example, a `file.changed` event may provide exact `changes[]` entries plus extra `files[]` entries that are only hints.

Downstream schema work therefore needs fidelity metadata that can represent mixed events. The required contract is per-op fidelity (or an equivalent encoding that preserves which captured paths were exact vs best-effort). Event-level-only fidelity is not sufficient.

## Current guarantees and guardrails

- **Same-path hooks are serialized**
  - `path_tail` reads and writes happen inside one `BEGIN IMMEDIATE` transaction.
  - Two hooks racing on the same file do not capture the same `before` state.

- **Only one worker drains a worktree**
  - The worker takes a flock on `worker.lock`.
  - If another worker starts, it exits.
  - The hook prefers signalling a live worker over spawning a new one.

- **Worktrees stay isolated, with shared branch coordination layered on top**
  - Different git dirs mean different DBs, locks, logs, and workers.
  - That isolation is safe for different branches.
  - It is **not** enough to make same-branch multi-worktree replay exact. Exact mode therefore assumes one worktree owns a branch at a time.

- **Branch-specific replay**
  - The worker only processes pending events for the currently checked out branch.
  - Events for other branches stay pending until that branch is active again.
  - That branch-name check is necessary but not sufficient. Shared branch generation checks reject or quarantine unsupported same-branch multi-worktree cases.

- **Crash recovery is explicit**
  - Leftover `publishing` rows are reconciled on startup.
  - If the target commit is already an ancestor of the branch tip, the event is marked `published`.
  - If the branch generation or ancestry no longer matches, the row is quarantined instead of being replayed into a new branch incarnation.

## Environment variables

| Variable | Default | What it controls |
|----------|---------|------------------|
| `SNAPSHOTD_QUIET_SECONDS` | `1.0` | How long the worker waits after the last enqueue before replay starts |
| `SNAPSHOTD_IDLE_SECONDS` | `30.0` | How long the worker stays alive with no work on the current branch |
| `SNAPSHOTD_POLL_SECONDS` | `0.35` | Poll interval while waiting |
| `SNAPSHOTD_HEARTBEAT_STALE` | `15.0` | Age after which a worker heartbeat is treated as dead |
| `SNAPSHOTD_AI_ENABLE` | off | Enables built-in AI commit messages |
| `SNAPSHOTD_AI_MAX_QUEUE_DEPTH` | `2` | Backlog depth above which built-in AI batching is skipped |
| `SNAPSHOTD_AI_CHUNK_SIZE` | `20` | Max events per structured-output AI request, clamped to `1..100` |
| `SNAPSHOTD_COMMIT_MESSAGE_CMD` | unset | Custom argv-style message command, run per event |
| `SNAPSHOTD_SENSITIVE_GLOBS` | `.env,*.pem,*.key,...` | Paths whose diffs are redacted before any network call |
| `SNAPSHOTD_RETENTION_SECONDS` | `604800` | How long settled rows are kept before pruning |
| `SNAPSHOTD_LOG_MAX_BYTES` / `_KEEP` | `2 MiB` / `3` | Log rotation threshold and retained files |
| `SNAPSHOTD_DEBUG` | off | Writes debug logs under `<git-dir>/ai-snapshotd/logs/` |
| `SNAPSHOTD_WORKER_PATH` | sibling file | Override worker script path |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | unset / OpenAI default | Required for built-in AI mode. Base URL must be `https://` |
| `OPENAI_MODEL` | `gpt-4o-mini` (placeholder) | Model used for built-in AI mode. Set this explicitly to whichever OpenAI-compatible model your account has access to; the default is just a placeholder. |
| `OPENAI_API_TIMEOUT` | `15` | Network timeout in seconds |

If neither `SNAPSHOTD_COMMIT_MESSAGE_CMD` nor `SNAPSHOTD_AI_ENABLE=1` is set, the worker writes deterministic commit messages.

## Batch message generation

Built-in AI now works as a pre-pass, not a per-event network call.

When AI is enabled and the backlog is at or below `SNAPSHOTD_AI_MAX_QUEUE_DEPTH`, the worker does this before replaying commits:

1. Find events whose `events.message` is still `NULL`
2. Split them into chunks of `SNAPSHOTD_AI_CHUNK_SIZE`
3. Send one structured-output request per chunk
4. Persist returned messages into `events.message`
5. Build commits from stored messages, falling back to `SNAPSHOTD_COMMIT_MESSAGE_CMD` if configured, otherwise deterministic commit messages, for any event whose chunk failed

Why this design is better:

- It cuts prompt overhead on bursts because one request covers many events.
- It keeps replay predictable because generated messages are stored before the commit loop.
- It degrades cleanly. One bad chunk falls back to `SNAPSHOTD_COMMIT_MESSAGE_CMD` if configured, otherwise deterministic commit messages, for that chunk only.

Each request uses a JSON schema. The model has to return a `messages` array, keyed by event `seq`. Sensitive-path redaction still happens per event before anything leaves the machine.

### Tuning guidance

| Setting | Good starting point | Why |
|---------|---------------------|-----|
| `SNAPSHOTD_AI_CHUNK_SIZE` | `20` | Large enough to amortize prompt overhead, small enough to keep responses manageable |
| `SNAPSHOTD_AI_MAX_QUEUE_DEPTH` | `50` or `100` | With chunking, 100 queued events means 5 requests at chunk size 20, not 100 requests |
| `SNAPSHOTD_COMMIT_MESSAGE_CMD` | leave unset unless you need custom logic | Custom command generation still runs once per event, so it does not benefit from batching |

If you are still tuning the system, start with built-in batching. It is cheaper and simpler than a custom per-event command.

## Operating commands

```bash
# Show queue status for a repo
python3 snapshot-worker.py --status --repo /path/to/repo

# Drain pending events synchronously
# Exit 0 if the current-branch queue is empty, 2 if events remain
python3 snapshot-worker.py --flush --repo /path/to/repo

# Run the worker in the foreground
python3 snapshot-worker.py --repo /path/to/repo
```

## Debugging

```bash
GIT_DIR=$(git rev-parse --absolute-git-dir)

tail -n 200 "$GIT_DIR/ai-snapshotd/logs/hook.log"
tail -n 200 "$GIT_DIR/ai-snapshotd/logs/worker.log"

python3 snapshot-worker.py --status --repo .

sqlite3 "$GIT_DIR/ai-snapshotd/snapshotd.db" \
  "SELECT seq, state, branch_ref, tool_name, substr(commit_oid,1,8), error FROM events ORDER BY seq DESC LIMIT 20;"
```

## Security notes

- `SNAPSHOTD_COMMIT_MESSAGE_CMD` is parsed with `shlex.split` and executed as a plain argv list. No shell involved.
- Built-in OpenAI mode is off by default. To enable it, set both `OPENAI_API_KEY` and `SNAPSHOTD_AI_ENABLE=1`.
- `OPENAI_BASE_URL` must use `https://`.
- Diffs for paths matching `SNAPSHOTD_SENSITIVE_GLOBS` are replaced with a redaction marker before any network request.
- If backlog depth exceeds `SNAPSHOTD_AI_MAX_QUEUE_DEPTH`, built-in AI is skipped for that drain cycle.

The opinionated recommendation here is simple: keep sensitive globs broad, keep the base URL HTTPS-only, and do not try to be clever about redaction.

## Known limitations

- Unix only. The worker uses advisory `fcntl` locks.
- Some `file.changed` payloads report only inferred paths instead of a full structured edit set. In those cases, capture is best-effort.
- Exact autocommit still does not support multiple worktrees sharing the same branch. The shared branch registry exists to detect and reject or quarantine that topology, not to make it replayable.
- Branch rewrites are not safe to auto-replay across generations. Stale pending work must be quarantined instead.
- `blocked_conflict` events are recorded, not auto-retried.
- After a successful publish, the worker resets only the paths it just committed, and only when the live index still matches the pre-publish HEAD. If you staged different content for the same paths, it leaves that alone.
