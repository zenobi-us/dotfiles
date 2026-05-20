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

describe("pi-llamacpp Explicit Load Gate", () => {
  it("passes loaded and sleeping models without redundant load calls", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    const fetchCalls = [];
    const gate = new LoadGate(settings, new RouterClient(settings, {
      fetch: async (url, init) => {
        fetchCalls.push({ url: String(url), method: init?.method });
        return jsonResponse({ data: [{ id: "loaded", status: "loaded" }, { id: "sleepy", status: "sleeping" }] });
      },
    }), { sleep: async () => {} });

    await gate.ensureRequestReady("loaded");
    await gate.ensureRequestReady("sleepy");

    assert.deepEqual(fetchCalls.map((call) => [call.method, call.url]), [
      ["GET", "http://router.test/models"],
      ["GET", "http://router.test/models"],
    ]);
  });

  it("loads an unloaded model before request and polls until loaded", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", timeouts: { loadMs: 1000, requestGateMs: 1000, pollMs: 1 } });
    const calls = [];
    const states = [
      { data: [{ id: "cold", status: "available" }] },
      { data: [{ id: "cold", status: "loading" }] },
      { data: [{ id: "cold", status: "loaded" }] },
    ];
    const gate = new LoadGate(settings, new RouterClient(settings, {
      fetch: async (url, init) => {
        calls.push({ url: String(url), method: init?.method, body: init?.body });
        if (String(url).endsWith("/models/load")) return jsonResponse({ ok: true });
        return jsonResponse(states.shift());
      },
    }), { sleep: async () => {} });

    await gate.ensureRequestReady("cold");

    assert.deepEqual(calls.map((call) => [call.method, call.url]), [
      ["GET", "http://router.test/models"],
      ["POST", "http://router.test/models/load"],
      ["GET", "http://router.test/models"],
      ["GET", "http://router.test/models"],
    ]);
    assert.deepEqual(JSON.parse(calls[1].body), { model: "cold" });
  });

  it("fails distinctly for failed-load, unknown model, unreachable router, auth error, and timeout", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", timeouts: { loadMs: 1, requestGateMs: 1, pollMs: 1 } });

    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, { fetch: async () => jsonResponse({ data: [{ id: "bad", status: "failed", error: "no gpu" }] }) }), { sleep: async () => {} }).ensureRequestReady("bad"),
      /llamacpp load failed for model bad: no gpu/,
    );
    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, { fetch: async () => jsonResponse({ data: [{ id: "other", status: "loaded" }] }) }), { sleep: async () => {} }).ensureRequestReady("missing"),
      /llamacpp unknown model id missing/,
    );
    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, { fetch: async () => { throw new Error("ECONNREFUSED"); } }), { sleep: async () => {} }).ensureRequestReady("any"),
      /llamacpp router unreachable: ECONNREFUSED/,
    );
    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, { fetch: async () => jsonResponse({ error: "no" }, { status: 401 }) }), { sleep: async () => {} }).ensureRequestReady("any"),
      /llamacpp router auth failed during model list: HTTP 401/,
    );
    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, { fetch: async (url) => String(url).endsWith("/models/load") ? jsonResponse({ error: "load denied" }, { status: 500 }) : jsonResponse({ data: [{ id: "denied", status: "available" }] }) }), { sleep: async () => {} }).ensureRequestReady("denied"),
      /llamacpp load request failed for model denied: HTTP 500/,
    );
    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, { fetch: async (url) => String(url).endsWith("/models/load") ? jsonResponse({}) : jsonResponse({ data: [{ id: "slow", status: "loading" }] }) }), { sleep: async () => {} }).ensureRequestReady("slow"),
      /llamacpp load gate timed out for model slow/,
    );
  });


  it("enforces requestGateMs across initial status, load, and polling calls", async () => {
    const settings = parseLlamaCppSettings({
      serverBaseUrl: "http://router.test",
      timeouts: { loadMs: 1000, statusMs: 1000, requestGateMs: 5, pollMs: 1 },
    });
    let now = 0;
    const calls = [];
    const gate = new LoadGate(settings, new RouterClient(settings, {
      fetch: async (url, init) => {
        calls.push([init?.method, String(url)]);
        now += 10;
        return jsonResponse({ data: [{ id: "cold", status: "available" }] });
      },
    }), { sleep: async () => {}, now: () => now });

    await assert.rejects(gate.ensureRequestReady("cold"), /llamacpp load gate timed out for model cold after 5ms/);
    assert.deepEqual(calls, [["GET", "http://router.test/models"]]);
  });

  it("enforces requestGateMs when POST load consumes the remaining gate budget", async () => {
    const settings = parseLlamaCppSettings({
      serverBaseUrl: "http://router.test",
      timeouts: { loadMs: 1000, statusMs: 1000, requestGateMs: 5, pollMs: 1 },
    });
    let now = 0;
    const calls = [];
    const gate = new LoadGate(settings, new RouterClient(settings, {
      fetch: async (url, init) => {
        calls.push([init?.method, String(url)]);
        if (String(url).endsWith("/models/load")) {
          now += 10;
          return jsonResponse({ ok: true });
        }
        return jsonResponse({ data: [{ id: "cold", status: "available" }] });
      },
    }), { sleep: async () => {}, now: () => now });

    await assert.rejects(gate.ensureRequestReady("cold"), /llamacpp load gate timed out for model cold after 5ms/);
    assert.deepEqual(calls, [
      ["GET", "http://router.test/models"],
      ["POST", "http://router.test/models/load"],
    ]);
  });

  it("times out initial /models even when caller signal is present", async () => {
    const caller = new AbortController();
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", timeouts: { statusMs: 5, loadMs: 1000, requestGateMs: 1000, pollMs: 1 } });

    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, {
        fetch: async (_url, init) => {
          await waitForAbort(init?.signal);
        },
      }), { sleep: async () => {}, signal: caller.signal }).ensureRequestReady("cold"),
      /llamacpp router model list timed out/,
    );
    assert.equal(caller.signal.aborted, false);
  });

  it("times out POST /models/load even when caller signal is present", async () => {
    const caller = new AbortController();
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", timeouts: { loadMs: 5, statusMs: 1000, requestGateMs: 1000, pollMs: 1 } });

    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, {
        fetch: async (url, init) => {
          if (String(url).endsWith("/models/load")) {
            await waitForAbort(init?.signal);
          }
          return jsonResponse({ data: [{ id: "cold", status: "available" }] });
        },
      }), { sleep: async () => {}, signal: caller.signal }).ensureRequestReady("cold"),
      /llamacpp load request timed out for model cold/,
    );
    assert.equal(caller.signal.aborted, false);
  });

  it("normalizes caller aborts during /models as aborted rather than timeout", async () => {
    const caller = new AbortController();
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", timeouts: { statusMs: 1000, loadMs: 1000, requestGateMs: 1000, pollMs: 1 } });

    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, {
        fetch: async (_url, init) => {
          setTimeout(() => caller.abort(new DOMException("User cancelled", "AbortError")), 1);
          await waitForAbort(init?.signal);
        },
      }), { sleep: async () => {}, signal: caller.signal }).ensureRequestReady("cold"),
      /llamacpp router model list aborted/,
    );
  });
  it("normalizes POST /models/load unreachable and timeout errors distinctly", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", timeouts: { loadMs: 1000, requestGateMs: 1000, pollMs: 1 } });

    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, {
        fetch: async (url) => {
          if (String(url).endsWith("/models/load")) throw new Error("connect ECONNREFUSED token=secret");
          return jsonResponse({ data: [{ id: "cold", status: "available" }] });
        },
      }), { sleep: async () => {} }).ensureRequestReady("cold"),
      /llamacpp router unreachable during model load for model cold: connect ECONNREFUSED \[redacted\]/,
    );

    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, {
        fetch: async (url) => {
          if (String(url).endsWith("/models/load")) throw new DOMException("The operation was aborted", "TimeoutError");
          return jsonResponse({ data: [{ id: "cold", status: "available" }] });
        },
      }), { sleep: async () => {} }).ensureRequestReady("cold"),
      /llamacpp load request timed out for model cold/,
    );
  });

  it("fails failed router models before loaded or sleeping readiness", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });

    await assert.rejects(
      new LoadGate(settings, new RouterClient(settings, { fetch: async () => jsonResponse({ data: [{ id: "bad", status: "failed", loaded: true, error: "gpu token=secret" }] }) }), { sleep: async () => {} }).ensureRequestReady("bad"),
      /llamacpp load failed for model bad: gpu \[redacted\]/,
    );
  });

  it("does not gate providerless or non-llamacpp hook events", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    const calls = [];
    const handlers = {};
    await llamacppProvider({
      registerCommand() {},
      on(event, handler) { handlers[event] = handler; },
      unregisterProvider() {},
      registerProvider() {},
    }, {
      loadSettings: async () => settings,
      fetch: async (url, init) => {
        calls.push([init?.method, String(url)]);
        return jsonResponse({ data: [{ id: "select-me", status: "loaded" }] });
      },
    });

    assert.equal(handlers.before_provider_request, undefined);
    assert.deepEqual(calls, [["GET", "http://router.test/models"]]);
  });

  it("loadOnSelect false leaves model_select hook as a no-op", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", loadOnSelect: false });
    const calls = [];
    const handlers = {};
    await llamacppProvider({
      registerCommand() {},
      on(event, handler) { handlers[event] = handler; },
      unregisterProvider() {},
      registerProvider() {},
    }, {
      loadSettings: async () => settings,
      fetch: async (url, init) => {
        calls.push([init?.method, String(url)]);
        return jsonResponse({ data: [{ id: "select-me", status: "available" }] });
      },
    });

    await handlers.model_select({ type: "model_select", model: { provider: "llamacpp", id: "select-me" }, previousModel: undefined, source: "set" }, {});

    assert.deepEqual(calls, [["GET", "http://router.test/models"]]);
  });

  it("keeps model_select early feedback optional and does not rely on before_provider_request for blocking", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", loadOnSelect: true });
    const handlers = {};
    const requests = [];
    const modelListResponses = [
      { data: [{ id: "select-me", status: "loaded" }] },
      { data: [{ id: "select-me", status: "available" }] },
      { data: [{ id: "select-me", status: "loaded" }] },
      { data: [{ id: "select-me", status: "loaded" }] },
    ];
    await llamacppProvider({
      registerCommand() {},
      on(event, handler) { handlers[event] = handler; },
      unregisterProvider() {},
      registerProvider() {},
    }, {
      loadSettings: async () => settings,
      fetch: async (url, init) => {
        requests.push([init?.method, String(url)]);
        if (String(url).endsWith("/models/load")) return jsonResponse({});
        return jsonResponse(modelListResponses.shift() ?? { data: [{ id: "select-me", status: "loaded" }] });
      },
    });

    await handlers.model_select({ type: "model_select", model: { provider: "llamacpp", id: "select-me" }, previousModel: undefined, source: "set" }, {});

    assert.equal(handlers.before_provider_request, undefined);
    assert.equal(typeof handlers.model_select, "function");
    assert.deepEqual(requests.map(([method, url]) => [method, url]), [
      ["GET", "http://router.test/models"],
      ["GET", "http://router.test/models"],
      ["POST", "http://router.test/models/load"],
      ["GET", "http://router.test/models"],
    ]);
  });

  it("registers a custom provider stream wrapper that rejects before delegate when load gate fails", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    let provider;
    let delegateCalls = 0;
    await llamacppProvider({
      registerCommand() {},
      unregisterProvider() {},
      registerProvider(_name, config) { provider = config; },
    }, {
      loadSettings: async () => settings,
      fetch: async () => jsonResponse({ data: [{ id: "bad", status: "failed", error: "gpu unavailable" }] }),
    });

    assert.equal(provider.api, "llamacpp-openai-completions");
    assert.equal(typeof provider.streamSimple, "function");
    await assert.rejects(
      provider.streamSimple({ provider: "llamacpp", id: "bad", api: "llamacpp-openai-completions" }, { messages: [] }, { delegate: () => { delegateCalls += 1; } }),
      /llamacpp load failed for model bad: gpu unavailable/,
    );
    assert.equal(delegateCalls, 0);
  });

  it("provider stream wrapper delegates exactly once after loaded model passes the gate", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    let provider;
    const delegated = [];
    const delegateResult = { delegated: true };
    await llamacppProvider({
      registerCommand() {},
      unregisterProvider() {},
      registerProvider(_name, config) { provider = config; },
    }, {
      loadSettings: async () => settings,
      fetch: async () => jsonResponse({ data: [{ id: "ready", status: "loaded" }] }),
    });

    const result = await provider.streamSimple(
      { provider: "llamacpp", id: "ready", api: "llamacpp-openai-completions" },
      { messages: [] },
      { delegate: (model, context, options) => { delegated.push({ model, context, options }); return delegateResult; } },
    );

    assert.equal(result, delegateResult);
    assert.equal(delegated.length, 1);
    assert.equal(delegated[0].model.api, "openai-completions");
    assert.equal(delegated[0].model.provider, "llamacpp");
    assert.deepEqual(delegated[0].context, { messages: [] });
  });

  it("registers no before_provider_request hook and blocks via provider stream before delegate", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    let provider;
    const handlers = {};
    let delegateCalls = 0;
    await llamacppProvider({
      registerCommand() {},
      on(event, handler) { handlers[event] = handler; },
      unregisterProvider() {},
      registerProvider(_name, config) { provider = config; },
    }, {
      loadSettings: async () => settings,
      fetch: async () => jsonResponse({ data: [{ id: "missing-ready", status: "failed" }] }),
    });

    assert.equal(handlers.before_provider_request, undefined);
    await assert.rejects(
      provider.streamSimple({ provider: "llamacpp", id: "missing-ready", api: "llamacpp-openai-completions" }, { messages: [] }, { delegate: () => { delegateCalls += 1; } }),
      /llamacpp load failed/,
    );
    assert.equal(delegateCalls, 0);
  });

  it("composes caller abort signals with POST /models/load timeout", async () => {
    const controller = new AbortController();
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test" });
    const signals = [];
    const gate = new LoadGate(settings, new RouterClient(settings, {
      fetch: async (url, init) => {
        signals.push(init?.signal);
        if (String(url).endsWith("/models/load")) return jsonResponse({ ok: true });
        return jsonResponse({ data: [{ id: "cold", status: signals.length > 2 ? "loaded" : "available" }] });
      },
    }), { sleep: async () => {}, signal: controller.signal });

    await gate.ensureRequestReady("cold");

    assert.notEqual(signals[1], controller.signal);
    assert.equal(signals[1].aborted, false);
  });

  it("sends bearer auth on POST /models/load", async () => {
    const settings = parseLlamaCppSettings({ serverBaseUrl: "http://router.test", providerApiKey: "secret-token" });
    const loadHeaders = [];
    const gate = new LoadGate(settings, new RouterClient(settings, {
      fetch: async (url, init) => {
        if (String(url).endsWith("/models/load")) loadHeaders.push(init?.headers);
        return String(url).endsWith("/models/load")
          ? jsonResponse({ ok: true })
          : jsonResponse({ data: [{ id: "cold", status: loadHeaders.length ? "loaded" : "available" }] });
      },
    }), { sleep: async () => {} });

    await gate.ensureRequestReady("cold");

    assert.equal(loadHeaders[0].Authorization, "Bearer secret-token");
  });
});


