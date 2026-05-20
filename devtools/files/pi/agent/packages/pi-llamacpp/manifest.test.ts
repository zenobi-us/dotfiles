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

describe("pi-llamacpp package manifest", () => {
  it("declares the extension entrypoint and Pi peer dependencies", () => {
    const manifest = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

    assert.equal(manifest.type, "module");
    assert.equal(manifest.main, "index.ts");
    assert.deepEqual(manifest.pi?.extensions, ["index.ts"]);
    assert.match(manifest.keywords.join(" "), /pi-package/);
    assert.equal(manifest.peerDependencies?.["@mariozechner/pi-coding-agent"], "*");
    assert.equal(manifest.peerDependencies?.["@mariozechner/pi-ai"], "*");
    assert.equal(manifest.dependencies && Object.keys(manifest.dependencies).length, 0);
  });
});
