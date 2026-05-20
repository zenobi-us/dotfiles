// @ts-nocheck
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import llamacppProvider from "./index.ts";
import { refreshProviderModels } from "./provider-runtime.ts";
import {
  DEFAULT_LLAMACPP_SETTINGS,
  createBaselineOperationalStatus,
  deriveProviderBaseUrl,
  parseLlamaCppSettings,
  resolveProviderApiKey,
} from "./settings-module.ts";
import {
  formatOperationalStatus,
  formatRouterModelList,
  normalizeRouterModelList,
} from "./model-presentation.ts";
import { RouterClient } from "./router-client.ts";
import { PresetFileReader, validateManagedServerStartPreparation } from "./preset-file-reader.ts";
import { ManagedRouterProcess } from "./managed-router-process.ts";
import { LoadGate } from "./load-gate.ts";
import { FakeManagedProcess, invalidJsonResponse, jsonResponse, waitForAbort } from "./test-helpers.ts";

describe("pi-llamacpp Preset Metadata", () => {
  it("reports Configured Preset File presence and missing state for Operational Status", () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-presets-"));
    const presentPath = join(dir, "models.ini");
    const missingPath = join(dir, "missing.ini");
    writeFileSync(presentPath, "[alpha]\n-c=4096\n");

    assert.equal(PresetFileReader.read(presentPath).exists, true);
    const missing = PresetFileReader.read(missingPath);
    assert.equal(missing.exists, false);
    assert.match(missing.error, /Configured Preset File not found/);

    const status = createBaselineOperationalStatus(parseLlamaCppSettings({ configuredPresetFilePath: missingPath }));
    assert.match(formatOperationalStatus(status), /Preset File: missing/);
    assert.match(formatOperationalStatus(status), /Configured Preset File not found/);
  });

  it("blocks managed server start preparation when configured preset file is missing", () => {
    const settings = parseLlamaCppSettings({ configuredPresetFilePath: join(tmpdir(), "does-not-exist.ini") });
    const result = validateManagedServerStartPreparation(settings);

    assert.equal(result.canStart, false);
    assert.match(result.error, /Configured Preset File not found/);
  });

  it("parses INI sections as Model Presets and normalizes documented metadata aliases without mutating runtime args", () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-presets-"));
    const file = join(dir, "models.ini");
    writeFileSync(file, [
      "[short]",
      "-c=4096",
      "-n=512",
      "-rea=on",
      "--model=/models/short.gguf",
      "",
      "[long]",
      "--ctx-size=8192",
      "--predict=1024",
      "--reasoning=auto",
      "--reasoning-format=deepseek",
      "",
      "[n-predict]",
      "--n-predict=1536",
      "--reasoning-format=deepseek-legacy",
      "",
      "[env]",
      "LLAMA_ARG_CTX_SIZE=16384",
      "LLAMA_ARG_N_PREDICT=2048",
      "LLAMA_ARG_REASONING=off",
    ].join("\n"));

    const result = PresetFileReader.read(file);

    assert.equal(result.exists, true);
    assert.deepEqual(result.presets.map((preset) => preset.id), ["short", "long", "n-predict", "env"]);
    assert.deepEqual(result.presets.map((preset) => preset.metadata), [
      { contextWindow: 4096, maxTokens: 512, reasoning: true, reasoningMode: "on" },
      { contextWindow: 8192, maxTokens: 1024, reasoning: true, reasoningMode: "auto", reasoningFormat: "deepseek" },
      { maxTokens: 1536, reasoning: true, reasoningFormat: "deepseek-legacy" },
      { contextWindow: 16384, maxTokens: 2048, reasoning: false, reasoningMode: "off" },
    ]);
    assert.deepEqual(result.presets[0].runtimeArgs, {
      "-c": "4096",
      "-n": "512",
      "-rea": "on",
      "--model": "/models/short.gguf",
    });
  });

  it("does not treat undocumented -r as Preset Metadata reasoning", () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-presets-"));
    const file = join(dir, "models.ini");
    writeFileSync(file, "[not-reasoning]\n-r=true\n--reasoning=on\n");

    const result = PresetFileReader.read(file);

    assert.deepEqual(result.presets[0].metadata, { reasoning: true, reasoningMode: "on" });
    assert.deepEqual(result.presets[0].runtimeArgs, {
      "-r": "true",
      "--reasoning": "on",
    });
    assert.equal(result.warnings.length, 0);
  });

  it("reports invalid Preset Metadata values without changing runtime args", () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-presets-"));
    const file = join(dir, "models.ini");
    writeFileSync(file, "[bad]\n--ctx-size=huge\n--n-predict=-1\n--reasoning=maybe\n");

    const result = PresetFileReader.read(file);

    assert.deepEqual(result.presets[0].metadata, {});
    assert.deepEqual(result.presets[0].runtimeArgs, {
      "--ctx-size": "huge",
      "--n-predict": "-1",
      "--reasoning": "maybe",
    });
    assert.equal(result.warnings.length, 3);
  });

  it("enriches only Provider Models whose Router Model List IDs match Model Presets", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-presets-"));
    const file = join(dir, "models.ini");
    writeFileSync(file, "[match]\n--ctx-size=8192\n--n-predict=1024\n--reasoning=on\n\n[unmatched]\n--ctx-size=32768\n");
    const settings = parseLlamaCppSettings({ configuredPresetFilePath: file });
    let registeredModels = [];

    await refreshProviderModels({
      unregisterProvider() {},
      registerProvider(_name, provider) { registeredModels = provider.models; },
    }, settings, new RouterClient(settings, {
      fetch: async () => jsonResponse({ data: [{ id: "match" }, { id: "router-only" }] }),
    }));

    assert.deepEqual(registeredModels.map((model) => model.id), ["match", "router-only"]);
    assert.equal(registeredModels[0].contextWindow, 8192);
    assert.equal(registeredModels[0].maxTokens, 1024);
    assert.equal(registeredModels[0].reasoning, true);
    assert.equal(registeredModels[1].contextWindow, 128000);
  });
});

