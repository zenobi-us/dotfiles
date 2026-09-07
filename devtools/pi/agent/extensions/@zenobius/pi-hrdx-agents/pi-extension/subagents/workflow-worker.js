import vm from "node:vm";
import { parentPort, workerData } from "node:worker_threads";

const port = parentPort;
if (!port) throw new Error("workflow worker requires a parent port");

const pendingAgents = new Map();
let nextAgentId = 0;

function agent(prompt, options) {
	if (
		typeof prompt !== "string" ||
		!options ||
		typeof options !== "object" ||
		Array.isArray(options) ||
		Object.keys(options).length !== 2 ||
		options.kind !== "review" ||
		(typeof options.node !== "string" && typeof options.role !== "string")
	) {
		throw new Error("Workflow agent requires a prompt and { kind: 'review', node } options");
	}
	const id = String(++nextAgentId);
	port.postMessage({ type: "agent", id, prompt, options });
	return new Promise((resolve, reject) => pendingAgents.set(id, { resolve, reject }));
}

function log(message) {
	port.postMessage({ type: "log", message });
}

port.on("message", (message) => {
	if (message?.type !== "agent_result") return;
	const pending = pendingAgents.get(message.id);
	if (!pending) return;
	pendingAgents.delete(message.id);
	pending.resolve(message.result);
});

(async () => {
	try {
		const sandbox = Object.freeze({ agent: Object.freeze(agent), log: Object.freeze(log), console: undefined });
		const context = vm.createContext(sandbox, {
			codeGeneration: { strings: false, wasm: false },
		});
		const script = new vm.Script(`(async () => {\n${workerData.source}\n})()`, {
			filename: workerData.filename,
		});
		const result = await script.runInContext(context);
		port.postMessage({ type: "result", result });
	} catch (error) {
		port.postMessage({
			type: "error",
			message: error instanceof Error ? error.message : String(error),
		});
	}
})();
