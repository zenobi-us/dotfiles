// @ts-nocheck
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
  RouterClient,
  formatRouterModelList,
  normalizeRouterModelList,
  PresetFileReader,
  refreshProviderModels,
  validateManagedServerStartPreparation,
  ManagedRouterProcess,
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


describe("pi-llamacpp external router discovery", () => {
  it("maps Router Model List responses and sends bearer auth for management requests", async () => {
    const settings = parseLlamaCppSettings({
      serverBaseUrl: "http://router.test/",
      providerApiKey: "secret-token",
    });
    const requests = [];
    const client = new RouterClient(settings, {
      fetch: async (url, init) => {
        requests.push({ url: String(url), headers: init?.headers });
        return jsonResponse({
          data: [
            { id: "tiny", object: "model", status: "loaded" },
            { id: "sleepy", display_name: "Sleepy Model", state: "sleeping" },
            { model: "cold", status: "not-loaded" },
          ],
        });
      },
    });

    const result = await client.fetchModelList();

    assert.deepEqual(result.models.map((model) => ({ id: model.id, name: model.name, status: model.status, loaded: model.loaded })), [
      { id: "tiny", name: "tiny", status: "loaded", loaded: true },
      { id: "sleepy", name: "Sleepy Model", status: "sleeping", loaded: true },
      { id: "cold", name: "cold", status: "not-loaded", loaded: false },
    ]);
    assert.equal(requests[0].url, "http://router.test/models");
    assert.equal(requests[0].headers.Authorization, "Bearer secret-token");
  });

  it("refreshes Provider Models with unregister before register after compatible discovery", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", providerApiKey: "local" });
    const calls = [];
    const pi = {
      unregisterProvider(name) { calls.push(["unregister", name]); },
      registerProvider(name, provider) { calls.push(["register", name, provider.models.map((model) => model.id)]); },
    };
    const status = await refreshProviderModels(pi, settings, new RouterClient(settings, {
      fetch: async () => jsonResponse({ data: [{ id: "a", status: "loaded" }, { id: "b", status: "available" }] }),
    }));

    assert.equal(status.routerReachable, true);
    assert.equal(status.providerRegistered, true);
    assert.equal(status.providerModelCount, 2);
    assert.deepEqual(calls, [
      ["unregister", "llamacpp"],
      ["register", "llamacpp", ["a", "b"]],
    ]);
  });

  it("does not register Provider Models when model list retrieval is incompatible", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    const calls = [];
    const status = await refreshProviderModels({
      unregisterProvider(name) { calls.push(["unregister", name]); },
      registerProvider(name) { calls.push(["register", name]); },
    }, settings, new RouterClient(settings, {
      fetch: async () => jsonResponse({ bad: [] }),
    }));

    assert.equal(status.routerReachable, false);
    assert.equal(status.providerRegistered, false);
    assert.equal(status.providerModelCount, 0);
    assert.match(status.lastError, /missing a data\/models array/);
    assert.deepEqual(calls, [["unregister", "llamacpp"]]);
  });


  it("unregisters stale Provider Models before failed incompatible refresh", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    const calls = [];
    const status = await refreshProviderModels({
      unregisterProvider(name) { calls.push(["unregister", name]); },
      registerProvider(name) { calls.push(["register", name]); },
    }, settings, new RouterClient(settings, {
      fetch: async () => jsonResponse({ bad: [] }),
    }));

    assert.equal(status.routerReachable, false);
    assert.equal(status.providerRegistered, false);
    assert.equal(status.providerModelCount, 0);
    assert.match(status.lastError, /missing a data\/models array/);
    assert.deepEqual(calls, [["unregister", "llamacpp"]]);
  });

  it("reports unsupported provider API instead of false registration success", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    const status = await refreshProviderModels({}, settings, new RouterClient(settings, {
      fetch: async () => jsonResponse({ data: [{ id: "a" }] }),
    }));

    assert.equal(status.routerReachable, true);
    assert.equal(status.providerRegistered, false);
    assert.equal(status.providerModelCount, 0);
    assert.equal(status.routerModelCount, 1);
    assert.match(status.lastError, /Provider API unsupported/);
  });

  it("registers an empty current Provider Model set after a compatible empty router list", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    const calls = [];
    const status = await refreshProviderModels({
      unregisterProvider(name) { calls.push(["unregister", name]); },
      registerProvider(name, provider) { calls.push(["register", name, provider.models]); },
    }, settings, new RouterClient(settings, {
      fetch: async () => jsonResponse({ data: [] }),
    }));

    assert.equal(status.routerReachable, true);
    assert.equal(status.providerModelCount, 0);
    assert.deepEqual(calls, [
      ["unregister", "llamacpp"],
      ["register", "llamacpp", []],
    ]);
  });

  it("formats /llamacpp list from Router Model List shape", () => {
    const models = normalizeRouterModelList({ data: [{ id: "alpha", status: "loaded" }, { id: "beta" }] });
    const output = formatRouterModelList(models);

    assert.match(output, /llamacpp Router Model List/);
    assert.match(output, /\| alpha \| alpha \| loaded \| yes \|/);
    assert.match(output, /\| beta \| beta \| unknown \| no \|/);
  });

  it("reload drops stale Provider Models by unregistering before registering the latest router list", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    const commands = new Map();
    const calls = [];
    const responses = [
      { data: [{ id: "old" }] },
      { data: [{ id: "new" }] },
    ];
    const pi = {
      registerCommand(name, command) { commands.set(name, command); },
      unregisterProvider(name) { calls.push(["unregister", name]); },
      registerProvider(name, provider) { calls.push(["register", name, provider.models.map((model) => model.id)]); },
    };

    await llamacppProvider(pi, {
      loadSettings: async () => settings,
      fetch: async () => jsonResponse(responses.shift()),
    });
    const notifications = [];
    await commands.get("llamacpp").handler("reload", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    assert.deepEqual(calls, [
      ["unregister", "llamacpp"],
      ["register", "llamacpp", ["old"]],
      ["unregister", "llamacpp"],
      ["register", "llamacpp", ["new"]],
    ]);
    assert.match(notifications[0].message, /Provider Models: 1/);
  });

  it("list command fetches current Router Model List output without Pi restart", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    const commands = new Map();
    const responses = [
      { data: [{ id: "startup" }] },
      { data: [{ id: "runtime", status: "loaded" }] },
    ];
    const pi = {
      registerCommand(name, command) { commands.set(name, command); },
      unregisterProvider() {},
      registerProvider() {},
    };

    await llamacppProvider(pi, {
      loadSettings: async () => settings,
      fetch: async () => jsonResponse(responses.shift()),
    });
    const notifications = [];
    await commands.get("llamacpp").handler("list", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    assert.equal(notifications[0].level, "info");
    assert.match(notifications[0].message, /llamacpp Router Model List/);
    assert.match(notifications[0].message, /\| runtime \| runtime \| loaded \| yes \|/);
    assert.doesNotMatch(notifications[0].message, /startup/);
  });
});


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

describe("ManagedRouterProcess lifecycle", () => {
  it("starts managed router with configured binary, preset file, base URL, and bounded logs", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-managed-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n--ctx-size=4096\n");
    const spawned = [];
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({
      spawn: (command, args) => {
        spawned.push({ command, args });
        return fakeProcess;
      },
      sleep: async () => {},
      maxLogLines: 2,
    });
    const settings = parseLlamaCppSettings({
      managedStart: true,
      serverBinaryPath: "/opt/llama/llama-server",
      modelPresetsFile: presetFile,
      serverBaseUrl: "http://127.0.0.1:8099",
      timeouts: { startMs: 5, pollMs: 1 },
    });
    let probes = 0;

    const result = await manager.start(settings, async () => {
      probes += 1;
      if (probes < 2) throw new Error("not reachable yet");
    });
    fakeProcess.emitStdout("one\ntwo\nthree\n");
    fakeProcess.emitStderr("err1\nerr2\nerr3\n");

    assert.equal(result.ownership, "managed");
    assert.equal(spawned[0].command, "/opt/llama/llama-server");
    assert.deepEqual(spawned[0].args, [
      "--host", "127.0.0.1",
      "--port", "8099",
      "--model-presets", presetFile,
    ]);
    assert.deepEqual(manager.status().process?.stdoutTail, ["two", "three"]);
    assert.deepEqual(manager.status().process?.stderrTail, ["err2", "err3"]);
  });


  it("adopts a reachable router as External Router and refuses to stop it", async () => {
    const manager = new ManagedRouterProcess({
      spawn: () => { throw new Error("must not spawn"); },
      sleep: async () => {},
    });
    const settings = parseLlamaCppSettings({ managedStart: true });

    const started = await manager.start(settings, async () => undefined);
    const stopped = await manager.stop();

    assert.equal(started.ownership, "external");
    assert.equal(stopped.ownership, "external");
    assert.match(stopped.message, /No package-owned managed router process/);
  });

  it("keeps safe ownership proof on repeated start in same instance", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-owned-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    let spawnCount = 0;
    const manager = new ManagedRouterProcess({ spawn: () => { spawnCount += 1; return new FakeManagedProcess(); }, sleep: async () => {} });
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile });
    let probes = 0;
    await manager.start(settings, async () => {
      probes += 1;
      if (probes < 2) throw new Error("not yet");
    });

    const repeated = await manager.start(settings, async () => undefined);

    assert.equal(repeated.ownership, "managed");
    assert.equal(spawnCount, 1);
  });

  it("stops only package-owned managed processes", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-stop-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({ spawn: () => fakeProcess, sleep: async () => {} });
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile });
    let probes = 0;
    await manager.start(settings, async () => {
      probes += 1;
      if (probes < 2) throw new Error("not yet");
    });

    const stopped = await manager.stop();

    assert.equal(fakeProcess.killed, true);
    assert.equal(stopped.ownership, "none");
  });

  it("honors stopOnQuit only for managed ownership", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-quit-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({ spawn: () => fakeProcess, sleep: async () => {} });
    const settings = parseLlamaCppSettings({ managedStart: true, stopOnQuit: false, modelPresetsFile: presetFile });
    let probes = 0;
    await manager.start(settings, async () => {
      probes += 1;
      if (probes < 2) throw new Error("not yet");
    });

    await manager.stopOnQuit(settings);
    assert.equal(fakeProcess.killed, false);

    await manager.stopOnQuit(parseLlamaCppSettings({ managedStart: true, stopOnQuit: true, modelPresetsFile: presetFile }));
    assert.equal(fakeProcess.killed, true);
  });

  it("blocks managed start when Configured Preset File is missing", async () => {
    let spawned = false;
    const manager = new ManagedRouterProcess({
      spawn: () => { spawned = true; return new FakeManagedProcess(); },
      sleep: async () => {},
    });
    const settings = parseLlamaCppSettings({
      managedStart: true,
      modelPresetsFile: join(tmpdir(), "missing-llamacpp-presets.ini"),
    });

    const result = await manager.start(settings, async () => { throw new Error("not reachable"); });

    assert.equal(spawned, false);
    assert.equal(result.ownership, "none");
    assert.match(result.message, /Configured Preset File not found/);
  });

  it("treats session reload adoption as external when a router is reachable", async () => {
    const firstProcess = new FakeManagedProcess();
    const first = new ManagedRouterProcess({ spawn: () => firstProcess, sleep: async () => {} });
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-reload-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile });
    let probes = 0;
    await first.start(settings, async () => {
      probes += 1;
      if (probes < 2) throw new Error("not yet");
    });

    const reloaded = new ManagedRouterProcess({
      spawn: () => { throw new Error("reload must not spawn"); },
      sleep: async () => {},
    });
    const adopted = await reloaded.start(settings, async () => undefined);

    assert.equal(firstProcess.killed, false);
    assert.equal(adopted.ownership, "external");
  });
});

class FakeManagedProcess {
  stdoutHandlers = [];
  stderrHandlers = [];
  exitHandlers = [];
  killed = false;
  stdout = { on: (_event, handler) => this.stdoutHandlers.push(handler) };
  stderr = { on: (_event, handler) => this.stderrHandlers.push(handler) };
  on(event, handler) {
    if (event === "exit") this.exitHandlers.push(handler);
    return this;
  }
  kill() {
    this.killed = true;
    for (const handler of this.exitHandlers) handler(0, null);
    return true;
  }
  emitStdout(text) { for (const handler of this.stdoutHandlers) handler(Buffer.from(text)); }
  emitStderr(text) { for (const handler of this.stderrHandlers) handler(Buffer.from(text)); }
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}
