/**
 * Unit Tests for Sized Component
 */

import { describe, it, expect, vi } from 'vitest';
import { Sized, sized, fixed } from './Sized';
import { Text } from '@mariozechner/pi-tui';

describe('Sized Component', () => {
  describe('Basic Construction', () => {
    it('creates sized component with class constructor', () => {
      const text = new Text('Hello', 0, 0);
      const sizedComponent = new Sized(text, 20);

      expect(sizedComponent.preferredWidth).toBe(20);
      expect(sizedComponent.fixedWidth).toBeUndefined();
    });

    it('creates sized component with helper function', () => {
      const text = new Text('World', 0, 0);
      const sizedComponent = sized(text, 30);

      expect(sizedComponent.preferredWidth).toBe(30);
      expect(sizedComponent.fixedWidth).toBeUndefined();
    });

    it('creates fixed-width component with helper function', () => {
      const text = new Text('Fixed', 0, 0);
      const fixedComponent = fixed(text, 15);

      expect(fixedComponent.preferredWidth).toBe(15);
      expect(fixedComponent.fixedWidth).toBe(true);
    });
  });

  describe('PreferredWidth Property', () => {
    it('stores preferred width correctly', () => {
      const text = new Text('Test', 0, 0);
      const sizedComponent = new Sized(text, 50);

      expect(sizedComponent.preferredWidth).toBe(50);
    });

    it('handles small preferred width', () => {
      const text = new Text('A', 0, 0);
      const sizedComponent = new Sized(text, 5);

      expect(sizedComponent.preferredWidth).toBe(5);
    });

    it('handles large preferred width', () => {
      const text = new Text('Long content', 0, 0);
      const sizedComponent = new Sized(text, 200);

      expect(sizedComponent.preferredWidth).toBe(200);
    });

    it('handles zero preferred width', () => {
      const text = new Text('', 0, 0);
      const sizedComponent = new Sized(text, 0);

      expect(sizedComponent.preferredWidth).toBe(0);
    });
  });

  describe('FixedWidth Property', () => {
    it('sets fixedWidth to true for fixed components', () => {
      const text = new Text('Icon', 0, 0);
      const fixedComponent = new Sized(text, 10, true);

      expect(fixedComponent.fixedWidth).toBe(true);
    });

    it('sets fixedWidth to false for flexible components', () => {
      const text = new Text('Flexible', 0, 0);
      const flexibleComponent = new Sized(text, 20, false);

      expect(flexibleComponent.fixedWidth).toBe(false);
    });

    it('leaves fixedWidth undefined when not specified', () => {
      const text = new Text('Default', 0, 0);
      const sizedComponent = new Sized(text, 15);

      expect(sizedComponent.fixedWidth).toBeUndefined();
    });
  });

  describe('Rendering', () => {
    it('renders wrapped component at given width', () => {
      const text = new Text('Content', 0, 0);
      const sizedComponent = new Sized(text, 20);

      const output = sizedComponent.render(40);

      expect(output).toBeDefined();
      expect(Array.isArray(output)).toBe(true);
    });

    it('renders at different widths correctly', () => {
      const text = new Text('Test', 0, 0);
      const sizedComponent = new Sized(text, 30);

      const output1 = sizedComponent.render(50);
      const output2 = sizedComponent.render(100);

      expect(output1).toBeDefined();
      expect(output2).toBeDefined();
    });

    it('passes render width to wrapped component', () => {
      const text = new Text('A'.repeat(50), 0, 0);
      const sizedComponent = new Sized(text, 20);

      const output = sizedComponent.render(80);

      // The wrapped component receives the width parameter
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Component Access', () => {
    it('provides access to wrapped component', () => {
      const text = new Text('Original', 0, 0);
      const sizedComponent = new Sized(text, 25);

      const wrapped = sizedComponent.getComponent();

      expect(wrapped).toBe(text);
    });

    it('preserves wrapped component reference', () => {
      const originalText = new Text('Reference', 0, 0);
      const sizedComponent = new Sized(originalText, 30);

      const retrieved = sizedComponent.getComponent();

      expect(retrieved).toBe(originalText);
    });
  });

  describe('Invalidation', () => {
    it('calls invalidate on wrapped component', () => {
      let invalidateCalled = false;

      const mockComponent = {
        render: vi.fn(() => ['test']),
        invalidate: vi.fn(() => {
          invalidateCalled = true;
        }),
      };

      const sizedComponent = new Sized(mockComponent, 20);
      sizedComponent.invalidate();

      expect(invalidateCalled).toBe(true);
    });
  });

  describe('Input Handling', () => {
    it('forwards handleInput to wrapped component when available', () => {
      let inputReceived = '';

      const mockComponent = {
        render: vi.fn(() => ['test']),
        invalidate: vi.fn(),
        handleInput: vi.fn((data: string) => {
          inputReceived = data;
        }),
      };

      const sizedComponent = new Sized(mockComponent, 20);
      sizedComponent.handleInput?.('test input');

      expect(inputReceived).toBe('test input');
    });

    it('handles missing handleInput gracefully', () => {
      const mockComponent = {
        render: vi.fn(() => ['test']),
        invalidate: vi.fn(),
      };

      const sizedComponent = new Sized(mockComponent, 20);

      // Should not throw
      expect(() => {
        sizedComponent.handleInput?.('test');
      }).not.toThrow();
    });
  });

  describe('Helper Functions', () => {
    it('sized() helper creates Sized component', () => {
      const text = new Text('Helper', 0, 0);
      const result = sized(text, 40);

      expect(result).toBeInstanceOf(Sized);
      expect(result.preferredWidth).toBe(40);
      expect(result.fixedWidth).toBeUndefined();
    });

    it('fixed() helper creates fixed-width component', () => {
      const text = new Text('Fixed Helper', 0, 0);
      const result = fixed(text, 25);

      expect(result).toBeInstanceOf(Sized);
      expect(result.preferredWidth).toBe(25);
      expect(result.fixedWidth).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles component with no content', () => {
      const text = new Text('', 0, 0);
      const sizedComponent = new Sized(text, 10);

      const output = sizedComponent.render(20);

      expect(output).toBeDefined();
      expect(Array.isArray(output)).toBe(true);
    });

    it('handles very small preferred width', () => {
      const text = new Text('X', 0, 0);
      const sizedComponent = new Sized(text, 1);

      expect(sizedComponent.preferredWidth).toBe(1);
      expect(() => sizedComponent.render(10)).not.toThrow();
    });

    it('handles very large preferred width', () => {
      const text = new Text('Content', 0, 0);
      const sizedComponent = new Sized(text, 1000);

      expect(sizedComponent.preferredWidth).toBe(1000);
      expect(() => sizedComponent.render(100)).not.toThrow();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for sized component', () => {
      const text = new Text('Snapshot test content', 0, 0);
      const sizedComponent = sized(text, 30);

      const output = sizedComponent.render(80);
      expect(output).toMatchSnapshot();
    });

    it('matches snapshot for fixed component', () => {
      const text = new Text('Fixed width content', 0, 0);
      const fixedComponent = fixed(text, 20);

      const output = fixedComponent.render(80);
      expect(output).toMatchSnapshot();
    });
  });
});
