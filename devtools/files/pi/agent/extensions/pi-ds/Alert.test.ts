/**
 * Unit Tests for Alert Component
 */

import { describe, it, expect } from 'vitest';
import { Alert } from './Alert';
import { createTestTheme, createOutputMatcher } from './test-helpers';

describe('Alert Component', () => {
  const theme = createTestTheme();

  describe('Basic Rendering', () => {
    it('renders success alert with checkmark icon', () => {
      const alert = new Alert(theme, 'success', 'Operation completed', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('✓')).toBe(true);
      expect(matcher.contains('Operation completed')).toBe(true);
    });

    it('renders warning alert with warning icon', () => {
      const alert = new Alert(theme, 'warning', 'High CPU usage', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('⚠')).toBe(true);
      expect(matcher.contains('High CPU usage')).toBe(true);
    });

    it('renders error alert with X icon', () => {
      const alert = new Alert(theme, 'error', 'Connection failed', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('✗')).toBe(true);
      expect(matcher.contains('Connection failed')).toBe(true);
    });

    it('renders info alert with info icon', () => {
      const alert = new Alert(theme, 'info', 'System maintenance', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('i')).toBe(true);
      expect(matcher.contains('System maintenance')).toBe(true);
    });
  });

  describe('Width Handling', () => {
    it('renders at 40 characters width', () => {
      const alert = new Alert(theme, 'success', 'Done', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(40);

      expect(output.length).toBeGreaterThan(0);
      expect(output.every((line) => line.length <= 40)).toBe(true);
    });

    it('renders at 80 characters width', () => {
      const alert = new Alert(theme, 'info', 'Processing request', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);

      expect(output.length).toBeGreaterThan(0);
      expect(output.every((line) => line.length <= 80)).toBe(true);
    });

    it('renders at 120 characters width', () => {
      const alert = new Alert(theme, 'warning', 'Long message that might wrap', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(120);

      expect(output.length).toBeGreaterThan(0);
      expect(output.every((line) => line.length <= 120)).toBe(true);
    });
  });

  describe('Message Content', () => {
    it('handles empty message', () => {
      const alert = new Alert(theme, 'info', '', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);

      expect(output.length).toBeGreaterThan(0);
      // Should still have icon
      expect(createOutputMatcher(output).contains('i')).toBe(true);
    });

    it('handles long message', () => {
      const longMessage =
        'This is a very long message that should still render correctly regardless of the length of the content provided to the alert component';
      const alert = new Alert(theme, 'success', longMessage, {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);
      const matcher = createOutputMatcher(output);

      expect(output.length).toBeGreaterThan(0);
      expect(matcher.contains('This is a very long message')).toBe(true);
    });

    it('handles special characters in message', () => {
      const alert = new Alert(theme, 'error', 'Error: $PATH not found!', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('$PATH')).toBe(true);
      expect(matcher.contains('not found!')).toBe(true);
    });
  });

  describe('Padding Configuration', () => {
    it('applies no padding when padding is 0', () => {
      const alert = new Alert(theme, 'info', 'No padding', {
        bgColor: 'userMessageBg',
        padding: 0,
      });

      const output = alert.render(80);

      expect(output.length).toBeGreaterThan(0);
      // With no padding, content should be directly rendered
      const matcher = createOutputMatcher(output);
      expect(matcher.contains('No padding')).toBe(true);
    });

    it('applies padding when padding is 1', () => {
      const alert = new Alert(theme, 'info', 'With padding', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);

      expect(output.length).toBeGreaterThan(0);
      // Should have empty lines for padding
      expect(output.length).toBeGreaterThanOrEqual(3); // top padding, content, bottom padding
    });

    it('applies larger padding when padding is 2', () => {
      const alert = new Alert(theme, 'info', 'More padding', {
        bgColor: 'userMessageBg',
        padding: 2,
      });

      const output = alert.render(80);

      expect(output.length).toBeGreaterThan(0);
      // Should have more lines with larger padding
      expect(output.length).toBeGreaterThanOrEqual(5); // 2 top, content, 2 bottom
    });
  });

  describe('Edge Cases', () => {
    it('handles minimum width (20 chars)', () => {
      const alert = new Alert(theme, 'info', 'Hi', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(20);

      expect(output.length).toBeGreaterThan(0);
    });

    it('handles very small width (10 chars)', () => {
      const alert = new Alert(theme, 'info', 'X', {
        bgColor: 'userMessageBg',
        padding: 0,
      });

      const output = alert.render(10);

      expect(output.length).toBeGreaterThan(0);
    });

    it('renders consistently with same inputs', () => {
      const alert = new Alert(theme, 'success', 'Consistent', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output1 = alert.render(80);
      const output2 = alert.render(80);

      expect(output1).toEqual(output2);
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for success alert', () => {
      const alert = new Alert(theme, 'success', 'Operation completed successfully', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);
      expect(output).toMatchSnapshot();
    });

    it('matches snapshot for error alert', () => {
      const alert = new Alert(theme, 'error', 'Connection to server failed', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);
      expect(output).toMatchSnapshot();
    });

    it('matches snapshot for warning alert', () => {
      const alert = new Alert(theme, 'warning', 'High memory usage detected', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);
      expect(output).toMatchSnapshot();
    });

    it('matches snapshot for info alert', () => {
      const alert = new Alert(theme, 'info', 'System update available', {
        bgColor: 'userMessageBg',
        padding: 1,
      });

      const output = alert.render(80);
      expect(output).toMatchSnapshot();
    });
  });
});
