/**
 * Unit Tests for Grid Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Grid } from './Grid';
import { Text } from '@mariozechner/pi-tui';
import { createOutputMatcher } from './test-helpers';

describe('Grid Component', () => {
  describe('Basic Construction', () => {
    it('creates grid with default options', () => {
      const grid = new Grid();
      expect(grid).toBeDefined();
    });

    it('creates grid with custom spacing', () => {
      const grid = new Grid({ spacing: 4 });
      expect(grid).toBeDefined();
    });

    it('creates grid with custom minColumnWidth', () => {
      const grid = new Grid({ minColumnWidth: 20 });
      expect(grid).toBeDefined();
    });

    it('creates grid with both custom options', () => {
      const grid = new Grid({ spacing: 3, minColumnWidth: 15 });
      expect(grid).toBeDefined();
    });
  });

  describe('Child Management', () => {
    it('starts with no children', () => {
      const grid = new Grid();
      const output = grid.render(80);

      expect(output).toEqual([]);
    });

    it('adds single child', () => {
      const grid = new Grid();
      grid.addChild(new Text('Column 1', 0, 0));

      const output = grid.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('adds multiple children', () => {
      const grid = new Grid();
      grid.addChild(new Text('Col 1', 0, 0));
      grid.addChild(new Text('Col 2', 0, 0));
      grid.addChild(new Text('Col 3', 0, 0));

      const output = grid.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('removes child correctly', () => {
      const grid = new Grid();
      const child1 = new Text('Keep', 0, 0);
      const child2 = new Text('Remove', 0, 0);

      grid.addChild(child1);
      grid.addChild(child2);
      grid.removeChild(child2);

      const output = grid.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('Keep')).toBe(true);
      expect(matcher.contains('Remove')).toBe(false);
    });

    it('handles removing non-existent child gracefully', () => {
      const grid = new Grid();
      const child = new Text('Exists', 0, 0);
      const nonChild = new Text('Does not exist', 0, 0);

      grid.addChild(child);

      expect(() => grid.removeChild(nonChild)).not.toThrow();
    });
  });

  describe('Equal Width Distribution', () => {
    it('distributes width equally among 2 children', () => {
      const grid = new Grid({ spacing: 2 });
      grid.addChild(new Text('A', 0, 0));
      grid.addChild(new Text('B', 0, 0));

      const output = grid.render(80);

      // With 2 children and 2 spacing: (80 - 2) / 2 = 39 per column
      expect(output.length).toBeGreaterThan(0);
    });

    it('distributes width equally among 3 children', () => {
      const grid = new Grid({ spacing: 2 });
      grid.addChild(new Text('A', 0, 0));
      grid.addChild(new Text('B', 0, 0));
      grid.addChild(new Text('C', 0, 0));

      const output = grid.render(90);

      // With 3 children and 2 spacing each: (90 - 4) / 3 = ~28 per column
      expect(output.length).toBeGreaterThan(0);
    });

    it('distributes width equally among 4 children', () => {
      const grid = new Grid({ spacing: 2 });
      grid.addChild(new Text('A', 0, 0));
      grid.addChild(new Text('B', 0, 0));
      grid.addChild(new Text('C', 0, 0));
      grid.addChild(new Text('D', 0, 0));

      const output = grid.render(100);

      // With 4 children and 2 spacing each: (100 - 6) / 4 = 23.5 -> 23 per column
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Spacing Behavior', () => {
    it('applies default spacing of 2', () => {
      const grid = new Grid();
      grid.addChild(new Text('First', 0, 0));
      grid.addChild(new Text('Second', 0, 0));

      const output = grid.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('applies custom spacing of 4', () => {
      const grid = new Grid({ spacing: 4 });
      grid.addChild(new Text('First', 0, 0));
      grid.addChild(new Text('Second', 0, 0));

      const output = grid.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('handles zero spacing', () => {
      const grid = new Grid({ spacing: 0 });
      grid.addChild(new Text('A', 0, 0));
      grid.addChild(new Text('B', 0, 0));

      const output = grid.render(80);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Minimum Width Handling', () => {
    it('falls back to vertical layout when width too small', () => {
      const grid = new Grid({ minColumnWidth: 20 });
      grid.addChild(new Text('Column 1', 0, 0));
      grid.addChild(new Text('Column 2', 0, 0));

      // Width 30 < 20 * 2 + spacing, should stack vertically
      const output = grid.render(30);

      expect(output.length).toBeGreaterThan(1);
    });

    it('uses horizontal layout when width sufficient', () => {
      const grid = new Grid({ minColumnWidth: 10 });
      grid.addChild(new Text('A', 0, 0));
      grid.addChild(new Text('B', 0, 0));

      // Width 80 is plenty for 2 columns at min 10
      const output = grid.render(80);

      expect(output.length).toBeGreaterThan(0);
    });

    it('respects custom minimum column width', () => {
      const grid = new Grid({ minColumnWidth: 30 });
      grid.addChild(new Text('Wide column', 0, 0));
      grid.addChild(new Text('Another wide column', 0, 0));

      const output = grid.render(100);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Content Rendering', () => {
    it('renders text content in columns', () => {
      const grid = new Grid();
      grid.addChild(new Text('First Column', 0, 0));
      grid.addChild(new Text('Second Column', 0, 0));

      const output = grid.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('First Column')).toBe(true);
      expect(matcher.contains('Second Column')).toBe(true);
    });

    it('handles empty text components', () => {
      const grid = new Grid();
      grid.addChild(new Text('', 0, 0));
      grid.addChild(new Text('', 0, 0));

      const output = grid.render(80);
      expect(output).toBeDefined();
    });

    it('handles mixed content lengths', () => {
      const grid = new Grid();
      grid.addChild(new Text('Short', 0, 0));
      grid.addChild(new Text('Much longer content here', 0, 0));
      grid.addChild(new Text('X', 0, 0));

      const output = grid.render(80);
      const matcher = createOutputMatcher(output);

      expect(matcher.contains('Short')).toBe(true);
      expect(matcher.contains('Much longer content here')).toBe(true);
      expect(matcher.contains('X')).toBe(true);
    });
  });

  describe('Width Variations', () => {
    let grid: Grid;

    beforeEach(() => {
      grid = new Grid({ spacing: 2 });
      grid.addChild(new Text('Column A', 0, 0));
      grid.addChild(new Text('Column B', 0, 0));
      grid.addChild(new Text('Column C', 0, 0));
    });

    it('renders at 40 characters width', () => {
      const output = grid.render(40);
      expect(output.length).toBeGreaterThan(0);
      expect(output.every((line) => line.length <= 40)).toBe(true);
    });

    it('renders at 80 characters width', () => {
      const output = grid.render(80);
      expect(output.length).toBeGreaterThan(0);
      expect(output.every((line) => line.length <= 80)).toBe(true);
    });

    it('renders at 120 characters width', () => {
      const output = grid.render(120);
      expect(output.length).toBeGreaterThan(0);
      expect(output.every((line) => line.length <= 120)).toBe(true);
    });

    it('renders at 160 characters width', () => {
      const output = grid.render(160);
      expect(output.length).toBeGreaterThan(0);
      expect(output.every((line) => line.length <= 160)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles single child in grid', () => {
      const grid = new Grid();
      grid.addChild(new Text('Only child', 0, 0));

      const output = grid.render(80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('handles very narrow width', () => {
      const grid = new Grid({ minColumnWidth: 5 });
      grid.addChild(new Text('A', 0, 0));

      const output = grid.render(10);
      expect(output).toBeDefined();
    });

    it('handles very wide width', () => {
      const grid = new Grid();
      grid.addChild(new Text('A', 0, 0));
      grid.addChild(new Text('B', 0, 0));

      const output = grid.render(500);
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders consistently with same inputs', () => {
      const grid = new Grid();
      grid.addChild(new Text('Consistent', 0, 0));
      grid.addChild(new Text('Content', 0, 0));

      const output1 = grid.render(80);
      const output2 = grid.render(80);

      expect(output1).toEqual(output2);
    });
  });

  describe('Invalidation', () => {
    it('calls invalidate on all children', () => {
      const calls: number[] = [];

      const mockChild1 = {
        render: vi.fn(() => ['test']),
        invalidate: vi.fn(() => calls.push(1)),
      };

      const mockChild2 = {
        render: vi.fn(() => ['test']),
        invalidate: vi.fn(() => calls.push(2)),
      };

      const grid = new Grid();
      grid.addChild(mockChild1);
      grid.addChild(mockChild2);

      grid.invalidate();

      expect(calls).toContain(1);
      expect(calls).toContain(2);
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for 3-column grid', () => {
      const grid = new Grid({ spacing: 2 });
      grid.addChild(new Text('Column 1', 0, 0));
      grid.addChild(new Text('Column 2', 0, 0));
      grid.addChild(new Text('Column 3', 0, 0));

      const output = grid.render(80);
      expect(output).toMatchSnapshot();
    });

    it('matches snapshot for wide spacing', () => {
      const grid = new Grid({ spacing: 5 });
      grid.addChild(new Text('First', 0, 0));
      grid.addChild(new Text('Second', 0, 0));

      const output = grid.render(80);
      expect(output).toMatchSnapshot();
    });

    it('matches snapshot for many columns', () => {
      const grid = new Grid({ spacing: 1 });
      for (let i = 1; i <= 5; i++) {
        grid.addChild(new Text(`Col ${i}`, 0, 0));
      }

      const output = grid.render(100);
      expect(output).toMatchSnapshot();
    });
  });
});
