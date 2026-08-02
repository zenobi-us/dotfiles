import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const rootTmp = join(import.meta.dir, "..", "tmp", "actions-test");
const originalEnv = { PI_CODING_AGENT_DIR: process.env.PI_CODING_AGENT_DIR };
const spawnSyncMock = mock(() => ({ status: 0, stdout: "", stderr: "", error: undefined, signal: null, output: [], pid: 0 }));

function writeJson(path: string, value: unknown): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, JSON.stringify(value, null, 2));
}

function writePackage(dir: string, name: string): void {
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "package.json"), JSON.stringify({ name, version: "1.0.0", pi: { extensions: ["./extension.ts"] } }));
	writeFileSync(join(dir, "extension.ts"), "export default function activate() {}\n");
}

beforeEach(() => {
	rmSync(rootTmp, { recursive: true, force: true });
	mkdirSync(rootTmp, { recursive: true });
	process.env.PI_CODING_AGENT_DIR = join(rootTmp, "home", ".pi", "agent");
	spawnSyncMock.mockClear();
});

afterEach(async () => {
	const processModule = await import("../extensions/manager/process.ts");
	processModule.__setSpawnSyncForTests(undefined);
	rmSync(rootTmp, { recursive: true, force: true });
	if (originalEnv.PI_CODING_AGENT_DIR === undefined) delete process.env.PI_CODING_AGENT_DIR;
	else process.env.PI_CODING_AGENT_DIR = originalEnv.PI_CODING_AGENT_DIR;
});

async function useSpawnMock(): Promise<void> {
	const processModule = await import("../extensions/manager/process.ts");
	processModule.__setSpawnSyncForTests(spawnSyncMock as never);
}

test("npm update and uninstall execution use configured npmCommand and scope-local cwd", async () => {
	await useSpawnMock();
	const { buildInventory } = await import("../extensions/manager/inventory.ts");
	const { planUninstall, planUpdate, runUninstall, runUpdate } = await import("../extensions/manager/actions.ts");
	const project = join(rootTmp, "project");
	const userPi = process.env.PI_CODING_AGENT_DIR!;
	const npmDir = join(userPi, "npm");
	const packageDir = join(npmDir, "node_modules", "@scope", "pkg");
	mkdirSync(join(project, ".pi"), { recursive: true });
	writeJson(join(userPi, "settings.json"), {
		npmCommand: ["mise", "exec", "node@22.19", "--", "npm"],
		packages: ["npm:@scope/pkg"],
	});
	writePackage(packageDir, "@scope/pkg");
	const inv = buildInventory({} as never, { cwd: project } as never);
	const item = inv.packages.find((pkg) => pkg.packageName === "@scope/pkg")!;
	item.updateAvailable = true;
	item.updateSource = "npm";
	item.npmName = "@scope/pkg";

	const update = planUpdate(item, inv, { cwd: project } as never)!;
	expect(update.command).toContain("'mise' 'exec' 'node@22.19' '--' 'npm' install @scope/pkg@latest");
	expect(runUpdate(update).ok).toBe(true);
	expect(spawnSyncMock).toHaveBeenLastCalledWith("mise", ["exec", "node@22.19", "--", "npm", "install", "@scope/pkg@latest"], expect.objectContaining({ cwd: npmDir }));

	const uninstall = planUninstall(item, inv, { cwd: project } as never)!;
	expect(uninstall.command).toContain("'mise' 'exec' 'node@22.19' '--' 'npm' uninstall @scope/pkg");
	expect(runUninstall(uninstall, inv).ok).toBe(true);
	expect(spawnSyncMock).toHaveBeenLastCalledWith("mise", ["exec", "node@22.19", "--", "npm", "uninstall", "@scope/pkg"], expect.objectContaining({ cwd: npmDir }));
});

test("npm update reports cwd preparation failures", async () => {
	await useSpawnMock();
	const { runUpdate } = await import("../extensions/manager/actions.ts");
	const badCwd = join(rootTmp, "not-a-directory");
	writeFileSync(badCwd, "file blocks mkdir");
	spawnSyncMock.mockClear();
	const result = runUpdate({
		item: { id: "package:@scope/pkg", displayName: "Pkg", kind: "package", state: "active", stateReason: "", description: "", provider: "npm", scope: "user", sourcePath: "", sourceName: "npm:@scope/pkg", packageName: "@scope/pkg" },
		method: { kind: "npm", npmName: "@scope/pkg", scope: "user", cwd: badCwd, command: "npm", argsPrefix: [] },
		command: "npm install @scope/pkg@latest",
		description: "",
	});
	expect(result.ok).toBe(false);
	expect(result.message).toContain("Failed to prepare npm working directory");
	expect(spawnSyncMock).not.toHaveBeenCalled();
});

test("invalid npmCommand is surfaced in npm action plans", async () => {
	await useSpawnMock();
	const { buildInventory } = await import("../extensions/manager/inventory.ts");
	const { planUpdate } = await import("../extensions/manager/actions.ts");
	const project = join(rootTmp, "project");
	const userPi = process.env.PI_CODING_AGENT_DIR!;
	const packageDir = join(userPi, "npm", "node_modules", "@scope", "bad-command");
	mkdirSync(join(project, ".pi"), { recursive: true });
	writeJson(join(userPi, "settings.json"), { npmCommand: "npm", packages: ["npm:@scope/bad-command"] });
	writePackage(packageDir, "@scope/bad-command");
	const inv = buildInventory({} as never, { cwd: project } as never);
	const item = inv.packages.find((pkg) => pkg.packageName === "@scope/bad-command")!;
	item.updateAvailable = true;
	item.updateSource = "npm";
	item.npmName = "@scope/bad-command";
	const plan = planUpdate(item, inv, { cwd: project } as never)!;
	expect(plan.description).toContain("invalid npmCommand");
});
