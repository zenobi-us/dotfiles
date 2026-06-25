export interface VersionedAskConfigFile {
	schemaVersion: number;
	[key: string]: unknown;
}

export interface AskConfigMigration {
	from: number;
	migrate: (config: VersionedAskConfigFile) => VersionedAskConfigFile;
	to: number;
}
