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


  it("status command reports invalid Server Base URL as last error", async () => {
    const commands = new Map();
    const pi = { registerCommand(name, command) { commands.set(name, command); } };
    await llamacppProvider(pi, { loadSettings: async () => parseLlamaCppSettings({ serverBaseUrl: "not a url" }) });
    const notifications = [];

    await commands.get("llamacpp").handler("status", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    assert.equal(notifications[0].level, "warning");
    assert.match(notifications[0].message, /Last Error: Invalid Server Base URL/);
  });


  it("list command reports invalid Server Base URL without throwing", async () => {
    const commands = new Map();
    const pi = { registerCommand(name, command) { commands.set(name, command); } };
    await llamacppProvider(pi, { loadSettings: async () => parseLlamaCppSettings({ serverBaseUrl: "not a url" }) });
    const notifications = [];

    await commands.get("llamacpp").handler("list", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    assert.equal(notifications[0].level, "warning");
    assert.match(notifications[0].message, /llamacpp Operational Status/);
    assert.match(notifications[0].message, /Last Error: Invalid Server Base URL/);
  });

  it("reload command reports invalid Server Base URL without throwing", async () => {
    const commands = new Map();
    const pi = { registerCommand(name, command) { commands.set(name, command); } };
    await llamacppProvider(pi, { loadSettings: async () => parseLlamaCppSettings({ serverBaseUrl: "not a url" }) });
    const notifications = [];

    await commands.get("llamacpp").handler("reload", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    assert.equal(notifications[0].level, "warning");
    assert.match(notifications[0].message, /llamacpp Operational Status/);
    assert.match(notifications[0].message, /Last Error: Invalid Server Base URL/);
  });

  it("start command reports invalid Server Base URL without throwing", async () => {
    const commands = new Map();
    const pi = { registerCommand(name, command) { commands.set(name, command); } };
    await llamacppProvider(pi, { loadSettings: async () => parseLlamaCppSettings({ serverBaseUrl: "not a url" }) });
    const notifications = [];

    await commands.get("llamacpp").handler("start", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    assert.equal(notifications[0].level, "warning");
    assert.match(notifications[0].message, /llamacpp Operational Status/);
    assert.match(notifications[0].message, /Last Error: Invalid Server Base URL/);
  });

  it("stop command reports invalid post-stop status load without throwing", async () => {
    const commands = new Map();
    const pi = { registerCommand(name, command) { commands.set(name, command); } };
    await llamacppProvider(pi, { loadSettings: async () => parseLlamaCppSettings({ serverBaseUrl: "not a url" }) });
    const notifications = [];

    await commands.get("llamacpp").handler("stop", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    assert.equal(notifications[0].level, "warning");
    assert.match(notifications[0].message, /llamacpp Operational Status/);
    assert.match(notifications[0].message, /Last Error: Invalid Server Base URL/);
  });


  it("status command refreshes reachability instead of reusing stale reachable cache", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    const commands = new Map();
    const fetchResults = [
      jsonResponse({ data: [{ id: "alive" }] }),
      new Error("router disappeared"),
    ];
    const pi = {
      registerCommand(name, command) { commands.set(name, command); },
      unregisterProvider() {},
      registerProvider() {},
    };

    await llamacppProvider(pi, {
      loadSettings: async () => settings,
      fetch: async () => {
        const next = fetchResults.shift();
        if (next instanceof Error) throw next;
        return next;
      },
    });

    const notifications = [];
    await commands.get("llamacpp").handler("status", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    assert.equal(notifications[0].level, "info");
    assert.match(notifications[0].message, /Router Reachable: no/);
    assert.match(notifications[0].message, /Provider Registered: no/);
    assert.match(notifications[0].message, /Last Error: router disappeared/);
  });
});


