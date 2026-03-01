/**
 * Test Helpers for TUI Components
 *
 * Provides utilities for testing text-based UI components including
 * mock themes, output matchers, and width testing utilities.
 */

import type { Theme } from '@mariozechner/pi-coding-agent';

/**
 * Create a simple mock theme for testing
 *
 * Returns strings unchanged (no ANSI codes) for easier assertions.
 * Use this for unit tests focused on layout logic.
 */
export function createTestTheme(): Theme {
  return {
    fg: (_color: string, text: string) => text,
    bg: (_color: string, text: string) => text,
    bold: (text: string) => text,
  } as Theme;
}

/**
 * Create output matcher helpers for cleaner assertions
 *
 * @param lines - Rendered output lines
 * @returns Object with helper methods for assertions
 */
export function createOutputMatcher(lines: string[]) {
  const output = lines.join('\n');

  return {
    output,
    lines,
    contains: (text: string) => output.includes(text),
    notContains: (text: string) => !output.includes(text),
    matchesPattern: (pattern: RegExp) => pattern.test(output),
    lineCount: () => lines.length,
    maxLineLength: () => Math.max(...lines.map((l) => l.length)),
  };
}

/**
 * Test component at multiple widths
 *
 * @param renderFn - Function that takes width and returns output lines
 * @param widths - Array of widths to test (default: [40, 80, 120, 160])
 * @returns Map of width to output
 */
export function testAtWidths(
  // Parameter name 'width' in type signature is for documentation
  // eslint-disable-next-line no-unused-vars
  renderFn: (width: number) => string[],
  widths: number[] = [40, 80, 120, 160]
): Map<number, string[]> {
  const results = new Map<number, string[]>();

  for (const w of widths) {
    results.set(w, renderFn(w));
  }

  return results;
}

/**
 * Count visible characters in a string (excluding ANSI codes)
 * Simple implementation that works for most cases.
 *
 * @param str - String to measure
 * @returns Number of visible characters
 */
export function visibleLength(str: string): number {
  // Remove ANSI escape codes
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[[0-9;]*m/g, '').length;
}

/**
 * Strip ANSI escape codes from a string
 *
 * @param str - String with ANSI codes
 * @returns String with ANSI codes removed
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}
