import { describe, it, expect, beforeEach } from 'bun:test';
import { AsciiBox, createAsciiBox } from './AsciiBox';
import { Text } from '@mariozechner/pi-tui';
import { createTestTheme, stripAnsi } from './test-helpers';

describe('AsciiBox', () => {
  let theme: ReturnType<typeof createTestTheme>;

  beforeEach(() => {
    theme = createTestTheme();
  });

  describe('basic rendering', () => {
    it('should render a box with title and content', () => {
      const box = new AsciiBox(theme, {
        title: new Text('Title', 0, 0),
        content: new Text('Content', 0, 0),
      });

      const lines = box.render(20);
      const stripped = lines.map(stripAnsi);

      // Check structure
      expect(stripped[0]).toMatch(/^╭─+╮$/);
      expect(stripped[stripped.length - 1]).toMatch(/^╰─+╯$/);

      // Check borders on content lines
      for (let i = 1; i < stripped.length - 1; i++) {
        if (stripped[i].includes('─')) {
          // Separator line
          expect(stripped[i]).toMatch(/^├─+┤$/);
        } else {
          // Content line
          expect(stripped[i].startsWith('│')).toBe(true);
          expect(stripped[i].endsWith('│')).toBe(true);
        }
      }
    });

    it('should include title text', () => {
      const box = new AsciiBox(theme, {
        title: new Text('My Title', 0, 0),
        content: new Text('My Content', 0, 0),
      });

      const lines = box.render(30);
      const stripped = lines.map(stripAnsi);
      const joined = stripped.join('\n');

      expect(joined).toContain('My Title');
      expect(joined).toContain('My Content');
    });

    it('should render separator between title and content', () => {
      const box = new AsciiBox(theme, {
        title: new Text('Title', 0, 0),
        content: new Text('Content', 0, 0),
      });

      const lines = box.render(20);
      const stripped = lines.map(stripAnsi);

      // Find separator line
      const separatorIndex = stripped.findIndex((line) => line.includes('├'));
      expect(separatorIndex).toBeGreaterThan(0);
      expect(stripped[separatorIndex]).toMatch(/^├─+┤$/);
    });

    it('should hide separator when showSeparator is false', () => {
      const box = new AsciiBox(
        theme,
        {
          title: new Text('Title', 0, 0),
          content: new Text('Content', 0, 0),
        },
        { showSeparator: false }
      );

      const lines = box.render(20);
      const stripped = lines.map(stripAnsi);

      // No separator line
      const separatorIndex = stripped.findIndex((line) => line.includes('├'));
      expect(separatorIndex).toBe(-1);
    });
  });

  describe('width handling', () => {
    it('should respect provided width', () => {
      const box = new AsciiBox(theme, {
        title: new Text('Title', 0, 0),
        content: new Text('Content', 0, 0),
      });

      const lines = box.render(40);
      const stripped = lines.map(stripAnsi);

      // All lines should be 40 chars wide
      for (const line of stripped) {
        expect(line.length).toBe(40);
      }
    });

    it('should handle narrow widths', () => {
      const box = new AsciiBox(theme, {
        title: new Text('T', 0, 0),
        content: new Text('C', 0, 0),
      });

      const lines = box.render(10);
      const stripped = lines.map(stripAnsi);

      // Should still have proper structure
      expect(stripped[0]).toMatch(/^╭─+╮$/);
      expect(stripped[stripped.length - 1]).toMatch(/^╰─+╯$/);
    });
  });

  describe('padding', () => {
    it('should apply default padding of 1', () => {
      const box = new AsciiBox(theme, {
        title: new Text('X', 0, 0),
        content: new Text('Y', 0, 0),
      });

      const lines = box.render(20);
      const stripped = lines.map(stripAnsi);

      // Find title line (first content line after top border)
      const titleLine = stripped[1];
      // Should have space after │ and before content
      expect(titleLine.startsWith('│ ')).toBe(true);
    });

    it('should apply custom padding', () => {
      const box = new AsciiBox(
        theme,
        {
          title: new Text('X', 0, 0),
          content: new Text('Y', 0, 0),
        },
        { padding: 3 }
      );

      const lines = box.render(30);
      const stripped = lines.map(stripAnsi);

      // Find title line
      const titleLine = stripped[1];
      // Should have 3 spaces after │
      expect(titleLine.startsWith('│   ')).toBe(true);
    });
  });

  describe('helper function', () => {
    it('should create box using createAsciiBox', () => {
      const box = createAsciiBox(theme, {
        title: new Text('Title', 0, 0),
        content: new Text('Content', 0, 0),
      });

      expect(box).toBeInstanceOf(AsciiBox);

      const lines = box.render(30);
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should pass options to createAsciiBox', () => {
      const box = createAsciiBox(
        theme,
        {
          title: new Text('Title', 0, 0),
          content: new Text('Content', 0, 0),
        },
        { showSeparator: false, padding: 2 }
      );

      const lines = box.render(30);
      const stripped = lines.map(stripAnsi);

      // No separator
      const separatorIndex = stripped.findIndex((line) => line.includes('├'));
      expect(separatorIndex).toBe(-1);
    });
  });

  describe('dynamic updates', () => {
    it('should update title', () => {
      const box = new AsciiBox(theme, {
        title: new Text('Old Title', 0, 0),
        content: new Text('Content', 0, 0),
      });

      box.setTitle(new Text('New Title', 0, 0));

      const lines = box.render(30);
      const stripped = lines.map(stripAnsi);
      const joined = stripped.join('\n');

      expect(joined).toContain('New Title');
      expect(joined).not.toContain('Old Title');
    });

    it('should update content', () => {
      const box = new AsciiBox(theme, {
        title: new Text('Title', 0, 0),
        content: new Text('Old Content', 0, 0),
      });

      box.setContent(new Text('New Content', 0, 0));

      const lines = box.render(30);
      const stripped = lines.map(stripAnsi);
      const joined = stripped.join('\n');

      expect(joined).toContain('New Content');
      expect(joined).not.toContain('Old Content');
    });
  });

  describe('multiline content', () => {
    it('should handle multiline title', () => {
      // Create a component that renders multiple lines
      const multiLineTitle = {
        render: () => ['Line 1', 'Line 2'],
        invalidate: () => {},
      };

      const box = new AsciiBox(theme, {
        title: multiLineTitle,
        content: new Text('Content', 0, 0),
      });

      const lines = box.render(30);
      const stripped = lines.map(stripAnsi);
      const joined = stripped.join('\n');

      expect(joined).toContain('Line 1');
      expect(joined).toContain('Line 2');
    });

    it('should handle multiline content', () => {
      const multiLineContent = {
        render: () => ['Content 1', 'Content 2', 'Content 3'],
        invalidate: () => {},
      };

      const box = new AsciiBox(theme, {
        title: new Text('Title', 0, 0),
        content: multiLineContent,
      });

      const lines = box.render(30);
      const stripped = lines.map(stripAnsi);
      const joined = stripped.join('\n');

      expect(joined).toContain('Content 1');
      expect(joined).toContain('Content 2');
      expect(joined).toContain('Content 3');
    });
  });
});
