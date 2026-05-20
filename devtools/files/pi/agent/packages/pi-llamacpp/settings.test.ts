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

describe("pi-llamacpp settings baseline", () => {
  it("parses package settings and derives provider base URL safely", () => {
    const settings = parseLlamaCppSettings({
      serverBaseUrl: "http://localhost:8080/",
      serverBinaryPath: "/opt/llama/llama-server",
      configuredPresetFilePath: "/models/router.ini",
      providerApiKey: "local-key",
      loadOnSelect: true,
      stopOnQuit: true,
      timeouts: {
        startMs: 1000,
        loadMs: 2000,
        pollMs: 3000,
        requestGateMs: 4000,
        statusMs: 5000,
      },
    });

    assert.equal(settings.serverBaseUrl, "http://localhost:8080");
    assert.equal(settings.providerBaseUrl, "http://localhost:8080/v1");
    assert.equal(settings.serverBinaryPath, "/opt/llama/llama-server");
    assert.equal(settings.configuredPresetFilePath, "/models/router.ini");
    assert.equal(settings.providerApiKey.value, "local-key");
    assert.equal(settings.loadOnSelect, true);
    assert.equal(settings.stopOnQuit, true);
    assert.deepEqual(settings.timeouts, {
      startMs: 1000,
      loadMs: 2000,
      pollMs: 3000,
      requestGateMs: 4000,
      statusMs: 5000,
    });
  });

  it("uses defaults for absent settings", () => {
    assert.deepEqual(parseLlamaCppSettings({}), DEFAULT_LLAMACPP_SETTINGS);
  });

  it("appends /v1 once for trailing slash and existing v1 inputs", () => {
    assert.equal(deriveProviderBaseUrl("http://127.0.0.1:8080/"), "http://127.0.0.1:8080/v1");
    assert.equal(deriveProviderBaseUrl("http://127.0.0.1:8080/v1"), "http://127.0.0.1:8080/v1");
  });
});

