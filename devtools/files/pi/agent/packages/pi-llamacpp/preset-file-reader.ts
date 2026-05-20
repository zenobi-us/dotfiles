import { existsSync, readFileSync } from "node:fs";
import type {
  LlamaCppSettings,
  ManagedServerStartPreparation,
  ModelPreset,
  PresetFileReadResult,
  PresetFileStatus,
} from "./types.js";
import { normalizeConfiguredPresetFilePath } from "./settings-module.js";

export class PresetFileReader {
  static read(path: string): PresetFileReadResult {
    const resolvedPath = normalizeConfiguredPresetFilePath(path);
    if (!existsSync(resolvedPath)) {
      return {
        path,
        exists: false,
        presets: [],
        warnings: [],
        error: `Configured Preset File not found: ${path}`,
      };
    }

    const warnings: string[] = [];
    const presets = parsePresetIni(readFileSync(resolvedPath, "utf8"), warnings);
    return { path, exists: true, presets, warnings };
  }
}

export function validateManagedServerStartPreparation(settings: LlamaCppSettings): ManagedServerStartPreparation {
  const presetFile = toPresetFileStatus(PresetFileReader.read(settings.configuredPresetFilePath));
  if (!presetFile.exists) {
    return { canStart: false, presetFile, error: presetFile.error };
  }
  return { canStart: true, presetFile };
}

export function toPresetFileStatus(result: PresetFileReadResult): PresetFileStatus {
  const status: PresetFileStatus = {
    path: result.path,
    exists: result.exists,
    presetCount: result.presets.length,
    warnings: result.warnings,
  };
  if (result.error !== undefined) status.error = result.error;
  return status;
}

function parsePresetIni(text: string, warnings: string[]): ModelPreset[] {
  const presets: ModelPreset[] = [];
  let current: ModelPreset | undefined;

  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    const sectionMatch = /^\[([^\]]+)\]$/u.exec(line);
    if (sectionMatch) {
      current = { id: sectionMatch[1].trim(), runtimeArgs: {}, metadata: {} };
      if (current.id) presets.push(current);
      continue;
    }
    if (!current) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = stripIniValueComment(line.slice(separatorIndex + 1).trim());
    if (!key) continue;
    current.runtimeArgs[key] = value;
    normalizePresetMetadataValue(current, key, value, warnings);
  }

  return presets;
}

function normalizePresetMetadataValue(preset: ModelPreset, key: string, value: string, warnings: string[]): void {
  const canonicalKey = normalizePresetMetadataKey(key);
  if (!canonicalKey) return;

  if (canonicalKey === "reasoningMode") {
    const parsed = parseReasoningMode(value);
    if (parsed === undefined) {
      warnings.push(`Invalid reasoning metadata for preset ${preset.id}: ${value}`);
      return;
    }
    preset.metadata.reasoningMode = parsed;
    preset.metadata.reasoning = parsed !== "off";
    return;
  }

  if (canonicalKey === "reasoningFormat") {
    const parsed = parseReasoningFormat(value);
    if (parsed === undefined) {
      warnings.push(`Invalid reasoning format metadata for preset ${preset.id}: ${value}`);
      return;
    }
    preset.metadata.reasoningFormat = parsed;
    preset.metadata.reasoning = parsed !== "none";
    return;
  }

  const parsed = parseMetadataPositiveInteger(value);
  if (parsed === undefined) {
    warnings.push(`Invalid ${canonicalKey} metadata for preset ${preset.id}: ${value}`);
    return;
  }
  if (canonicalKey === "contextWindow") preset.metadata.contextWindow = parsed;
  if (canonicalKey === "maxTokens") preset.metadata.maxTokens = parsed;
}

function normalizePresetMetadataKey(key: string): "contextWindow" | "maxTokens" | "reasoningMode" | "reasoningFormat" | undefined {
  const normalized = key.trim();
  if (["-c", "--ctx-size", "LLAMA_ARG_CTX_SIZE"].includes(normalized)) return "contextWindow";
  if (["-n", "--predict", "--n-predict", "LLAMA_ARG_N_PREDICT"].includes(normalized)) return "maxTokens";
  if (["-rea", "--reasoning", "LLAMA_ARG_REASONING"].includes(normalized)) return "reasoningMode";
  if (["--reasoning-format"].includes(normalized)) return "reasoningFormat";
  return undefined;
}

function parseMetadataPositiveInteger(value: string): number | undefined {
  if (!/^\d+$/u.test(value)) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseReasoningMode(value: string): "on" | "off" | "auto" | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === "on" || normalized === "off" || normalized === "auto") return normalized;
  return undefined;
}

function parseReasoningFormat(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized || /\s/u.test(normalized)) return undefined;
  return normalized;
}

function stripIniValueComment(value: string): string {
  return value.replace(/\s+[;#].*$/u, "").trim();
}
