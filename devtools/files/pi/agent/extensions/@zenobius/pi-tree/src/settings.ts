import {
    getAgentDir,
    SettingsManager,
    type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import {
    closeSync,
    mkdirSync,
    openSync,
    readFileSync,
    renameSync,
    statSync,
    unlinkSync,
    writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { Type, type TSchema } from "typebox";
import { Value } from "typebox/value";

import {
    DEFAULT_MODE,
    MAX_VISIBLE_LINES_SETTINGS_KEY,
    MIN_VISIBLE_LINES,
    PREVIEW_FULL_HEIGHT_SETTINGS_KEY,
    PREVIEW_SETTINGS_KEY,
    SETTINGS_KEY,
    SETTINGS_LOCK_TIMEOUT_MS,
    STALE_SETTINGS_LOCK_MS,
} from "./constants.ts";
import type { TreeTimestampMode } from "./types.ts";

const SettingsObjectSchema = Type.Object({});
const TreeTimestampModeSchema = Type.Union([
    Type.Literal("off"),
    Type.Literal("relative"),
    Type.Literal("absolute"),
]);
const TreePreviewEnabledSchema = Type.Boolean();
const TreeMaxVisibleLinesSchema = Type.Number();
const TreePreviewFullHeightSchema = Type.Boolean();
const ThemeNameSchema = Type.String();

type SettingsReadContext = {
    cwd: string;
    projectTrusted: boolean;
};

let settingsReadContext: SettingsReadContext | undefined;
let cachedMode: TreeTimestampMode | null = null;
let cachedPreviewEnabled: boolean | null = null;
let cachedMaxVisibleLines: number | null | undefined;
let cachedPreviewFullHeight: boolean | undefined;
let cachedThemeName: string | undefined;
let cachedThemeNameLoaded = false;

type ProjectTrustContext = ExtensionContext & {
    isProjectTrusted?: () => boolean;
};

function isProjectTrusted(ctx: ExtensionContext): boolean {
    return (ctx as ProjectTrustContext).isProjectTrusted?.() ?? true;
}

function clearReadCaches(): void {
    cachedMode = null;
    cachedPreviewEnabled = null;
    cachedMaxVisibleLines = undefined;
    cachedPreviewFullHeight = undefined;
    cachedThemeName = undefined;
    cachedThemeNameLoaded = false;
}

export function setSettingsContext(ctx: ExtensionContext): void {
    const next: SettingsReadContext = {
        cwd: ctx.cwd,
        projectTrusted: isProjectTrusted(ctx),
    };
    if (
        settingsReadContext?.cwd !== next.cwd ||
        settingsReadContext.projectTrusted !== next.projectTrusted
    ) {
        settingsReadContext = next;
        clearReadCaches();
    }
}

export function isTreeTimestampMode(value: unknown): value is TreeTimestampMode {
    return Value.Check(TreeTimestampModeSchema, value);
}

function getSettingsPath(): string {
    return join(getAgentDir(), "settings.json");
}

function getErrorCode(error: unknown): string | undefined {
    if (!(error instanceof Error)) return undefined;
    const code = (error as NodeJS.ErrnoException).code;
    if (typeof code === "string") return code;
    return undefined;
}

function throwError(error: unknown): never {
    if (error instanceof Error) throw error;
    throw new Error(String(error));
}

function sleepSync(ms: number): void {
    const buffer = new SharedArrayBuffer(4);
    Atomics.wait(new Int32Array(buffer), 0, 0, ms);
}

function parseOptionalString(schema: TSchema, value: unknown): string | undefined {
    if (value === undefined) return undefined;
    if (!Value.Check(schema, value)) return undefined;
    const parsed: unknown = Value.Parse(schema, value);
    if (typeof parsed === "string") return parsed;
    return undefined;
}

function parseOptionalBoolean(schema: TSchema, value: unknown): boolean | undefined {
    if (value === undefined) return undefined;
    if (!Value.Check(schema, value)) return undefined;
    const parsed: unknown = Value.Parse(schema, value);
    if (typeof parsed === "boolean") return parsed;
    return undefined;
}

function parseOptionalNumber(schema: TSchema, value: unknown): number | undefined {
    if (value === undefined) return undefined;
    if (!Value.Check(schema, value)) return undefined;
    const parsed: unknown = Value.Parse(schema, value);
    if (typeof parsed === "number") return parsed;
    return undefined;
}

function formatSchemaPath(instancePath: string): string {
    if (instancePath.length === 0) return "root";
    return instancePath
        .slice(1)
        .split("/")
        .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
        .join(".");
}

function parseSettingsObject(value: unknown, settingsPath: string): Record<string, unknown> {
    const errors = [...Value.Errors(SettingsObjectSchema, value)];
    if (errors.length > 0) {
        const messages = errors
            .slice(0, 5)
            .map((error) => `${formatSchemaPath(error.instancePath)} ${error.message}`);
        let suffix = "";
        if (errors.length > messages.length) {
            suffix = `; and ${errors.length - messages.length} more`;
        }
        throw new Error(
            `${settingsPath} must contain a JSON object: ${messages.join("; ")}${suffix}`,
        );
    }
    return { ...(Value.Parse(SettingsObjectSchema, value) as Record<string, unknown>) };
}

function readMergedSettingsObject(): Record<string, unknown> {
    const context = settingsReadContext ?? { cwd: process.cwd(), projectTrusted: false };
    const manager = SettingsManager.create(context.cwd, getAgentDir(), {
        projectTrusted: context.projectTrusted,
    });
    return {
        ...(manager.getGlobalSettings() as Record<string, unknown>),
        ...(manager.getProjectSettings() as Record<string, unknown>),
    };
}

function withSettingsLock<T>(settingsPath: string, fn: () => T): T {
    const lockPath = `${settingsPath}.lock`;
    mkdirSync(dirname(lockPath), { recursive: true });

    const start = Date.now();
    while (true) {
        try {
            const fd = openSync(lockPath, "wx");
            try {
                writeFileSync(
                    fd,
                    `${JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() })}\n`,
                    "utf8",
                );
            } catch {
                // Ignore best-effort lock metadata.
            }

            try {
                return fn();
            } finally {
                try {
                    closeSync(fd);
                } catch {
                    // Ignore cleanup failures.
                }
                try {
                    unlinkSync(lockPath);
                } catch {
                    // Ignore cleanup failures.
                }
            }
        } catch (error: unknown) {
            if (getErrorCode(error) !== "EEXIST") throwError(error);

            try {
                const stat = statSync(lockPath);
                if (Date.now() - stat.mtimeMs > STALE_SETTINGS_LOCK_MS) {
                    unlinkSync(lockPath);
                    continue;
                }
            } catch {
                // Ignore stale-lock checks.
            }

            if (Date.now() - start > SETTINGS_LOCK_TIMEOUT_MS) {
                throw new Error(`Timed out waiting for lock: ${lockPath}`);
            }
            sleepSync(40 + Math.random() * 80);
        }
    }
}

function atomicWriteUtf8Sync(filePath: string, content: string): void {
    mkdirSync(dirname(filePath), { recursive: true });

    const tempPath = join(
        dirname(filePath),
        `.${filePath.split(/[\\/]/).pop() ?? "settings.json"}.tmp.${process.pid}.${Math.random()
            .toString(16)
            .slice(2)}`,
    );

    writeFileSync(tempPath, content, "utf8");

    try {
        renameSync(tempPath, filePath);
    } catch (error: unknown) {
        const code = getErrorCode(error);
        if (code === "EEXIST" || code === "EPERM") {
            try {
                unlinkSync(filePath);
            } catch {
                // Ignore missing target before retrying the rename.
            }
            renameSync(tempPath, filePath);
            return;
        }
        try {
            unlinkSync(tempPath);
        } catch {
            // Ignore cleanup failures.
        }
        throwError(error);
    }
}

function readSettingsObject(options?: { throwOnInvalid?: boolean }): Record<string, unknown> {
    const settingsPath = getSettingsPath();
    try {
        const raw = readFileSync(settingsPath, "utf8");
        return parseSettingsObject(JSON.parse(raw), settingsPath);
    } catch (error: unknown) {
        if (getErrorCode(error) === "ENOENT") return {};
        if (options?.throwOnInvalid === true) throwError(error);
        // Ignore malformed settings files while reading and fall back to defaults.
    }

    return {};
}

function updateSettingsObject(update: (settings: Record<string, unknown>) => void): void {
    const settingsPath = getSettingsPath();
    withSettingsLock(settingsPath, () => {
        const settings = readSettingsObject({ throwOnInvalid: true });
        update(settings);
        atomicWriteUtf8Sync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
    });
}

export function getPersistedMode(): TreeTimestampMode {
    if (cachedMode !== null) return cachedMode;

    const settings = readMergedSettingsObject();
    const configured = parseOptionalString(TreeTimestampModeSchema, settings[SETTINGS_KEY]);
    cachedMode = DEFAULT_MODE;
    if (isTreeTimestampMode(configured)) {
        cachedMode = configured;
    }
    return cachedMode;
}

export function getPersistedPreviewEnabled(): boolean {
    if (cachedPreviewEnabled !== null) return cachedPreviewEnabled;

    const settings = readMergedSettingsObject();
    cachedPreviewEnabled =
        parseOptionalBoolean(TreePreviewEnabledSchema, settings[PREVIEW_SETTINGS_KEY]) ?? false;
    return cachedPreviewEnabled;
}

export function getPersistedMaxVisibleLines(): number | null {
    if (cachedMaxVisibleLines !== undefined) return cachedMaxVisibleLines;

    const settings = readMergedSettingsObject();
    const configured = parseOptionalNumber(
        TreeMaxVisibleLinesSchema,
        settings[MAX_VISIBLE_LINES_SETTINGS_KEY],
    );
    cachedMaxVisibleLines = null;
    if (configured !== undefined && Number.isFinite(configured)) {
        cachedMaxVisibleLines = Math.max(MIN_VISIBLE_LINES, Math.floor(configured));
    }
    return cachedMaxVisibleLines;
}

export function getPersistedPreviewFullHeight(): boolean {
    if (cachedPreviewFullHeight !== undefined) return cachedPreviewFullHeight;

    const settings = readMergedSettingsObject();
    cachedPreviewFullHeight =
        parseOptionalBoolean(
            TreePreviewFullHeightSchema,
            settings[PREVIEW_FULL_HEIGHT_SETTINGS_KEY],
        ) ?? true;
    return cachedPreviewFullHeight;
}

export function getConfiguredThemeName(): string | undefined {
    if (cachedThemeNameLoaded) return cachedThemeName;

    const settings = readMergedSettingsObject();
    cachedThemeName = parseOptionalString(ThemeNameSchema, settings.theme);
    cachedThemeNameLoaded = true;
    return cachedThemeName;
}

function warnSettingsWriteFailed(error: unknown): void {
    let suffix = "";
    if (error instanceof Error && error.message.length > 0) {
        suffix = `: ${error.message}`;
    }
    console.warn(`[pi-tree] settings update was not saved${suffix}`);
}

export function persistPreviewEnabled(enabled: boolean): void {
    try {
        updateSettingsObject((settings) => {
            settings[PREVIEW_SETTINGS_KEY] = enabled;
        });
        cachedPreviewEnabled = enabled;
    } catch (error: unknown) {
        warnSettingsWriteFailed(error);
    }
}

export function persistMode(mode: TreeTimestampMode): void {
    try {
        updateSettingsObject((settings) => {
            settings[SETTINGS_KEY] = mode;
        });
        cachedMode = mode;
    } catch (error: unknown) {
        warnSettingsWriteFailed(error);
    }
}
