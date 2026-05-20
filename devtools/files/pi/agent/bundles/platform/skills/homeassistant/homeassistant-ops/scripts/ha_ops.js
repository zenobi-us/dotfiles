#!/usr/bin/env node

/**
 * Home Assistant ops toolkit (single CLI).
 *
 * Commands:
 *   - cleanup
 *   - snapshot
 *   - rollback
 *   - find-references
 *   - traces
 *   - tail-events
 *   - name-review-from-backup
 *
 * Uses only Node built-ins (requires Node 22+ for fetch + WebSocket).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as readlinePromises from "node:readline/promises";
import * as util from "node:util";

const { parseArgs } = util;

// -------------------------
// utils
// -------------------------

function utcTimestamp() {
	// YYYYMMDDTHHMMSSZ
	const d = new Date();
	const pad = (n) => String(n).padStart(2, "0");
	return (
		String(d.getUTCFullYear()) +
		pad(d.getUTCMonth() + 1) +
		pad(d.getUTCDate()) +
		"T" +
		pad(d.getUTCHours()) +
		pad(d.getUTCMinutes()) +
		pad(d.getUTCSeconds()) +
		"Z"
	);
}

function utcNowIso() {
	return new Date().toISOString();
}

function deriveWsUrl(httpUrl) {
	const base = String(httpUrl || "")
		.trim()
		.replace(/\/+$/, "");
	if (base.startsWith("https://")) {
		return "wss://" + base.slice("https://".length) + "/api/websocket";
	}
	if (base.startsWith("http://")) {
		return "ws://" + base.slice("http://".length) + "/api/websocket";
	}
	throw new Error(`Unsupported base URL: ${base}`);
}

function slugifyForEntityId(value) {
	let v = String(value || "")
		.trim()
		.toLowerCase();
	v = v.replace(/[^a-z0-9_ ]+/g, "");
	v = v.replace(/\s+/g, "_");
	v = v.replace(/_+/g, "_");
	v = v.replace(/^_+|_+$/g, "");
	return v;
}

function normalizeAreaName(value) {
	return slugifyForEntityId(value).replace(/_/g, "");
}

function getStr(obj, key) {
	if (!obj || typeof obj !== "object") return null;
	const v = obj[key];
	return typeof v === "string" ? v : null;
}

function getDict(obj, key) {
	if (!obj || typeof obj !== "object") return null;
	const v = obj[key];
	return v && typeof v === "object" && !Array.isArray(v) ? v : null;
}

function sortListByKey(items, keyFields) {
	if (!Array.isArray(items)) return items;
	const keyOf = (item) => {
		if (!item || typeof item !== "object" || Array.isArray(item))
			return [1, String(item)];
		for (const f of keyFields) {
			if (typeof item[f] === "string") return [0, item[f]];
		}
		try {
			return [0, stableStringify(item)];
		} catch {
			return [0, String(item)];
		}
	};
	return [...items].sort((a, b) => {
		const [pa, ka] = keyOf(a);
		const [pb, kb] = keyOf(b);
		if (pa !== pb) return pa - pb;
		return ka < kb ? -1 : ka > kb ? 1 : 0;
	});
}

function stableStringify(value, indent = 0) {
	const seen = new WeakSet();
	const sortRec = (v) => {
		if (!v || typeof v !== "object") return v;
		if (seen.has(v)) return v;
		seen.add(v);
		if (Array.isArray(v)) return v.map(sortRec);
		const out = {};
		for (const k of Object.keys(v).sort()) out[k] = sortRec(v[k]);
		return out;
	};
	return JSON.stringify(sortRec(value), null, indent);
}

function resolveEntityArea(entry, deviceIdToAreaId) {
	const areaId = entry?.area_id;
	if (areaId !== undefined && areaId !== null) {
		return typeof areaId === "string" ? areaId : null;
	}
	const deviceId = entry?.device_id;
	if (typeof deviceId === "string") {
		const inherited = deviceIdToAreaId[deviceId];
		return typeof inherited === "string" ? inherited : (inherited ?? null);
	}
	return null;
}

class ProgressReporter {
	constructor(total, prefix = "", width = 30) {
		this.total = total;
		this.current = 0;
		this.prefix = prefix;
		this.width = width;
		this.lastLen = 0;
	}

	update(n = 1) {
		this.current += n;
		this.#print();
	}

	finish() {
		this.current = this.total;
		this.#print();
		process.stdout.write("\n");
	}

	#print() {
		if (!this.total) return;
		const pct = this.current / this.total;
		const filled = Math.floor(this.width * pct);
		let bar =
			"=".repeat(filled) +
			">" +
			" ".repeat(Math.max(0, this.width - filled - 1));
		if (filled >= this.width) bar = "=".repeat(this.width);
		const output = `\r${this.prefix}${this.current}/${this.total} [${bar}] ${Math.round(pct * 100)}%`;
		const padding = " ".repeat(Math.max(0, this.lastLen - output.length));
		process.stdout.write(output + padding);
		this.lastLen = output.length;
	}
}

// -------------------------
// HA clients
// -------------------------

function getHaUrl() {
	const url = String(process.env.HA_URL || "").trim();
	if (!url) throw new Error("Missing HA_URL environment variable");
	return url.replace(/\/+$/, "");
}

function getHaToken() {
	const token = String(process.env.HA_TOKEN || "").trim();
	if (!token) throw new Error("Missing HA_TOKEN environment variable");
	return token;
}

class HARest {
	constructor({ baseUrl, token, timeoutMs } = {}) {
		this.baseUrl = (baseUrl || getHaUrl()).replace(/\/+$/, "");
		this.token = token || getHaToken();
		this.timeoutMs = typeof timeoutMs === "number" ? timeoutMs : 30_000;
	}

	async request(method, apiPath, { jsonBody, expectedStatuses } = {}) {
		const url = this.baseUrl + apiPath;
		const expected = Array.isArray(expectedStatuses) ? expectedStatuses : [200];
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

		let res;
		try {
			res = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${this.token}`,
					...(jsonBody !== undefined
						? { "Content-Type": "application/json" }
						: {}),
				},
				body: jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined,
				signal: controller.signal,
			});
		} finally {
			clearTimeout(timeout);
		}

		if (!expected.includes(res.status)) {
			const text = await res.text().catch(() => "");
			throw new Error(`${method} ${apiPath} -> ${res.status}\n${text}`);
		}
		return res;
	}

	async getJson(apiPath, { expectedStatuses } = {}) {
		const res = await this.request("GET", apiPath, { expectedStatuses });
		const text = await res.text();
		if (!text) return null;
		try {
			return JSON.parse(text);
		} catch (e) {
			if (res.status !== 200) return null;
			throw new Error(`GET ${apiPath} returned non-JSON content`);
		}
	}

	async postJson(apiPath, payload, { expectedStatuses } = {}) {
		const res = await this.request("POST", apiPath, {
			jsonBody: payload,
			expectedStatuses,
		});
		const text = await res.text();
		if (!text) return null;
		return JSON.parse(text);
	}
}

class HAWebSocket {
	constructor({ wsUrl, token } = {}) {
		const httpUrl = getHaUrl();
		this.wsUrl = wsUrl || deriveWsUrl(httpUrl);
		this.token = token || getHaToken();
		this.nextMsgId = 1;
		this.ws = null;
		this.pending = new Map(); // id -> {resolve,reject}
		this.ignoredCallIds = new Set();
		this.queue = [];
		this.queueWaiters = [];
	}

	async connect() {
		this.ws = new WebSocket(this.wsUrl);

		this.ws.addEventListener("message", (ev) => {
			let msg;
			try {
				msg = JSON.parse(String(ev.data));
			} catch {
				return;
			}
			if (!msg || typeof msg !== "object") return;
			const id = msg.id;
			if (typeof id === "number" && this.pending.has(id)) {
				const { resolve, reject } = this.pending.get(id);
				this.pending.delete(id);
				if (msg.success === false) {
					reject(
						new Error(`WS call failed: ${msg.type}: ${JSON.stringify(msg)}`),
					);
				} else {
					resolve(msg.result);
				}
				return;
			}
			if (typeof id === "number" && this.ignoredCallIds.has(id)) {
				this.ignoredCallIds.delete(id);
				return;
			}
			this.#enqueue(msg);
		});

		await new Promise((resolve, reject) => {
			this.ws.addEventListener("open", () => resolve());
			this.ws.addEventListener("error", (e) => reject(e));
		});

		const first = await this.recvJson({ timeoutMs: 10_000 });
		if (first?.type !== "auth_required") {
			throw new Error(
				`Unexpected initial WS message: ${JSON.stringify(first)}`,
			);
		}

		this.sendJson({ type: "auth", access_token: this.token });

		const second = await this.recvJson({ timeoutMs: 10_000 });
		if (second?.type !== "auth_ok") {
			throw new Error(`WS auth failed: ${JSON.stringify(second)}`);
		}
		return this;
	}

	async close() {
		if (!this.ws) return;
		try {
			this.ws.close();
		} catch {
			// ignore
		}
		this.ws = null;
	}

	nextId() {
		const id = this.nextMsgId;
		this.nextMsgId += 1;
		return id;
	}

	sendJson(payload) {
		if (!this.ws) throw new Error("WebSocket not connected");
		this.ws.send(JSON.stringify(payload));
	}

	async call(messageType, payload = {}, { timeoutMs = 30_000 } = {}) {
		if (!this.ws) throw new Error("WebSocket not connected");
		const id = this.nextId();
		const msg = { id, type: messageType, ...payload };
		const promise = new Promise((resolve, reject) => {
			let timeout = null;
			const wrapped = {
				resolve: (value) => {
					if (timeout) clearTimeout(timeout);
					resolve(value);
				},
				reject: (err) => {
					if (timeout) clearTimeout(timeout);
					reject(err);
				},
			};
			this.pending.set(id, wrapped);
			if (timeoutMs) {
				timeout = setTimeout(() => {
					if (!this.pending.has(id)) return;
					this.pending.delete(id);
					this.ignoredCallIds.add(id);
					wrapped.reject(
						new Error(`WS call timeout after ${timeoutMs}ms: ${messageType}`),
					);
				}, timeoutMs);
			}
		});
		this.ws.send(JSON.stringify(msg));
		return await promise;
	}

	#enqueue(msg) {
		const waiter = this.queueWaiters.shift();
		if (waiter) {
			waiter.resolve(msg);
			return;
		}
		this.queue.push(msg);
	}

	async recvJson({ timeoutMs } = {}) {
		if (this.queue.length) return this.queue.shift();
		const promise = new Promise((resolve, reject) => {
			this.queueWaiters.push({ resolve, reject });
		});
		if (!timeoutMs) return await promise;
		return await Promise.race([
			promise,
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error("WS recv timeout")), timeoutMs),
			),
		]);
	}
}

// -------------------------
// CLI
// -------------------------

function printTopHelp() {
	console.log("Usage: node scripts/ha_ops.js <command> [options]");
	console.log("");
	console.log("Commands:");
	console.log("  cleanup                 Bulk cleanup (dry-run by default)");
	console.log(
		"  snapshot                Create a JSON snapshot for diff/rollback",
	);
	console.log(
		"  rollback                Rollback registry changes from a snapshot",
	);
	console.log("  find-references          Find entity_id/string references");
	console.log(
		"  traces                   List/view automation or script traces",
	);
	console.log(
		"  tail-events              Tail Home Assistant events over WebSocket",
	);
	console.log(
		"  name-review-from-backup  Offline naming analysis from a backup",
	);
	console.log("");
	console.log("Environment:");
	console.log("  HA_URL    Home Assistant base URL (e.g. http://host:8123)");
	console.log("  HA_TOKEN  Long-lived access token");
}

function die(message, code = 2) {
	process.stderr.write(String(message) + "\n");
	process.exit(code);
}

async function run() {
	const argv = process.argv.slice(2);
	if (!argv.length || argv[0] === "-h" || argv[0] === "--help") {
		printTopHelp();
		return 0;
	}

	const command = argv[0];
	const args = argv.slice(1);

	try {
		switch (command) {
			case "cleanup":
				return await cmdCleanup(args);
			case "snapshot":
				return await cmdSnapshot(args);
			case "rollback":
				return await cmdRollback(args);
			case "find-references":
				return await cmdFindReferences(args);
			case "traces":
				return await cmdTraces(args);
			case "tail-events":
				return await cmdTailEvents(args);
			case "name-review-from-backup":
				return await cmdNameReviewFromBackup(args);
			default:
				printTopHelp();
				die(`Unknown command: ${command}`);
				return 2;
		}
	} catch (e) {
		die(e?.message || String(e), 1);
		return 1;
	}
}

// -------------------------
// cleanup
// -------------------------

const AVAILABLE_CLEANUP_STEPS = [
	"rename-switch-suffix",
	"create-groups",
	"prefix-lights-cove",
	"prefix-generic",
];

function printCleanupHelp() {
	console.log("Usage: node scripts/ha_ops.js cleanup [options]");
	console.log("");
	console.log("Options:");
	console.log(
		"  --steps <csv>              Steps to run (default: rename-switch-suffix,create-groups,prefix-lights-cove)",
	);
	console.log(
		"  --pattern <cat:regex>      Pattern for prefix-generic (repeatable)",
	);
	console.log(
		"  --blueprint-pattern <re>   Regex to match blueprint paths for create-groups step",
	);
	console.log(
		"  --log <path>               Log path (default: ha_cleanup_<timestamp>.md)",
	);
	console.log(
		"  --apply                    Apply changes (required to mutate HA)",
	);
	console.log(
		"  --json                     Output proposed changes as JSON (implies dry-run)",
	);
	console.log("  -h, --help                 Show this help");
	console.log("");
	console.log("Available steps:");
	for (const s of AVAILABLE_CLEANUP_STEPS) console.log(`  - ${s}`);
}

async function cmdCleanup(argv) {
	const { values } = parseArgs({
		args: argv,
		allowPositionals: false,
		options: {
			help: { type: "boolean", short: "h" },
			steps: {
				type: "string",
				default: "rename-switch-suffix,create-groups,prefix-lights-cove",
			},
			pattern: { type: "string", multiple: true, default: [] },
			"blueprint-pattern": { type: "string", default: "" },
			log: { type: "string", default: "" },
			apply: { type: "boolean", default: false },
			json: { type: "boolean", default: false },
		},
	});

	if (values.help) {
		printCleanupHelp();
		return 0;
	}

	const steps = String(values.steps || "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	for (const step of steps) {
		if (!AVAILABLE_CLEANUP_STEPS.includes(step)) {
			die(
				`Unknown step: ${step}\nAvailable: ${AVAILABLE_CLEANUP_STEPS.join(", ")}`,
				2,
			);
		}
	}

	if (values.apply && values.json) {
		die("Cannot combine --apply and --json", 2);
	}

	const dryRun = !values.apply;

	const genericPatterns = [];
	for (const p of values.pattern || []) {
		const raw = String(p);
		const idx = raw.indexOf(":");
		if (idx === -1) {
			die(`Invalid pattern format: ${raw} (expected 'category:regex')`, 2);
		}
		const category = raw.slice(0, idx);
		const re = raw.slice(idx + 1);
		try {
			genericPatterns.push([category, new RegExp(re)]);
		} catch (e) {
			die(`Invalid regex in pattern ${raw}: ${e?.message || e}`, 2);
		}
	}
	if (steps.includes("prefix-generic") && !genericPatterns.length) {
		die("prefix-generic step requires at least one --pattern", 2);
	}

	let rest;
	try {
		rest = new HARest();
	} catch (e) {
		die(e?.message || String(e), 2);
	}

	const timestamp = utcTimestamp();
	const logPath = values.log
		? String(values.log)
		: `ha_cleanup_${timestamp}.md`;

	const states = await rest.getJson("/api/states");
	if (!Array.isArray(states)) {
		die("Failed to load states from Home Assistant", 1);
	}

	const ws = await new HAWebSocket().connect();
	try {
		const ctx = await cleanupLoadContext(rest, ws, states, dryRun);
		for (const step of steps) {
			if (step === "rename-switch-suffix") {
				await cleanupStepRenameSwitchSuffix(ctx);
			} else if (step === "create-groups") {
				await cleanupStepCreateGroups(ctx, values["blueprint-pattern"] || "");
			} else if (step === "prefix-lights-cove") {
				await cleanupStepPrefixLightsCove(ctx);
			} else if (step === "prefix-generic") {
				await cleanupStepPrefixGeneric(ctx, genericPatterns);
			}
		}

		if (values.json) {
			console.log(
				JSON.stringify(
					{
						dry_run: true,
						steps,
						renames: ctx.renames.map((r) => ({
							entity_id: r.entityId,
							old: r.oldName,
							new: r.newName,
							category: r.category,
						})),
						group_changes: ctx.groupChanges.map((g) => ({
							automation: g.automationEntityId,
							group_id: g.groupEntityId,
							name: g.groupName,
							switches: g.switches,
							action: g.action,
						})),
						warnings: ctx.warnings,
					},
					null,
					2,
				),
			);
			return 0;
		}

		cleanupWriteLog(logPath, rest.baseUrl, timestamp, ctx, steps, dryRun);
		console.log(`Log: ${logPath}`);
		console.log(`Renames: ${ctx.renames.length}`);
		console.log(`Group changes: ${ctx.groupChanges.length}`);
		if (ctx.warnings.length) console.log(`Warnings: ${ctx.warnings.length}`);
		return 0;
	} finally {
		await ws.close();
	}
}

async function cleanupLoadContext(rest, ws, states, dryRun) {
	const ctx = {
		rest,
		ws,
		states,
		areaIdToName: {},
		normalizedAreaToId: {},
		deviceIdToAreaId: {},
		entityEntryById: {},
		renames: [],
		groupChanges: [],
		warnings: [],
		dryRun,
	};

	try {
		const areas = await ws.call("config/area_registry/list");
		if (Array.isArray(areas)) {
			for (const area of areas) {
				if (!area || typeof area !== "object") continue;
				const areaId = getStr(area, "area_id");
				const name = getStr(area, "name");
				if (areaId && name) {
					ctx.areaIdToName[areaId] = name;
					const normalized = normalizeAreaName(name);
					if (normalized) ctx.normalizedAreaToId[normalized] = areaId;
				}
			}
		}
	} catch (e) {
		ctx.warnings.push(`Could not load area registry: ${e?.message || e}`);
	}

	try {
		const devices = await ws.call("config/device_registry/list");
		if (Array.isArray(devices)) {
			for (const device of devices) {
				if (!device || typeof device !== "object") continue;
				const id = getStr(device, "id");
				if (!id) continue;
				ctx.deviceIdToAreaId[id] = device.area_id ?? null;
			}
		}
	} catch (e) {
		ctx.warnings.push(`Could not load device registry: ${e?.message || e}`);
	}

	try {
		const entities = await ws.call("config/entity_registry/list");
		if (Array.isArray(entities)) {
			for (const ent of entities) {
				if (!ent || typeof ent !== "object") continue;
				const eid = getStr(ent, "entity_id");
				if (eid) ctx.entityEntryById[eid] = ent;
			}
		}
	} catch (e) {
		ctx.warnings.push(`Could not load entity registry: ${e?.message || e}`);
	}

	ctx.resolveAreaName = (entityId) => {
		const entry = ctx.entityEntryById[entityId];
		if (!entry) return null;
		const areaId = resolveEntityArea(entry, ctx.deviceIdToAreaId);
		if (areaId && ctx.areaIdToName[areaId]) return ctx.areaIdToName[areaId];
		return null;
	};

	ctx.resolveAreaId = (entityId) => {
		const entry = ctx.entityEntryById[entityId];
		if (!entry) return null;
		return resolveEntityArea(entry, ctx.deviceIdToAreaId);
	};

	return ctx;
}

async function cleanupRenameEntity(ctx, entityId, oldName, newName, category) {
	if (ctx.dryRun) {
		ctx.renames.push({ entityId, oldName, newName, category });
		return true;
	}
	try {
		await ctx.ws.call("config/entity_registry/update", {
			entity_id: entityId,
			name: newName,
		});
		ctx.renames.push({ entityId, oldName, newName, category });
		return true;
	} catch (e) {
		ctx.warnings.push(`Failed to rename ${entityId}: ${e?.message || e}`);
		return false;
	}
}

async function cleanupStepRenameSwitchSuffix(ctx) {
	const re = /^Lights(?: .+)? Switch$/;
	const candidates = [];
	for (const st of ctx.states) {
		if (!st || typeof st !== "object") continue;
		const entityId = getStr(st, "entity_id");
		if (!entityId || !entityId.startsWith("switch.")) continue;
		const attrs = getDict(st, "attributes") || {};
		const friendly = getStr(attrs, "friendly_name");
		if (friendly && re.test(friendly)) candidates.push([entityId, friendly]);
	}
	if (!candidates.length) return;
	const progress = new ProgressReporter(
		candidates.length,
		"Renaming switch suffixes: ",
	);
	for (const [entityId, friendly] of candidates) {
		const newName = friendly.slice(0, -" Switch".length);
		const entry = ctx.entityEntryById[entityId];
		if (entry && entry.name === newName) {
			progress.update();
			continue;
		}
		await cleanupRenameEntity(
			ctx,
			entityId,
			friendly,
			newName,
			"switch-suffix",
		);
		progress.update();
	}
	progress.finish();
}

function parseSyncAlias(alias) {
	const raw = String(alias || "").trim();
	if (!raw.startsWith("Sync ")) return null;
	const name = raw.slice("Sync ".length).trim();
	const suffixToKind = {
		" Light Switches": "Lights",
		" Lights": "Lights",
		" Cove Switches": "Cove",
		" Cove": "Cove",
	};
	for (const [suffix, kind] of Object.entries(suffixToKind)) {
		if (!name.endsWith(suffix)) continue;
		const area = name.slice(0, -suffix.length).trim();
		if (area) return [area, kind];
	}
	return null;
}

function pickMainSwitch(switches) {
	if (!switches.length) return null;
	const suffixMatch = (parent, child) => {
		if (!child.startsWith(parent + "_")) return false;
		const suffix = child.slice((parent + "_").length);
		return /^\d+$/.test(suffix);
	};
	const candidates = switches.map((candidate) => {
		const matchCount = switches.filter(
			(other) => other !== candidate && suffixMatch(candidate, other),
		).length;
		return [matchCount, candidate.length, candidate];
	});
	candidates.sort(
		(a, b) => b[0] - a[0] || a[1] - b[1] || (a[2] < b[2] ? -1 : 1),
	);
	const [bestMatchCount, , best] = candidates[0];
	if (bestMatchCount > 0) return best;
	const nonNumber = switches.filter((s) => !/_\d+$/.test(s));
	if (nonNumber.length === 1) return nonNumber[0];
	return null;
}

function deriveGroupEntityId(
	switches,
	automationEntityId,
	targetAreaId,
	switchAreaId,
) {
	const main = pickMainSwitch(switches);
	if (main) return `${main}_group`;

	const stripped = switches.map((s) => s.replace(/_\d+$/, ""));
	if (
		stripped.length &&
		stripped.every((s) => s === stripped[0]) &&
		switches.some((s) => /_\d+$/.test(s))
	) {
		return `${stripped[0]}_group`;
	}

	if (targetAreaId) {
		const inArea = [...switches]
			.filter((s) => switchAreaId[s] === targetAreaId)
			.sort();
		if (inArea.length === 1) return `${inArea[0]}_group`;
	}

	let objectId = automationEntityId.split(".", 2)[1] || automationEntityId;
	if (objectId.startsWith("sync_")) objectId = objectId.slice("sync_".length);
	if (objectId.endsWith("_light_switches"))
		objectId = objectId.slice(0, -"_light_switches".length) + "_lights";
	else if (objectId.endsWith("_light_switch"))
		objectId = objectId.slice(0, -"_light_switch".length) + "_lights";
	else if (objectId.endsWith("_switches"))
		objectId = objectId.slice(0, -"_switches".length);
	return `switch.${objectId}_group`;
}

async function cleanupStepCreateGroups(ctx, blueprintPattern) {
	const bpRe = blueprintPattern
		? new RegExp(String(blueprintPattern))
		: /sync.*switch/i;

	const candidates = [];
	for (const st of ctx.states) {
		if (!st || typeof st !== "object") continue;
		const entityId = getStr(st, "entity_id");
		if (!entityId || !entityId.startsWith("automation.")) continue;
		const attrs = getDict(st, "attributes") || {};
		const alias = getStr(attrs, "friendly_name");
		const automationId = getStr(attrs, "id");
		if (!entityId || !alias || !automationId) continue;
		const parsed = parseSyncAlias(alias);
		if (!parsed) continue;

		let cfg;
		try {
			cfg = await ctx.rest.getJson(
				`/api/config/automation/config/${automationId}`,
			);
		} catch (e) {
			ctx.warnings.push(
				`Failed to load config for ${entityId}: ${e?.message || e}`,
			);
			continue;
		}
		if (!cfg || typeof cfg !== "object") continue;
		const useBlueprint = getDict(cfg, "use_blueprint");
		if (!useBlueprint) continue;
		const blueprintPath = getStr(useBlueprint, "path");
		if (!blueprintPath || !bpRe.test(blueprintPath)) continue;

		const inputCfg = getDict(useBlueprint, "input") || {};
		let switches = inputCfg.switch || inputCfg.switches;
		if (typeof switches === "string") switches = [switches];
		if (!Array.isArray(switches) || switches.length < 2) continue;
		switches = switches.filter(
			(s) => typeof s === "string" && s.startsWith("switch."),
		);
		if (switches.length < 2) continue;

		candidates.push([entityId, alias, parsed, switches]);
	}

	if (!candidates.length) return;

	const knownEntityIds = new Set(Object.keys(ctx.entityEntryById));
	const progress = new ProgressReporter(
		candidates.length,
		"Creating/updating groups: ",
	);

	for (const [automationEntityId, alias, parsed, switches] of candidates) {
		const [areaName, kind] = parsed;

		const switchAreaId = {};
		for (const sw of switches) switchAreaId[sw] = ctx.resolveAreaId(sw);

		const targetAreaId =
			ctx.normalizedAreaToId[normalizeAreaName(areaName)] || null;
		const displayAreaName = targetAreaId
			? ctx.areaIdToName[targetAreaId] || areaName
			: areaName;
		const groupName = `${displayAreaName} ${kind}`;
		const desiredGroupId = deriveGroupEntityId(
			switches,
			automationEntityId,
			targetAreaId,
			switchAreaId,
		);

		if (ctx.dryRun) {
			ctx.groupChanges.push({
				automationEntityId,
				automationAlias: alias,
				switches,
				groupEntityId: desiredGroupId,
				groupName,
				areaId: targetAreaId,
				action: "planned",
			});
			progress.update();
			continue;
		}

		let action = null;

		// Rename *_all -> *_group if it's a group helper.
		const candidateAll = desiredGroupId.replace(/_group$/, "") + "_all";
		if (
			!knownEntityIds.has(desiredGroupId) &&
			knownEntityIds.has(candidateAll)
		) {
			const existing = ctx.entityEntryById[candidateAll];
			if (
				existing &&
				typeof existing === "object" &&
				existing.platform === "group"
			) {
				try {
					const updated = await ctx.ws.call("config/entity_registry/update", {
						entity_id: candidateAll,
						new_entity_id: desiredGroupId,
					});
					knownEntityIds.delete(candidateAll);
					knownEntityIds.add(desiredGroupId);
					delete ctx.entityEntryById[candidateAll];
					let nextEntry =
						updated && typeof updated === "object" ? updated : null;
					if (!nextEntry) {
						try {
							nextEntry = await ctx.ws.call("config/entity_registry/get", {
								entity_id: desiredGroupId,
							});
						} catch (e) {
							ctx.warnings.push(
								`Renamed ${candidateAll} -> ${desiredGroupId} but failed to fetch new entity registry entry: ${e?.message || e}`,
							);
						}
					}
					if (nextEntry && typeof nextEntry === "object") {
						ctx.entityEntryById[desiredGroupId] = nextEntry;
					}
					action = "renamed";
				} catch (e) {
					ctx.warnings.push(
						`Failed to rename ${candidateAll}: ${e?.message || e}`,
					);
				}
			}
		}

		if (knownEntityIds.has(desiredGroupId)) {
			// Update existing group helper.
			try {
				const groupEntry = ctx.entityEntryById[desiredGroupId];
				if (
					!groupEntry ||
					typeof groupEntry !== "object" ||
					groupEntry.platform !== "group"
				) {
					ctx.warnings.push(
						`${desiredGroupId} exists but is not a group helper`,
					);
					progress.update();
					continue;
				}
				const configEntryId = getStr(groupEntry, "config_entry_id");
				if (!configEntryId) {
					ctx.warnings.push(`${desiredGroupId} missing config_entry_id`);
					progress.update();
					continue;
				}

				const optionsFlow = await ctx.rest.postJson(
					"/api/config/config_entries/options/flow",
					{
						handler: configEntryId,
					},
				);
				const flowId = getStr(optionsFlow, "flow_id");
				if (flowId) {
					await ctx.rest.postJson(
						`/api/config/config_entries/options/flow/${flowId}`,
						{
							entities: switches,
							hide_members: true,
							all: false,
						},
					);
				}

				const payload = { entity_id: desiredGroupId, name: groupName };
				if (targetAreaId) payload.area_id = targetAreaId;
				const updated = await ctx.ws.call(
					"config/entity_registry/update",
					payload,
				);
				if (updated && typeof updated === "object")
					ctx.entityEntryById[desiredGroupId] = updated;
				action = action || "updated";
			} catch (e) {
				ctx.warnings.push(
					`Failed to update group ${desiredGroupId}: ${e?.message || e}`,
				);
				progress.update();
				continue;
			}
		} else {
			// Create new group helper.
			try {
				const flowStart = await ctx.rest.postJson(
					"/api/config/config_entries/flow",
					{ handler: "group" },
				);
				const flowId = getStr(flowStart, "flow_id");
				if (!flowId)
					throw new Error(
						`Unexpected flow start: ${JSON.stringify(flowStart)}`,
					);

				await ctx.rest.postJson(`/api/config/config_entries/flow/${flowId}`, {
					next_step_id: "switch",
				});

				const objectId = desiredGroupId.split(".", 2)[1] || desiredGroupId;
				await ctx.rest.postJson(`/api/config/config_entries/flow/${flowId}`, {
					name: objectId,
					entities: switches,
					hide_members: true,
					all: false,
				});

				const payload = { entity_id: desiredGroupId, name: groupName };
				if (targetAreaId) payload.area_id = targetAreaId;
				const updated = await ctx.ws.call(
					"config/entity_registry/update",
					payload,
				);
				if (updated && typeof updated === "object")
					ctx.entityEntryById[desiredGroupId] = updated;
				knownEntityIds.add(desiredGroupId);
				action = "created";
			} catch (e) {
				ctx.warnings.push(
					`Failed to create group ${desiredGroupId}: ${e?.message || e}`,
				);
				progress.update();
				continue;
			}
		}

		ctx.groupChanges.push({
			automationEntityId,
			automationAlias: alias,
			switches,
			groupEntityId: desiredGroupId,
			groupName,
			areaId: targetAreaId,
			action: action || "updated",
		});
		progress.update();
	}

	progress.finish();
}

async function cleanupStepPrefixLightsCove(ctx) {
	const re = /^(Lights|Cove)\b/;
	const candidates = [];
	for (const st of ctx.states) {
		if (!st || typeof st !== "object") continue;
		const entityId = getStr(st, "entity_id");
		if (!entityId) continue;
		if (!(entityId.startsWith("switch.") || entityId.startsWith("light.")))
			continue;
		const attrs = getDict(st, "attributes") || {};
		const friendly = getStr(attrs, "friendly_name");
		if (friendly && re.test(friendly)) candidates.push([entityId, friendly]);
	}
	if (!candidates.length) return;
	const progress = new ProgressReporter(
		candidates.length,
		"Prefixing Lights/Cove names: ",
	);
	for (const [entityId, friendly] of candidates) {
		const areaName = ctx.resolveAreaName(entityId);
		if (!areaName) {
			ctx.warnings.push(`${entityId}: cannot resolve area for prefix`);
			progress.update();
			continue;
		}
		if (friendly.startsWith(areaName + " ")) {
			progress.update();
			continue;
		}
		const newName = `${areaName} ${friendly}`;
		await cleanupRenameEntity(
			ctx,
			entityId,
			friendly,
			newName,
			"lights-cove-prefix",
		);
		progress.update();
	}
	progress.finish();
}

async function cleanupStepPrefixGeneric(ctx, patterns) {
	const candidates = [];
	for (const st of ctx.states) {
		if (!st || typeof st !== "object") continue;
		const entityId = getStr(st, "entity_id");
		if (!entityId) continue;
		const attrs = getDict(st, "attributes") || {};
		const friendly = getStr(attrs, "friendly_name");
		if (!friendly) continue;
		for (const [category, re] of patterns) {
			const m = re.exec(friendly);
			if (m && m.index === 0) {
				candidates.push([entityId, friendly, category]);
				break;
			}
		}
	}
	if (!candidates.length) return;
	const progress = new ProgressReporter(
		candidates.length,
		"Prefixing generic patterns: ",
	);
	for (const [entityId, friendly, category] of candidates) {
		const areaName = ctx.resolveAreaName(entityId);
		if (!areaName) {
			ctx.warnings.push(
				`${entityId}: cannot resolve area for ${category} prefix`,
			);
			progress.update();
			continue;
		}
		if (friendly.startsWith(areaName + " ")) {
			progress.update();
			continue;
		}
		const newName = `${areaName} ${friendly}`;
		await cleanupRenameEntity(ctx, entityId, friendly, newName, category);
		progress.update();
	}
	progress.finish();
}

function cleanupWriteLog(logPath, baseUrl, timestamp, ctx, steps, dryRun) {
	const lines = [
		`# Home Assistant cleanup run (${timestamp})`,
		"",
		`- Instance: \`${baseUrl}\``,
		`- Steps: ${steps.join(", ")}`,
		`- Mode: ${dryRun ? "dry-run" : "applied"}`,
		"",
	];

	const byCategory = new Map();
	for (const r of ctx.renames) {
		const list = byCategory.get(r.category) || [];
		list.push(r);
		byCategory.set(r.category, list);
	}

	lines.push("## Entity Renames");
	if (byCategory.size) {
		const cats = [...byCategory.keys()].sort();
		for (const cat of cats) {
			lines.push("", `### ${cat}`);
			const rs = [...byCategory.get(cat)].sort((a, b) =>
				a.entityId < b.entityId ? -1 : 1,
			);
			for (const r of rs)
				lines.push(
					`- \`${r.entityId}\`: ${JSON.stringify(r.oldName)} → ${JSON.stringify(r.newName)}`,
				);
		}
	} else {
		lines.push("- (no changes)");
	}
	lines.push("");

	lines.push("## Group Changes");
	if (ctx.groupChanges.length) {
		for (const g of ctx.groupChanges) {
			lines.push(
				`- \`${g.automationEntityId}\` (${JSON.stringify(g.automationAlias)}): ` +
					`${g.action} \`${g.groupEntityId}\` name=${JSON.stringify(g.groupName)} members=${JSON.stringify(g.switches)}`,
			);
		}
	} else {
		lines.push("- (no changes)");
	}
	lines.push("");

	lines.push("## Warnings");
	if (ctx.warnings.length) {
		for (const w of ctx.warnings) lines.push(`- ${w}`);
	} else {
		lines.push("- (none)");
	}
	lines.push("");

	fs.writeFileSync(logPath, lines.join("\n") + "\n", "utf-8");
}

// -------------------------
// snapshot
// -------------------------

function printSnapshotHelp() {
	console.log("Usage: node scripts/ha_ops.js snapshot [options]");
	console.log("");
	console.log("Options:");
	console.log(
		"  --out <path>         Output JSON path (default: ha_snapshot_<timestamp>.json)",
	);
	console.log("  --indent <n>         JSON indentation (default: 2)");
	console.log("  --include-states     Include /api/states (noisy for diffs)");
	console.log("  --no-automations     Skip automation config snapshots");
	console.log("  --no-scripts         Skip script config snapshots");
	console.log("  --no-scenes          Skip scene config snapshots");
	console.log(
		"  --no-lovelace        Skip Lovelace dashboard config snapshots",
	);
	console.log("  -h, --help           Show this help");
}

async function cmdSnapshot(argv) {
	const { values } = parseArgs({
		args: argv,
		allowPositionals: false,
		options: {
			help: { type: "boolean", short: "h" },
			out: { type: "string", default: "" },
			indent: { type: "string", default: "2" },
			"include-states": { type: "boolean", default: false },
			"no-automations": { type: "boolean", default: false },
			"no-scripts": { type: "boolean", default: false },
			"no-scenes": { type: "boolean", default: false },
			"no-lovelace": { type: "boolean", default: false },
		},
	});

	if (values.help) {
		printSnapshotHelp();
		return 0;
	}

	let rest;
	try {
		rest = new HARest();
	} catch (e) {
		die(e?.message || String(e), 2);
	}

	const timestamp = utcTimestamp();
	const outPath = values.out
		? String(values.out)
		: `ha_snapshot_${timestamp}.json`;
	const indent = Number(values.indent);
	if (!Number.isFinite(indent) || indent < 0)
		die(`Invalid --indent: ${values.indent}`, 2);

	const snapshot = {
		meta: {
			generated_at: timestamp,
			url: rest.baseUrl,
		},
		registries: {},
		configs: {},
		warnings: [],
	};

	try {
		const cfg = await rest.getJson("/api/config");
		if (cfg && typeof cfg === "object") {
			snapshot.meta.ha_version = cfg.version;
			snapshot.meta.location_name = cfg.location_name;
			snapshot.meta.time_zone = cfg.time_zone;
		}
	} catch (e) {
		snapshot.warnings.push(`Failed to load /api/config: ${e?.message || e}`);
	}

	let states = [];
	try {
		const data = await rest.getJson("/api/states");
		if (Array.isArray(data)) {
			states = data.filter((s) => s && typeof s === "object");
			if (values["include-states"]) snapshot.states = states;
		}
	} catch (e) {
		snapshot.warnings.push(`Failed to load /api/states: ${e?.message || e}`);
	}

	const ws = await new HAWebSocket().connect();
	try {
		try {
			const areas = await ws.call("config/area_registry/list");
			snapshot.registries.areas = sortListByKey(areas, ["area_id", "name"]);
		} catch (e) {
			snapshot.warnings.push(
				`Failed to load area registry: ${e?.message || e}`,
			);
		}

		try {
			const devices = await ws.call("config/device_registry/list");
			snapshot.registries.devices = sortListByKey(devices, ["id"]);
		} catch (e) {
			snapshot.warnings.push(
				`Failed to load device registry: ${e?.message || e}`,
			);
		}

		try {
			const entities = await ws.call("config/entity_registry/list");
			snapshot.registries.entities = sortListByKey(entities, ["entity_id"]);
		} catch (e) {
			snapshot.warnings.push(
				`Failed to load entity registry: ${e?.message || e}`,
			);
		}
	} finally {
		await ws.close();
	}

	// Automations
	if (!values["no-automations"]) {
		const automations = {};
		for (const st of states) {
			const entityId = getStr(st, "entity_id");
			if (!entityId || !entityId.startsWith("automation.")) continue;
			const attrs =
				st.attributes && typeof st.attributes === "object" ? st.attributes : {};
			const automationId = getStr(attrs, "id");
			if (!automationId) continue;
			const cfg = await rest
				.getJson(`/api/config/automation/config/${automationId}`, {
					expectedStatuses: [200, 404],
				})
				.catch(() => null);
			if (cfg && typeof cfg === "object")
				automations[entityId] = { id: automationId, config: cfg };
		}
		snapshot.configs.automations = Object.fromEntries(
			Object.entries(automations).sort(([a], [b]) => (a < b ? -1 : 1)),
		);
	}

	// Scripts
	if (!values["no-scripts"]) {
		const scripts = {};
		for (const st of states) {
			const entityId = getStr(st, "entity_id");
			if (!entityId || !entityId.startsWith("script.")) continue;
			const attrs =
				st.attributes && typeof st.attributes === "object" ? st.attributes : {};
			const scriptId = getStr(attrs, "id");
			if (!scriptId) continue;
			const cfg = await rest
				.getJson(`/api/config/script/config/${scriptId}`, {
					expectedStatuses: [200, 404],
				})
				.catch(() => null);
			if (cfg && typeof cfg === "object")
				scripts[entityId] = { id: scriptId, config: cfg };
		}
		snapshot.configs.scripts = Object.fromEntries(
			Object.entries(scripts).sort(([a], [b]) => (a < b ? -1 : 1)),
		);
	}

	// Scenes
	if (!values["no-scenes"]) {
		const scenes = {};
		for (const st of states) {
			const entityId = getStr(st, "entity_id");
			if (!entityId || !entityId.startsWith("scene.")) continue;
			const attrs =
				st.attributes && typeof st.attributes === "object" ? st.attributes : {};
			const sceneId = getStr(attrs, "id");
			if (!sceneId) continue;
			const cfg = await rest
				.getJson(`/api/config/scene/config/${sceneId}`, {
					expectedStatuses: [200, 404],
				})
				.catch(() => null);
			if (cfg && typeof cfg === "object")
				scenes[entityId] = { id: sceneId, config: cfg };
		}
		snapshot.configs.scenes = Object.fromEntries(
			Object.entries(scenes).sort(([a], [b]) => (a < b ? -1 : 1)),
		);
	}

	// Lovelace
	if (!values["no-lovelace"]) {
		const lovelace = {};
		const dashboards = await rest
			.getJson("/api/lovelace/dashboards", { expectedStatuses: [200, 404] })
			.catch(() => null);
		if (Array.isArray(dashboards)) {
			for (const d of dashboards) {
				if (!d || typeof d !== "object") continue;
				const dashId = getStr(d, "id");
				if (!dashId) continue;
				const cfg = await rest
					.getJson(`/api/lovelace/config/${dashId}`, {
						expectedStatuses: [200, 404],
					})
					.catch(() => null);
				if (cfg && typeof cfg === "object")
					lovelace[dashId] = { dashboard: d, config: cfg };
			}
		} else {
			const cfg = await rest
				.getJson("/api/lovelace/config", { expectedStatuses: [200, 404] })
				.catch(() => null);
			if (cfg && typeof cfg === "object") {
				lovelace.default = { config: cfg };
			} else {
				snapshot.warnings.push(
					"Lovelace API not available or not storage-based dashboards.",
				);
			}
		}
		snapshot.configs.lovelace = Object.fromEntries(
			Object.entries(lovelace).sort(([a], [b]) => (a < b ? -1 : 1)),
		);
	}

	fs.writeFileSync(outPath, stableStringify(snapshot, indent) + "\n", "utf-8");

	const counts = {
		areas: (snapshot.registries.areas || []).length,
		devices: (snapshot.registries.devices || []).length,
		entities: (snapshot.registries.entities || []).length,
		automations: Object.keys(snapshot.configs.automations || {}).length,
		scripts: Object.keys(snapshot.configs.scripts || {}).length,
		scenes: Object.keys(snapshot.configs.scenes || {}).length,
		lovelace: Object.keys(snapshot.configs.lovelace || {}).length,
	};

	console.log(outPath);
	console.log("counts:", JSON.stringify(counts, null, 0));
	if (snapshot.warnings.length)
		console.log(`warnings: ${snapshot.warnings.length}`);
	return 0;
}

// -------------------------
// rollback
// -------------------------

function printRollbackHelp() {
	console.log(
		"Usage: node scripts/ha_ops.js rollback <snapshot.json> [options]",
	);
	console.log("");
	console.log("Options:");
	console.log("  --dry-run       Show what would be changed without applying");
	console.log("  --yes, -y       Apply changes without confirmation");
	console.log(
		"  --log <path>    Log file path (default: ha_rollback_<timestamp>.md)",
	);
	console.log("  -h, --help      Show this help");
}

function desiredEntityFields(entry) {
	return {
		name: entry.name,
		area_id: entry.area_id,
		disabled_by: entry.disabled_by,
		hidden_by: entry.hidden_by,
		icon: entry.icon,
	};
}

function formatValue(value) {
	if (value === null || value === undefined) return "(none)";
	return JSON.stringify(value);
}

async function cmdRollback(argv) {
	const { values, positionals } = parseArgs({
		args: argv,
		allowPositionals: true,
		options: {
			help: { type: "boolean", short: "h" },
			"dry-run": { type: "boolean", default: false },
			yes: { type: "boolean", short: "y", default: false },
			log: { type: "string", default: "" },
		},
	});

	if (values.help) {
		printRollbackHelp();
		return 0;
	}

	if (!positionals.length) die("Missing snapshot path", 2);
	const snapshotPath = String(positionals[0]);
	if (!fs.existsSync(snapshotPath))
		die(`Snapshot file not found: ${snapshotPath}`, 2);

	let snapshot;
	try {
		snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
	} catch (e) {
		die(`Failed to load snapshot: ${e?.message || e}`, 2);
	}

	const snapshotEntities = snapshot?.registries?.entities;
	if (!Array.isArray(snapshotEntities) || !snapshotEntities.length)
		die("No entities found in snapshot", 2);

	let rest;
	try {
		rest = new HARest();
	} catch (e) {
		die(e?.message || String(e), 2);
	}

	const warnings = [];
	const rollbacks = [];

	const ws = await new HAWebSocket().connect();
	try {
		const current = await ws.call("config/entity_registry/list");
		if (!Array.isArray(current)) die("Unexpected entity registry response", 2);

		const currentByUniqueId = new Map();
		const currentByEntityId = new Map();
		for (const e of current) {
			if (!e || typeof e !== "object") continue;
			if (typeof e.unique_id === "string" && e.unique_id.trim())
				currentByUniqueId.set(e.unique_id, e);
			if (typeof e.entity_id === "string" && e.entity_id.trim())
				currentByEntityId.set(e.entity_id, e);
		}

		const entityKey = (entry) => {
			const uid = entry.unique_id;
			if (typeof uid === "string" && uid.trim()) return ["unique_id", uid];
			const eid = entry.entity_id;
			if (typeof eid === "string" && eid.trim()) return ["entity_id", eid];
			return null;
		};

		for (const snap of snapshotEntities) {
			if (!snap || typeof snap !== "object") continue;
			const key = entityKey(snap);
			if (!key) continue;
			const [kind, value] = key;
			const cur =
				kind === "unique_id"
					? currentByUniqueId.get(value)
					: currentByEntityId.get(value);
			if (!cur) {
				if (kind === "unique_id") {
					warnings.push(
						`Snapshot entity with unique_id=${JSON.stringify(value)} not found in current registry`,
					);
				} else {
					warnings.push(
						`Snapshot entity with entity_id=${JSON.stringify(value)} not found in current registry`,
					);
				}
				continue;
			}
			const currentEntityId = getStr(cur, "entity_id");
			const targetEntityId = getStr(snap, "entity_id");
			if (!currentEntityId || !targetEntityId) continue;

			const desired = desiredEntityFields(snap);
			const changed = {};
			for (const [k, v] of Object.entries(desired)) {
				if (cur[k] !== v) changed[k] = v;
			}

			if (currentEntityId !== targetEntityId || Object.keys(changed).length) {
				rollbacks.push({
					uniqueId: getStr(snap, "unique_id"),
					currentEntityId,
					targetEntityId,
					fields: changed,
				});
			}
		}
	} finally {
		await ws.close();
	}

	if (!rollbacks.length) {
		console.log("No changes needed - current registry matches snapshot");
		return 0;
	}

	console.log(`Found ${rollbacks.length} entity registry rollback(s):\n`);
	for (const rb of [...rollbacks].sort((a, b) =>
		a.targetEntityId < b.targetEntityId ? -1 : 1,
	)) {
		let header = `- ${rb.currentEntityId}`;
		if (rb.currentEntityId !== rb.targetEntityId)
			header += ` -> ${rb.targetEntityId}`;
		if (rb.uniqueId) header += ` (unique_id=${JSON.stringify(rb.uniqueId)})`;
		console.log(header);
		for (const [k, v] of Object.entries(rb.fields).sort(([a], [b]) =>
			a < b ? -1 : 1,
		)) {
			console.log(`    - ${k}: ${formatValue(v)}`);
		}
	}

	if (values["dry-run"]) {
		console.log("\n[dry-run] No changes applied");
		return 0;
	}

	if (!values.yes) {
		const rl = readlinePromises.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		try {
			const answer = String(await rl.question("Apply these rollbacks? [y/N] "))
				.trim()
				.toLowerCase();
			if (answer !== "y" && answer !== "yes") {
				console.log("Aborted");
				return 0;
			}
		} finally {
			rl.close();
		}
	}

	const rbKey = (rb) =>
		`${rb.uniqueId || ""}||${rb.currentEntityId}||${rb.targetEntityId}`;
	const renamedOk = new Set();
	const appliedRenames = [];
	const appliedUpdates = [];
	const applyWarnings = [];

	const ws2 = await new HAWebSocket().connect();
	try {
		const renames = rollbacks.filter(
			(r) => r.currentEntityId !== r.targetEntityId,
		);
		const updates = rollbacks.filter((r) => Object.keys(r.fields).length);

		if (renames.length) {
			const progress = new ProgressReporter(
				renames.length,
				"Restoring entity_ids: ",
			);
			for (const rb of renames) {
				try {
					await ws2.call("config/entity_registry/update", {
						entity_id: rb.currentEntityId,
						new_entity_id: rb.targetEntityId,
					});
					renamedOk.add(rbKey(rb));
					appliedRenames.push(rb);
				} catch (e) {
					applyWarnings.push(
						`Failed to rename ${rb.currentEntityId} -> ${rb.targetEntityId}: ${e?.message || e}`,
					);
				}
				progress.update();
			}
			progress.finish();
		}

		if (updates.length) {
			const progress = new ProgressReporter(
				updates.length,
				"Restoring registry fields: ",
			);
			for (const rb of updates) {
				const entityIdForUpdate = renamedOk.has(rbKey(rb))
					? rb.targetEntityId
					: rb.currentEntityId;
				try {
					await ws2.call("config/entity_registry/update", {
						entity_id: entityIdForUpdate,
						...rb.fields,
					});
					appliedUpdates.push({ ...rb, entityIdForUpdate });
				} catch (e) {
					applyWarnings.push(
						`Failed to update ${entityIdForUpdate}: ${e?.message || e}`,
					);
				}
				progress.update();
			}
			progress.finish();
		}
	} finally {
		await ws2.close();
	}

	const timestamp = utcTimestamp();
	const logPath = values.log
		? String(values.log)
		: `ha_rollback_${timestamp}.md`;
	const lines = [
		`# Home Assistant rollback (${timestamp})`,
		"",
		`- Instance: \`${rest.baseUrl}\``,
		`- Snapshot: \`${snapshotPath}\``,
		"",
		"## Applied entity_id renames",
	];
	if (appliedRenames.length) {
		for (const rb of appliedRenames)
			lines.push(`- \`${rb.currentEntityId}\` -> \`${rb.targetEntityId}\``);
	} else {
		lines.push("- (none)");
	}
	lines.push("");
	lines.push("## Applied registry field updates");
	if (appliedUpdates.length) {
		for (const rb of appliedUpdates) {
			lines.push(`- \`${rb.entityIdForUpdate}\``);
			for (const [k, v] of Object.entries(rb.fields).sort(([a], [b]) =>
				a < b ? -1 : 1,
			)) {
				lines.push(`  - ${k}: ${formatValue(v)}`);
			}
		}
	} else {
		lines.push("- (none)");
	}
	lines.push("");

	lines.push("## Warnings");
	const allWarnings = [...warnings, ...applyWarnings];
	if (allWarnings.length) {
		for (const w of allWarnings) lines.push(`- ${w}`);
	} else {
		lines.push("- (none)");
	}
	lines.push("");

	fs.writeFileSync(logPath, lines.join("\n") + "\n", "utf-8");
	console.log(`\nLog: ${logPath}`);
	if (allWarnings.length) console.log(`Warnings: ${allWarnings.length}`);
	return 0;
}

// -------------------------
// find-references
// -------------------------

function printFindReferencesHelp() {
	console.log("Usage: node scripts/ha_ops.js find-references [options]");
	console.log("");
	console.log("Options:");
	console.log("  --needle <str>        String to search for (repeatable)");
	console.log(
		"  --needles-file <path> File with one needle per line (# comments allowed)",
	);
	console.log(
		"  --map-json <path>     JSON mapping old->new (searches old keys)",
	);
	console.log(
		"  --backup-root <path>  Path to a Home Assistant backup root (optional)",
	);
	console.log(
		"  --max-bytes <n>       Max file size to scan in backups (default: 5000000)",
	);
	console.log(
		"  --out <path>          Output markdown path (default: ha_refs_<timestamp>.md)",
	);
	console.log("  --json-out <path>     Optional JSON output path");
	console.log("  --no-live             Skip live (API) scanning");
	console.log("  --no-backup           Skip backup scanning");
	console.log("  -h, --help            Show this help");
}

function* iterStrings(value, p = "") {
	if (value && typeof value === "object") {
		if (Array.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				yield* iterStrings(value[i], `${p}[${i}]`);
			}
			return;
		}
		for (const [k, v] of Object.entries(value)) {
			const childPath = p ? `${p}.${k}` : String(k);
			yield* iterStrings(v, childPath);
		}
		return;
	}
	if (typeof value === "string") yield [p, value];
}

function compileUnionRegex(needles) {
	const escaped = needles
		.filter(Boolean)
		.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
	if (!escaped.length) throw new Error("No needles provided");
	escaped.sort((a, b) => b.length - a.length);
	return new RegExp(escaped.join("|"));
}

function loadNeedles(values) {
	const needles = [];
	for (const n of values.needle || []) {
		const s = String(n).trim();
		if (s) needles.push(s);
	}
	if (values["needles-file"]) {
		const content = fs.readFileSync(String(values["needles-file"]), "utf-8");
		for (const line of content.split(/\r?\n/)) {
			const s = line.trim();
			if (!s || s.startsWith("#")) continue;
			needles.push(s);
		}
	}
	if (values["map-json"]) {
		const mapping = JSON.parse(
			fs.readFileSync(String(values["map-json"]), "utf-8"),
		);
		if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) {
			throw new Error("--map-json must be a JSON object mapping old->new");
		}
		for (const k of Object.keys(mapping)) {
			if (typeof k === "string" && k.trim()) needles.push(k.trim());
		}
	}
	const seen = new Set();
	const unique = [];
	for (const n of needles) {
		if (seen.has(n)) continue;
		seen.add(n);
		unique.push(n);
	}
	return unique;
}

async function findLiveHits(rest, needleRe) {
	const hits = [];
	const warnings = [];
	const states = await rest.getJson("/api/states");
	if (!Array.isArray(states))
		throw new Error("Unexpected /api/states response");

	const scanConfig = (kind, owner, ownerId, config) => {
		if (!config || (typeof config !== "object" && !Array.isArray(config)))
			return;
		for (const [p, s] of iterStrings(config)) {
			const match = needleRe.exec(s);
			if (match)
				hits.push({
					kind,
					owner,
					owner_id: ownerId,
					path: p,
					needle: match[0],
				});
		}
	};

	for (const st of states) {
		const entityId = getStr(st, "entity_id");
		if (!entityId || !entityId.startsWith("automation.")) continue;
		const attrs =
			st.attributes && typeof st.attributes === "object" ? st.attributes : {};
		const automationId = getStr(attrs, "id");
		if (!automationId) continue;
		const cfg = await rest
			.getJson(`/api/config/automation/config/${automationId}`, {
				expectedStatuses: [200, 404],
			})
			.catch(() => null);
		if (cfg && typeof cfg === "object" && Object.keys(cfg).length)
			scanConfig("automation", entityId, automationId, cfg);
	}

	for (const st of states) {
		const entityId = getStr(st, "entity_id");
		if (!entityId || !entityId.startsWith("script.")) continue;
		const attrs =
			st.attributes && typeof st.attributes === "object" ? st.attributes : {};
		const scriptId = getStr(attrs, "id");
		if (!scriptId) continue;
		const cfg = await rest
			.getJson(`/api/config/script/config/${scriptId}`, {
				expectedStatuses: [200, 404],
			})
			.catch(() => null);
		if (cfg && typeof cfg === "object")
			scanConfig("script", entityId, scriptId, cfg);
	}

	for (const st of states) {
		const entityId = getStr(st, "entity_id");
		if (!entityId || !entityId.startsWith("scene.")) continue;
		const attrs =
			st.attributes && typeof st.attributes === "object" ? st.attributes : {};
		const sceneId = getStr(attrs, "id");
		if (!sceneId) continue;
		const cfg = await rest
			.getJson(`/api/config/scene/config/${sceneId}`, {
				expectedStatuses: [200, 404],
			})
			.catch(() => null);
		if (cfg && typeof cfg === "object")
			scanConfig("scene", entityId, sceneId, cfg);
	}

	const dashboards = await rest
		.getJson("/api/lovelace/dashboards", { expectedStatuses: [200, 404] })
		.catch(() => null);
	if (Array.isArray(dashboards)) {
		for (const d of dashboards) {
			const dashId = getStr(d, "id");
			if (!dashId) continue;
			const cfg = await rest
				.getJson(`/api/lovelace/config/${dashId}`, {
					expectedStatuses: [200, 404],
				})
				.catch(() => null);
			if (cfg && typeof cfg === "object")
				scanConfig("lovelace", dashId, null, cfg);
		}
	} else {
		const cfg = await rest
			.getJson("/api/lovelace/config", { expectedStatuses: [200, 404] })
			.catch(() => null);
		if (cfg && typeof cfg === "object")
			scanConfig("lovelace", "default", null, cfg);
		else
			warnings.push(
				"Lovelace API not available or not storage-based dashboards.",
			);
	}

	return [hits, warnings];
}

function listFilesRecursive(base) {
	const out = [];
	const stack = [base];
	while (stack.length) {
		const cur = stack.pop();
		let entries;
		try {
			entries = fs.readdirSync(cur, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const ent of entries) {
			const full = path.join(cur, ent.name);
			if (ent.isDirectory()) {
				stack.push(full);
			} else if (ent.isFile()) {
				out.push(full);
			}
		}
	}
	return out;
}

function defaultBackupFiles(base) {
	const candidates = [];
	for (const p of listFilesRecursive(base)) {
		const name = path.basename(p);
		if (name === "secrets.yaml") continue;
		if (path.basename(path.dirname(p)) === ".storage") {
			candidates.push(p);
			continue;
		}
		const ext = path.extname(p).toLowerCase();
		if (ext === ".yaml" || ext === ".yml" || ext === ".json") {
			candidates.push(p);
		}
	}
	return candidates;
}

function findBackupHits(backupRoot, needleRe, maxBytes) {
	const warnings = [];
	const hits = [];

	let base = backupRoot;
	const candidateBase = path.join(backupRoot, "homeassistant", "data");
	if (fs.existsSync(candidateBase)) base = candidateBase;

	const files = defaultBackupFiles(base);
	for (const p of files) {
		let size;
		try {
			size = fs.statSync(p).size;
		} catch (e) {
			warnings.push(`${p}: failed to stat: ${e?.message || e}`);
			continue;
		}
		if (size > maxBytes) continue;
		let text;
		try {
			text = fs.readFileSync(p, "utf-8");
		} catch (e) {
			warnings.push(`${p}: failed to read: ${e?.message || e}`);
			continue;
		}
		const lines = text.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const m = needleRe.exec(lines[i]);
			if (m) hits.push({ path: p, line: i + 1, needle: m[0] });
		}
	}

	return [hits, warnings];
}

function writeRefsReport(
	outPath,
	needles,
	liveHits,
	liveWarnings,
	backupHits,
	backupWarnings,
) {
	const lines = [
		"# Home Assistant reference report",
		"",
		`- Generated: \`${utcTimestamp()}\``,
		`- Needles: ${needles.map((n) => `\`${n}\``).join(", ")}`,
		"",
		"## Live (API) hits",
	];
	if (liveHits.length) {
		const sorted = [...liveHits].sort((a, b) => {
			const keyA = `${a.kind}||${a.owner}||${a.path}||${a.needle}`;
			const keyB = `${b.kind}||${b.owner}||${b.path}||${b.needle}`;
			return keyA < keyB ? -1 : 1;
		});
		for (const hit of sorted) {
			const ownerSuffix = hit.owner_id ? ` (id \`${hit.owner_id}\`)` : "";
			lines.push(
				`- ${hit.kind}: \`${hit.owner}\`${ownerSuffix} — matched \`${hit.needle}\` at \`${hit.path}\``,
			);
		}
	} else {
		lines.push("- (none)");
	}
	lines.push("");

	lines.push("## Backup hits");
	if (backupHits.length) {
		const sorted = [...backupHits].sort((a, b) => {
			const keyA = `${a.path}||${a.line}||${a.needle}`;
			const keyB = `${b.path}||${b.line}||${b.needle}`;
			return keyA < keyB ? -1 : 1;
		});
		for (const hit of sorted)
			lines.push(`- \`${hit.path}\`:${hit.line}: matched \`${hit.needle}\``);
	} else {
		lines.push("- (none)");
	}
	lines.push("");

	lines.push("## Warnings");
	const all = [...liveWarnings, ...backupWarnings];
	if (all.length) {
		for (const w of all) lines.push(`- ${w}`);
	} else {
		lines.push("- (none)");
	}
	lines.push("");

	fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
}

function writeRefsJsonReport(
	outPath,
	url,
	backupRoot,
	needles,
	liveHits,
	liveWarnings,
	backupHits,
	backupWarnings,
) {
	const payload = {
		meta: {
			generated_at: utcTimestamp(),
			url,
			backup_root: backupRoot,
			needles,
		},
		live: { hits: liveHits, warnings: liveWarnings },
		backup: { hits: backupHits, warnings: backupWarnings },
	};
	fs.writeFileSync(outPath, stableStringify(payload, 2) + "\n", "utf-8");
}

async function cmdFindReferences(argv) {
	const { values } = parseArgs({
		args: argv,
		allowPositionals: false,
		options: {
			help: { type: "boolean", short: "h" },
			needle: { type: "string", multiple: true, default: [] },
			"needles-file": { type: "string", default: "" },
			"map-json": { type: "string", default: "" },
			"backup-root": { type: "string", default: "" },
			"max-bytes": { type: "string", default: "5000000" },
			out: { type: "string", default: "" },
			"json-out": { type: "string", default: "" },
			"no-live": { type: "boolean", default: false },
			"no-backup": { type: "boolean", default: false },
		},
	});

	if (values.help) {
		printFindReferencesHelp();
		return 0;
	}

	let needles;
	try {
		needles = loadNeedles(values);
	} catch (e) {
		die(e?.message || String(e), 2);
	}
	if (!needles.length)
		die("No needles. Use --needle, --needles-file, or --map-json.", 2);

	let needleRe;
	try {
		needleRe = compileUnionRegex(needles);
	} catch (e) {
		die(e?.message || String(e), 2);
	}

	const liveHits = [];
	const liveWarnings = [];
	let url = "";
	if (!values["no-live"]) {
		try {
			const rest = new HARest();
			url = rest.baseUrl;
			const [hits, warnings] = await findLiveHits(rest, needleRe);
			liveHits.push(...hits);
			liveWarnings.push(...warnings);
		} catch (e) {
			liveWarnings.push(`Live scan failed: ${e?.message || e}`);
		}
	}

	const backupHits = [];
	const backupWarnings = [];
	if (!values["no-backup"] && values["backup-root"]) {
		const maxBytes = Number(values["max-bytes"]);
		if (!Number.isFinite(maxBytes) || maxBytes < 0)
			die(`Invalid --max-bytes: ${values["max-bytes"]}`, 2);
		try {
			const [hits, warnings] = findBackupHits(
				String(values["backup-root"]),
				needleRe,
				maxBytes,
			);
			backupHits.push(...hits);
			backupWarnings.push(...warnings);
		} catch (e) {
			backupWarnings.push(`Backup scan failed: ${e?.message || e}`);
		}
	}

	if (values["no-backup"]) {
		backupWarnings.push("Backup scan skipped: --no-backup provided.");
	} else if (!values["backup-root"]) {
		backupWarnings.push("Backup scan skipped: no --backup-root provided.");
	}

	const timestamp = utcTimestamp();
	const outPath = values.out ? String(values.out) : `ha_refs_${timestamp}.md`;
	writeRefsReport(
		outPath,
		needles,
		liveHits,
		liveWarnings,
		backupHits,
		backupWarnings,
	);
	if (values["json-out"]) {
		writeRefsJsonReport(
			String(values["json-out"]),
			url,
			values["backup-root"],
			needles,
			liveHits,
			liveWarnings,
			backupHits,
			backupWarnings,
		);
	}
	console.log(outPath);
	return 0;
}

// -------------------------
// tail-events
// -------------------------

function printTailEventsHelp() {
	console.log("Usage: node scripts/ha_ops.js tail-events [options]");
	console.log("");
	console.log("Options:");
	console.log("  --entity <id>        Entity ID to include (repeatable)");
	console.log(
		"  --event-type <type>  Event type to subscribe to (repeatable, default: state_changed)",
	);
	console.log("  --device-ieee <ieee> Device IEEE to include (repeatable)");
	console.log(
		"  --device-id <id>     Device registry ID to include (repeatable)",
	);
	console.log(
		"  --seconds <n>        Stop after N seconds (0 = run until interrupted)",
	);
	console.log("  --raw                Print raw JSON for each event");
	console.log("  -h, --help           Show this help");
}

function asList(value) {
	if (value === null || value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

function formatCtx(ctx) {
	if (!ctx || typeof ctx !== "object") return "ctx=?";
	return `ctx.id=${String(ctx.id)} ctx.parent_id=${String(ctx.parent_id)} ctx.user_id=${String(ctx.user_id)}`;
}

function stateSummary(state) {
	if (!state || typeof state !== "object") return "<?>";
	const s = state.state;
	const attrs =
		state.attributes && typeof state.attributes === "object"
			? state.attributes
			: {};
	const name = attrs.friendly_name;
	if (typeof name === "string" && name) return `${String(s)} (${name})`;
	return String(s);
}

function* iterEntityIdsFromEvent(event) {
	const data = event?.data;
	if (!data || typeof data !== "object") return;
	if (typeof data.entity_id === "string") {
		yield data.entity_id;
		return;
	}
	const serviceData = data.service_data;
	if (!serviceData || typeof serviceData !== "object") return;
	const target = serviceData.entity_id;
	if (typeof target === "string") yield target;
	else if (Array.isArray(target)) {
		for (const e of target) if (typeof e === "string") yield e;
	}
}

function* iterDeviceIeeeFromEvent(event) {
	const data = event?.data;
	if (!data || typeof data !== "object") return;
	if (typeof data.device_ieee === "string") yield data.device_ieee;
}

function* iterDeviceIdsFromEvent(event) {
	const data = event?.data;
	if (!data || typeof data !== "object") return;
	if (typeof data.device_id === "string") yield data.device_id;
}

// -------------------------
// traces
// -------------------------

function printTracesHelp() {
	console.log("Usage: node scripts/ha_ops.js traces [options]");
	console.log("");
	console.log("List or view automation/script execution traces.");
	console.log("");
	console.log("Options:");
	console.log(
		"  --domain <domain>        Domain to query: automation or script (default: automation)",
	);
	console.log(
		"  --item-id <id>           Filter by numeric automation/script ID (from attributes.id)",
	);
	console.log(
		"  --entity-id <entity_id>  Filter by entity_id (e.g., automation.my_automation)",
	);
	console.log(
		"  --run-id <run_id>        Get detailed trace for a specific run",
	);
	console.log("  --limit <n>              Max traces to show (default: 10)");
	console.log("  --json                   Output as JSON");
	console.log("  -h, --help               Show this help");
	console.log("");
	console.log("Examples:");
	console.log("  # List recent automation traces");
	console.log("  node scripts/ha_ops.js traces");
	console.log("");
	console.log("  # List traces for a specific automation by entity_id");
	console.log(
		"  node scripts/ha_ops.js traces --entity-id automation.doorbell_announce",
	);
	console.log("");
	console.log("  # Get detailed trace for a specific run");
	console.log(
		"  node scripts/ha_ops.js traces --item-id 1757182154251 --run-id abc123...",
	);
}

async function cmdTraces(argv) {
	const { values } = parseArgs({
		args: argv,
		allowPositionals: false,
		options: {
			help: { type: "boolean", short: "h" },
			domain: { type: "string", default: "automation" },
			"item-id": { type: "string", default: "" },
			"entity-id": { type: "string", default: "" },
			"run-id": { type: "string", default: "" },
			limit: { type: "string", default: "10" },
			json: { type: "boolean", default: false },
		},
	});

	if (values.help) {
		printTracesHelp();
		return 0;
	}

	const domain = values.domain;
	if (domain !== "automation" && domain !== "script") {
		die(`Invalid --domain: ${domain}. Must be 'automation' or 'script'.`, 2);
	}

	const limit = Number(values.limit);
	if (!Number.isFinite(limit) || limit < 1) {
		die(`Invalid --limit: ${values.limit}`, 2);
	}

	let itemId = values["item-id"];
	const entityId = values["entity-id"];
	const runId = values["run-id"];

	// If entity-id is provided, resolve to item-id
	if (entityId && !itemId) {
		const rest = new HARest();
		const state = await rest.getJson(`/api/states/${entityId}`, {
			expectedStatuses: [200, 404],
		});
		if (!state) {
			die(`Entity not found: ${entityId}`, 2);
		}
		const attrs = state.attributes || {};
		const resolvedId = attrs.id;
		if (!resolvedId) {
			die(
				`Entity ${entityId} does not have an 'id' attribute (required for trace lookup)`,
				2,
			);
		}
		itemId = String(resolvedId);
	}

	const ws = await new HAWebSocket().connect();
	try {
		if (runId) {
			// Get specific trace
			if (!itemId) {
				die("--item-id (or --entity-id) is required when using --run-id", 2);
			}
			const trace = await ws.call("trace/get", {
				domain,
				item_id: itemId,
				run_id: runId,
			});

			if (values.json) {
				console.log(JSON.stringify(trace, null, 2));
			} else {
				printTraceDetail(trace, domain, itemId, runId);
			}
		} else {
			// List traces
			const payload = { domain };
			if (itemId) {
				payload.item_id = itemId;
			}
			const traces = await ws.call("trace/list", payload);

			if (!Array.isArray(traces)) {
				die(`Unexpected response from trace/list: ${JSON.stringify(traces)}`, 1);
			}

			// Sort by start time descending
			traces.sort((a, b) => {
				const ta = a.timestamp?.start || "";
				const tb = b.timestamp?.start || "";
				return tb.localeCompare(ta);
			});

			const limited = traces.slice(0, limit);

			if (values.json) {
				console.log(JSON.stringify(limited, null, 2));
			} else {
				if (limited.length === 0) {
					console.log(`No traces found for ${domain}${itemId ? ` (item_id=${itemId})` : ""}`);
				} else {
					console.log(
						`Found ${traces.length} trace(s) for ${domain}${itemId ? ` (item_id=${itemId})` : ""}, showing ${limited.length}:\n`,
					);
					for (const t of limited) {
						printTraceSummary(t);
					}
				}
			}
		}
	} finally {
		await ws.close();
	}

	return 0;
}

function printTraceSummary(trace) {
	const runId = trace.run_id || "?";
	const state = trace.state || "?";
	const scriptExec = trace.script_execution || "?";
	const lastStep = trace.last_step || "?";
	const start = trace.timestamp?.start || "?";
	const finish = trace.timestamp?.finish || "";
	const trigger = trace.trigger || "";
	const error = trace.error || "";

	console.log(`Run: ${runId}`);
	console.log(`  State: ${state} | Execution: ${scriptExec}`);
	console.log(`  Last step: ${lastStep}`);
	console.log(`  Start: ${start}${finish ? ` | Finish: ${finish}` : ""}`);
	if (trigger) console.log(`  Trigger: ${trigger}`);
	if (error) console.log(`  ERROR: ${error}`);
	console.log();
}

function printTraceDetail(traceData, domain, itemId, runId) {
	console.log(`=== Trace Detail ===`);
	console.log(`Domain: ${domain}`);
	console.log(`Item ID: ${itemId}`);
	console.log(`Run ID: ${runId}`);
	console.log();

	const trace = traceData.trace || {};
	const paths = Object.keys(trace).sort();

	// Extract timestamps for timeline
	const timeline = [];
	for (const path of paths) {
		const steps = trace[path];
		if (!Array.isArray(steps)) continue;
		for (const step of steps) {
			const ts = step.timestamp;
			if (ts) {
				timeline.push({ path, timestamp: ts, step });
			}
		}
	}

	// Sort by timestamp
	timeline.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

	if (timeline.length === 0) {
		console.log("No trace steps found.");
		return;
	}

	const startTime = new Date(timeline[0].timestamp);
	console.log("Timeline:");
	for (const { path, timestamp, step } of timeline) {
		const elapsed = ((new Date(timestamp) - startTime) / 1000).toFixed(3);
		let info = "";

		const result = step.result || {};
		if (result.stop) {
			info = ` -> STOP: ${result.stop}`;
		} else if (result.error) {
			info = ` -> ERROR`;
		}

		const changedVars = step.changed_variables || {};
		const varNames = Object.keys(changedVars);
		if (varNames.length > 0 && !info) {
			info = ` -> vars: ${varNames.join(", ")}`;
		}

		console.log(`  +${elapsed.padStart(7)}s: ${path}${info}`);
	}
}

async function cmdTailEvents(argv) {
	const { values } = parseArgs({
		args: argv,
		allowPositionals: false,
		options: {
			help: { type: "boolean", short: "h" },
			entity: { type: "string", multiple: true, default: [] },
			"event-type": { type: "string", multiple: true, default: [] },
			"device-ieee": { type: "string", multiple: true, default: [] },
			"device-id": { type: "string", multiple: true, default: [] },
			seconds: { type: "string", default: "0" },
			raw: { type: "boolean", default: false },
		},
	});

	if (values.help) {
		printTailEventsHelp();
		return 0;
	}

	const seconds = Number(values.seconds);
	if (!Number.isFinite(seconds) || seconds < 0)
		die(`Invalid --seconds: ${values.seconds}`, 2);

	const eventTypes = (
		values["event-type"].length ? values["event-type"] : ["state_changed"]
	)
		.map(String)
		.filter(Boolean);
	const uniqueEventTypes = [...new Set(eventTypes)];

	const entityFilter = new Set(values.entity.map(String));
	const deviceIeeeFilter = new Set(values["device-ieee"].map(String));
	const deviceIdFilter = new Set(values["device-id"].map(String));

	const ws = await new HAWebSocket().connect();
	try {
		for (const eventType of uniqueEventTypes) {
			const id = ws.nextId();
			ws.sendJson({ id, type: "subscribe_events", event_type: eventType });
			const ack = await ws.recvJson({ timeoutMs: 10_000 });
			if (!ack || ack.success !== true)
				throw new Error(
					`Failed subscribing to ${JSON.stringify(eventType)}: ${JSON.stringify(ack)}`,
				);
		}

		console.log(
			`[${utcNowIso()}] Subscribed to ${JSON.stringify(uniqueEventTypes)}`,
		);
		if (entityFilter.size)
			console.log(
				`[${utcNowIso()}] Filtering to entities: ${JSON.stringify([...entityFilter].sort())}`,
			);
		if (deviceIeeeFilter.size)
			console.log(
				`[${utcNowIso()}] Filtering to device_ieee: ${JSON.stringify([...deviceIeeeFilter].sort())}`,
			);
		if (deviceIdFilter.size)
			console.log(
				`[${utcNowIso()}] Filtering to device_id: ${JSON.stringify([...deviceIdFilter].sort())}`,
			);

		const stopAt = seconds > 0 ? Date.now() + seconds * 1000 : null;
		while (true) {
			if (stopAt && Date.now() >= stopAt) break;
			const msg = await ws.recvJson();
			if (!msg || msg.type !== "event") continue;
			const event = msg.event;
			if (!event || typeof event !== "object") continue;

			if (entityFilter.size || deviceIeeeFilter.size || deviceIdFilter.size) {
				let matched = false;
				if (entityFilter.size) {
					const ids = new Set(iterEntityIdsFromEvent(event));
					matched = matched || [...ids].some((id) => entityFilter.has(id));
				}
				if (deviceIeeeFilter.size) {
					const ieees = new Set(iterDeviceIeeeFromEvent(event));
					matched =
						matched || [...ieees].some((id) => deviceIeeeFilter.has(id));
				}
				if (deviceIdFilter.size) {
					const dids = new Set(iterDeviceIdsFromEvent(event));
					matched = matched || [...dids].some((id) => deviceIdFilter.has(id));
				}
				if (!matched) continue;
			}

			if (values.raw) {
				console.log(JSON.stringify(event));
				continue;
			}

			const etype = event.event_type;
			const data =
				event.data && typeof event.data === "object" ? event.data : {};
			const now = utcNowIso();

			if (etype === "state_changed") {
				const entityId = data.entity_id;
				const newState = data.new_state;
				const oldState = data.old_state;
				const ctx =
					newState && typeof newState === "object" ? newState.context : null;
				console.log(
					`[${now}] state_changed ${entityId}: ${stateSummary(oldState)} -> ${stateSummary(newState)}; ${formatCtx(ctx)}`,
				);
			} else if (etype === "call_service") {
				const domain = data.domain;
				const service = data.service;
				const serviceData = data.service_data;
				const ctxInfo = event.context;
				let targets = [];
				if (serviceData && typeof serviceData === "object")
					targets = asList(serviceData.entity_id);
				console.log(
					`[${now}] call_service ${domain}.${service} target=${JSON.stringify(targets)}; ${formatCtx(ctxInfo)}`,
				);
			} else {
				console.log(`[${now}] ${etype} ${JSON.stringify(data)}`);
			}
		}
		return 0;
	} finally {
		await ws.close();
	}
}

// -------------------------
// name-review-from-backup
// -------------------------

const GENERIC_PATTERNS = [
	["Motion/Occupancy", /\b(motion|occupancy|presence)\b/i],
	["Door/Window", /\b(door|window)\b/i],
	["Temperature", /\btemp(erature)?\b/i],
	["Humidity", /\bhumidity\b/i],
	["Illuminance", /\b(illuminance|lux)\b/i],
	["Battery", /\bbattery\b/i],
	["Power/Energy", /\b(power|energy|current|voltage)\b/i],
	["Leak/Water", /\b(leak|water)\b/i],
	["Smoke/CO", /\b(smoke|carbon monoxide|co)\b/i],
	["Outlet/Plug", /\b(outlet|plug)\b/i],
	["TV/Speaker", /\b(tv|speaker)\b/i],
	["Camera", /\bcamera\b/i],
	["Lock", /\block\b/i],
	["Blinds/Cover", /\b(blinds|curtain|cover)\b/i],
	["Fan", /\bfan\b/i],
];

const NOISE_NAME_PATTERN =
	/\b(rssi|lqi|linkquality|identify|device temperature|power factor|apparent power|summation delivered)\b/i;
const LIGHTS_COVE_NAME_PATTERN = /\b(lights|cove)\b/i;

function printNameReviewHelp() {
	console.log(
		"Usage: node scripts/ha_ops.js name-review-from-backup --backup-root <path> [options]",
	);
	console.log("");
	console.log("Options:");
	console.log(
		"  --backup-root <path>       Path to the Home Assistant backup root (required)",
	);
	console.log(
		"  --out <path>               Output markdown path (default: ha_name_review_<timestamp>.md)",
	);
	console.log("  --limit <n>                Max candidates (default: 300)");
	console.log(
		"  --include-diagnostic       Include diagnostic/config entities",
	);
	console.log(
		"  --include-lights-cove      Include entities mentioning 'Lights' or 'Cove'",
	);
	console.log("  -h, --help                 Show this help");
}

function normName(value) {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, " ");
}

function startsWithAnyPrefix(value, prefixes) {
	const v = normName(value);
	for (const p of prefixes) {
		const pp = normName(p);
		if (!pp) continue;
		if (v === pp || v.startsWith(pp + " ")) return true;
	}
	return false;
}

function deviceDisplayName(device) {
	return device.name_by_user || device.name || null;
}

function entityDisplayName(entity, deviceName) {
	if (entity.name) return entity.name;
	const originalName = entity.original_name;
	if (entity.has_entity_name && deviceName && originalName)
		return `${deviceName} ${originalName}`;
	return originalName || entity.entity_id || "<unknown>";
}

function loadRestoreStateFriendlyNames(storageDir) {
	const p = path.join(storageDir, "core.restore_state");
	if (!fs.existsSync(p)) return {};
	let payload;
	try {
		payload = JSON.parse(fs.readFileSync(p, "utf-8"));
	} catch {
		return {};
	}
	if (!payload || typeof payload !== "object" || !Array.isArray(payload.data))
		return {};
	const friendly = {};
	for (const item of payload.data) {
		const state = item?.state;
		if (!state || typeof state !== "object") continue;
		const entityId = state.entity_id;
		const attrs = state.attributes;
		if (!attrs || typeof attrs !== "object") continue;
		const name = attrs.friendly_name;
		if (entityId && typeof name === "string" && name.trim())
			friendly[entityId] = name.trim();
	}
	return friendly;
}

function mdEscapeTableCell(value) {
	return String(value || "")
		.replace(/\\/g, "\\\\")
		.replace(/\|/g, "\\|")
		.replace(/\n/g, " ")
		.trim();
}

async function cmdNameReviewFromBackup(argv) {
	const { values } = parseArgs({
		args: argv,
		allowPositionals: false,
		options: {
			help: { type: "boolean", short: "h" },
			"backup-root": { type: "string", default: "" },
			out: { type: "string", default: "" },
			limit: { type: "string", default: "300" },
			"include-diagnostic": { type: "boolean", default: false },
			"include-lights-cove": { type: "boolean", default: false },
		},
	});

	if (values.help) {
		printNameReviewHelp();
		return 0;
	}

	if (!values["backup-root"]) die("--backup-root is required", 2);
	const backupRoot = String(values["backup-root"]);
	const storageDir = path.join(backupRoot, "homeassistant", "data", ".storage");

	const entityRegistryPath = path.join(storageDir, "core.entity_registry");
	const deviceRegistryPath = path.join(storageDir, "core.device_registry");
	const areaRegistryPath = path.join(storageDir, "core.area_registry");

	for (const p of [entityRegistryPath, deviceRegistryPath, areaRegistryPath]) {
		if (!fs.existsSync(p)) die(`Missing expected backup file: ${p}`, 2);
	}

	let entityPayload, devicePayload, areaPayload;
	try {
		entityPayload = JSON.parse(fs.readFileSync(entityRegistryPath, "utf-8"));
		devicePayload = JSON.parse(fs.readFileSync(deviceRegistryPath, "utf-8"));
		areaPayload = JSON.parse(fs.readFileSync(areaRegistryPath, "utf-8"));
	} catch (e) {
		die(`Failed to load backup registries: ${e?.message || e}`, 2);
	}

	const entityRegistry = entityPayload?.data?.entities;
	const deviceRegistry = devicePayload?.data?.devices;
	const areaRegistry = areaPayload?.data?.areas;
	if (
		!Array.isArray(entityRegistry) ||
		!Array.isArray(deviceRegistry) ||
		!Array.isArray(areaRegistry)
	) {
		die("Unexpected registry format (expected lists)", 2);
	}

	const restoreFriendlyNames = loadRestoreStateFriendlyNames(storageDir);

	const areasById = {};
	for (const a of areaRegistry)
		if (a && typeof a === "object" && typeof a.id === "string")
			areasById[a.id] = a;
	const devicesById = {};
	for (const d of deviceRegistry)
		if (d && typeof d === "object" && typeof d.id === "string")
			devicesById[d.id] = d;

	const areaPrefixesById = {};
	for (const [areaId, area] of Object.entries(areasById)) {
		const prefixes = [];
		if (typeof area.name === "string") prefixes.push(area.name);
		if (Array.isArray(area.aliases)) {
			for (const a of area.aliases) if (typeof a === "string") prefixes.push(a);
		}
		areaPrefixesById[areaId] = prefixes.filter(Boolean);
	}

	const resolveAreaId = (entity) => {
		if (typeof entity.area_id === "string" && entity.area_id)
			return entity.area_id;
		const deviceId = entity.device_id;
		if (typeof deviceId === "string" && devicesById[deviceId]) {
			const areaId = devicesById[deviceId].area_id;
			return typeof areaId === "string" ? areaId : null;
		}
		return null;
	};

	const nameToAreaIds = new Map(); // normName -> Set(areaId)
	const resolved = [];
	for (const entity of entityRegistry) {
		if (!entity || typeof entity !== "object") continue;
		const areaId = resolveAreaId(entity);
		let deviceName = null;
		if (typeof entity.device_id === "string" && devicesById[entity.device_id]) {
			deviceName = deviceDisplayName(devicesById[entity.device_id]);
		}
		const entityId = entity.entity_id || "";
		const currentName =
			restoreFriendlyNames[entityId] || entityDisplayName(entity, deviceName);
		resolved.push([entity, areaId, deviceName, currentName]);
		if (areaId && currentName) {
			const key = normName(currentName);
			if (!nameToAreaIds.has(key)) nameToAreaIds.set(key, new Set());
			nameToAreaIds.get(key).add(areaId);
		}
	}

	const interestingDomains = new Set([
		"binary_sensor",
		"sensor",
		"switch",
		"button",
		"cover",
		"fan",
		"climate",
		"media_player",
		"remote",
		"camera",
		"lock",
		"scene",
		"script",
		"timer",
		"input_boolean",
		"input_select",
	]);

	const candidates = [];
	let scanned = 0;
	let withArea = 0;

	for (const [entity, areaId, _deviceName, currentName] of resolved) {
		const entityId = entity.entity_id || "";
		const domain = entityId.includes(".") ? entityId.split(".", 1)[0] : "";
		if (!domain || !interestingDomains.has(domain)) continue;

		if (
			!values["include-diagnostic"] &&
			(entity.entity_category === "diagnostic" ||
				entity.entity_category === "config")
		)
			continue;
		if (NOISE_NAME_PATTERN.test(currentName)) continue;
		if (
			!values["include-lights-cove"] &&
			LIGHTS_COVE_NAME_PATTERN.test(currentName)
		)
			continue;

		scanned += 1;
		if (!areaId || !areasById[areaId]) continue;
		withArea += 1;

		const area = areasById[areaId];
		const areaName =
			typeof area.name === "string" && area.name ? area.name : areaId;
		const areaPrefixes = areaPrefixesById[areaId] || [areaName];
		if (startsWithAnyPrefix(currentName, areaPrefixes)) continue;

		const suggestedName = `${areaName} ${currentName}`.trim();
		const reasons = [];
		let score = 0;

		const spread = (nameToAreaIds.get(normName(currentName)) || new Set()).size;
		if (spread >= 2) {
			reasons.push(`Same name in ${spread} areas`);
			score += 100 + Math.min(spread, 10) * 5;
		}

		const matchedKinds = [];
		for (const [kind, re] of GENERIC_PATTERNS) {
			if (re.test(currentName)) matchedKinds.push(kind);
		}
		if (matchedKinds.length) {
			reasons.push(`Generic: ${[...new Set(matchedKinds)].sort().join(", ")}`);
			score += 50;
		}

		if (spread < 2 && !matchedKinds.length) continue;

		const disabledBy =
			typeof entity.disabled_by === "string" ? entity.disabled_by : null;
		const hiddenBy =
			typeof entity.hidden_by === "string" ? entity.hidden_by : null;
		if (disabledBy || hiddenBy) {
			reasons.push("Hidden/disabled");
			score -= 10;
		}
		if (score <= 0) continue;

		candidates.push({
			score,
			area_name: areaName,
			domain,
			entity_id: entityId,
			current_name: currentName,
			suggested_name: suggestedName,
			reasons,
			disabled_by: disabledBy,
			hidden_by: hiddenBy,
		});
	}

	candidates.sort((a, b) => {
		if (b.score !== a.score) return b.score - a.score;
		const aKey = `${a.area_name.toLowerCase()}||${a.domain}||${a.entity_id}`;
		const bKey = `${b.area_name.toLowerCase()}||${b.domain}||${b.entity_id}`;
		return aKey < bKey ? -1 : 1;
	});

	const limit = Number(values.limit);
	if (!Number.isFinite(limit) || limit < 0)
		die(`Invalid --limit: ${values.limit}`, 2);

	const timestamp = utcTimestamp();
	const outPath = values.out
		? String(values.out)
		: `ha_name_review_${timestamp}.md`;

	const lines = [
		"# Home Assistant — entity name review (from backup)",
		"",
		`- Generated: \`${timestamp}\``,
		`- Backup: \`${backupRoot}\``,
		`- Entities scanned: \`${scanned}\``,
		`- With area resolved: \`${withArea}\``,
		`- Candidates (score>0): \`${candidates.length}\``,
		"",
		"## Top candidates",
		"",
		"| Score | Area | Entity | Current name | Suggested name | Reasons |",
		"| ---: | --- | --- | --- | --- | --- |",
	];
	for (const c of candidates.slice(0, limit)) {
		lines.push(
			`| ${c.score} | ${mdEscapeTableCell(c.area_name)} | \`${c.entity_id}\` | ${mdEscapeTableCell(c.current_name)} | ${mdEscapeTableCell(c.suggested_name)} | ${mdEscapeTableCell(c.reasons.join("; "))} |`,
		);
	}
	lines.push(
		"",
		"## Notes",
		"",
		"- This report uses the backup registries; it won't reflect renames applied after that backup was taken.",
		"- Suggested names prefix the entity's current friendly name with the resolved area name.",
		"",
	);
	fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
	console.log(outPath);
	return 0;
}

run()
	.then((code) => process.exit(code))
	.catch((e) => die(e?.stack || e?.message || String(e), 1));
