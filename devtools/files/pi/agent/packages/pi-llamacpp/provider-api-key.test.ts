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

describe("pi-llamacpp Provider API Key resolution", () => {
  it("resolves literal values and environment variable names deterministically", () => {
    const env = { LLAMACPP_API_KEY: "env-secret", lower_case_key: "lower-secret" };

    assert.deepEqual(resolveProviderApiKey("literal-secret", env), {
      kind: "literal",
      value: "literal-secret",
    });
    assert.deepEqual(resolveProviderApiKey("LLAMACPP_API_KEY", env), {
      kind: "env",
      envName: "LLAMACPP_API_KEY",
      value: "env-secret",
    });
    assert.deepEqual(resolveProviderApiKey("env:lower_case_key", env), {
      kind: "env",
      envName: "lower_case_key",
      value: "lower-secret",
    });
    assert.deepEqual(resolveProviderApiKey("lower_case_key", {}), {
      kind: "literal",
      value: "lower_case_key",
    });

    assert.deepEqual(resolveProviderApiKey("MISSING_LLAMACPP_API_KEY", env), {
      kind: "missing-env",
      envName: "MISSING_LLAMACPP_API_KEY",
      value: "MISSING_LLAMACPP_API_KEY",
      error: "Provider API Key environment variable MISSING_LLAMACPP_API_KEY is not set.",
    });
    assert.deepEqual(resolveProviderApiKey("env:missing_lower_case_key", env), {
      kind: "missing-env",
      envName: "missing_lower_case_key",
      value: "env:missing_lower_case_key",
      error: "Provider API Key environment variable missing_lower_case_key is not set.",
    });
  });

  it("rejects shell-command-style Provider API Key values", () => {
    assert.deepEqual(resolveProviderApiKey("$(pass show llama)", {}), {
      kind: "unsupported",
      value: "$(pass show llama)",
      error: "Provider API Key shell commands are unsupported; use a literal value or environment variable name.",
    });
  });
});

