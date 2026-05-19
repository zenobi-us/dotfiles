import assert from "node:assert/strict";
import { describe, it } from "node:test";

import llamacppProvider, {
  DEFAULT_LLAMACPP_SETTINGS,
  deriveProviderBaseUrl,
  formatOperationalStatus,
  parseLlamaCppSettings,
  resolveProviderApiKey,
} from "./index.ts";

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

describe("pi-llamacpp Provider API Key resolution", () => {
  it("resolves literal values and environment variable names only", () => {
    const env = { LLAMACPP_API_KEY: "env-secret" };

    assert.deepEqual(resolveProviderApiKey("literal-secret", env), {
      kind: "literal",
      value: "literal-secret",
    });
    assert.deepEqual(resolveProviderApiKey("LLAMACPP_API_KEY", env), {
      kind: "env",
      envName: "LLAMACPP_API_KEY",
      value: "env-secret",
    });

    assert.deepEqual(resolveProviderApiKey("MISSING_LLAMACPP_API_KEY", env), {
      kind: "missing-env",
      envName: "MISSING_LLAMACPP_API_KEY",
      value: "MISSING_LLAMACPP_API_KEY",
      error: "Provider API Key environment variable MISSING_LLAMACPP_API_KEY is not set.",
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

describe("pi-llamacpp status baseline", () => {
  it("reports Operational Status when no router is reachable", () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://localhost:8080" });
    const status = formatOperationalStatus({
      settings,
      routerReachable: false,
      providerRegistered: false,
      providerModelCount: 0,
      lastError: "Router discovery not implemented in this baseline slice.",
    });

    assert.match(status, /Operational Status/);
    assert.match(status, /Router Reachable: no/);
    assert.match(status, /Provider Registered: no/);
    assert.match(status, /Provider Models: 0/);
    assert.match(status, /Provider Base URL: http:\/\/localhost:8080\/v1/);
    assert.match(status, /startMs: 30000/);
    assert.match(status, /Last Error: Router discovery not implemented/);
  });

  it("loads extension, registers status command, and registers no Provider Models before router discovery", async () => {
    const commands = new Map();
    const pi = {
      registerCommand(name, command) {
        commands.set(name, command);
      },
      registerProvider() {
        throw new Error("Provider must not be registered in baseline no-router slice");
      },
    };

    await llamacppProvider(pi);

    assert.equal(commands.has("llamacpp"), true);
    const notifications = [];
    await commands.get("llamacpp").handler("status", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    assert.equal(notifications[0].level, "info");
    assert.match(notifications[0].message, /Operational Status/);
    assert.match(notifications[0].message, /Router Reachable: no/);
  });
});
