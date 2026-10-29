class TerminalSession {
  constructor(argv, cwd) {
    this.process = Bun.spawn(argv, { cwd, stdin: "pipe", stdout: "pipe", stderr: "pipe" });
    this.ledger = [{ launch: { argv, cwd } }];
    this.pending = new Map();
    this.id = 0;
    this.stderr = new Response(this.process.stderr).text();
    this.pump = this.consume();
  }
  async call(method, params = {}) {
    const id = ++this.id;
    const request = { id, method, params };
    this.ledger.push({ request });
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Native RPC timed out: ${method}`)); }, 25000);
      this.pending.set(id, { resolve, reject, timer });
    });
    this.process.stdin.write(JSON.stringify(request) + "\n");
    await this.process.stdin.flush();
    return promise;
  }
  async consume() {
    let buffer = "";
    const decoder = new TextDecoder();
    for await (const bytes of this.process.stdout) {
      buffer += decoder.decode(bytes, { stream: true });
      let end;
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
        if (!line.trim()) continue;
        const response = JSON.parse(line);
        this.ledger.push({ response });
        const pending = this.pending.get(response.id);
        if (pending) {
          this.pending.delete(response.id); clearTimeout(pending.timer);
          response.error ? pending.reject(new Error(JSON.stringify(response.error))) : pending.resolve(response.result);
        }
      }
    }
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error("Native process ended.")); }
    this.pending.clear();
  }
}

export { TerminalSession };
