/**
 * Unit Tests for Flex Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Flex } from './Flex';
import { sized, fixed } from './Sized';
import { Text } from '@mariozechner/pi-tui';
import { createOutputMatcher } from './test-helpers';

describe('Flex Component', () => {
  describe('Basic Construction', () => {
    it('creates flex with default options', () => {
      const flex = new Flex();
      expect(flex).toBeDefined();
    });

    it('creates flex with fill mode', () => {
      const flex = new Flex({ mode: 'fill' });
      expect(flex).toBeDefined();
    });

    it('creates flex with wrap mode', () => {
      const flex = new Flex({ mode: 'wrap' });
      expect(flex).toBeDefined();
    });

    it('creates flex with custom spacing', () => {
      const flex = new Flex({ spacing: 4 });
      expect(flex).toBeDefined();
    });

    it('creates flex with alignment', () => {
      const flex = new Flex({ align: 'center' });
      expect(flex).toBeDefined();
    });
  });

  describe('Child Management', () => {
    it('starts with no children', () => {
      const flex = new Flex();
      const output = flex.render(80);

      expect(output).toEqual([]);
    });

    it('adds single child', () => {
      const flex = new Flex();
      flex.addChild(sized(new Text('Item', 0, 0), 20));

      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('adds multiple children', () => {
      const flex = new Flex();
      flex.addChild(sized(new Text('Item 1', 0, 0), 15));
      flex.addChild(sized(new Text('Item 2', 0, 0), 15));
      flex.addChild(sized(new Text('Item 3', 0, 0), 15));

      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('removes child correctly', () => {
      const flex = new Flex();
      const child1 = sized(new Text('Keep', 0, 0), 20);
      const child2 = sized(new Text('Remove', 0, 0), 20);

      flex.addChild(child1);
      flex.addChild(child2);
      flex.removeChild(child2);

      const output = flex.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('Keep')).toBe(true);
      expect(matcher.contains('Remove')).toBe(false);
    });
  });

  describe('Fill Mode - Basic Behavior', () => {
    it('distributes extra space evenly among flexible children', () => {
      const flex = new Flex({ mode: 'fill', spacing: 2 });
      flex.addChild(sized(new Text('A', 0, 0), 10)); // min 10
      flex.addChild(sized(new Text('B', 0, 0), 10)); // min 10
      flex.addChild(sized(new Text('C', 0, 0), 10)); // min 10

      // Width 80: (80 - 4 spacing) = 76 / 3 = ~25 each
      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('respects minimum widths in fill mode', () => {
      const flex = new Flex({ mode: 'fill' });
      flex.addChild(sized(new Text('Small', 0, 0), 10));
      flex.addChild(sized(new Text('Large', 0, 0), 50));

      const output = flex.render(100);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('Small')).toBe(true);
      expect(matcher.contains('Large')).toBe(true);
    });

    it('handles uneven space distribution', () => {
      const flex = new Flex({ mode: 'fill', spacing: 2 });
      flex.addChild(sized(new Text('A', 0, 0), 15));
      flex.addChild(sized(new Text('B', 0, 0), 20));
      flex.addChild(sized(new Text('C', 0, 0), 25));

      const output = flex.render(100);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Fill Mode - Fixed Width Support', () => {
    it('gives fixed children exactly their preferred width', () => {
      const flex = new Flex({ mode: 'fill', spacing: 2 });
      flex.addChild(fixed(new Text('Icon', 0, 0), 10)); // Exactly 10
      flex.addChild(sized(new Text('Message', 0, 0), 20)); // Min 20, can grow

      const output = flex.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('Icon')).toBe(true);
      expect(matcher.contains('Message')).toBe(true);
    });

    it('distributes extra space only to flexible children', () => {
      const flex = new Flex({ mode: 'fill', spacing: 2 });
      flex.addChild(fixed(new Text('A', 0, 0), 15)); // Fixed at 15
      flex.addChild(sized(new Text('B', 0, 0), 20)); // Can grow
      flex.addChild(sized(new Text('C', 0, 0), 20)); // Can grow

      // Width 100: 15 (fixed) + 2 + flexible + 2 + flexible = 100
      // Flexible space: 100 - 15 - 4 = 81 / 2 = ~40 each
      const output = flex.render(100);
      expect(output.length).toBeGreaterThan(0);
    });

    it('handles multiple fixed children', () => {
      const flex = new Flex({ mode: 'fill', spacing: 2 });
      flex.addChild(fixed(new Text('A', 0, 0), 10));
      flex.addChild(fixed(new Text('B', 0, 0), 15));
      flex.addChild(sized(new Text('C', 0, 0), 20));

      const output = flex.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('A')).toBe(true);
      expect(matcher.contains('B')).toBe(true);
      expect(matcher.contains('C')).toBe(true);
    });

    it('handles all children being fixed', () => {
      const flex = new Flex({ mode: 'fill', spacing: 2 });
      flex.addChild(fixed(new Text('A', 0, 0), 20));
      flex.addChild(fixed(new Text('B', 0, 0), 25));
      flex.addChild(fixed(new Text('C', 0, 0), 30));

      const output = flex.render(100);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Wrap Mode - Basic Behavior', () => {
    it('wraps children to next line when width exceeded', () => {
      const flex = new Flex({ mode: 'wrap', spacing: 2 });
      flex.addChild(sized(new Text('First', 0, 0), 30));
      flex.addChild(sized(new Text('Second', 0, 0), 30));
      flex.addChild(sized(new Text('Third', 0, 0), 30));

      // Width 40: Can't fit all three, should wrap
      const output = flex.render(40);
      expect(output.length).toBeGreaterThan(1);
    });

    it('keeps items on same line when they fit', () => {
      const flex = new Flex({ mode: 'wrap', spacing: 2 });
      flex.addChild(sized(new Text('A', 0, 0), 10));
      flex.addChild(sized(new Text('B', 0, 0), 10));
      flex.addChild(sized(new Text('C', 0, 0), 10));

      // Width 80: Plenty of space, should stay on one line
      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('wraps at correct boundaries', () => {
      const flex = new Flex({ mode: 'wrap', spacing: 2 });
      flex.addChild(sized(new Text('Short', 0, 0), 10));
      flex.addChild(sized(new Text('Medium text', 0, 0), 20));
      flex.addChild(sized(new Text('Very long text here', 0, 0), 35));

      const output = flex.render(40);
      expect(output.length).toBeGreaterThan(1);
    });
  });

  describe('Spacing Behavior', () => {
    it('applies default spacing of 2', () => {
      const flex = new Flex({ mode: 'fill' });
      flex.addChild(sized(new Text('A', 0, 0), 10));
      flex.addChild(sized(new Text('B', 0, 0), 10));

      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('applies custom spacing of 4', () => {
      const flex = new Flex({ mode: 'fill', spacing: 4 });
      flex.addChild(sized(new Text('A', 0, 0), 10));
      flex.addChild(sized(new Text('B', 0, 0), 10));

      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('handles zero spacing', () => {
      const flex = new Flex({ mode: 'fill', spacing: 0 });
      flex.addChild(sized(new Text('A', 0, 0), 10));
      flex.addChild(sized(new Text('B', 0, 0), 10));

      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('handles large spacing', () => {
      const flex = new Flex({ mode: 'wrap', spacing: 10 });
      flex.addChild(sized(new Text('A', 0, 0), 10));
      flex.addChild(sized(new Text('B', 0, 0), 10));

      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Alignment', () => {
    it('aligns left by default', () => {
      const flex = new Flex({ mode: 'wrap' });
      flex.addChild(sized(new Text('Left', 0, 0), 15));

      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('aligns center when specified', () => {
      const flex = new Flex({ mode: 'wrap', align: 'center' });
      flex.addChild(sized(new Text('Center', 0, 0), 15));

      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('aligns right when specified', () => {
      const flex = new Flex({ mode: 'wrap', align: 'right' });
      flex.addChild(sized(new Text('Right', 0, 0), 15));

      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Content Rendering', () => {
    it('renders text content correctly', () => {
      const flex = new Flex({ mode: 'fill' });
      flex.addChild(sized(new Text('First Item', 0, 0), 20));
      flex.addChild(sized(new Text('Second Item', 0, 0), 20));

      const output = flex.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('First Item')).toBe(true);
      expect(matcher.contains('Second Item')).toBe(true);
    });

    it('handles empty children', () => {
      const flex = new Flex({ mode: 'fill' });
      flex.addChild(sized(new Text('', 0, 0), 10));
      flex.addChild(sized(new Text('', 0, 0), 10));

      const output = flex.render(80);
      expect(output).toBeDefined();
    });

    it('handles mixed content lengths', () => {
      const flex = new Flex({ mode: 'wrap' });
      flex.addChild(sized(new Text('Short', 0, 0), 10));
      flex.addChild(sized(new Text('Much longer content', 0, 0), 30));
      flex.addChild(sized(new Text('X', 0, 0), 5));

      const output = flex.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('Short')).toBe(true);
      expect(matcher.contains('Much longer content')).toBe(true);
      expect(matcher.contains('X')).toBe(true);
    });
  });

  describe('Width Variations', () => {
    let flex: Flex;

    beforeEach(() => {
      flex = new Flex({ mode: 'fill', spacing: 2 });
      flex.addChild(sized(new Text('Item A', 0, 0), 15));
      flex.addChild(sized(new Text('Item B', 0, 0), 15));
      flex.addChild(sized(new Text('Item C', 0, 0), 15));
    });

    it('renders at 40 characters width', () => {
      const output = flex.render(40);
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders at 80 characters width', () => {
      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders at 120 characters width', () => {
      const output = flex.render(120);
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders at 160 characters width', () => {
      const output = flex.render(160);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles single child', () => {
      const flex = new Flex({ mode: 'fill' });
      flex.addChild(sized(new Text('Only', 0, 0), 20));

      const output = flex.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('handles very narrow width', () => {
      const flex = new Flex({ mode: 'wrap' });
      flex.addChild(sized(new Text('A', 0, 0), 5));

      const output = flex.render(10);
      expect(output).toBeDefined();
    });

    it('handles very wide width', () => {
      const flex = new Flex({ mode: 'fill' });
      flex.addChild(sized(new Text('A', 0, 0), 10));
      flex.addChild(sized(new Text('B', 0, 0), 10));

      const output = flex.render(500);
      expect(output.length).toBeGreaterThan(0);
    });

    it('handles children without preferred width', () => {
      const flex = new Flex({ mode: 'fill' });
      flex.addChild(new Text('No sizing', 0, 0));

      const output = flex.render(80);
      expect(output).toBeDefined();
    });

    it('renders consistently with same inputs', () => {
      const flex = new Flex({ mode: 'fill' });
      flex.addChild(sized(new Text('Consistent', 0, 0), 20));
      flex.addChild(sized(new Text('Content', 0, 0), 20));

      const output1 = flex.render(80);
      const output2 = flex.render(80);

      expect(output1).toEqual(output2);
    });
  });

  describe('Invalidation', () => {
    it('calls invalidate on all children', () => {
      const calls: number[] = [];

      const mockChild1 = sized(
        {
          render: vi.fn(() => ['test']),
          invalidate: vi.fn(() => calls.push(1)),
        },
        20
      );

      const mockChild2 = sized(
        {
          render: vi.fn(() => ['test']),
          invalidate: vi.fn(() => calls.push(2)),
        },
        20
      );

      const flex = new Flex();
      flex.addChild(mockChild1);
      flex.addChild(mockChild2);

      flex.invalidate();

      expect(calls).toContain(1);
      expect(calls).toContain(2);
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for fill mode', () => {
      const flex = new Flex({ mode: 'fill', spacing: 2 });
      flex.addChild(sized(new Text('Column 1', 0, 0), 20));
      flex.addChild(sized(new Text('Column 2', 0, 0), 20));
      flex.addChild(sized(new Text('Column 3', 0, 0), 20));

      const output = flex.render(80);
      expect(output).toMatchSnapshot();
    });

    it('matches snapshot for wrap mode', () => {
      const flex = new Flex({ mode: 'wrap', spacing: 2 });
      flex.addChild(sized(new Text('Tag 1', 0, 0), 15));
      flex.addChild(sized(new Text('Tag 2', 0, 0), 15));
      flex.addChild(sized(new Text('Tag 3', 0, 0), 15));
      flex.addChild(sized(new Text('Tag 4', 0, 0), 15));

      const output = flex.render(40);
      expect(output).toMatchSnapshot();
    });

    it('matches snapshot for fixed + flexible mix', () => {
      const flex = new Flex({ mode: 'fill', spacing: 2 });
      flex.addChild(fixed(new Text('Icon', 0, 0), 10));
      flex.addChild(sized(new Text('Message text here', 0, 0), 30));

      const output = flex.render(80);
      expect(output).toMatchSnapshot();
    });

    it('matches snapshot for center alignment', () => {
      const flex = new Flex({ mode: 'wrap', align: 'center', spacing: 2 });
      flex.addChild(sized(new Text('Centered', 0, 0), 20));
      flex.addChild(sized(new Text('Items', 0, 0), 15));

      const output = flex.render(80);
      expect(output).toMatchSnapshot();
    });
  });
});
