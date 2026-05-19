import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import llamacppProvider, {
  DEFAULT_LLAMACPP_SETTINGS,
  createBaselineOperationalStatus,
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


  it("surfaces missing Provider API Key environment variables as the baseline status last error", () => {
    const status = createBaselineOperationalStatus(parseLlamaCppSettings({ providerApiKey: "MISSING_LLAMACPP_API_KEY" }, {}));

    assert.equal(status.lastError, "Provider API Key environment variable MISSING_LLAMACPP_API_KEY is not set.");
    assert.match(formatOperationalStatus(status), /Last Error: Provider API Key environment variable MISSING_LLAMACPP_API_KEY is not set\./);
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


  it("status command reports configured package settings", async () => {
    const commands = new Map();
    const configuredSettings = parseLlamaCppSettings({
      serverBaseUrl: "http://example.test:9090/",
      serverBinaryPath: "/usr/local/bin/llama-server",
      configuredPresetFilePath: "/tmp/presets.ini",
      providerApiKey: "env:lower_case_key",
      loadOnSelect: true,
      stopOnQuit: true,
      timeouts: {
        startMs: 111,
        loadMs: 222,
        pollMs: 333,
        requestGateMs: 444,
        statusMs: 555,
      },
    }, { lower_case_key: "secret" });
    const pi = {
      registerCommand(name, command) {
        commands.set(name, command);
      },
    };

    await llamacppProvider(pi, { loadSettings: async () => configuredSettings });

    const notifications = [];
    await commands.get("llamacpp").handler("status", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    const message = notifications[0].message;
    assert.match(message, /Server Base URL: http:\/\/example.test:9090/);
    assert.match(message, /Provider Base URL: http:\/\/example.test:9090\/v1/);
    assert.match(message, /Server Binary Path: \/usr\/local\/bin\/llama-server/);
    assert.match(message, /Configured Preset File: \/tmp\/presets.ini/);
    assert.match(message, /Provider API Key: env:lower_case_key/);
    assert.match(message, /loadOnSelect: yes/);
    assert.match(message, /stopOnQuit: yes/);
    assert.match(message, /startMs: 111/);
    assert.match(message, /loadMs: 222/);
    assert.match(message, /pollMs: 333/);
    assert.match(message, /requestGateMs: 444/);
    assert.match(message, /statusMs: 555/);
  });


  it("status command reads configured package settings from project config", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "pi-llamacpp-"));
    mkdirSync(join(projectDir, ".git"));
    mkdirSync(join(projectDir, ".pi"));
    writeFileSync(join(projectDir, ".pi", "llamacpp.config.json"), JSON.stringify({
      serverBaseUrl: "http://configured.test:7070/",
      serverBinaryPath: "/opt/llama-server",
      configuredPresetFilePath: "/opt/presets.ini",
      timeouts: { statusMs: 777 },
    }));

    const commands = new Map();
    const pi = {
      registerCommand(name, command) {
        commands.set(name, command);
      },
    };

    await llamacppProvider(pi);

    const notifications = [];
    await commands.get("llamacpp").handler("status", {
      cwd: projectDir,
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    const message = notifications[0].message;
    assert.match(message, /Server Base URL: http:\/\/configured.test:7070/);
    assert.match(message, /Provider Base URL: http:\/\/configured.test:7070\/v1/);
    assert.match(message, /Server Binary Path: \/opt\/llama-server/);
    assert.match(message, /Configured Preset File: \/opt\/presets.ini/);
    assert.match(message, /statusMs: 777/);
  });
});
