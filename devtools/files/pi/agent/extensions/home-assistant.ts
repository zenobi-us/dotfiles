import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { StringEnum } from "@mariozechner/pi-ai";
import { Type } from "@sinclair/typebox";
import { createConfigService } from "@zenobius/pi-extension-config";

type Json = Record<string, unknown>;
type MdTable = string;
type EntityState = Record<string, unknown>;
type ServiceCallResult = unknown;

type EntitySummary = {
	id: string;
	name: string;
	area: string;
};

type EntityDetails = {
	id: string;
	name: string;
	domain: string;
	description?: string;
};

interface HomeAssistantConfig {
	url?: string;
	token?: string;
}

const CONFIG_NAME = "home-assistant";

function toArray(value?: string[]): string[] {
	return (value ?? []).map((x) => x.trim()).filter(Boolean);
}

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};
	return value as Record<string, unknown>;
}

function parseDataObject(data?: string): Record<string, unknown> {
	if (!data?.trim()) return {};
	const parsed = JSON.parse(data);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("data must be a JSON object string");
	}
	return parsed as Record<string, unknown>;
}

function normaliseEntityId(entityId: string): string {
	return entityId.trim().replace(/^@/, "");
}

function markdownTable(headers: string[], rows: string[][]): MdTable {
	const head = `| ${headers.join(" | ")} |`;
	const separator = `| ${headers.map(() => "---").join(" | ")} |`;
	const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
	return [head, separator, body].filter(Boolean).join("\n");
}

class HaClient {
	constructor(
		public url: string,
		private token: string,
	) {}

	private ensureReady() {
		if (!this.url) throw new Error("Missing HA URL. Set HA_URL or run /ha-config set-url <url>");
		if (!this.token) throw new Error("Missing HA token. Set HA_TOKEN or run /ha-config set-token <token>");
	}

	private async request(path: string, init: RequestInit = {}): Promise<unknown> {
		this.ensureReady();

		const response = await fetch(`${this.url}${path}`, {
			...init,
			headers: {
				Authorization: `Bearer ${this.token}`,
				"Content-Type": "application/json",
				...(init.headers ?? {}),
			},
		});

		const text = await response.text();
		let body: unknown = text;
		try {
			body = text ? JSON.parse(text) : null;
		} catch {
			// keep raw text if not JSON
		}

		if (!response.ok) {
			throw new Error(`Home Assistant API ${response.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
		}

		return body;
	}

	async getStates(): Promise<EntityState[]> {
		const body = await this.request("/api/states");
		if (!Array.isArray(body)) return [];
		return body as EntityState[];
	}

	async getState(args: { entityId: string }): Promise<EntityState> {
		const entityId = normaliseEntityId(args.entityId);
		if (!entityId) throw new Error("getState requires entityId");
		const body = await this.request(`/api/states/${encodeURIComponent(entityId)}`);
		return asRecord(body);
	}

	async callService(args: { domain: string; service: string; data?: Record<string, unknown> }): Promise<ServiceCallResult> {
		const domain = args.domain.trim();
		const service = args.service.trim();
		if (!domain || !service) throw new Error("callService requires domain and service");

		return await this.request(`/api/services/${encodeURIComponent(domain)}/${encodeURIComponent(service)}`, {
			method: "POST",
			body: JSON.stringify(args.data ?? {}),
		});
	}

	async listServices(): Promise<Record<string, EntityDetails[]>> {
		const body = await this.request("/api/services");
		if (!Array.isArray(body)) return {};

		const result: Record<string, EntityDetails[]> = {};
		for (const entry of body) {
			const row = asRecord(entry);
			const domain = String(row.domain ?? "").trim();
			const services = asRecord(row.services);
			if (!domain) continue;

			const details: EntityDetails[] = Object.entries(services).map(([serviceId, meta]) => {
				const info = asRecord(meta);
				return {
					id: `${domain}.${serviceId}`,
					name: String(info.name ?? serviceId),
					domain,
					description: typeof info.description === "string" ? info.description : undefined,
				};
			});

			result[domain] = details;
		}
		return result;
	}
}

class HaToolService {
	constructor(public client: HaClient) {}

	private toSummary(state: EntityState): EntitySummary {
		const attrs = asRecord(state.attributes);
		const id = String(state.entity_id ?? "");
		const name = String(attrs.friendly_name ?? id);
		const area = String(attrs.area ?? attrs.area_id ?? "");
		return { id, name, area };
	}

	private matches(summary: EntitySummary, areas?: string[], tags?: string[]): boolean {
		const areaFilters = toArray(areas).map((x) => x.toLowerCase());
		if (areaFilters.length > 0) {
			const hay = summary.area.toLowerCase();
			if (!areaFilters.some((a) => hay.includes(a))) return false;
		}

		type TagFn = (s: EntitySummary, tag: string) => boolean;
		const tagFns: TagFn[] = [
			(s, t) => s.id.toLowerCase().includes(t),
			(s, t) => s.name.toLowerCase().includes(t),
			(s, t) => s.area.toLowerCase().includes(t),
		];

		const tagFilters = toArray(tags).map((x) => x.toLowerCase());
		if (tagFilters.length > 0) {
			for (const tag of tagFilters) {
				if (!tagFns.some((fn) => fn(summary, tag))) return false;
			}
		}

		return true;
	}

	async summariseAsJson(args: { areas?: string[]; tags?: string[] }): Promise<Json> {
		const states = await this.client.getStates();
		const summaries = states.map((s) => this.toSummary(s)).filter((s) => this.matches(s, args.areas, args.tags));
		return {
			total: summaries.length,
			entities: summaries,
		};
	}

	async summariseAsTable(args: { areas?: string[]; tags?: string[] }): Promise<MdTable> {
		const json = await this.summariseAsJson(args);
		const entities = (json.entities as EntitySummary[]) ?? [];
		return markdownTable(
			["ID", "Name", "Area"],
			entities.map((e) => [e.id, e.name, e.area || "-"]),
		);
	}

	async getDeviceStateAsJson(args: { entityids: string[] }): Promise<Json> {
		const ids = toArray(args.entityids).map(normaliseEntityId);
		const states = await Promise.all(ids.map(async (id) => ({ id, state: await this.client.getState({ entityId: id }) })));
		return {
			total: states.length,
			states,
		};
	}

	async getDeviceStateAsTable(args: { entityids: string[] }): Promise<MdTable> {
		const json = await this.getDeviceStateAsJson(args);
		const states = (json.states as { id: string; state: EntityState }[]) ?? [];

		const rows = states.map((entry) => {
			const attrs = asRecord(entry.state.attributes);
			const value = String(entry.state.state ?? "");
			const name = String(attrs.friendly_name ?? entry.id);
			return [entry.id, name, value];
		});

		return markdownTable(["Entity", "Name", "State"], rows);
	}

	async listServicesSummary(): Promise<Json> {
		const byDomain = await this.client.listServices();
		const domains = Object.keys(byDomain).sort();
		return {
			totalDomains: domains.length,
			totalServices: domains.reduce((sum, d) => sum + byDomain[d].length, 0),
			domains: domains.map((domain) => ({
				domain,
				count: byDomain[domain].length,
				services: byDomain[domain].map((s) => ({ id: s.id, name: s.name })),
			})),
		};
	}
}

class CommandRouter {
	private handlers: Record<string, (rest: string, ctx: ExtensionContext) => Promise<void>>;

	constructor(handlers: Record<string, (rest: string, ctx: ExtensionContext) => Promise<void>>) {
		this.handlers = handlers;
	}

	async route(input: string, ctx: ExtensionContext) {
		const trimmed = input.trim();
		const [command = "help", ...restParts] = trimmed.split(" ").filter(Boolean);
		const rest = restParts.join(" ");
		const handler = this.handlers[command] ?? this.handlers.help;
		await handler(rest, ctx);
	}
}

function resolveClientConfig(config: HomeAssistantConfig) {
	const url = (process.env.HA_URL ?? process.env.HOME_ASSISTANT_URL ?? config.url ?? "")
		.trim()
		.replace(/\/$/, "");
	const token = (process.env.HA_TOKEN ?? process.env.HOME_ASSISTANT_TOKEN ?? config.token ?? "").trim();
	return { url, token };
}

async function createHomeAssistantConfig() {
	return await createConfigService<HomeAssistantConfig>(CONFIG_NAME, {
		defaults: { url: "", token: "" },
	});
}

async function handleConfigCommand(
	args: string,
	ctx: ExtensionContext,
	configService: Awaited<ReturnType<typeof createHomeAssistantConfig>>,
) {
	const trimmed = args.trim();

	if (!trimmed || trimmed === "help") {
		ctx.ui.notify("Usage: /ha-config show | set-url <url> | set-token <token> | clear-token", "info");
		return;
	}

	if (trimmed === "show") {
		const resolved = resolveClientConfig(configService.config);
		const sourceUrl = process.env.HA_URL || process.env.HOME_ASSISTANT_URL ? "env" : "config";
		const sourceToken = process.env.HA_TOKEN || process.env.HOME_ASSISTANT_TOKEN ? "env" : "config";
		ctx.ui.notify(
			`HA URL: ${resolved.url || "(not set)"} [${sourceUrl}] • Token: ${resolved.token ? "set" : "not set"} [${sourceToken}]`,
			"info",
		);
		return;
	}

	if (trimmed.startsWith("set-url ")) {
		const url = trimmed.slice("set-url ".length).trim().replace(/\/$/, "");
		if (!url) return void ctx.ui.notify("URL cannot be empty", "error");
		await configService.set("url", url, "home");
		await configService.save("home");
		await configService.reload();
		ctx.ui.notify(`Saved HA URL: ${url}`, "info");
		return;
	}

	if (trimmed.startsWith("set-token ")) {
		const token = trimmed.slice("set-token ".length).trim();
		if (!token) return void ctx.ui.notify("Token cannot be empty", "error");
		await configService.set("token", token, "home");
		await configService.save("home");
		await configService.reload();
		ctx.ui.notify("Saved HA token", "info");
		return;
	}

	if (trimmed === "clear-token") {
		await configService.set("token", "", "home");
		await configService.save("home");
		await configService.reload();
		ctx.ui.notify("Cleared HA token", "warning");
		return;
	}

	ctx.ui.notify("Unknown args. Use: /ha-config help", "warning");
}

export default async function piHomeAssistantExtension(pi: ExtensionAPI) {
	const config = await createHomeAssistantConfig();
	const clientConfig = resolveClientConfig(config.config);
	const client = new HaClient(clientConfig.url, clientConfig.token);
	const tools = new HaToolService(client);

	const router = new CommandRouter({
		help: async (_rest, ctx) => {
			ctx.ui.notify(
				"Usage: /homeassistant list_services | summary_json | summary_table | state_json <id1,id2> | state_table <id1,id2>",
				"info",
			);
		},
		list_services: async (_rest, ctx) => {
			const summary = await tools.listServicesSummary();
			const domains = (summary.domains as { domain: string; count: number }[] | undefined) ?? [];
			const top = domains
				.slice()
				.sort((a, b) => b.count - a.count)
				.slice(0, 10)
				.map((d) => `${d.domain} (${d.count})`)
				.join(", ");
			ctx.ui.notify(`Domains: ${summary.totalDomains as number}, Services: ${summary.totalServices as number}. Top: ${top}`, "info");
		},
		summary_json: async (_rest, ctx) => {
			const result = await tools.summariseAsJson({});
			ctx.ui.notify(`Entities: ${result.total as number}`, "info");
		},
		summary_table: async (_rest, ctx) => {
			const table = await tools.summariseAsTable({});
			ctx.ui.notify(table, "info");
		},
		state_json: async (rest, ctx) => {
			const entityids = rest.split(",").map((x) => x.trim()).filter(Boolean);
			const result = await tools.getDeviceStateAsJson({ entityids });
			ctx.ui.notify(`Fetched ${result.total as number} state(s)`, "info");
		},
		state_table: async (rest, ctx) => {
			const entityids = rest.split(",").map((x) => x.trim()).filter(Boolean);
			const table = await tools.getDeviceStateAsTable({ entityids });
			ctx.ui.notify(table, "info");
		},
	});

	pi.registerCommand("ha-config", {
		description: "Configure Home Assistant: show, set-url, set-token, clear-token",
		handler: async (args: string, ctx: ExtensionContext) => {
			await handleConfigCommand(args, ctx, config);
		},
	});

	pi.registerCommand("homeassistant", {
		description: "Home Assistant command router",
		handler: async (args: string, ctx: ExtensionContext) => {
			await router.route(args, ctx);
		},
	});

	pi.registerTool({
		name: "homeassistant_list_services",
		label: "Home Assistant List Services",
		description: "List Home Assistant services as summary json.",
		parameters: Type.Object({}),
		async execute() {
			try {
				const result = await tools.listServicesSummary();
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
					details: result,
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					content: [{ type: "text", text: `Error: ${message}` }],
					details: { error: message },
					isError: true,
				};
			}
		},
	});

	pi.registerTool({
		name: "homeassistant_entities_summary",
		label: "Home Assistant Entities Summary",
		description: "Summarise entities as json or markdown table.",
		parameters: Type.Object({
			format: Type.Optional(StringEnum(["json", "table"] as const)),
			areas: Type.Optional(Type.Array(Type.String())),
			tags: Type.Optional(Type.Array(Type.String())),
		}),
		async execute(_id, params) {
			try {
				const format = params.format ?? "json";
				if (format === "table") {
					const table = await tools.summariseAsTable({ areas: params.areas, tags: params.tags });
					return { content: [{ type: "text", text: table }], details: { format, areas: params.areas, tags: params.tags } };
				}
				const json = await tools.summariseAsJson({ areas: params.areas, tags: params.tags });
				return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }], details: json };
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return { content: [{ type: "text", text: `Error: ${message}` }], details: { error: message }, isError: true };
			}
		},
	});

	pi.registerTool({
		name: "homeassistant_get_device_state",
		label: "Home Assistant Get Device State",
		description: "Get state for one or more entity IDs as json or markdown table.",
		parameters: Type.Object({
			entityids: Type.Array(Type.String()),
			format: Type.Optional(StringEnum(["json", "table"] as const)),
		}),
		async execute(_id, params) {
			try {
				const format = params.format ?? "json";
				if (format === "table") {
					const table = await tools.getDeviceStateAsTable({ entityids: params.entityids });
					return { content: [{ type: "text", text: table }], details: { format, count: params.entityids.length } };
				}
				const json = await tools.getDeviceStateAsJson({ entityids: params.entityids });
				return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }], details: json };
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return { content: [{ type: "text", text: `Error: ${message}` }], details: { error: message }, isError: true };
			}
		},
	});

	pi.registerTool({
		name: "homeassistant_call_service",
		label: "Home Assistant Call Service",
		description: "Call a Home Assistant service with domain/service and optional JSON data.",
		parameters: Type.Object({
			domain: Type.String(),
			service: Type.String(),
			data: Type.Optional(Type.String({ description: "JSON object string" })),
		}),
		async execute(_id, params) {
			try {
				const result = await client.callService({
					domain: params.domain,
					service: params.service,
					data: parseDataObject(params.data),
				});
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
					details: { domain: params.domain, service: params.service, result },
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return { content: [{ type: "text", text: `Error: ${message}` }], details: { error: message }, isError: true };
			}
		},
	});
}
