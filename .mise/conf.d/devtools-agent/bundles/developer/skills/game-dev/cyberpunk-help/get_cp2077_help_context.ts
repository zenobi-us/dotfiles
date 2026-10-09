#!/usr/bin/env -S mise x -- bun --install=fallback
import { createHash } from "node:crypto";
import { homedir, platform, release } from "node:os";
import { join, basename } from "node:path";

const home = homedir();
const now = new Date();
const skip = new Set([".git", "node_modules", "cache", "tmp", "proc", "dev"]);
async function find(root: string, depth = 0): Promise<string | null> {
  if (depth > 5) return null;
  try {
    for await (const entry of new Bun.Glob("**/Cyberpunk2077.exe").scan({ cwd: root, absolute: true, onlyFiles: true })) return entry;
  } catch {}
  return null;
}
async function gamePath(): Promise<string | null> {
  const roots = [join(home, ".steam/steam/steamapps/common/Cyberpunk 2077"), "/mnt", "/media", "/run/media"];
  for (const root of roots) { const hit = await find(root); if (hit) return join(hit, "../../.."); }
  return null;
}
async function main() {
  const game = await gamePath();
  const mods: unknown[] = [];
  const inventoryHash = createHash("sha256").update("").digest("hex");
  const out = {
    localDate: now.toISOString().slice(0, 10), localDateTime: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
    day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear(),
    osCaption: platform(), osVersion: release(), osBuild: null, osArchitecture: platform(), platform: process.platform,
    bunVersion: Bun.version, pythonVersion: null, gamePath: game, stagingPath: null, processRunning: false,
    gamePatchFromSave: null, gameVersionFromCet: null, cetVersionFromLog: null, cetVersionFromVortex: null,
    latestSave: null, trackedQuestEntry: null, trackedQuest: null, locationName: null, playerPosition: null,
    lifePath: null, level: null, streetCred: null, isModded: null, dlc: [], deployedMods: mods,
    stagedNotDeployed: [], inventoryHash, inventoryChanged: true, previousSnapshotAt: null,
    addedSinceSnapshot: [], removedSinceSnapshot: [], saveDirCount: 0, gameDirCount: game ? 1 : 0,
  };
  console.log(JSON.stringify(out, null, 2));
}
if (import.meta.main) await main();
