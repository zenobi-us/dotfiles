/**
 * Unit tests for lsp-tool.ts execute contract and cwd handling
 */

import lspToolExtension from '../lsp-tool.ts';

type AnyTool = {
  execute: (
    toolCallId: string,
    params: Record<string, unknown>,
    signal?: AbortSignal,
    onUpdate?: unknown,
    ctx?: { cwd?: string }
  ) => Promise<{ content?: Array<{ type: string; text: string }> }>;
};

const tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];

function test(name: string, fn: () => Promise<void> | void): void {
  tests.push({ name, fn });
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(text: string, expected: string, message: string): void {
  if (!text.includes(expected)) {
    throw new Error(`${message}\nExpected to include: ${expected}\nActual: ${text}`);
  }
}

function createTool(): AnyTool {
  let captured: AnyTool | undefined;

  const fakePi = {
    registerTool(tool: AnyTool) {
      captured = tool;
    },
  };

  lspToolExtension(fakePi as any);

  if (!captured) {
    throw new Error('Failed to capture lsp tool');
  }

  return captured;
}

test('execute uses framework tool signature and succeeds with ctx.cwd', async () => {
  const tool = createTool();

  const result = await tool.execute(
    'tc-1',
    {
      action: 'workspace-diagnostics',
      files: ['does-not-exist.ts'],
    },
    undefined,
    undefined,
    { cwd: process.cwd() }
  );

  const text = result.content?.find((c) => c.type === 'text')?.text ?? '';
  assertIncludes(text, 'action: workspace-diagnostics', 'Expected workspace diagnostics output');
});

test('execute falls back when ctx.cwd is missing', async () => {
  const tool = createTool();

  const result = await tool.execute(
    'tc-2',
    {
      action: 'workspace-diagnostics',
      files: ['does-not-exist.ts'],
    },
    undefined,
    undefined,
    undefined
  );

  const text = result.content?.find((c) => c.type === 'text')?.text ?? '';
  assertIncludes(text, 'action: workspace-diagnostics', 'Expected fallback cwd execution output');
});

async function runTests(): Promise<void> {
  console.log('Running lsp-tool execute contract tests...\n');

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ${name}... ✓`);
      passed += 1;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ${name}... ✗`);
      console.log(`    Error: ${msg}\n`);
      failed += 1;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
