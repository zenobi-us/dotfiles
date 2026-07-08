import { appendFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

function envEnabled(value: string | undefined): boolean {
	return /^(1|true|yes|on)$/i.test(value?.trim() ?? "");
}

function diagnosticPath(): string {
	const configured = process.env.PI_BG_TASK_DIAGNOSTIC_LOG?.trim();
	return configured ? resolve(configured) : join(tmpdir(), "vstack-pi-bg", "diagnostics.log");
}

export function backgroundDiagnosticsEnabled(): boolean {
	return envEnabled(process.env.PI_BG_TASK_DEBUG) || envEnabled(process.env.PI_BG_TASK_DIAGNOSTICS) || Boolean(process.env.PI_BG_TASK_DIAGNOSTIC_LOG?.trim());
}

export function logBackgroundDiagnostic(message: string, details?: unknown): void {
	if (!backgroundDiagnosticsEnabled()) return;
	try {
		const path = diagnosticPath();
		mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
		const suffix = details === undefined ? "" : ` ${JSON.stringify(details)}`;
		appendFileSync(path, `[${new Date().toISOString()}] ${message}${suffix}\n`, "utf8");
	} catch {
		// Diagnostics must never write to the TUI or disturb rendering.
	}
}
