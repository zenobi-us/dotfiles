import { expect, test } from "bun:test";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { SharedContextModal } from "./modal";
import { GraphExplorer } from "./explorer";
import type { SharedAgentContext } from "./model";

const theme = { fg: (_token: string, text: string) => text, bg: (_token: string, text: string) => `<focus>${text}</focus>` } as Theme;
const context = { repositoryRoot: "/projects/example", mode: "mixed" } as SharedAgentContext;

test("tab highlighting does not activate content until Space or Enter", async () => {
  const tracker = new GraphExplorer({ context, theme, exec: async () => ({ stdout: "", code: 0 }), done: () => {}, requestRender: () => {}, height: () => 20, commands: () => [], loadSnapshot: async () => ({ backend: "local-markdown", initiatives: [], tickets: [] }) });
  await tracker.load();
  let fileOpens = 0;
  const files = { render: () => ["File browser"], handleInput: (key: string) => { if (key === "\r") fileOpens++; } };
  const modal = new SharedContextModal(context, theme, tracker, files, () => {});
  await modal.handleInput("\t");
  await modal.handleInput("\t");
  expect(modal.render(100)[2]).toContain("> 2 Files <");
  expect(modal.render(100).join("\n")).not.toContain("File browser");
  await modal.handleInput(" ");
  expect(modal.render(100).at(-1)).toBe("File browser");
  expect(fileOpens).toBe(0);
  await modal.handleInput("\r");
  expect(fileOpens).toBe(1);
  await modal.handleInput("\t");
  await modal.handleInput("\r");
  expect(modal.render(100).join("\n")).not.toContain("File browser");
});

test("number shortcuts switch tabs without changing tracker queues or losing selection", async () => {
  const tracker = new GraphExplorer({ context, theme, exec: async () => ({ stdout: "", code: 0 }), done: () => {}, requestRender: () => {}, height: () => 20, commands: () => [], loadSnapshot: async () => ({ backend: "local-markdown", initiatives: [], tickets: [] }) });
  await tracker.load();
  const modal = new SharedContextModal(context, theme, tracker, { render: () => ["File browser"], handleInput: () => {} }, () => {});
  await modal.handleInput("6");
  await modal.handleInput("2");
  expect(modal.render(100).at(-1)).toBe("File browser");
  await modal.handleInput("1");
  expect(modal.render(100).join("\n")).toContain("Ticket queues · review");
});
