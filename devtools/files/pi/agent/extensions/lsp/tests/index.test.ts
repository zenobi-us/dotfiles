/**
 * Unit tests for index.ts formatting functions
 */

// ============================================================================
// Test utilities
// ============================================================================

const tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];

function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(message || `Expected ${e}, got ${a}`);
}

// ============================================================================
// Import the module to test internal functions
// We need to test via the execute function since formatters are private
// Or we can extract and test the logic directly
// ============================================================================

import { uriToPath, findSymbolPosition, formatDiagnostic, filterDiagnosticsBySeverity } from "../lsp-core.js";

// ============================================================================
// uriToPath tests
// ============================================================================

test("uriToPath: converts file:// URI to path", () => {
  const result = uriToPath("file:///Users/test/file.ts");
  assertEqual(result, "/Users/test/file.ts");
});

test("uriToPath: handles encoded characters", () => {
  const result = uriToPath("file:///Users/test/my%20file.ts");
  assertEqual(result, "/Users/test/my file.ts");
});

test("uriToPath: passes through non-file URIs", () => {
  const result = uriToPath("/some/path.ts");
  assertEqual(result, "/some/path.ts");
});

test("uriToPath: handles invalid URIs gracefully", () => {
  const result = uriToPath("not-a-valid-uri");
  assertEqual(result, "not-a-valid-uri");
});

// ============================================================================
// findSymbolPosition tests
// ============================================================================

test("findSymbolPosition: finds exact match", () => {
  const symbols = [
    { name: "greet", range: { start: { line: 5, character: 10 }, end: { line: 5, character: 15 } }, selectionRange: { start: { line: 5, character: 10 }, end: { line: 5, character: 15 } }, kind: 12, children: [] },
    { name: "hello", range: { start: { line: 10, character: 0 }, end: { line: 10, character: 5 } }, selectionRange: { start: { line: 10, character: 0 }, end: { line: 10, character: 5 } }, kind: 12, children: [] },
  ];
  const pos = findSymbolPosition(symbols as any, "greet");
  assertEqual(pos, { line: 5, character: 10 });
});

test("findSymbolPosition: finds partial match", () => {
  const symbols = [
    { name: "getUserName", range: { start: { line: 3, character: 0 }, end: { line: 3, character: 11 } }, selectionRange: { start: { line: 3, character: 0 }, end: { line: 3, character: 11 } }, kind: 12, children: [] },
  ];
  const pos = findSymbolPosition(symbols as any, "user");
  assertEqual(pos, { line: 3, character: 0 });
});

test("findSymbolPosition: prefers exact over partial", () => {
  const symbols = [
    { name: "userName", range: { start: { line: 1, character: 0 }, end: { line: 1, character: 8 } }, selectionRange: { start: { line: 1, character: 0 }, end: { line: 1, character: 8 } }, kind: 12, children: [] },
    { name: "user", range: { start: { line: 5, character: 0 }, end: { line: 5, character: 4 } }, selectionRange: { start: { line: 5, character: 0 }, end: { line: 5, character: 4 } }, kind: 12, children: [] },
  ];
  const pos = findSymbolPosition(symbols as any, "user");
  assertEqual(pos, { line: 5, character: 0 });
});

test("findSymbolPosition: searches nested children", () => {
  const symbols = [
    { 
      name: "MyClass", 
      range: { start: { line: 0, character: 0 }, end: { line: 10, character: 0 } }, 
      selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 7 } }, 
      kind: 5,
      children: [
        { name: "myMethod", range: { start: { line: 2, character: 2 }, end: { line: 4, character: 2 } }, selectionRange: { start: { line: 2, character: 2 }, end: { line: 2, character: 10 } }, kind: 6, children: [] },
      ]
    },
  ];
  const pos = findSymbolPosition(symbols as any, "myMethod");
  assertEqual(pos, { line: 2, character: 2 });
});

test("findSymbolPosition: returns null for no match", () => {
  const symbols = [
    { name: "foo", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }, selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }, kind: 12, children: [] },
  ];
  const pos = findSymbolPosition(symbols as any, "bar");
  assertEqual(pos, null);
});

test("findSymbolPosition: case insensitive", () => {
  const symbols = [
    { name: "MyFunction", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }, selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }, kind: 12, children: [] },
  ];
  const pos = findSymbolPosition(symbols as any, "myfunction");
  assertEqual(pos, { line: 0, character: 0 });
});

// ============================================================================
// formatDiagnostic tests
// ============================================================================

test("formatDiagnostic: formats error", () => {
  const diag = {
    range: { start: { line: 5, character: 10 }, end: { line: 5, character: 15 } },
    message: "Type 'number' is not assignable to type 'string'",
    severity: 1,
  };
  const result = formatDiagnostic(diag as any);
  assertEqual(result, "ERROR [6:11] Type 'number' is not assignable to type 'string'");
});

test("formatDiagnostic: formats warning", () => {
  const diag = {
    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
    message: "Unused variable",
    severity: 2,
  };
  const result = formatDiagnostic(diag as any);
  assertEqual(result, "WARN [1:1] Unused variable");
});

test("formatDiagnostic: formats info", () => {
  const diag = {
    range: { start: { line: 2, character: 4 }, end: { line: 2, character: 10 } },
    message: "Consider using const",
    severity: 3,
  };
  const result = formatDiagnostic(diag as any);
  assertEqual(result, "INFO [3:5] Consider using const");
});

test("formatDiagnostic: formats hint", () => {
  const diag = {
    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
    message: "Prefer arrow function",
    severity: 4,
  };
  const result = formatDiagnostic(diag as any);
  assertEqual(result, "HINT [1:1] Prefer arrow function");
});

// ============================================================================
// filterDiagnosticsBySeverity tests
// ============================================================================

test("filterDiagnosticsBySeverity: all returns everything", () => {
  const diags = [
    { severity: 1, message: "error", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
    { severity: 2, message: "warning", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
    { severity: 3, message: "info", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
    { severity: 4, message: "hint", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
  ];
  const result = filterDiagnosticsBySeverity(diags as any, "all");
  assertEqual(result.length, 4);
});

test("filterDiagnosticsBySeverity: error returns only errors", () => {
  const diags = [
    { severity: 1, message: "error", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
    { severity: 2, message: "warning", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
  ];
  const result = filterDiagnosticsBySeverity(diags as any, "error");
  assertEqual(result.length, 1);
  assertEqual(result[0].message, "error");
});

test("filterDiagnosticsBySeverity: warning returns errors and warnings", () => {
  const diags = [
    { severity: 1, message: "error", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
    { severity: 2, message: "warning", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
    { severity: 3, message: "info", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
  ];
  const result = filterDiagnosticsBySeverity(diags as any, "warning");
  assertEqual(result.length, 2);
});

test("filterDiagnosticsBySeverity: info returns errors, warnings, and info", () => {
  const diags = [
    { severity: 1, message: "error", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
    { severity: 2, message: "warning", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
    { severity: 3, message: "info", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
    { severity: 4, message: "hint", range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
  ];
  const result = filterDiagnosticsBySeverity(diags as any, "info");
  assertEqual(result.length, 3);
});

// ============================================================================
// Run tests
// ============================================================================

async function runTests(): Promise<void> {
  console.log("Running index.ts unit tests...\n");

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ${name}... ✓`);
      passed++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ${name}... ✗`);
      console.log(`    Error: ${msg}\n`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
