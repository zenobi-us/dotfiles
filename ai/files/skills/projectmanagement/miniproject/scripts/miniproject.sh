#!/usr/bin/env bash
set -euo pipefail

# LLM MAINTENANCE INSTRUCTIONS
# - This file has intentional state/data-flow diagrams.
# - If you add/remove/edit logic in any command or helper, update diagrams in this header.
# - Keep naming conventions strict:
#   * Subcommands: cmd_{subcommand_name_with_underscores}
#   * Non-subcommand helpers: lib_{domain}_{purpose}
# - Refresh policy (keep this split):
#   * mutating cmd_* MUST refresh derived views via lib_views_refresh_derived
#   * query cmd_* MAY refresh only via lib_views_refresh_on_query
#   * utility cmd_* MUST NOT refresh derived views
#
# IDEAL USER FLOW (STATE MACHINE)
#
#   [start]
#      |
#      v
#   [discover work] --(next/tree/list-unclaimed-stories)--> [choose task]
#      |                                                      |
#      |                                                      v
#      |<--(release-task)----------------------------- [lock-task]
#      |                                                      |
#      |                              (periodic heartbeat)    v
#      |<--------------------------- [heartbeat] <---- [active work]
#      |                                                      |
#      |                                                      v
#      +----(stale-sweep/takeover-task)--------------> [recovery]
#
# SUBCOMMAND DATA-FLOW SKETCHES
# - cmd_help: args -> usage text -> stdout
# - cmd_memory_dir: git context -> .memory path resolution -> stdout/fs(create)
# - cmd_memory_git_repo: directory -> git root detect -> stdout
# - cmd_migrate_phases_to_inline: phase files -> inline phase markdown -> epic/story file updates
# - cmd_register_intent: args+identity -> .memory/.locks/intents/*.md
# - cmd_discover_intents: intents/*.md -> frontmatter parse -> stdout table
# - cmd_lock_task: task file + identity -> claim frontmatter upserts -> derived views refresh
# - cmd_heartbeat: claimed task + identity -> lease extension upserts -> derived views refresh
# - cmd_takeover_task: claimed task + force+reason -> previous owner snapshot + claim overwrite
# - cmd_release_task: claimed task + owner -> release state upserts -> derived views refresh
# - cmd_stale_sweep: task files -> stale detection -> optional claim_state=stale upsert
# - cmd_project: all epic/story/task files -> team.md/todo.md/summary.md
# - cmd_discover_locks: task files -> active/stale lock snapshot -> stdout
# - cmd_list_by_owner: task files -> owner/workspace grouping -> stdout
# - cmd_list_by_session: alias wrapper -> cmd_list_by_owner
# - cmd_list_unclaimed_stories: story/task files -> unclaimed story list -> stdout
# - cmd_tree: epic/story/task files -> hierarchy view -> stdout
# - cmd_next: identity + task lock state -> recommended next commands -> stdout

# Name: lib_cli_usage
# What: Prints CLI help text and subcommand docs.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_cli_usage() {
	cat <<'EOF'
miniproject.sh - minimal MDTM CLI (subcommand routed)

Usage:
  miniproject.sh <subcommand> [args]

Subcommands:
  help                                 Show this help
  memory-dir                            Print resolved .memory dir
  memory-git-repo <directory>           Print git repo root for directory
  migrate-phases-to-inline [opts] [dir] Migrate phase-*.md to inline epic sections
    --dry-run                            Preview only; make no changes

  register-intent <story_id> [opts]    Register lock intent for a story
    --owner <id>                        Owner identity (required unless env provides)
    --workspace <id>                    Workspace identity (default: derived)
    --run-id <id>                       Run identity (default: generated)
    --ttl-min <minutes>                 Intent TTL in minutes (default: 15)
    --session <id>                      Deprecated alias for --owner

  discover-intents                      List active lock intents

  lock-task <task-file> [opts]          Lock a task (story lock is derived)
    --owner <id>                        Owner identity (required unless env provides)
    --workspace <id>                    Workspace identity (default: derived)
    --run-id <id>                       Run identity (default: generated)
    --reason <text>                     Lock reason (default: "active work")
    --lease-min <minutes>               Lease in minutes (default: 45)
    --session <id>                      Deprecated alias for --owner

  heartbeat <task-file> [opts]          Renew lock heartbeat/lease for owned task
    --owner <id>                        Owner identity (required unless env provides)
    --workspace <id>                    Optional workspace match check
    --run-id <id>                       Run identity to stamp heartbeat
    --lease-min <minutes>               Lease extension minutes (default: 45)
    --session <id>                      Deprecated alias for --owner

  takeover-task <task-file> [opts]      Force takeover of task lock
    --owner <id>                        New owner identity (required)
    --workspace <id>                    Workspace identity (default: derived)
    --run-id <id>                       Run identity (default: generated)
    --reason <text>                     Required takeover reason
    --lease-min <minutes>               Lease in minutes (default: 45)
    --force                             Required to confirm takeover intent
    --session <id>                      Deprecated alias for --owner

  release-task <task-file> [opts]       Release a task lock
    --owner <id>                        Owner identity (required unless env provides)
    --reason <text>                     Release reason (default: "released")
    --session <id>                      Deprecated alias for --owner

  stale-sweep [--apply]                 Detect stale locks; --apply marks claim_state=stale

  project [--stdout]                    Compute derived views (team.md, todo.md, summary.md)
                                        default writes files; --stdout prints only

  discover-locks                        List claimed tasks + derived story locks
  list-by-owner                         List claimed tasks grouped by owner_id
  list-by-session                       Deprecated alias for list-by-owner
  list-unclaimed-stories                List stories with no actively claimed tasks
  tree                                  Print epic > story > task tree (blocked annotated)
  next                                  Print brief dynamic recommendations for what to run next

Identity model (tool/framework agnostic):
  - owner_id: opaque identifier provided by your orchestration/human workflow
  - workspace_id: stable identifier for a worktree/checkout context
  - run_id: ephemeral execution instance id

Environment defaults (optional):
  - MP_OWNER_ID or OWNER_ID (for --owner)
  - MP_AUTO_PROJECT=1|0 (default: 1; auto-refresh after mutating commands)
  - MP_AUTO_PROJECT_QUERY=1|0 (default: 0; optional refresh before query commands)

Notes:
  - Source of truth is task frontmatter in .memory/task-*.md.
  - team.md / todo.md / summary.md should be treated as derived views.
EOF
}

# Name: lib_time_now_iso
# What: Returns current UTC timestamp in ISO-8601.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_time_now_iso() {
	date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# Name: lib_text_hash
# What: Hashes input text using available system hash tool.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_text_hash() {
	local text
	text="$1"
	if command -v sha1sum >/dev/null 2>&1; then
		printf '%s' "$text" | sha1sum | awk '{print $1}'
		return 0
	fi
	if command -v shasum >/dev/null 2>&1; then
		printf '%s' "$text" | shasum -a 1 | awk '{print $1}'
		return 0
	fi
	printf '%s' "$text" | cksum | awk '{print $1}'
}

# Name: lib_identity_owner_default
# What: Resolves default owner identity from env vars.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_identity_owner_default() {
	if [[ -n "${MP_OWNER_ID:-}" ]]; then
		printf '%s\n' "$MP_OWNER_ID"
		return 0
	fi
	if [[ -n "${OWNER_ID:-}" ]]; then
		printf '%s\n' "$OWNER_ID"
		return 0
	fi
	printf '%s\n' ""
}

# Name: lib_identity_workspace_default
# What: Builds deterministic workspace id from repo/worktree path.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_identity_workspace_default() {
	local repo_root worktree raw digest
	repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
	worktree="$(pwd -P)"
	raw="${repo_root}::${worktree}"
	digest="$(lib_text_hash "$raw" | cut -c1-12)"
	printf 'ws-%s\n' "$digest"
}

# Name: lib_identity_run_default
# What: Generates ephemeral run id for current process.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_identity_run_default() {
	printf 'run-%s-%s\n' "$(date +%Y%m%d-%H%M%S)" "$$"
}

# Name: lib_text_safe_name
# What: Sanitizes text for safe filename fragments.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_text_safe_name() {
	local raw
	raw="$1"
	printf '%s' "$raw" | tr '/[:space:]' '__' | tr -cd '[:alnum:]_.-'
}

# Name: lib_time_iso_to_epoch
# What: Converts ISO timestamp to epoch seconds when possible.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_time_iso_to_epoch() {
	local iso
	iso="$1"
	if [[ -z "$iso" ]]; then
		printf '%s\n' ""
		return 0
	fi
	date -u -d "$iso" +%s 2>/dev/null || printf '%s\n' ""
}

# Name: lib_claim_is_active_file
# What: Evaluates whether a task claim is currently active.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_claim_is_active_file() {
	local file
	file="$1"
	local state owner lease now_e lease_e
	state="$(lib_frontmatter_get "$file" "claim_state")"
	owner="$(lib_frontmatter_get "$file" "claimed_by_owner_id")"
	lease="$(lib_frontmatter_get "$file" "lease_expires_at")"

	if [[ "$state" != "claimed" || -z "$owner" ]]; then
		return 1
	fi

	if [[ -z "$lease" ]]; then
		return 0
	fi

	now_e="$(date -u +%s)"
	lease_e="$(lib_time_iso_to_epoch "$lease")"
	if [[ -z "$lease_e" ]]; then
		return 0
	fi

	[[ "$now_e" -lt "$lease_e" ]]
}

# Name: lib_claim_is_stale_file
# What: Evaluates whether a task claim is stale/expired.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_claim_is_stale_file() {
	local file
	file="$1"
	local state owner lease now_e lease_e
	state="$(lib_frontmatter_get "$file" "claim_state")"
	owner="$(lib_frontmatter_get "$file" "claimed_by_owner_id")"
	lease="$(lib_frontmatter_get "$file" "lease_expires_at")"

	if [[ "$state" != "claimed" || -z "$owner" || -z "$lease" ]]; then
		return 1
	fi

	now_e="$(date -u +%s)"
	lease_e="$(lib_time_iso_to_epoch "$lease")"
	if [[ -z "$lease_e" ]]; then
		return 1
	fi

	[[ "$now_e" -ge "$lease_e" ]]
}

# Name: lib_git_resolve_main_worktree_root
# What: Finds main worktree root even from linked worktrees.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_git_resolve_main_worktree_root() {
	local main_worktree
	main_worktree="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null | xargs dirname || true)"
	if [[ -z "$main_worktree" || "$main_worktree" == "." || ! -d "$main_worktree" ]]; then
		main_worktree="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
	fi
	printf '%s\n' "$main_worktree"
}
# Name: lib_memory_dir
# What: Resolves .memory path and optionally creates it.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_memory_dir() {
	local create_if_missing
	local main_worktree
	local dir

	create_if_missing="true"
	if [[ "${1:-}" == "--no-create" ]]; then
		create_if_missing="false"
	fi

	if ! git rev-parse --git-dir >/dev/null 2>&1; then
		echo "ERROR: Not in a git repository" >&2
		return 1
	fi

	main_worktree="$(lib_git_resolve_main_worktree_root)"
	dir="$main_worktree/.memory"

	if [[ -d "$dir" ]]; then
		printf '%s\n' "$dir"
		return 0
	fi

	if [[ "$create_if_missing" == "true" ]]; then
		mkdir -p "$dir"
		printf '%s\n' "$dir"
		return 0
	fi

	echo "ERROR: .memory/ directory not found at: $dir" >&2
	return 1
}

# Name: lib_git_repo_root_for_dir
# What: Finds git root for a provided directory.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_git_repo_root_for_dir() {
	local directory real_path git_root
	directory="$1"

	if [[ -z "$directory" ]]; then
		echo "ERROR: directory argument is required" >&2
		return 2
	fi
	if [[ ! -e "$directory" ]]; then
		echo "ERROR: Directory does not exist: $directory" >&2
		return 1
	fi

	real_path="$(readlink -f "$directory")"
	if [[ ! -d "$real_path" ]]; then
		echo "ERROR: Not a directory: $directory -> $real_path" >&2
		return 1
	fi

	if (cd "$real_path" && git rev-parse --git-dir >/dev/null 2>&1); then
		git_root="$(cd "$real_path" && git rev-parse --show-toplevel)"
		printf '%s\n' "$git_root"
		return 0
	fi

	echo "ERROR: Not in a git repository: $directory -> $real_path" >&2
	return 1
}

# Name: lib_frontmatter_get
# What: Reads a frontmatter key from markdown file.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_frontmatter_get() {
	local file
	local key

	file="$1"
	key="$2"
	awk -v key="$key" '
    BEGIN { in_fm=0 }
    NR==1 && $0 ~ /^---[[:space:]]*$/ { in_fm=1; next }
    in_fm && $0 ~ /^---[[:space:]]*$/ { in_fm=0; exit }
    in_fm {
      if ($0 ~ "^" key ":[[:space:]]*") {
        line=$0
        sub("^" key ":[[:space:]]*", "", line)
        gsub(/^"|"$/, "", line)
        if (line == "null" || line == "~") {
          line = ""
        }
        print line
        exit
      }
    }
  ' "$file"
}

# Name: lib_frontmatter_upsert
# What: Inserts or updates a frontmatter key atomically.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_frontmatter_upsert() {
	local file
	local key
	local value
	local tmp

	file="$1"
	key="$2"
	value="$3"
	tmp="$(mktemp)"

	if [[ "$(head -n1 "$file" 2>/dev/null || true)" != "---" ]]; then
		{
			echo "---"
			echo "$key: $value"
			echo "---"
			cat "$file"
		} >"$tmp"
		mv "$tmp" "$file"
		return 0
	fi

	awk -v key="$key" -v value="$value" '
    BEGIN { in_fm=0; replaced=0; inserted=0 }
    NR==1 && $0 ~ /^---[[:space:]]*$/ { in_fm=1; print; next }
    in_fm && $0 ~ /^---[[:space:]]*$/ {
      if (!replaced && !inserted) {
        print key ": " value
        inserted=1
      }
      in_fm=0
      print
      next
    }
    in_fm {
      if ($0 ~ "^" key ":[[:space:]]*") {
        print key ": " value
        replaced=1
        next
      }
      print
      next
    }
    { print }
  ' "$file" >"$tmp"

	mv "$tmp" "$file"
}

# Name: lib_identity_resolve_owner_arg
# What: Normalizes owner from flag/session/env defaults.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_identity_resolve_owner_arg() {
	local owner
	local session_alias

	owner="$1"
	session_alias="$2"
	if [[ -n "$owner" ]]; then
		printf '%s\n' "$owner"
		return 0
	fi
	if [[ -n "$session_alias" ]]; then
		printf '%s\n' "$session_alias"
		return 0
	fi
	owner="$(lib_identity_owner_default)"
	printf '%s\n' "$owner"
}

# Name: lib_identity_require_owner
# What: Fails fast when owner identity is missing.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_identity_require_owner() {
	local owner
	owner="$1"
	if [[ -z "$owner" ]]; then
		echo "ERROR: owner_id is required. Provide --owner <id> (or set MP_OWNER_ID/OWNER_ID)." >&2
		exit 1
	fi
}

# Name: lib_task_find_file
# What: Resolves task argument to concrete task file path.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_task_find_file() {
	local mem
	local arg

	mem="$1"
	arg="$2"
	if [[ -f "$arg" ]]; then
		printf '%s\n' "$arg"
		return 0
	fi
	if [[ -f "$mem/$arg" ]]; then
		printf '%s\n' "$mem/$arg"
		return 0
	fi
	if [[ -f "$mem/task-${arg}.md" ]]; then
		printf '%s\n' "$mem/task-${arg}.md"
		return 0
	fi
	echo "ERROR: task file not found: $arg" >&2
	return 1
}

# Name: lib_file_write_atomic
# What: Writes stdin to target via temp file+rename.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_file_write_atomic() {
	local target
	local tmp

	target="$1"
	tmp="$(mktemp)"
	cat >"$tmp"
	mv "$tmp" "$target"
}

# Name: lib_views_refresh_derived
# What: Refreshes derived project views after mutating actions.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_views_refresh_derived() {
	if [[ "${MP_AUTO_PROJECT:-1}" == "1" ]]; then
		cmd_project >/dev/null
	fi
}

# Name: lib_views_refresh_on_query
# What: Optionally refreshes derived views before query commands.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_views_refresh_on_query() {
	if [[ "${MP_AUTO_PROJECT_QUERY:-0}" == "1" ]]; then
		cmd_project >/dev/null 2>&1 || true
	fi
}




# Name: lib_migration_remove_phase_id_from_story
# What: Removes deprecated phase_id from story frontmatter.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_migration_remove_phase_id_from_story() {
	local story_file
	story_file="$1"

	if grep -q "^phase_id:" "$story_file"; then
		echo "  -> Removing phase_id from: $(basename "$story_file")"
		local temp_file
		temp_file="$(mktemp)"
		sed '/^phase_id:/d' "$story_file" >"$temp_file"
		mv "$temp_file" "$story_file"
		return 0
	fi
	return 1
}

# Name: lib_migration_generate_inline_phase
# What: Builds inline phase markdown from phase file.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_migration_generate_inline_phase() {
	local phase_file
	phase_file="$1"

	local title status start_criteria end_criteria
	title="$(lib_frontmatter_get "$phase_file" "title")"
	status="$(lib_frontmatter_get "$phase_file" "status")"
	start_criteria="$(lib_frontmatter_get "$phase_file" "start_criteria")"
	end_criteria="$(lib_frontmatter_get "$phase_file" "end_criteria")"

	local phase_name
	phase_name="$title"
	if [[ -z "$phase_name" ]]; then
		phase_name="$(basename "$phase_file" .md | sed 's/phase-[a-f0-9]*-//')"
	fi

	local tasks deliverables
	tasks="$(awk '
		BEGIN { in_fm=0; in_body=0; sec="" }
		/^---[[:space:]]*$/ {
			if (in_fm==0) { in_fm=1; next }
			if (in_fm==1) { in_fm=2; in_body=1; next }
		}
		in_body {
			if ($0 ~ /^##[[:space:]]+/) { sec=$0; sub(/^##[[:space:]]+/, "", sec); next }
			if (sec=="Tasks" || sec=="tasks") print
		}
	' "$phase_file")"
	deliverables="$(awk '
		BEGIN { in_fm=0; in_body=0; sec="" }
		/^---[[:space:]]*$/ {
			if (in_fm==0) { in_fm=1; next }
			if (in_fm==1) { in_fm=2; in_body=1; next }
		}
		in_body {
			if ($0 ~ /^##[[:space:]]+/) { sec=$0; sub(/^##[[:space:]]+/, "", sec); next }
			if (sec=="Deliverables" || sec=="deliverables") print
		}
	' "$phase_file")"

	echo "### $phase_name"
	echo "- **Status**: ${status:-planned}"
	[[ -n "$start_criteria" ]] && echo "- **Start Criteria**: $start_criteria"
	[[ -n "$end_criteria" ]] && echo "- **End Criteria**: $end_criteria"

	if [[ -n "$tasks" ]]; then
		echo "- **Tasks**:"
		echo "$tasks" | sed 's/^/  /'
	else
		echo "- **Tasks**: (none migrated)"
	fi

	if [[ -n "$deliverables" ]]; then
		echo "- **Deliverables**:"
		echo "$deliverables" | sed 's/^/  /'
	fi
	echo
}

# Name: lib_migration_append_phase_to_epic
# What: Appends generated phase section into epic file.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
lib_migration_append_phase_to_epic() {
	local epic_file phase_content
	epic_file="$1"
	phase_content="$2"

	if grep -q "^## Phases" "$epic_file"; then
		local phases_line temp_file
		phases_line="$(grep -n "^## Phases" "$epic_file" | cut -d: -f1 | head -1)"
		temp_file="$(mktemp)"
		head -n "$phases_line" "$epic_file" >"$temp_file"
		echo >>"$temp_file"
		echo "$phase_content" >>"$temp_file"
		tail -n +$((phases_line + 1)) "$epic_file" >>"$temp_file"
		mv "$temp_file" "$epic_file"
	else
		echo >>"$epic_file"
		echo "## Phases" >>"$epic_file"
		echo >>"$epic_file"
		echo "$phase_content" >>"$epic_file"
	fi
}


# Name: cmd_help
# What: Subcommand entrypoint for help text.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_help() {
	lib_cli_usage
}

# Name: cmd_memory_dir
# What: Subcommand entrypoint for memory-dir.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_memory_dir() {
	lib_memory_dir "$@"
}

# Name: cmd_list_by_session
# What: Backwards-compatible alias for list-by-owner.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_list_by_session() {
	cmd_list_by_owner "$@"
}

# Name: cmd_memory_git_repo
# What: Subcommand entrypoint for memory-git-repo.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_memory_git_repo() {
	local directory
	directory="${1:-}"
	if [[ -z "$directory" ]]; then
		echo "ERROR: memory-git-repo requires <directory>" >&2
		exit 1
	fi
	lib_git_repo_root_for_dir "$directory"
}




# Name: cmd_migrate_phases_to_inline
# What: Migrates phase files into inline epic sections.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_migrate_phases_to_inline() {
	local dry_run memory_dir_arg
	dry_run="false"
	memory_dir_arg=""

	while [[ $# -gt 0 ]]; do
		case "$1" in
		--dry-run)
			dry_run="true"
			shift
			;;
		*)
			memory_dir_arg="$1"
			shift
			;;
		esac
	done

	local mem
	if [[ -n "$memory_dir_arg" ]]; then
		mem="$memory_dir_arg"
	else
		mem="$(lib_memory_dir)"
	fi

	mem="$(cd "$mem" 2>/dev/null && pwd)" || {
		echo "ERROR: Memory directory not found: $mem" >&2
		exit 1
	}

	echo "=== Phase Migration Tool ==="
	echo "Memory directory: $mem"
	echo "Mode: $(if [[ "$dry_run" == "true" ]]; then echo "DRY RUN"; else echo "LIVE"; fi)"
	echo

	local phases_found phases_migrated stories_updated epics_updated errors
	phases_found=0
	phases_migrated=0
	stories_updated=0
	epics_updated=0
	errors=0

	local phase_files
	phase_files="$(find "$mem" -maxdepth 1 -name 'phase-*.md' -type f 2>/dev/null | sort)"

	if [[ -z "$phase_files" ]]; then
		echo "No phase-*.md files found. Nothing to migrate."
	else
		while IFS= read -r phase_file; do
			[[ -n "$phase_file" ]] || continue
			phases_found=$((phases_found + 1))
			echo "Processing: $(basename "$phase_file")"
			local epic_id epic_file phase_content
			epic_id="$(lib_frontmatter_get "$phase_file" "epic_id")"
			if [[ -z "$epic_id" ]]; then
				echo "  ERROR: No epic_id found. Skipping."
				errors=$((errors + 1))
				continue
			fi
			epic_file="$(find "$mem" -maxdepth 1 -name "epic-${epic_id}-*.md" -type f 2>/dev/null | head -1)"
			if [[ -z "$epic_file" ]]; then
				echo "  ERROR: Parent epic not found for epic_id: $epic_id"
				errors=$((errors + 1))
				continue
			fi
			phase_content="$(lib_migration_generate_inline_phase "$phase_file")"
			if [[ "$dry_run" == "true" ]]; then
				echo "  Preview:"
				echo "$phase_content" | sed 's/^/    /'
			else
				lib_migration_append_phase_to_epic "$epic_file" "$phase_content"
				rm "$phase_file"
			fi
			phases_migrated=$((phases_migrated + 1))
			epics_updated=$((epics_updated + 1))
		done <<<"$phase_files"
	fi

	local story_files
	story_files="$(find "$mem" -maxdepth 1 -name 'story-*.md' -type f 2>/dev/null | sort)"
	if [[ -n "$story_files" ]]; then
		while IFS= read -r story_file; do
			[[ -n "$story_file" ]] || continue
			if [[ "$dry_run" == "true" ]]; then
				if grep -q '^phase_id:' "$story_file"; then
					echo "  -> Would remove phase_id from: $(basename "$story_file")"
					stories_updated=$((stories_updated + 1))
				fi
			else
				if lib_migration_remove_phase_id_from_story "$story_file"; then
					stories_updated=$((stories_updated + 1))
				fi
			fi
		done <<<"$story_files"
	fi

	if [[ -d "$mem/archive" ]]; then
		local archived_stories
		archived_stories="$(find "$mem/archive" -name 'story-*.md' -type f 2>/dev/null | sort)"
		if [[ -n "$archived_stories" ]]; then
			while IFS= read -r story_file; do
				[[ -n "$story_file" ]] || continue
				if [[ "$dry_run" == "true" ]]; then
					if grep -q '^phase_id:' "$story_file"; then
						echo "  -> Would remove phase_id from: $(basename "$story_file")"
						stories_updated=$((stories_updated + 1))
					fi
				else
					if lib_migration_remove_phase_id_from_story "$story_file"; then
						stories_updated=$((stories_updated + 1))
					fi
				fi
			done <<<"$archived_stories"
		fi
	fi

	echo
	echo "=== Migration Summary ==="
	echo "Phase files found:      $phases_found"
	echo "Phases migrated:        $phases_migrated"
	echo "Epics updated:          $epics_updated"
	echo "Stories updated:        $stories_updated"
	echo "Errors:                 $errors"

	if [[ "$dry_run" == "true" ]]; then
		echo
		echo "This was a dry run. No changes were made."
	else
		echo
		echo "Migration complete."
	fi
}

# Name: cmd_register_intent
# What: Creates lock intent record for a story.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_register_intent() {
	local story_id
	story_id="${1:-}"
	shift || true
	if [[ -z "$story_id" ]]; then
		echo "ERROR: register-intent requires <story_id>" >&2
		exit 1
	fi

	local owner
	local session_alias
	local workspace
	local run_id
	local ttl_min

	owner=""
	session_alias=""
	workspace="$(lib_identity_workspace_default)"
	run_id="$(lib_identity_run_default)"
	ttl_min="15"

	while [[ $# -gt 0 ]]; do
		case "$1" in
		--owner)
			owner="$2"
			shift 2
			;;
		--session)
			session_alias="$2"
			shift 2
			;;
		--workspace)
			workspace="$2"
			shift 2
			;;
		--run-id)
			run_id="$2"
			shift 2
			;;
		--ttl-min)
			ttl_min="$2"
			shift 2
			;;
		*)
			echo "ERROR: unknown option: $1" >&2
			exit 1
			;;
		esac
	done

	owner="$(lib_identity_resolve_owner_arg "$owner" "$session_alias")"
	lib_identity_require_owner "$owner"

	local mem intents_dir now expires file
	mem="$(lib_memory_dir)"
	intents_dir="$mem/.locks/intents"
	mkdir -p "$intents_dir"

	now="$(lib_time_now_iso)"
	expires="$(date -u -d "+${ttl_min} minutes" +"%Y-%m-%dT%H:%M:%SZ")"
	local owner_key workspace_key story_key
	owner_key="$(lib_text_safe_name "$owner")"
	workspace_key="$(lib_text_safe_name "$workspace")"
	story_key="$(lib_text_safe_name "$story_id")"
	file="$intents_dir/${owner_key}__${workspace_key}__${story_key}.md"

	cat >"$file" <<EOF
---
story_id: $story_id
owner_id: $owner
workspace_id: $workspace
run_id: $run_id
created_at: $now
expires_at: $expires
status: active
---
# Lock Intent

Owner $owner intends to lock story $story_id.
EOF

	echo "Registered intent: $file"
}

# Name: cmd_discover_intents
# What: Lists active lock intents from intents directory.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_discover_intents() {
	lib_views_refresh_on_query
	local mem
	local intents_dir

	mem="$(lib_memory_dir)"
	intents_dir="$mem/.locks/intents"
	mkdir -p "$intents_dir"

	local found
	found=0
	shopt -s nullglob
	for f in "$intents_dir"/*.md; do
		found=1
		local story owner workspace run exp status
		story="$(lib_frontmatter_get "$f" "story_id")"
		owner="$(lib_frontmatter_get "$f" "owner_id")"
		workspace="$(lib_frontmatter_get "$f" "workspace_id")"
		run="$(lib_frontmatter_get "$f" "run_id")"
		exp="$(lib_frontmatter_get "$f" "expires_at")"
		status="$(lib_frontmatter_get "$f" "status")"
		echo "- story=$story owner=$owner workspace=$workspace run=$run status=${status:-unknown} expires=$exp file=$(basename "$f")"
	done
	shopt -u nullglob

	if [[ "$found" -eq 0 ]]; then
		echo "No intents found."
	fi
}

# Name: cmd_lock_task
# What: Claims a task lock for an owner/workspace/run.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_lock_task() {
	local task_arg
	task_arg="${1:-}"
	shift || true
	if [[ -z "$task_arg" ]]; then
		echo "ERROR: lock-task requires <task-file>" >&2
		exit 1
	fi

	local owner
	local session_alias
	local workspace
	local run_id
	local reason
	local lease_min

	owner=""
	session_alias=""
	workspace="$(lib_identity_workspace_default)"
	run_id="$(lib_identity_run_default)"
	reason="active work"
	lease_min="45"

	while [[ $# -gt 0 ]]; do
		case "$1" in
		--owner)
			owner="$2"
			shift 2
			;;
		--session)
			session_alias="$2"
			shift 2
			;;
		--workspace)
			workspace="$2"
			shift 2
			;;
		--run-id)
			run_id="$2"
			shift 2
			;;
		--reason)
			reason="$2"
			shift 2
			;;
		--lease-min)
			lease_min="$2"
			shift 2
			;;
		*)
			echo "ERROR: unknown option: $1" >&2
			exit 1
			;;
		esac
	done

	owner="$(lib_identity_resolve_owner_arg "$owner" "$session_alias")"
	lib_identity_require_owner "$owner"

	local mem file
	mem="$(lib_memory_dir)"
	file="$(lib_task_find_file "$mem" "$task_arg")"

	local current_owner current_workspace
	current_owner="$(lib_frontmatter_get "$file" "claimed_by_owner_id")"
	current_workspace="$(lib_frontmatter_get "$file" "claimed_by_workspace_id")"

	if lib_claim_is_active_file "$file"; then
		if [[ "$current_owner" != "$owner" || "$current_workspace" != "$workspace" ]]; then
			echo "ERROR: active lock conflict on $(basename "$file")" >&2
			echo "  current_owner=$current_owner current_workspace=${current_workspace:-none}" >&2
			echo "  requested_owner=$owner requested_workspace=$workspace" >&2
			echo "Use takeover-task --force with --reason to override." >&2
			exit 1
		fi
	fi

	local now expires claim_started
	now="$(lib_time_now_iso)"
	expires="$(date -u -d "+${lease_min} minutes" +"%Y-%m-%dT%H:%M:%SZ")"
	claim_started="$(lib_frontmatter_get "$file" "claim_started_at")"
	if [[ -z "$claim_started" ]] || ! lib_claim_is_active_file "$file"; then
		claim_started="$now"
	fi

	lib_frontmatter_upsert "$file" "claimed_by_owner_id" "$owner"
	lib_frontmatter_upsert "$file" "claimed_by_workspace_id" "$workspace"
	lib_frontmatter_upsert "$file" "claimed_by_run_id" "$run_id"
	lib_frontmatter_upsert "$file" "claim_started_at" "$claim_started"
	lib_frontmatter_upsert "$file" "last_heartbeat_at" "$now"
	lib_frontmatter_upsert "$file" "lease_expires_at" "$expires"
	lib_frontmatter_upsert "$file" "claim_state" "claimed"
	lib_frontmatter_upsert "$file" "lock_reason" "$reason"

	local story_id
	story_id="$(lib_frontmatter_get "$file" "story_id")"

	lib_views_refresh_derived

	echo "Locked task: $(basename "$file")"
	echo "  owner_id: $owner"
	echo "  workspace_id: $workspace"
	echo "  run_id: $run_id"
	echo "  lease_expires_at: $expires"
	if [[ -n "$story_id" ]]; then
		echo "  derived story lock: $story_id"
	fi
}

# Name: cmd_heartbeat
# What: Renews lease/heartbeat for an owned task lock.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_heartbeat() {
	local task_arg
	task_arg="${1:-}"
	shift || true
	if [[ -z "$task_arg" ]]; then
		echo "ERROR: heartbeat requires <task-file>" >&2
		exit 1
	fi

	local owner
	local session_alias
	local workspace
	local run_id
	local lease_min

	owner=""
	session_alias=""
	workspace=""
	run_id="$(lib_identity_run_default)"
	lease_min="45"

	while [[ $# -gt 0 ]]; do
		case "$1" in
		--owner)
			owner="$2"
			shift 2
			;;
		--session)
			session_alias="$2"
			shift 2
			;;
		--workspace)
			workspace="$2"
			shift 2
			;;
		--run-id)
			run_id="$2"
			shift 2
			;;
		--lease-min)
			lease_min="$2"
			shift 2
			;;
		*)
			echo "ERROR: unknown option: $1" >&2
			exit 1
			;;
		esac
	done

	owner="$(lib_identity_resolve_owner_arg "$owner" "$session_alias")"
	lib_identity_require_owner "$owner"

	local mem file
	mem="$(lib_memory_dir)"
	file="$(lib_task_find_file "$mem" "$task_arg")"

	local current_owner current_workspace
	current_owner="$(lib_frontmatter_get "$file" "claimed_by_owner_id")"
	current_workspace="$(lib_frontmatter_get "$file" "claimed_by_workspace_id")"

	if [[ -z "$current_owner" || "$current_owner" != "$owner" ]]; then
		echo "ERROR: heartbeat denied. task owned by '${current_owner:-none}', not '$owner'" >&2
		exit 1
	fi
	if [[ -n "$workspace" && -n "$current_workspace" && "$current_workspace" != "$workspace" ]]; then
		echo "ERROR: heartbeat denied. workspace mismatch ($current_workspace != $workspace)" >&2
		exit 1
	fi

	local now expires
	now="$(lib_time_now_iso)"
	expires="$(date -u -d "+${lease_min} minutes" +"%Y-%m-%dT%H:%M:%SZ")"

	lib_frontmatter_upsert "$file" "claim_state" "claimed"
	lib_frontmatter_upsert "$file" "claimed_by_run_id" "$run_id"
	lib_frontmatter_upsert "$file" "last_heartbeat_at" "$now"
	lib_frontmatter_upsert "$file" "lease_expires_at" "$expires"

	lib_views_refresh_derived

	echo "Heartbeat updated: $(basename "$file")"
	echo "  owner_id: $owner"
	echo "  lease_expires_at: $expires"
}

# Name: cmd_takeover_task
# What: Force-takes over a task lock with reason.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_takeover_task() {
	local task_arg
	task_arg="${1:-}"
	shift || true
	if [[ -z "$task_arg" ]]; then
		echo "ERROR: takeover-task requires <task-file>" >&2
		exit 1
	fi

	local owner
	local session_alias
	local workspace
	local run_id
	local reason
	local lease_min
	local force

	owner=""
	session_alias=""
	workspace="$(lib_identity_workspace_default)"
	run_id="$(lib_identity_run_default)"
	reason=""
	lease_min="45"
	force="false"

	while [[ $# -gt 0 ]]; do
		case "$1" in
		--owner)
			owner="$2"
			shift 2
			;;
		--session)
			session_alias="$2"
			shift 2
			;;
		--workspace)
			workspace="$2"
			shift 2
			;;
		--run-id)
			run_id="$2"
			shift 2
			;;
		--reason)
			reason="$2"
			shift 2
			;;
		--lease-min)
			lease_min="$2"
			shift 2
			;;
		--force)
			force="true"
			shift
			;;
		*)
			echo "ERROR: unknown option: $1" >&2
			exit 1
			;;
		esac
	done

	owner="$(lib_identity_resolve_owner_arg "$owner" "$session_alias")"
	lib_identity_require_owner "$owner"
	if [[ "$force" != "true" ]]; then
		echo "ERROR: takeover-task requires --force" >&2
		exit 1
	fi
	if [[ -z "$reason" ]]; then
		echo "ERROR: takeover-task requires --reason" >&2
		exit 1
	fi

	local mem file
	mem="$(lib_memory_dir)"
	file="$(lib_task_find_file "$mem" "$task_arg")"

	local prev_owner prev_workspace prev_run
	prev_owner="$(lib_frontmatter_get "$file" "claimed_by_owner_id")"
	prev_workspace="$(lib_frontmatter_get "$file" "claimed_by_workspace_id")"
	prev_run="$(lib_frontmatter_get "$file" "claimed_by_run_id")"

	local now expires
	now="$(lib_time_now_iso)"
	expires="$(date -u -d "+${lease_min} minutes" +"%Y-%m-%dT%H:%M:%SZ")"

	lib_frontmatter_upsert "$file" "previous_owner_id" "$prev_owner"
	lib_frontmatter_upsert "$file" "previous_workspace_id" "$prev_workspace"
	lib_frontmatter_upsert "$file" "previous_run_id" "$prev_run"
	lib_frontmatter_upsert "$file" "takeover_at" "$now"
	lib_frontmatter_upsert "$file" "takeover_reason" "$reason"

	lib_frontmatter_upsert "$file" "claimed_by_owner_id" "$owner"
	lib_frontmatter_upsert "$file" "claimed_by_workspace_id" "$workspace"
	lib_frontmatter_upsert "$file" "claimed_by_run_id" "$run_id"
	lib_frontmatter_upsert "$file" "claim_started_at" "$now"
	lib_frontmatter_upsert "$file" "last_heartbeat_at" "$now"
	lib_frontmatter_upsert "$file" "lease_expires_at" "$expires"
	lib_frontmatter_upsert "$file" "claim_state" "claimed"
	lib_frontmatter_upsert "$file" "lock_reason" "takeover: $reason"

	lib_views_refresh_derived

	echo "Took over task: $(basename "$file")"
	echo "  from_owner: ${prev_owner:-none}"
	echo "  to_owner: $owner"
	echo "  workspace_id: $workspace"
	echo "  lease_expires_at: $expires"
}

# Name: cmd_stale_sweep
# What: Detects stale claims and optionally marks them stale.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_stale_sweep() {
	local apply
	apply="false"
	while [[ $# -gt 0 ]]; do
		case "$1" in
		--apply)
			apply="true"
			shift
			;;
		*)
			echo "ERROR: unknown option: $1" >&2
			exit 1
			;;
		esac
	done

	local mem
	mem="$(lib_memory_dir)"

	local found
	found=0
	shopt -s nullglob
	for f in "$mem"/task-*.md; do
		if lib_claim_is_stale_file "$f"; then
			found=1
			local owner lease
			owner="$(lib_frontmatter_get "$f" "claimed_by_owner_id")"
			lease="$(lib_frontmatter_get "$f" "lease_expires_at")"
			echo "STALE  $(basename "$f")  owner=${owner:-none} lease_expires_at=${lease:-none}"
			if [[ "$apply" == "true" ]]; then
				lib_frontmatter_upsert "$f" "claim_state" "stale"
			fi
		fi
	done
	shopt -u nullglob

	if [[ "$found" -eq 0 ]]; then
		echo "No stale locks."
	elif [[ "$apply" == "true" ]]; then
		lib_views_refresh_derived
		echo "Applied stale state to stale claims."
	fi
}

# Name: cmd_release_task
# What: Releases task lock ownership.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_release_task() {
	local task_arg
	task_arg="${1:-}"
	shift || true
	if [[ -z "$task_arg" ]]; then
		echo "ERROR: release-task requires <task-file>" >&2
		exit 1
	fi

	local owner
	local session_alias
	local reason

	owner=""
	session_alias=""
	reason="released"

	while [[ $# -gt 0 ]]; do
		case "$1" in
		--owner)
			owner="$2"
			shift 2
			;;
		--session)
			session_alias="$2"
			shift 2
			;;
		--reason)
			reason="$2"
			shift 2
			;;
		*)
			echo "ERROR: unknown option: $1" >&2
			exit 1
			;;
		esac
	done

	owner="$(lib_identity_resolve_owner_arg "$owner" "$session_alias")"
	lib_identity_require_owner "$owner"

	local mem file
	mem="$(lib_memory_dir)"
	file="$(lib_task_find_file "$mem" "$task_arg")"

	local current_owner
	current_owner="$(lib_frontmatter_get "$file" "claimed_by_owner_id")"
	if [[ -n "$current_owner" && "$current_owner" != "$owner" ]]; then
		echo "ERROR: task owned by '$current_owner', not '$owner'" >&2
		exit 1
	fi

	lib_frontmatter_upsert "$file" "claim_state" "released"
	lib_frontmatter_upsert "$file" "lock_reason" "$reason"
	lib_frontmatter_upsert "$file" "lease_expires_at" ""
	lib_frontmatter_upsert "$file" "last_heartbeat_at" "$(lib_time_now_iso)"

	lib_views_refresh_derived

	echo "Released task: $(basename "$file")"
}

# Name: cmd_discover_locks
# What: Shows active/stale task locks and derived story locks.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_discover_locks() {
	lib_views_refresh_on_query
	local mem
	mem="$(lib_memory_dir)"

	local tasks_locked
	local stories_tmp

	tasks_locked=0
	stories_tmp="$(mktemp)"

	shopt -s nullglob
	for f in "$mem"/task-*.md; do
		local state owner workspace story
		state="$(lib_frontmatter_get "$f" "claim_state")"
		owner="$(lib_frontmatter_get "$f" "claimed_by_owner_id")"
		workspace="$(lib_frontmatter_get "$f" "claimed_by_workspace_id")"
		story="$(lib_frontmatter_get "$f" "story_id")"

		if lib_claim_is_active_file "$f"; then
			tasks_locked=$((tasks_locked + 1))
			echo "TASK  $(basename "$f")  owner=$owner  workspace=${workspace:-none}  story=${story:-none}"
			if [[ -n "$story" ]]; then
				echo "$story" >>"$stories_tmp"
			fi
		elif [[ "$state" == "claimed" && -n "$owner" ]]; then
			echo "TASK  $(basename "$f")  owner=$owner  workspace=${workspace:-none}  story=${story:-none}  [STALE]"
		fi
	done
	shopt -u nullglob

	if [[ "$tasks_locked" -eq 0 ]]; then
		echo "No claimed tasks."
	fi

	if [[ -s "$stories_tmp" ]]; then
		echo
		echo "Derived story locks:"
		sort -u "$stories_tmp" | sed 's/^/STORY /'
	fi

	rm -f "$stories_tmp"
}

# Name: cmd_list_by_owner
# What: Groups active claims by owner/workspace.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_list_by_owner() {
	lib_views_refresh_on_query
	local mem
	local tmp

	mem="$(lib_memory_dir)"
	tmp="$(mktemp)"

	shopt -s nullglob
	for f in "$mem"/task-*.md; do
		local owner workspace story
		owner="$(lib_frontmatter_get "$f" "claimed_by_owner_id")"
		workspace="$(lib_frontmatter_get "$f" "claimed_by_workspace_id")"
		story="$(lib_frontmatter_get "$f" "story_id")"
		if lib_claim_is_active_file "$f"; then
			echo "$owner|$workspace|$(basename "$f")|$story" >>"$tmp"
		fi
	done
	shopt -u nullglob

	if [[ ! -s "$tmp" ]]; then
		echo "No claimed tasks."
		rm -f "$tmp"
		return 0
	fi

	sort "$tmp" | awk -F'|' '
    BEGIN { cur_owner=""; cur_ws="" }
    {
      if ($1 != cur_owner || $2 != cur_ws) {
        cur_owner=$1
        cur_ws=$2
        print "Owner " cur_owner " (workspace=" (cur_ws==""?"none":cur_ws) ")"
      }
      printf "  - %s (story=%s)\n", $3, ($4==""?"none":$4)
    }
  '

	rm -f "$tmp"
}

# Name: cmd_list_unclaimed_stories
# What: Lists stories that have no actively claimed tasks.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_list_unclaimed_stories() {
	lib_views_refresh_on_query
	local mem
	mem="$(lib_memory_dir)"

	local claimed_stories
	claimed_stories="$(mktemp)"

	shopt -s nullglob
	for tf in "$mem"/task-*.md; do
		local sid
		sid="$(lib_frontmatter_get "$tf" "story_id")"
		if lib_claim_is_active_file "$tf" && [[ -n "$sid" ]]; then
			echo "$sid" >>"$claimed_stories"
		fi
	done

	local any
	any=0
	for sf in "$mem"/story-*.md; do
		local sid title
		sid="$(lib_frontmatter_get "$sf" "id")"
		title="$(lib_frontmatter_get "$sf" "title")"
		if [[ -z "$sid" ]]; then
			sid="$(basename "$sf" | awk -F'-' '{print $2}')"
		fi
		if ! grep -qx "$sid" "$claimed_stories" 2>/dev/null; then
			any=1
			echo "- $sid  ${title:-$(basename "$sf")}"
		fi
	done
	shopt -u nullglob

	if [[ "$any" -eq 0 ]]; then
		echo "No unclaimed stories."
	fi

	rm -f "$claimed_stories"
}

# Name: cmd_tree
# What: Prints epic/story/task tree with blocked annotations.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_tree() {
	lib_views_refresh_on_query
	local mem
	mem="$(lib_memory_dir)"

	shopt -s nullglob

	local has_epic
	has_epic=0
	for ef in "$mem"/epic-*.md; do
		has_epic=1
		local epic_id epic_title
		epic_id="$(lib_frontmatter_get "$ef" "id")"
		epic_title="$(lib_frontmatter_get "$ef" "title")"
		if [[ -z "$epic_id" ]]; then
			epic_id="$(basename "$ef" | awk -F'-' '{print $2}')"
		fi
		echo "EPIC  $epic_id  ${epic_title:-$(basename "$ef")}"

		local story_count
		story_count=0
		for sf in "$mem"/story-*.md; do
			local s_epic_id sid stitle
			s_epic_id="$(lib_frontmatter_get "$sf" "epic_id")"
			[[ "$s_epic_id" == "$epic_id" ]] || continue
			story_count=$((story_count + 1))

			sid="$(lib_frontmatter_get "$sf" "id")"
			stitle="$(lib_frontmatter_get "$sf" "title")"
			if [[ -z "$sid" ]]; then
				sid="$(basename "$sf" | awk -F'-' '{print $2}')"
			fi
			echo "  STORY $sid  ${stitle:-$(basename "$sf")}"

			local task_count
			task_count=0
			for tf in "$mem"/task-*.md; do
				local t_story t_title t_status blocked_by ann
				t_story="$(lib_frontmatter_get "$tf" "story_id")"
				[[ "$t_story" == "$sid" ]] || continue
				task_count=$((task_count + 1))

				t_title="$(lib_frontmatter_get "$tf" "title")"
				t_status="$(lib_frontmatter_get "$tf" "status")"
				blocked_by="$(lib_frontmatter_get "$tf" "blocked_by")"
				ann=""
				if [[ "$t_status" == "blocked" || -n "$blocked_by" ]]; then
					ann=" [BLOCKED${blocked_by:+ by $blocked_by}]"
				fi
				echo "    TASK  $(basename "$tf")  status=${t_status:-unknown}${ann}  ${t_title:+- $t_title}"
			done

			if [[ "$task_count" -eq 0 ]]; then
				echo "    (no tasks)"
			fi
		done

		if [[ "$story_count" -eq 0 ]]; then
			echo "  (no stories)"
		fi
	done

	if [[ "$has_epic" -eq 0 ]]; then
		echo "No epic files found in $mem"
	fi

	shopt -u nullglob
}



# Name: cmd_next
# What: Prints concise dynamic suggestions for next commands.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_next() {
	lib_views_refresh_on_query

	local mem owner
	mem="$(lib_memory_dir)"
	owner="$(lib_identity_owner_default)"

	local active_for_owner active_total stale_total unclaimed_open
	active_for_owner=0
	active_total=0
	stale_total=0
	unclaimed_open=0

	shopt -s nullglob
	for tf in "$mem"/task-*.md; do
		local ts claimed_owner
		ts="$(lib_frontmatter_get "$tf" "status")"
		claimed_owner="$(lib_frontmatter_get "$tf" "claimed_by_owner_id")"

		if lib_claim_is_active_file "$tf"; then
			active_total=$((active_total + 1))
			if [[ -n "$owner" && "$claimed_owner" == "$owner" ]]; then
				active_for_owner=$((active_for_owner + 1))
			fi
		elif lib_claim_is_stale_file "$tf"; then
			stale_total=$((stale_total + 1))
		fi

		case "$ts" in
		completed|archived|cancelled) ;;
		*)
			if ! lib_claim_is_active_file "$tf"; then
				unclaimed_open=$((unclaimed_open + 1))
			fi
			;;
		esac
	done
	shopt -u nullglob

	echo "Next actions (dynamic):"
	if [[ -z "$owner" ]]; then
		echo "- Set identity first: export MP_OWNER_ID=<your-id>"
		echo "- Then run: miniproject.sh next"
		return 0
	fi

	echo "- Identity detected: owner=$owner"
	if [[ "$active_for_owner" -gt 0 ]]; then
		echo "- You already hold $active_for_owner active task(s): run 'miniproject.sh list-by-owner'"
		echo "- Keep leases alive while coding: miniproject.sh heartbeat <task-file> --owner $owner"
		echo "- Finish/release when done: miniproject.sh release-task <task-file> --owner $owner --reason \"done\""
	else
		echo "- You have no active claims:"
		echo "  - Inspect candidates: miniproject.sh list-unclaimed-stories"
		echo "  - Inspect full structure: miniproject.sh tree"
		echo "  - Claim a task: miniproject.sh lock-task <task-file> --owner $owner"
	fi

	if [[ "$stale_total" -gt 0 ]]; then
		echo "- There are $stale_total stale lock(s): inspect/apply with miniproject.sh stale-sweep [--apply]"
	fi
	if [[ "$unclaimed_open" -gt 0 ]]; then
		echo "- Open unclaimed tasks currently visible: $unclaimed_open"
	fi

	if [[ "${MP_AUTO_PROJECT_QUERY:-0}" != "1" ]]; then
		echo "- Query auto-refresh is OFF; derived views may be stale until you run: miniproject.sh project"
	fi
	echo "- Refresh derived files anytime: miniproject.sh project"
	echo "- Snapshot reads without writes: miniproject.sh project --stdout"
	echo "- Coordination view: miniproject.sh discover-locks"
}

# Name: cmd_project
# What: Rebuilds derived team/todo/summary views.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
cmd_project() {
	local stdout_only
	stdout_only="false"
	while [[ $# -gt 0 ]]; do
		case "$1" in
		--stdout)
			stdout_only="true"
			shift
			;;
		*)
			echo "ERROR: unknown option: $1" >&2
			exit 1
			;;
		esac
	done

	local mem now
	mem="$(lib_memory_dir)"
	now="$(lib_time_now_iso)"

	local t_open
	local s_open

	t_open=0 t_completed=0 t_blocked=0 t_claimed=0 t_stale=0
	s_open=0 s_completed=0 e_active=0

	local team_tmp todo_tmp summary_tmp
	team_tmp="$(mktemp)"
	todo_tmp="$(mktemp)"
	summary_tmp="$(mktemp)"

	{
		echo "# Team Status"
		echo
		echo "_AUTO-GENERATED by scripts/miniproject.sh project at $now. Do not edit manually._"
		echo
		echo "## Active Ownership"

		local owners_tmp
		owners_tmp="$(mktemp)"
		shopt -s nullglob
		for tf in "$mem"/task-*.md; do
			if lib_claim_is_active_file "$tf"; then
				local owner workspace story
				owner="$(lib_frontmatter_get "$tf" "claimed_by_owner_id")"
				workspace="$(lib_frontmatter_get "$tf" "claimed_by_workspace_id")"
				story="$(lib_frontmatter_get "$tf" "story_id")"
				echo "$owner|${workspace:-none}|$(basename "$tf")|${story:-none}" >>"$owners_tmp"
			fi
		done
		shopt -u nullglob

		if [[ -s "$owners_tmp" ]]; then
			sort "$owners_tmp" | awk -F'|' '
        BEGIN { cur=""; curw="" }
        {
          if ($1 != cur || $2 != curw) {
            cur=$1; curw=$2;
            print "- **Owner:** " cur "  | workspace: " curw
          }
          print "  - task: `" $3 "` (story: `" $4 "`)"
        }
      '
		else
			echo "- No active owners."
		fi
		rm -f "$owners_tmp"

		echo
		echo "## Stale Locks"
		local stale_any
		stale_any=0
		shopt -s nullglob
		for tf in "$mem"/task-*.md; do
			if lib_claim_is_stale_file "$tf"; then
				stale_any=1
				echo "- $(basename "$tf") (owner=$(lib_frontmatter_get "$tf" "claimed_by_owner_id"), lease_expires_at=$(lib_frontmatter_get "$tf" "lease_expires_at"))"
			fi
		done
		shopt -u nullglob
		if [[ "$stale_any" -eq 0 ]]; then
			echo "- No stale locks."
		fi
	} >"$team_tmp"

	{
		echo "# TODO"
		echo
		echo "_AUTO-GENERATED by scripts/miniproject.sh project at $now. Do not edit manually._"
		echo
		echo "## Unclaimed Work"
		local unclaimed
		unclaimed=0
		shopt -s nullglob
		for tf in "$mem"/task-*.md; do
			local status blocked_by title
			status="$(lib_frontmatter_get "$tf" "status")"
			blocked_by="$(lib_frontmatter_get "$tf" "blocked_by")"
			title="$(lib_frontmatter_get "$tf" "title")"

			case "$status" in
			completed | archived | cancelled) continue ;;
			esac

			if lib_claim_is_active_file "$tf"; then
				continue
			fi

			unclaimed=1
			echo "- [ ] [$(basename "$tf")](./$(basename "$tf")) \`${status:-unknown}\` ${blocked_by:+[BLOCKED by $blocked_by]} ${title:+- $title}"
		done
		shopt -u nullglob
		if [[ "$unclaimed" -eq 0 ]]; then
			echo "- No unclaimed work."
		fi

		echo
		echo "## Claimed Active Work"
		local claimed_any
		claimed_any=0
		shopt -s nullglob
		for tf in "$mem"/task-*.md; do
			if lib_claim_is_active_file "$tf"; then
				claimed_any=1
				echo "- $(basename "$tf") (owner=$(lib_frontmatter_get "$tf" "claimed_by_owner_id"), workspace=$(lib_frontmatter_get "$tf" "claimed_by_workspace_id"), lease=$(lib_frontmatter_get "$tf" "lease_expires_at"))"
			fi
		done
		shopt -u nullglob
		if [[ "$claimed_any" -eq 0 ]]; then
			echo "- No active claimed work."
		fi
	} >"$todo_tmp"

	{
		shopt -s nullglob
		for ef in "$mem"/epic-*.md; do
			local es
			es="$(lib_frontmatter_get "$ef" "status")"
			if [[ "$es" != "completed" && "$es" != "archived" ]]; then
				e_active=$((e_active + 1))
			fi
		done

		for sf in "$mem"/story-*.md; do
			local ss
			ss="$(lib_frontmatter_get "$sf" "status")"
			if [[ "$ss" == "completed" ]]; then
				s_completed=$((s_completed + 1))
			else
				s_open=$((s_open + 1))
			fi
		done

		for tf in "$mem"/task-*.md; do
			local ts blocked_by
			ts="$(lib_frontmatter_get "$tf" "status")"
			blocked_by="$(lib_frontmatter_get "$tf" "blocked_by")"
			if [[ "$ts" == "completed" || "$ts" == "archived" || "$ts" == "cancelled" ]]; then
				t_completed=$((t_completed + 1))
			else
				t_open=$((t_open + 1))
			fi
			if [[ "$ts" == "blocked" || -n "$blocked_by" ]]; then
				t_blocked=$((t_blocked + 1))
			fi
			if lib_claim_is_active_file "$tf"; then
				t_claimed=$((t_claimed + 1))
			elif lib_claim_is_stale_file "$tf"; then
				t_stale=$((t_stale + 1))
			fi
		done
		shopt -u nullglob

		echo "# Project Summary"
		echo
		echo "_AUTO-GENERATED by scripts/miniproject.sh project at $now. Do not edit manually._"
		echo
		echo "## Snapshot"
		echo "- Active epics: $e_active"
		echo "- Stories: open=$s_open completed=$s_completed"
		echo "- Tasks: open=$t_open completed=$t_completed blocked=$t_blocked claimed(active)=$t_claimed stale=$t_stale"
		echo
		echo "## Immediate Focus (unclaimed + not completed)"
		local focus_any
		focus_any=0
		shopt -s nullglob
		for tf in "$mem"/task-*.md; do
			local ts
			ts="$(lib_frontmatter_get "$tf" "status")"
			if [[ "$ts" == "completed" || "$ts" == "archived" || "$ts" == "cancelled" ]]; then
				continue
			fi
			if lib_claim_is_active_file "$tf"; then
				continue
			fi
			focus_any=1
			echo "- $(basename "$tf") (status=${ts:-unknown})"
		done
		shopt -u nullglob
		if [[ "$focus_any" -eq 0 ]]; then
			echo "- No unclaimed open tasks."
		fi
	} >"$summary_tmp"

	if [[ "$stdout_only" == "true" ]]; then
		echo "===== team.md ====="
		cat "$team_tmp"
		echo
		echo "===== todo.md ====="
		cat "$todo_tmp"
		echo
		echo "===== summary.md ====="
		cat "$summary_tmp"
	else
		lib_file_write_atomic "$mem/team.md" <"$team_tmp"
		lib_file_write_atomic "$mem/todo.md" <"$todo_tmp"
		lib_file_write_atomic "$mem/summary.md" <"$summary_tmp"
		echo "Updated derived views:"
		echo "- $mem/team.md"
		echo "- $mem/todo.md"
		echo "- $mem/summary.md"
	fi

	rm -f "$team_tmp" "$todo_tmp" "$summary_tmp"
}

# Name: main
# What: Routes CLI subcommands to cmd_* handlers.
# Why: Keep behavior explicit and maintainable for humans/LLMs editing this script.
main() {
	local cmd
	cmd="${1:-help}"
	shift || true

	case "$cmd" in
	help | -h | --help) cmd_help "$@" ;;
	memory-dir) cmd_memory_dir "$@" ;;
	memory-git-repo) cmd_memory_git_repo "$@" ;;
	migrate-phases-to-inline) cmd_migrate_phases_to_inline "$@" ;;
	register-intent) cmd_register_intent "$@" ;;
	discover-intents) cmd_discover_intents "$@" ;;
	lock-task) cmd_lock_task "$@" ;;
	heartbeat) cmd_heartbeat "$@" ;;
	takeover-task) cmd_takeover_task "$@" ;;
	release-task) cmd_release_task "$@" ;;
	stale-sweep) cmd_stale_sweep "$@" ;;
	project) cmd_project "$@" ;;
	discover-locks) cmd_discover_locks "$@" ;;
	list-by-owner) cmd_list_by_owner "$@" ;;
	list-by-session) cmd_list_by_session "$@" ;;
	list-unclaimed-stories) cmd_list_unclaimed_stories "$@" ;;
	tree) cmd_tree "$@" ;;
	next) cmd_next "$@" ;;
	*)
		echo "ERROR: unknown subcommand: $cmd" >&2
		echo
		lib_cli_usage
		exit 1
		;;
	esac
}

main "$@"
