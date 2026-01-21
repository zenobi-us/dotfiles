/**
 * Worktree Extension - Git worktree management for isolated workspaces
 *
 * Provides commands to create, list, and manage git worktrees for feature development.
 * Codifies the patterns from the using-git-worktrees skill into an interactive command.
 *
 * Usage:
 *   /worktree create <feature-name>   - Create a new worktree for a feature
 *   /worktree list                    - List existing worktrees
 *   /worktree remove <name>           - Remove a worktree
 *   /worktree status                  - Show current worktree info
 *   /worktree cd <name>               - Print path to worktree
 *   /worktree prune                   - Clean up stale worktree references
 *
 * Configuration (~/.pi/settings.json):
 *   {
 *     "worktree": {
 *       "parentDir": "~/.local/share/worktrees/{{project}}",  // optional
 *       "onCreate": "mise setup"  // string or function
 *     }
 *   }
 *
 * Template vars for strings: {{path}}, {{name}}, {{branch}}, {{project}}
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { execSync, spawn } from "child_process";
import { existsSync, readFileSync, appendFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import { dirname, basename, join, resolve, relative } from "path";
import { homedir } from "os";

// ============================================================================
// Types
// ============================================================================

interface WorktreeInfo {
	path: string;
	branch: string;
	head: string;
	isMain: boolean;
	isCurrent: boolean;
}

interface WorktreeCreatedContext {
	path: string;
	name: string;
	branch: string;
	project: string;
	mainWorktree: string;
}

interface WorktreeSettings {
	parentDir?: string;
	onCreate?: string | ((ctx: WorktreeCreatedContext) => Promise<void>);
}

// ============================================================================
// Help Text
// ============================================================================

const HELP_TEXT = `
/worktree - Git worktree management

Commands:
  /worktree init                   Configure worktree settings interactively
  /worktree settings [key] [val]   Get/set individual settings
  /worktree create <feature-name>  Create new worktree with branch
  /worktree list                   List all worktrees
  /worktree remove <name>          Remove a worktree
  /worktree status                 Show current worktree info
  /worktree cd <name>              Print path to worktree
  /worktree prune                  Clean up stale references

Settings:
  /worktree settings               Show all settings
  /worktree settings parentDir     Get parentDir value
  /worktree settings parentDir ~   Set parentDir value
  /worktree settings onCreate      Get onCreate value  
  /worktree settings onCreate ""   Clear onCreate value

Configuration (~/.pi/settings.json):
  {
    "worktree": {
      "parentDir": "...",        // Override default parent directory
      "onCreate": "mise setup"   // Command to run after creation
    }
  }

Template vars: {{path}}, {{name}}, {{branch}}, {{project}}

Examples:
  /worktree init
  /worktree settings parentDir "~/.worktrees/{{project}}"
  /worktree create auth-feature
  /worktree list
  /worktree cd auth-feature
  /worktree remove auth-feature
`.trim();

// ============================================================================
// Git Utilities
// ============================================================================

/**
 * Execute a git command and return stdout
 */
function git(args: string[], cwd?: string): string {
	try {
		return execSync(`git ${args.join(" ")}`, {
			cwd,
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		}).trim();
	} catch (error) {
		throw new Error(`git ${args[0]} failed: ${(error as Error).message}`);
	}
}

/**
 * Check if we're in a git repository
 */
function isGitRepo(cwd: string): boolean {
	try {
		git(["rev-parse", "--git-dir"], cwd);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the main worktree path (handles both regular repos and worktrees)
 */
function getMainWorktreePath(cwd: string): string {
	const gitCommonDir = git(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd);
	return dirname(gitCommonDir);
}

/**
 * Get the project name from the main worktree path
 */
function getProjectName(cwd: string): string {
	return basename(getMainWorktreePath(cwd));
}

/**
 * Check if current directory is a worktree (not the main repo)
 */
function isWorktree(cwd: string): boolean {
	try {
		const gitDir = git(["rev-parse", "--git-dir"], cwd);
		// In a worktree, .git is a file pointing to the actual git dir
		const gitPath = join(cwd, ".git");
		if (existsSync(gitPath)) {
			const stat = statSync(gitPath);
			return stat.isFile();
		}
		return false;
	} catch {
		return false;
	}
}

/**
 * Get current branch name
 */
function getCurrentBranch(cwd: string): string {
	try {
		return git(["branch", "--show-current"], cwd) || "HEAD (detached)";
	} catch {
		return "unknown";
	}
}

/**
 * List all worktrees
 */
function listWorktrees(cwd: string): WorktreeInfo[] {
	const output = git(["worktree", "list", "--porcelain"], cwd);
	const worktrees: WorktreeInfo[] = [];
	const currentPath = resolve(cwd);
	const mainPath = getMainWorktreePath(cwd);

	let current: Partial<WorktreeInfo> = {};

	for (const line of output.split("\n")) {
		if (line.startsWith("worktree ")) {
			current.path = line.slice(9);
		} else if (line.startsWith("HEAD ")) {
			current.head = line.slice(5);
		} else if (line.startsWith("branch ")) {
			current.branch = line.slice(7).replace("refs/heads/", "");
		} else if (line === "detached") {
			current.branch = "HEAD (detached)";
		} else if (line === "") {
			if (current.path) {
				worktrees.push({
					path: current.path,
					branch: current.branch || "unknown",
					head: current.head || "unknown",
					isMain: current.path === mainPath,
					isCurrent: current.path === currentPath,
				});
			}
			current = {};
		}
	}

	// Handle last entry if no trailing newline
	if (current.path) {
		worktrees.push({
			path: current.path,
			branch: current.branch || "unknown",
			head: current.head || "unknown",
			isMain: current.path === mainPath,
			isCurrent: current.path === currentPath,
		});
	}

	return worktrees;
}

// ============================================================================
// Settings & Configuration
// ============================================================================

/**
 * Get the settings file path
 */
function getSettingsPath(): string {
	return join(homedir(), ".pi", "settings.json");
}

/**
 * Load full settings from ~/.pi/settings.json
 */
function loadFullSettings(): Record<string, unknown> {
	const settingsPath = getSettingsPath();
	try {
		if (existsSync(settingsPath)) {
			const content = readFileSync(settingsPath, "utf-8");
			return JSON.parse(content);
		}
	} catch {
		// Ignore errors, return empty
	}
	return {};
}

/**
 * Load worktree settings from ~/.pi/settings.json
 */
function loadSettings(): WorktreeSettings {
	const settings = loadFullSettings();
	return (settings.worktree as WorktreeSettings) || {};
}

/**
 * Save settings to ~/.pi/settings.json
 */
function saveSettings(worktreeSettings: WorktreeSettings): void {
	const settingsPath = getSettingsPath();
	const settingsDir = dirname(settingsPath);

	// Ensure ~/.pi directory exists
	if (!existsSync(settingsDir)) {
		mkdirSync(settingsDir, { recursive: true });
	}

	// Load existing settings and merge
	const fullSettings = loadFullSettings();
	fullSettings.worktree = worktreeSettings;

	// Write back with pretty formatting
	writeFileSync(settingsPath, JSON.stringify(fullSettings, null, 2) + "\n", "utf-8");
}

/**
 * Expand template variables in a string
 */
function expandTemplate(template: string, ctx: WorktreeCreatedContext): string {
	return template
		.replace(/\{\{path\}\}/g, ctx.path)
		.replace(/\{\{name\}\}/g, ctx.name)
		.replace(/\{\{branch\}\}/g, ctx.branch)
		.replace(/\{\{project\}\}/g, ctx.project)
		.replace(/^~/, homedir());
}

/**
 * Get the parent directory for worktrees
 */
function getWorktreeParentDir(cwd: string, settings: WorktreeSettings): string {
	const project = getProjectName(cwd);
	const mainWorktree = getMainWorktreePath(cwd);

	if (settings.parentDir) {
		// Use configured parent dir with template expansion
		return expandTemplate(settings.parentDir, {
			path: "",
			name: "",
			branch: "",
			project,
			mainWorktree,
		});
	}

	// Default: ../<projectname>.worktrees/
	return join(dirname(mainWorktree), `${project}.worktrees`);
}

// ============================================================================
// Exclude Management
// ============================================================================

/**
 * Check if a path is inside the repository
 */
function isPathInsideRepo(repoPath: string, targetPath: string): boolean {
	const relPath = relative(repoPath, targetPath);
	return !relPath.startsWith("..") && !relPath.startsWith("/");
}

/**
 * Ensure worktree directory is excluded from git tracking
 * Uses .git/info/exclude for local-only exclusion
 */
function ensureExcluded(cwd: string, worktreeParentDir: string): void {
	const mainWorktree = getMainWorktreePath(cwd);

	// Only manage exclusion if worktree dir is inside the repo
	if (!isPathInsideRepo(mainWorktree, worktreeParentDir)) {
		return;
	}

	const excludePath = join(mainWorktree, ".git", "info", "exclude");
	const relPath = relative(mainWorktree, worktreeParentDir);
	const excludePattern = `/${relPath}/`;

	try {
		let content = "";
		if (existsSync(excludePath)) {
			content = readFileSync(excludePath, "utf-8");
		}

		// Check if already excluded
		if (content.includes(excludePattern) || content.includes(relPath)) {
			return;
		}

		// Add exclusion
		const newEntry = `\n# Worktree directory (added by worktree extension)\n${excludePattern}\n`;
		appendFileSync(excludePath, newEntry);
	} catch {
		// Silently fail - not critical
	}
}

// ============================================================================
// Post-Create Hook
// ============================================================================

/**
 * Run the onCreate hook after worktree creation
 */
async function runOnCreateHook(
	ctx: WorktreeCreatedContext,
	settings: WorktreeSettings,
	notify: (msg: string, type: "info" | "error" | "warning") => void
): Promise<void> {
	const { onCreate } = settings;

	if (!onCreate) {
		return;
	}

	if (typeof onCreate === "string") {
		// String form: execute as shell command
		const command = expandTemplate(onCreate, ctx);
		notify(`Running: ${command}`, "info");

		return new Promise((resolve, reject) => {
			const child = spawn(command, {
				cwd: ctx.path,
				shell: true,
				stdio: ["ignore", "pipe", "pipe"],
			});

			let stdout = "";
			let stderr = "";

			child.stdout?.on("data", (data) => {
				stdout += data.toString();
			});

			child.stderr?.on("data", (data) => {
				stderr += data.toString();
			});

			child.on("close", (code) => {
				if (code === 0) {
					if (stdout.trim()) {
						notify(stdout.trim().slice(0, 200), "info");
					}
					resolve();
				} else {
					notify(`onCreate failed (exit ${code}): ${stderr.slice(0, 200)}`, "error");
					resolve(); // Don't reject - worktree was still created
				}
			});

			child.on("error", (err) => {
				notify(`onCreate error: ${err.message}`, "error");
				resolve(); // Don't reject - worktree was still created
			});
		});
	} else if (typeof onCreate === "function") {
		// Function form: call directly
		try {
			await onCreate(ctx);
		} catch (err) {
			notify(`onCreate error: ${(err as Error).message}`, "error");
		}
	}
}



// ============================================================================
// Command Handlers
// ============================================================================

async function handleInit(_args: string, ctx: ExtensionCommandContext): Promise<void> {
	if (!ctx.hasUI) {
		ctx.ui.notify("init requires interactive mode", "error");
		return;
	}

	const currentSettings = loadSettings();
	const settingsPath = getSettingsPath();

	ctx.ui.notify("Worktree Extension Setup\n━━━━━━━━━━━━━━━━━━━━━━━━", "info");

	// Show current settings if they exist
	if (currentSettings.parentDir || currentSettings.onCreate) {
		const current = [
			"Current settings:",
			currentSettings.parentDir ? `  parentDir: ${currentSettings.parentDir}` : null,
			currentSettings.onCreate ? `  onCreate: ${currentSettings.onCreate}` : null,
		]
			.filter(Boolean)
			.join("\n");
		ctx.ui.notify(current, "info");
	}

	// Step 1: Configure parent directory
	const PARENT_DIR_DEFAULT = "Default (../{{project}}.worktrees/)";
	const PARENT_DIR_GLOBAL = "Global (~/.local/share/worktrees/{{project}})";
	const PARENT_DIR_CUSTOM = "Custom path...";
	const PARENT_DIR_KEEP = "Keep current";

	const parentDirOptions = [
		PARENT_DIR_DEFAULT,
		PARENT_DIR_GLOBAL,
		PARENT_DIR_CUSTOM,
		currentSettings.parentDir ? PARENT_DIR_KEEP : null,
	].filter(Boolean) as string[];

	const parentDirChoice = await ctx.ui.select(
		"Where should worktrees be created?",
		parentDirOptions
	);

	if (parentDirChoice === undefined) {
		ctx.ui.notify("Setup cancelled", "info");
		return;
	}

	let parentDir: string | undefined;

	if (parentDirChoice === PARENT_DIR_DEFAULT) {
		parentDir = undefined; // Use default behavior
	} else if (parentDirChoice === PARENT_DIR_GLOBAL) {
		parentDir = "~/.local/share/worktrees/{{project}}";
	} else if (parentDirChoice === PARENT_DIR_CUSTOM) {
		const customPath = await ctx.ui.input(
			"Enter custom path (supports {{project}}, {{name}}):",
			currentSettings.parentDir || "../{{project}}.worktrees"
		);
		if (customPath === undefined) {
			ctx.ui.notify("Setup cancelled", "info");
			return;
		}
		parentDir = customPath || undefined;
	} else if (parentDirChoice === PARENT_DIR_KEEP) {
		parentDir = currentSettings.parentDir;
	}

	// Step 2: Configure onCreate command
	const onCreate = await ctx.ui.input(
		"Enter command to run after creating worktree (or leave empty):\nSupports: {{path}}, {{name}}, {{branch}}, {{project}}",
		(currentSettings.onCreate && typeof currentSettings.onCreate === "string") ? currentSettings.onCreate : "mise setup"
	);

	if (onCreate === undefined) {
		ctx.ui.notify("Setup cancelled", "info");
		return;
	}

	// Build new settings
	const newSettings: WorktreeSettings = {};
	if (parentDir) {
		newSettings.parentDir = parentDir;
	}
	if (onCreate && onCreate.trim()) {
		newSettings.onCreate = onCreate.trim();
	}

	// Confirm before saving
	const preview = [
		"Settings to save:",
		"",
		newSettings.parentDir ? `  parentDir: "${newSettings.parentDir}"` : "  parentDir: (default)",
		newSettings.onCreate ? `  onCreate: "${newSettings.onCreate}"` : "  onCreate: (none)",
		"",
		`File: ${settingsPath}`,
	].join("\n");

	const confirmed = await ctx.ui.confirm("Save settings?", preview);

	if (!confirmed) {
		ctx.ui.notify("Setup cancelled", "info");
		return;
	}

	// Save settings
	try {
		saveSettings(newSettings);
		ctx.ui.notify(`✓ Settings saved to ${settingsPath}`, "info");

		// Show final config
		const finalConfig = JSON.stringify({ worktree: newSettings }, null, 2);
		ctx.ui.notify(`Configuration:\n${finalConfig}`, "info");
	} catch (err) {
		ctx.ui.notify(`Failed to save settings: ${(err as Error).message}`, "error");
	}
}

const VALID_SETTING_KEYS = ["parentDir", "onCreate"] as const;
type SettingKey = (typeof VALID_SETTING_KEYS)[number];

async function handleSettings(args: string, ctx: ExtensionCommandContext): Promise<void> {
	const currentSettings = loadSettings();
	const settingsPath = getSettingsPath();

	// Parse args - handle quoted values
	const parts = args.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
	const key = parts[0]?.trim() as SettingKey | undefined;
	// Remove quotes from value if present
	const value = parts.slice(1).join(" ").replace(/^"(.*)"$/, "$1");

	// No args: show all settings
	if (!key) {
		const lines = [
			"Worktree Settings:",
			"━━━━━━━━━━━━━━━━━━",
			"",
			`parentDir: ${currentSettings.parentDir || "(default: ../<project>.worktrees/)"}`,
			`onCreate:  ${currentSettings.onCreate || "(none)"}`,
			"",
			`File: ${settingsPath}`,
		];
		ctx.ui.notify(lines.join("\n"), "info");
		return;
	}

	// Validate key
	if (!VALID_SETTING_KEYS.includes(key as SettingKey)) {
		ctx.ui.notify(
			`Invalid setting key: "${key}"\nValid keys: ${VALID_SETTING_KEYS.join(", ")}`,
			"error"
		);
		return;
	}

	// No value: get the setting
	if (!value && parts.length === 1) {
		const currentValue = currentSettings[key];
		if (currentValue) {
			ctx.ui.notify(`${key}: ${currentValue}`, "info");
		} else {
			const defaults: Record<SettingKey, string> = {
				parentDir: "(default: ../<project>.worktrees/)",
				onCreate: "(none)",
			};
			ctx.ui.notify(`${key}: ${defaults[key]}`, "info");
		}
		return;
	}

	// Set the value
	const newSettings = { ...currentSettings };

	// Handle empty string or explicit clear
	if (value === "" || value === '""' || value === "null" || value === "clear") {
		delete newSettings[key];
		ctx.ui.notify(`✓ Cleared ${key}`, "info");
	} else {
		newSettings[key] = value;
		ctx.ui.notify(`✓ Set ${key} = "${value}"`, "info");
	}

	try {
		saveSettings(newSettings);
	} catch (err) {
		ctx.ui.notify(`Failed to save settings: ${(err as Error).message}`, "error");
	}
}

async function handleCreate(args: string, ctx: ExtensionCommandContext): Promise<void> {
	const featureName = args.trim();
	if (!featureName) {
		ctx.ui.notify("Usage: /worktree create <feature-name>", "error");
		return;
	}

	if (!isGitRepo(ctx.cwd)) {
		ctx.ui.notify("Not in a git repository", "error");
		return;
	}

	const settings = loadSettings();
	const project = getProjectName(ctx.cwd);
	const mainWorktree = getMainWorktreePath(ctx.cwd);
	const parentDir = getWorktreeParentDir(ctx.cwd, settings);
	const worktreePath = join(parentDir, featureName);
	const branchName = `feature/${featureName}`;

	// Check if worktree already exists
	const existing = listWorktrees(ctx.cwd);
	if (existing.some((w) => w.path === worktreePath)) {
		ctx.ui.notify(`Worktree already exists at: ${worktreePath}`, "error");
		return;
	}

	// Check if branch already exists
	try {
		git(["rev-parse", "--verify", branchName], ctx.cwd);
		ctx.ui.notify(`Branch '${branchName}' already exists. Use a different name.`, "error");
		return;
	} catch {
		// Branch doesn't exist, good to proceed
	}

	// Ensure parent directory exclusion
	ensureExcluded(ctx.cwd, parentDir);

	// Create the worktree
	ctx.ui.notify(`Creating worktree: ${featureName}`, "info");

	try {
		git(["worktree", "add", "-b", branchName, worktreePath], mainWorktree);
	} catch (err) {
		ctx.ui.notify(`Failed to create worktree: ${(err as Error).message}`, "error");
		return;
	}

	const createdCtx: WorktreeCreatedContext = {
		path: worktreePath,
		name: featureName,
		branch: branchName,
		project,
		mainWorktree,
	};

	// Run onCreate hook
	await runOnCreateHook(createdCtx, settings, ctx.ui.notify.bind(ctx.ui));

	ctx.ui.notify(
		`✓ Worktree created!\n  Path: ${worktreePath}\n  Branch: ${branchName}`,
		"info"
	);
}

async function handleList(_args: string, ctx: ExtensionCommandContext): Promise<void> {
	if (!isGitRepo(ctx.cwd)) {
		ctx.ui.notify("Not in a git repository", "error");
		return;
	}

	const worktrees = listWorktrees(ctx.cwd);

	if (worktrees.length === 0) {
		ctx.ui.notify("No worktrees found", "info");
		return;
	}

	const lines = worktrees.map((w) => {
		const markers = [
			w.isMain ? "[main]" : "",
			w.isCurrent ? "[current]" : "",
		]
			.filter(Boolean)
			.join(" ");

		return `${w.branch}${markers ? " " + markers : ""}\n    ${w.path}`;
	});

	ctx.ui.notify(`Worktrees:\n\n${lines.join("\n\n")}`, "info");
}

async function handleRemove(args: string, ctx: ExtensionCommandContext): Promise<void> {
	const worktreeName = args.trim();
	if (!worktreeName) {
		ctx.ui.notify("Usage: /worktree remove <name>", "error");
		return;
	}

	if (!isGitRepo(ctx.cwd)) {
		ctx.ui.notify("Not in a git repository", "error");
		return;
	}

	const worktrees = listWorktrees(ctx.cwd);
	const settings = loadSettings();
	const parentDir = getWorktreeParentDir(ctx.cwd, settings);

	// Find worktree by name (check both path basename and full path)
	const target = worktrees.find(
		(w) =>
			basename(w.path) === worktreeName ||
			w.path === worktreeName ||
			w.path === join(parentDir, worktreeName)
	);

	if (!target) {
		ctx.ui.notify(`Worktree not found: ${worktreeName}`, "error");
		return;
	}

	if (target.isMain) {
		ctx.ui.notify("Cannot remove the main worktree", "error");
		return;
	}

	if (target.isCurrent) {
		ctx.ui.notify("Cannot remove the current worktree. Switch to another first.", "error");
		return;
	}

	// Confirm removal
	const confirmed = await ctx.ui.confirm(
		`Remove worktree?`,
		`This will remove:\n  Path: ${target.path}\n  Branch: ${target.branch}\n\nThe branch will NOT be deleted.`
	);

	if (!confirmed) {
		ctx.ui.notify("Cancelled", "info");
		return;
	}

	try {
		git(["worktree", "remove", target.path], ctx.cwd);
		ctx.ui.notify(`✓ Worktree removed: ${target.path}`, "info");
	} catch (err) {
		// Try force remove if there are untracked files
		const forceConfirmed = await ctx.ui.confirm(
			"Force remove?",
			`Worktree has uncommitted changes. Force remove anyway?`
		);

		if (forceConfirmed) {
			try {
				git(["worktree", "remove", "--force", target.path], ctx.cwd);
				ctx.ui.notify(`✓ Worktree force removed: ${target.path}`, "info");
			} catch (forceErr) {
				ctx.ui.notify(`Failed to remove: ${(forceErr as Error).message}`, "error");
			}
		} else {
			ctx.ui.notify("Cancelled", "info");
		}
	}
}

async function handleStatus(_args: string, ctx: ExtensionCommandContext): Promise<void> {
	if (!isGitRepo(ctx.cwd)) {
		ctx.ui.notify("Not in a git repository", "error");
		return;
	}

	const isWt = isWorktree(ctx.cwd);
	const mainPath = getMainWorktreePath(ctx.cwd);
	const project = getProjectName(ctx.cwd);
	const branch = getCurrentBranch(ctx.cwd);
	const worktrees = listWorktrees(ctx.cwd);

	const current = worktrees.find((w) => w.isCurrent);

	const status = [
		`Project: ${project}`,
		`Current path: ${ctx.cwd}`,
		`Branch: ${branch}`,
		`Is worktree: ${isWt ? "Yes" : "No (main repository)"}`,
		`Main worktree: ${mainPath}`,
		`Total worktrees: ${worktrees.length}`,
	];

	ctx.ui.notify(status.join("\n"), "info");
}

async function handleCd(args: string, ctx: ExtensionCommandContext): Promise<void> {
	const worktreeName = args.trim();

	if (!isGitRepo(ctx.cwd)) {
		ctx.ui.notify("Not in a git repository", "error");
		return;
	}

	const worktrees = listWorktrees(ctx.cwd);
	const settings = loadSettings();
	const parentDir = getWorktreeParentDir(ctx.cwd, settings);

	if (!worktreeName) {
		// No name provided - show main worktree path
		const main = worktrees.find((w) => w.isMain);
		if (main) {
			// Print path for shell capture
			console.log(main.path);
			ctx.ui.notify(`Main worktree: ${main.path}`, "info");
		}
		return;
	}

	// Find worktree by name
	const target = worktrees.find(
		(w) =>
			basename(w.path) === worktreeName ||
			w.path === worktreeName ||
			w.path === join(parentDir, worktreeName)
	);

	if (!target) {
		ctx.ui.notify(`Worktree not found: ${worktreeName}`, "error");
		return;
	}

	// Print path for shell capture
	console.log(target.path);
	ctx.ui.notify(`Worktree path: ${target.path}`, "info");
}

async function handlePrune(_args: string, ctx: ExtensionCommandContext): Promise<void> {
	if (!isGitRepo(ctx.cwd)) {
		ctx.ui.notify("Not in a git repository", "error");
		return;
	}

	// Check for stale worktrees first
	let dryRun: string;
	try {
		dryRun = git(["worktree", "prune", "--dry-run"], ctx.cwd);
	} catch (err) {
		ctx.ui.notify(`Failed to check stale worktrees: ${(err as Error).message}`, "error");
		return;
	}

	if (!dryRun.trim()) {
		ctx.ui.notify("No stale worktree references to prune", "info");
		return;
	}

	// Show what will be pruned and confirm
	const confirmed = await ctx.ui.confirm(
		"Prune stale worktrees?",
		`The following stale references will be removed:\n\n${dryRun}`
	);

	if (!confirmed) {
		ctx.ui.notify("Cancelled", "info");
		return;
	}

	try {
		git(["worktree", "prune"], ctx.cwd);
		ctx.ui.notify("✓ Stale worktree references pruned", "info");
	} catch (err) {
		ctx.ui.notify(`Failed to prune: ${(err as Error).message}`, "error");
	}
}

// ============================================================================
// Command Router
// ============================================================================

const commands: Record<string, (args: string, ctx: ExtensionCommandContext) => Promise<void>> = {
	init: handleInit,
	settings: handleSettings,
	config: handleSettings, // alias
	create: handleCreate,
	list: handleList,
	ls: handleList, // alias
	remove: handleRemove,
	rm: handleRemove, // alias
	status: handleStatus,
	cd: handleCd,
	prune: handlePrune,
};

// ============================================================================
// Extension Export
// ============================================================================

export default function (pi: ExtensionAPI) {
	pi.registerCommand("worktree", {
		description: "Git worktree management for isolated workspaces",
		handler: async (args, ctx) => {
			const [cmd, ...rest] = args.trim().split(/\s+/);
			const handler = commands[cmd];

			if (handler) {
				await handler(rest.join(" "), ctx);
			} else {
				ctx.ui.notify(HELP_TEXT, "info");
			}
		},
	});
}
