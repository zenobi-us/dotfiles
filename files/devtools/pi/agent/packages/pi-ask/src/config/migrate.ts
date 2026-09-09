import { normalizeConfiguredKeymaps } from "../constants/keymaps.ts";
import { normalizeAskConfig } from "./defaults.ts";
import {
	AskConfigVersionMigrationError,
	type AskConfigVersionMigrationResult,
	migrateAskConfigFileToCurrent,
} from "./migrations/index.ts";
import type { AskConfig, AskConfigFileV5 } from "./schema.ts";
import { validateAskConfigFileV5 } from "./schema.ts";

export class AskConfigMigrationError extends Error {
	readonly reason: "invalid_or_unsupported" | "migration_failed";

	constructor(
		message: string,
		reason: "invalid_or_unsupported" | "migration_failed"
	) {
		super(message);
		this.reason = reason;
	}
}

export interface AskConfigMigrationResult {
	config: AskConfig;
	migrated: boolean;
	notice?: string;
}

export function migrateAskConfig(raw: unknown): AskConfigMigrationResult {
	let migratedFile: AskConfigVersionMigrationResult;
	try {
		migratedFile = migrateAskConfigFileToCurrent(raw);
	} catch (error) {
		throw new AskConfigMigrationError(
			"Config was invalid or unsupported.",
			error instanceof AskConfigVersionMigrationError
				? error.reason
				: "migration_failed"
		);
	}

	if (!validateAskConfigFileV5.Check(migratedFile.config)) {
		throw new AskConfigMigrationError(
			"Config was invalid or unsupported.",
			"invalid_or_unsupported"
		);
	}

	const currentFile = migratedFile.config as AskConfigFileV5;
	const config = normalizeAskConfig(currentFile);
	const keymapsResult = normalizeConfiguredKeymaps(currentFile.keymaps);
	if (!keymapsResult.ok) {
		return {
			config: {
				...config,
				keymaps: normalizeAskConfig().keymaps,
			},
			migrated: migratedFile.migrated,
			notice: `${keymapsResult.error} Using default ask keymaps for this session. Edit the config and restart pi or run /reload.`,
		};
	}

	return {
		config: {
			...config,
			keymaps: keymapsResult.keymaps,
		},
		migrated: migratedFile.migrated,
	};
}
