import { expect, jest, spyOn, test } from "bun:test";
import * as childProcess from "node:child_process";
import { EventEmitter } from "node:events";
import imageAnnotatorExtension from "../index";

type API = Parameters<typeof imageAnnotatorExtension>[0];
type Command = Parameters<API["registerCommand"]>[1];

for (const outcome of ["done", "cancel", "abort"] as const) {
  test(`editing remains available after a day until ${outcome}`, async () => {
    let command: Command | undefined;
    const messages: unknown[] = [];
    const errors: string[] = [];
    let browserOpened!: (url: string) => void;
    const opened = new Promise<string>(resolve => { browserOpened = resolve; });
    const spawn = spyOn(childProcess, "spawn").mockImplementation((_command, args) => {
      const child = Object.assign(new EventEmitter(), { unref() {} });
      queueMicrotask(() => {
        child.emit("spawn");
        browserOpened((args as string[]).at(-1)!);
      });
      return child as childProcess.ChildProcess;
    });
    const controller = new AbortController();
    const pi = {
      zod: { object() {}, enum() {}, string: () => ({ optional() {} }) },
      registerTool() {},
      registerCommand(_name: string, value: Command) { command = value; },
      on() {},
      sendUserMessage(content: unknown) { messages.push(content); },
    } as unknown as API;
    let settled = false;
    let editing: Promise<void> | undefined;
    jest.useFakeTimers();
    try {
      imageAnnotatorExtension(pi);
      editing = command!.handler("new", {
        mode: "tui", cwd: process.cwd(), signal: controller.signal,
        ui: { notify(message) { errors.push(message); } },
      }).finally(() => { settled = true; });
      const url = new URL(await opened);
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      // Let a deadline rejection reach the command handler before checking the live session.
      for (let i = 0; i < 20; i++) await Promise.resolve();
      expect(errors).toEqual([]);
      expect(settled).toBe(false);
      const source = await fetch(new URL(`/api/source${url.search}`, url));
      expect(source.status).toBe(200);
      expect(await source.json()).toBeNull();
      if (outcome === "abort") {
        controller.abort();
      } else {
        const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F0sAAAAASUVORK5CYII=", "base64");
        const response = await fetch(new URL(`/api/${outcome}${url.search}`, url), {
          method: "POST",
          ...(outcome === "done" ? { headers: { "content-type": "image/png" }, body: png } : {}),
        });
        expect(response.status).toBe(200);
        await response.text();
      }
      await editing;
      expect(errors).toEqual(outcome === "abort" ? ["Image editing was cancelled."] : []);
      expect(messages).toEqual(outcome === "done" ? [[
        { type: "text", text: "Image: drawing.png" },
        { type: "image", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F0sAAAAASUVORK5CYII=", mimeType: "image/png" },
      ]] : []);
      await expect(fetch(new URL(`/api/source${url.search}`, url))).rejects.toThrow();
    } finally {
      controller.abort();
      await editing;
      jest.useRealTimers();
      spawn.mockRestore();
    }
  });
}
