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

describe("pi-llamacpp end-to-end diagnostics", () => {
  it("status/list/reload/start/stop expose diagnostic outcomes across fake router, process, and provider APIs", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-diagnostics-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[ready]\n[failed]\n[cold]\n");
    const settings = parseLlamaCppSettings({
      serverBaseUrl: "http://router.test",
      managedStart: true,
      modelPresetsFile: presetFile,
      timeouts: { startMs: 5, pollMs: 1, statusMs: 50, loadMs: 50, requestGateMs: 50 },
    });
    const commands = new Map();
    const notifications = [];
    const providerCalls = [];
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({ spawn: () => fakeProcess, sleep: async () => {} });
    const routerResponses = [
      new Error("ECONNREFUSED"),
      new Error("ECONNREFUSED"),
      jsonResponse({ data: [{ id: "ready", status: "loaded" }, { id: "failed", status: "failed", error: "gpu unavailable" }, { id: "cold", availability: "available", status: "not-loaded" }] }),
      jsonResponse({ data: [{ id: "ready", status: "loaded" }, { id: "failed", status: "failed", error: "gpu unavailable" }, { id: "cold", availability: "available", status: "not-loaded" }] }),
      jsonResponse({ data: [{ id: "ready", status: "loaded" }, { id: "failed", status: "failed", error: "gpu unavailable" }, { id: "cold", availability: "available", status: "not-loaded" }] }),
      jsonResponse({ data: [{ id: "ready", status: "loaded" }] }),
      jsonResponse({ data: [{ id: "ready", status: "loaded" }] }),
    ];

    await llamacppProvider({
      registerCommand(name, command) { commands.set(name, command); },
      unregisterProvider(name) { providerCalls.push(["unregister", name]); },
      registerProvider(name, provider) { providerCalls.push(["register", name, provider.models.map((model) => model.id)]); },
    }, {
      loadSettings: async () => settings,
      managedRouter: manager,
      fetch: async () => {
        const next = routerResponses.shift();
        if (next instanceof Error) throw next;
        return next;
      },
    });
    const ctx = { ui: { notify: (message, level) => notifications.push({ message, level }) } };

    await commands.get("llamacpp").handler("start", ctx);
    fakeProcess.emitStdout("router booted\n");
    fakeProcess.emitStderr("warming model cache\n");
    await commands.get("llamacpp").handler("status", ctx);
    await commands.get("llamacpp").handler("list", ctx);
    await commands.get("llamacpp").handler("reload", ctx);
    await commands.get("llamacpp").handler("stop", ctx);

    assert.match(notifications[0].message, /llamacpp start[\s\S]*Managed Llama Server Router started/);
    assert.match(notifications[1].message, /Model Status Counts:[\s\S]*loaded: 1[\s\S]*failed: 1[\s\S]*not-loaded: 1/);
    assert.match(notifications[1].message, /Managed stdout tail: router booted/);
    assert.match(notifications[1].message, /Managed stderr tail: warming model cache/);
    assert.match(notifications[2].message, /llamacpp list complete[\s\S]*Router Models: 1/);
    assert.match(notifications[2].message, /\| ready \| ready \| unknown \| loaded \| yes \|/);
    assert.match(notifications[3].message, /llamacpp reload complete[\s\S]*Provider Models: 1/);
    assert.match(notifications[4].message, /llamacpp stop[\s\S]*Stopped package-owned managed router process/);
    assert.ok(providerCalls.some((call) => JSON.stringify(call) === JSON.stringify(["register", "llamacpp", ["ready"]])));
  });

  it("normalizes auth, malformed model list, missing preset, timeout, load, and provider chat diagnostics without leaking resolved secrets", async () => {
    const secretSettings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", providerApiKey: "LLAMACPP_SECRET" }, { LLAMACPP_SECRET: "sk-secret-token" });

    await assert.rejects(
      new RouterClient(secretSettings, { fetch: async () => jsonResponse("denied Bearer sk-secret-token", { status: 401 }) }).fetchModelList(),
      /llamacpp router auth failed during model list: HTTP 401: denied Bearer \[redacted\]/,
    );
    await assert.rejects(
      new RouterClient(secretSettings, { fetch: async () => jsonResponse({ bad: [] }) }).fetchModelList(),
      /Router \/models response is missing a data\/models array/,
    );
    assert.doesNotMatch(formatOperationalStatus(createBaselineOperationalStatus(secretSettings, "Bearer sk-secret-token api_key=sk-secret-token")), /sk-secret-token/);

    const missingPreset = await new ManagedRouterProcess({ spawn: () => new FakeManagedProcess(), sleep: async () => {} })
      .start(parseLlamaCppSettings({ managedStart: true, modelPresetsFile: join(tmpdir(), "missing-diagnostics.ini") }), async () => { throw new Error("ECONNREFUSED"); });
    assert.match(missingPreset.message, /Configured Preset File not found/);

    const timeoutSettings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", timeouts: { loadMs: 1, requestGateMs: 1, pollMs: 1 } });
    await assert.rejects(
      new LoadGate(timeoutSettings, new RouterClient(timeoutSettings, { fetch: async (url) => String(url).endsWith("/models/load") ? jsonResponse({}) : jsonResponse({ data: [{ id: "slow", status: "loading" }] }) }), { sleep: async () => {} }).ensureRequestReady("slow"),
      /llamacpp load gate timed out for model slow/,
    );

    let provider;
    await llamacppProvider({ registerCommand() {}, unregisterProvider() {}, registerProvider(_name, config) { provider = config; } }, {
      loadSettings: async () => secretSettings,
      fetch: async () => jsonResponse({ data: [{ id: "ready", status: "loaded" }] }),
    });
    await assert.rejects(
      provider.streamSimple({ provider: "llamacpp", id: "ready", api: "llamacpp-openai-completions" }, { messages: [] }, { delegate: () => { throw new Error("chat failed token=sk-secret-token"); } }),
      /llamacpp provider chat failed after load gate for model ready: chat failed \[redacted\]/,
    );
  });

  it("redacts resolved non-pattern Provider API Key values across command and provider diagnostics", async () => {
    const secret = "secret1";
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", providerApiKey: "LLAMACPP_SECRET" }, { LLAMACPP_SECRET: secret });
    const commands = new Map();
    const notifications = [];
    let provider;
    const routerErrors = [
      jsonResponse(`router said ${secret}`, { status: 500 }),
      jsonResponse(`list said ${secret}`, { status: 500 }),
      jsonResponse(`reload said ${secret}`, { status: 500 }),
      jsonResponse(`start probe said ${secret}`, { status: 500 }),
    ];

    await llamacppProvider({
      registerCommand(name, command) { commands.set(name, command); },
      unregisterProvider() {},
      registerProvider(_name, config) { provider = config; },
    }, {
      loadSettings: async () => settings,
      fetch: async () => routerErrors.shift() ?? jsonResponse({ data: [{ id: "ready", status: "loaded" }] }),
    });
    const ctx = { ui: { notify: (message, level) => notifications.push({ message, level }) } };

    await commands.get("llamacpp").handler("status", ctx);
    await commands.get("llamacpp").handler("list", ctx);
    await commands.get("llamacpp").handler("reload", ctx);
    await commands.get("llamacpp").handler("start", ctx);

    const commandOutput = notifications.map((entry) => entry.message).join("\n---\n");
    assert.doesNotMatch(commandOutput, /secret1/);
    assert.match(commandOutput, /list said \[redacted\]/);
    assert.match(commandOutput, /reload said \[redacted\]/);
    assert.match(commandOutput, /start probe said \[redacted\]/);
    assert.doesNotMatch(commandOutput, /router said/);

    await assert.rejects(
      provider.streamSimple({ provider: "llamacpp", id: "ready", api: "llamacpp-openai-completions" }, { messages: [] }, { delegate: () => { throw new Error(`provider echoed ${secret}`); } }),
      /llamacpp provider chat failed after load gate for model ready: provider echoed \[redacted\]/,
    );
  });

  it("normalizes HTTP 200 invalid Router Model List JSON as package diagnostics", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", providerApiKey: "local-secret-123" });

    await assert.rejects(
      new RouterClient(settings, { fetch: async () => invalidJsonResponse("{ bad json local-secret-123") }).fetchModelList(),
      /Router \/models malformed response: \{ bad json \[redacted\]/,
    );
  });


  it("redacts resolved non-pattern Provider API Key from failed load gate model diagnostics", async () => {
    const secret = "local-secret-abc123";
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", providerApiKey: "LLAMACPP_SECRET" }, { LLAMACPP_SECRET: secret });

    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, {
        fetch: async () => jsonResponse({ data: [{ id: "bad", status: "failed", error: `router echoed ${secret}` }] }),
      }), { sleep: async () => {} }).ensureRequestReady("bad"),
      /llamacpp load failed for model bad: router echoed \[redacted\]/,
    );
  });

  it("redacts resolved non-pattern Provider API Key from managed process log tails in status", () => {
    const secret = "local-secret-abc123";
    const settings = parseLlamaCppSettings({ providerApiKey: "LLAMACPP_SECRET" }, { LLAMACPP_SECRET: secret });
    const status = formatOperationalStatus({
      settings,
      routerReachable: false,
      providerRegistered: false,
      providerModelCount: 0,
      routerOwnership: "managed",
      managedProcess: { state: "running", pid: 123, stdoutTail: [], stderrTail: [] },
      managedLogTail: { stdout: [`stdout ${secret}`], stderr: [`stderr ${secret}`] },
    });

    assert.doesNotMatch(status, /local-secret-abc123/);
    assert.match(status, /Managed stdout tail: stdout \[redacted\]/);
    assert.match(status, /Managed stderr tail: stderr \[redacted\]/);
  });

  it("redacts resolved non-pattern Provider API Key from router-supplied list fields", async () => {
    const secret = "local-secret-abc123";
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", providerApiKey: "LLAMACPP_SECRET" }, { LLAMACPP_SECRET: secret });
    const commands = new Map();
    const notifications = [];
    const responses = [
      jsonResponse({ data: [{ id: "ready", status: "loaded" }] }),
      jsonResponse({ data: [{ id: "model", name: `name ${secret}`, availability: `available ${secret}`, status: `failed ${secret}` }] }),
    ];

    await llamacppProvider({
      registerCommand(name, command) { commands.set(name, command); },
      unregisterProvider() {},
      registerProvider() {},
    }, {
      loadSettings: async () => settings,
      fetch: async () => responses.shift(),
    });

    await commands.get("llamacpp").handler("list", { ui: { notify: (message, level) => notifications.push({ message, level }) } });

    assert.doesNotMatch(notifications[0].message, /local-secret-abc123/);
    assert.match(notifications[0].message, /available \[redacted\]/);
    assert.match(notifications[0].message, /failed \[redacted\]/);
  });

  it("does not report expected post-stop ECONNREFUSED as a failed stop", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-post-stop-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", managedStart: true, modelPresetsFile: presetFile });
    const commands = new Map();
    const notifications = [];
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({ spawn: () => fakeProcess, sleep: async () => {} });
    const responses = [
      jsonResponse({ data: [{ id: "ready", status: "loaded" }] }),
      new Error("ECONNREFUSED"),
    ];

    await llamacppProvider({
      registerCommand(name, command) { commands.set(name, command); },
      unregisterProvider() {},
      registerProvider() {},
    }, {
      loadSettings: async () => settings,
      managedRouter: manager,
      fetch: async () => {
        const next = responses.shift();
        if (next instanceof Error) throw next;
        return next;
      },
    });
    let startProbe = 0;
    await manager.start(settings, async () => {
      startProbe += 1;
      if (startProbe === 1) throw new Error("ECONNREFUSED");
      return jsonResponse({ data: [{ id: "ready", status: "loaded" }] });
    });

    await commands.get("llamacpp").handler("stop", { ui: { notify: (message, level) => notifications.push({ message, level }) } });

    assert.equal(notifications[0].level, "info");
    assert.match(notifications[0].message, /Stopped package-owned managed router process/);
    assert.doesNotMatch(notifications[0].message, /Last Error: ECONNREFUSED/);
  });

  it("normalizes HTTP 200 empty invalid Router Model List JSON without parser internals", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", providerApiKey: "local-secret-123" });

    await assert.rejects(
      new RouterClient(settings, { fetch: async () => invalidJsonResponse("") }).fetchModelList(),
      (error) => {
        assert.match(error.message, /Router \/models malformed response: empty response body/);
        assert.doesNotMatch(error.message, /Unexpected end of JSON input/);
        return true;
      },
    );
  });

  it("does not value-redact the low-entropy default Provider API Key", () => {
    const status = formatOperationalStatus(createBaselineOperationalStatus(DEFAULT_LLAMACPP_SETTINGS, "default llamacpp key is intentionally named llamacpp"));

    assert.match(status, /default llamacpp key is intentionally named llamacpp/);
  });
});
