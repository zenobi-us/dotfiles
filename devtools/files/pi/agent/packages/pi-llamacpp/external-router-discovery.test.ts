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
    assert.match(output, /\| alpha \| alpha \| unknown \| loaded \| yes \|/);
    assert.match(output, /\| beta \| beta \| unknown \| unknown \| no \|/);
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
    assert.match(notifications[0].message, /\| runtime \| runtime \| unknown \| loaded \| yes \|/);
    assert.doesNotMatch(notifications[0].message, /startup/);
  });
});


