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


  it("expands home in Configured Preset File before spawning managed router", async () => {
    const previousHome = process.env.HOME;
    const home = mkdtempSync(join(tmpdir(), "pi-llamacpp-home-"));
    const presetDir = join(home, ".config", "llamacpp");
    const presetFile = join(presetDir, "model-presets.ini");
    mkdirSync(presetDir, { recursive: true });
    writeFileSync(presetFile, "[model-a]\n");

    const spawned = [];
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({
      spawn: (command, args) => {
        spawned.push({ command, args });
        return fakeProcess;
      },
      sleep: async () => {},
    });

    try {
      process.env.HOME = home;
      const settings = parseLlamaCppSettings({
        managedStart: true,
        configuredPresetFilePath: "~/.config/llamacpp/model-presets.ini",
        timeouts: { startMs: 5, pollMs: 1 },
      });
      let probes = 0;

      await manager.start(settings, async () => {
        probes += 1;
        if (probes < 2) throw new Error("not reachable yet");
      });
    } finally {
      if (previousHome === undefined) delete process.env.HOME;
      else process.env.HOME = previousHome;
    }

    assert.equal(spawned[0].args.includes("~/.config/llamacpp/model-presets.ini"), false);
    assert.deepEqual(spawned[0].args.slice(-2), ["--model-presets", presetFile]);
  });

  it("clears stale pre-spawn probe errors after successful managed start command", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-stale-start-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const commands = new Map();
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({ spawn: () => fakeProcess, sleep: async () => {} });
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile });
    const fetchResults = [
      new Error("startup unreachable"),
      new Error("initial pre-spawn probe failed"),
      jsonResponse({ data: [{ id: "model-a" }] }),
      jsonResponse({ data: [{ id: "model-a" }] }),
    ];
    const pi = {
      registerCommand(name, command) { commands.set(name, command); },
      unregisterProvider() {},
      registerProvider() {},
    };

    await llamacppProvider(pi, {
      loadSettings: async () => settings,
      managedRouter: manager,
      fetch: async () => {
        const next = fetchResults.shift();
        if (next instanceof Error) throw next;
        return next;
      },
    });
    const notifications = [];

    await commands.get("llamacpp").handler("start", {
      ui: { notify: (message, level) => notifications.push({ message, level }) },
    });

    assert.equal(notifications[0].level, "info");
    assert.match(notifications[0].message, /Managed Llama Server Router started/);
    assert.match(notifications[0].message, /Last Error: none/);
    assert.doesNotMatch(notifications[0].message, /initial pre-spawn probe failed/);
  });

  it("bounds log tail line size as well as line count", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-log-bytes-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({ spawn: () => fakeProcess, sleep: async () => {}, maxLogLines: 3 });
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile });
    let probes = 0;
    await manager.start(settings, async () => {
      probes += 1;
      if (probes < 2) throw new Error("not yet");
    });

    fakeProcess.emitStdout(`${"x".repeat(10000)}\nsmall\n`);

    const stdout = manager.status().process?.stdoutTail ?? [];
    assert.equal(stdout.at(-1), "small");
    assert.ok(stdout.every((line) => line.length <= 4097));
  });


  it("bounds log chunk processing before splitting huge chunks", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-log-chunk-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({
      spawn: () => fakeProcess,
      sleep: async () => {},
      maxLogLines: 5,
      maxLogLineChars: 1024,
      maxLogChunkChars: 18,
    });
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile });
    let probes = 0;
    await manager.start(settings, async () => {
      probes += 1;
      if (probes < 2) throw new Error("not yet");
    });

    const hugeSuffix = Array.from({ length: 1000 }, (_, i) => `suffix-${i}`).join("\n");
    fakeProcess.emitStdout(Buffer.from(`prefix-1\nprefix-2\n${hugeSuffix}\nSENTINEL\n`));

    const stdout = manager.status().process?.stdoutTail ?? [];
    assert.ok(stdout.length <= 5);
    assert.deepEqual(stdout, ["prefix-1", "prefix-2"]);
    assert.doesNotMatch(stdout.join("\n"), /SENTINEL|suffix-/);
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


  it("records child spawn error events and clears managed ownership safely", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-spawn-error-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({
      spawn: () => fakeProcess,
      sleep: async () => fakeProcess.emitError(new Error("spawn ENOENT")),
    });
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile, timeouts: { startMs: 1, pollMs: 1 } });

    const result = await manager.start(settings, async () => { throw new Error("not reachable"); });

    assert.equal(result.ownership, "none");
    assert.equal(result.process?.state, "exited");
    assert.match(result.lastError, /spawn ENOENT/);
  });


  it("preserves child spawn error diagnostics when a later reachability probe fails", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-spawn-preserve-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({
      spawn: () => fakeProcess,
      sleep: async () => {},
    });
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile, timeouts: { startMs: 1, pollMs: 1 } });

    const result = await manager.start(settings, async () => {
      fakeProcess.emitError(new Error("spawn EACCES"));
      throw new Error("generic router unreachable");
    });

    assert.equal(result.ownership, "none");
    assert.equal(result.process?.state, "exited");
    assert.match(result.lastError, /spawn EACCES/);
    assert.doesNotMatch(result.lastError ?? "", /generic router unreachable/);
  });

  it("retains managed ownership and reports failure when SIGTERM is not accepted", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-kill-false-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const fakeProcess = new FakeManagedProcess();
    fakeProcess.killResult = false;
    const manager = new ManagedRouterProcess({ spawn: () => fakeProcess, sleep: async () => {} });
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile });
    let probes = 0;
    await manager.start(settings, async () => {
      probes += 1;
      if (probes < 2) throw new Error("not yet");
    });

    const stopped = await manager.stop(1);

    assert.equal(fakeProcess.killed, true);
    assert.equal(stopped.ownership, "managed");
    assert.match(stopped.message, /failed to stop/i);
  });


  it("retains managed ownership when SIGTERM is ignored until stop timeout", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-kill-timeout-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const fakeProcess = new FakeManagedProcess();
    fakeProcess.emitExitOnKill = false;
    const manager = new ManagedRouterProcess({ spawn: () => fakeProcess, sleep: async () => {} });
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile });
    let probes = 0;
    await manager.start(settings, async () => {
      probes += 1;
      if (probes < 2) throw new Error("not yet");
    });

    const stopped = await manager.stop(1);

    assert.equal(stopped.ownership, "managed");
    assert.equal(stopped.process?.state, "running");
    assert.match(stopped.message, /within 1ms/);
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


  it("unrefs persistent managed process handles when stopOnQuit is false", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-unref-"));
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
    fakeProcess.emitStdout("still captured\n");

    assert.equal(fakeProcess.unrefCalled, true);
    assert.equal(fakeProcess.stdoutUnrefCalled, true);
    assert.equal(fakeProcess.stderrUnrefCalled, true);
    assert.deepEqual(manager.status().process.stdoutTail, ["still captured"]);
  });

  it("marks managed start timeout without leaving process state stale starting", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-llamacpp-timeout-"));
    const presetFile = join(dir, "models.ini");
    writeFileSync(presetFile, "[model-a]\n");
    const fakeProcess = new FakeManagedProcess();
    const manager = new ManagedRouterProcess({ spawn: () => fakeProcess, sleep: async () => {} });
    const settings = parseLlamaCppSettings({ managedStart: true, modelPresetsFile: presetFile, timeouts: { startMs: 1, pollMs: 1 } });

    const result = await manager.start(settings, async () => { throw new Error("not reachable"); });

    assert.equal(result.ownership, "managed");
    assert.equal(result.process?.state, "timed-out");
    assert.match(result.lastError, /Timed out/);
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


