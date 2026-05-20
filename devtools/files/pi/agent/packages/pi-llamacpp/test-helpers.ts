// @ts-nocheck
export class FakeManagedProcess {
  stdoutHandlers = [];
  stderrHandlers = [];
  exitHandlers = [];
  errorHandlers = [];
  killed = false;
  killResult = true;
  emitExitOnKill = true;
  unrefCalled = false;
  stdoutUnrefCalled = false;
  stderrUnrefCalled = false;
  stdout = { on: (_event, handler) => this.stdoutHandlers.push(handler), unref: () => { this.stdoutUnrefCalled = true; } };
  stderr = { on: (_event, handler) => this.stderrHandlers.push(handler), unref: () => { this.stderrUnrefCalled = true; } };
  on(event, handler) {
    if (event === "exit") this.exitHandlers.push(handler);
    if (event === "error") this.errorHandlers.push(handler);
    return this;
  }
  kill() {
    this.killed = true;
    if (this.killResult && this.emitExitOnKill) for (const handler of this.exitHandlers) handler(0, null);
    return this.killResult;
  }
  unref() { this.unrefCalled = true; }
  emitStdout(text) { for (const handler of this.stdoutHandlers) handler(Buffer.from(text)); }
  emitStderr(text) { for (const handler of this.stderrHandlers) handler(Buffer.from(text)); }
  emitError(error) { for (const handler of this.errorHandlers) handler(error); }
}

export function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

export function invalidJsonResponse(body, init = {}) {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}


export function waitForAbort(signal) {
  if (!signal) throw new Error("missing abort signal");
  if (signal.aborted) return Promise.reject(signal.reason ?? new DOMException("The operation was aborted", "AbortError"));
  return new Promise((_, reject) => {
    const timeout = setTimeout(() => reject(new Error("request was not aborted")), 50);
    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(signal.reason ?? new DOMException("The operation was aborted", "AbortError"));
    }, { once: true });
  });
}
