/**
 * AsciiBox Component - Box with borders around title and content
 *
 * Wraps title and content components inside an ASCII box using box-drawing characters.
 * Handles width calculation correctly using visibleWidth for ANSI-colored strings.
 *
 * **Layout Structure:**
 * ```
 * ╭─────────────────────────────────────╮
 * │ Title Component                     │
 * ├─────────────────────────────────────┤
 * │ Content Component                   │
 * │ (can be multiple lines)             │
 * ╰─────────────────────────────────────╯
 * ```
 *
 * **Box Drawing Characters:**
 * - `╭` top-left corner
 * - `╮` top-right corner
 * - `╰` bottom-left corner
 * - `╯` bottom-right corner
 * - `├` left tee (separator)
 * - `┤` right tee (separator)
 * - `│` vertical line
 * - `─` horizontal line
 *
 * @example
 * ```typescript
 * const box = new AsciiBox(theme, {
 *   title: new Text(theme.fg("accent", "My Title"), 0, 0),
 *   content: new Text("Some content here", 0, 0),
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using helper function (recommended)
 * const box = createAsciiBox(theme, {
 *   title: new Text("Header", 0, 0),
 *   content: myContentComponent,
 * });
 * ```
 */

import type { Component } from '@mariozechner/pi-tui';
import { visibleWidth } from '@mariozechner/pi-tui';
import { Theme, type ThemeColor } from '@mariozechner/pi-coding-agent';

/**
 * Props for AsciiBox component
 */
export interface AsciiBoxProps {
  /** Title component rendered in the header */
  title: Component;
  /** Content component rendered in the body */
  content: Component;
}

/**
 * Configuration options for AsciiBox component
 */
export interface AsciiBoxOptions {
  /** Border color key from theme (default: "border") */
  borderColor?: ThemeColor;
  /** Padding inside the box (default: 1) */
  padding?: number;
  /** Whether to show separator between title and content (default: true) */
  showSeparator?: boolean;
}

/**
 * AsciiBox component with title and content in bordered container
 *
 * **Internal Structure:**
 * - Top border with corners
 * - Title lines (each wrapped with side borders)
 * - Separator line (optional)
 * - Content lines (each wrapped with side borders)
 * - Bottom border with corners
 */
export class AsciiBox implements Component {
  private options: Required<AsciiBoxOptions>;

  /**
   * Create an AsciiBox component
   *
   * @param theme - Theme instance for colors
   * @param props - Title and content components
   * @param options - Configuration options
   */
  constructor(
    private theme: Theme,
    private props: AsciiBoxProps,
    options?: AsciiBoxOptions
  ) {
    this.options = AsciiBox.createOptions(options);
  }

  /**
   * Create default options with proper merging
   */
  public static createOptions(someOptions?: Partial<AsciiBoxOptions>): Required<AsciiBoxOptions> {
    return {
      borderColor: someOptions?.borderColor ?? 'border',
      padding: someOptions?.padding ?? 1,
      showSeparator: someOptions?.showSeparator ?? true,
    };
  }

  /**
   * Pad a string to target length accounting for ANSI codes
   */
  private pad(s: string, targetWidth: number): string {
    const vis = visibleWidth(s);
    const needed = Math.max(0, targetWidth - vis);
    return s + ' '.repeat(needed);
  }

  /**
   * Create a bordered row from content
   */
  private row(content: string, innerWidth: number): string {
    const border = this.theme.fg(this.options.borderColor, '│');
    const paddingStr = ' '.repeat(this.options.padding);
    const contentWidth = innerWidth - this.options.padding * 2;
    const paddedContent = this.pad(paddingStr + content, innerWidth - this.options.padding);
    return border + paddedContent + paddingStr.slice(0, this.options.padding) + border;
  }

  /**
   * Wrap each line of rendered component in borders
   */
  private wrapLines(lines: string[], innerWidth: number): string[] {
    return lines.map((line) => this.row(line, innerWidth));
  }

  /**
   * Create top border: ╭───────╮
   */
  private topBorder(innerWidth: number): string {
    return this.theme.fg(this.options.borderColor, '╭' + '─'.repeat(innerWidth) + '╮');
  }

  /**
   * Create bottom border: ╰───────╯
   */
  private bottomBorder(innerWidth: number): string {
    return this.theme.fg(this.options.borderColor, '╰' + '─'.repeat(innerWidth) + '╯');
  }

  /**
   * Create separator: ├───────┤
   */
  private separator(innerWidth: number): string {
    return this.theme.fg(this.options.borderColor, '├' + '─'.repeat(innerWidth) + '┤');
  }

  /**
   * Create empty row with just borders
   */
  private emptyRow(innerWidth: number): string {
    const border = this.theme.fg(this.options.borderColor, '│');
    return border + ' '.repeat(innerWidth) + border;
  }

  /**
   * Render the box to an array of strings
   *
   * @param width - Available width in characters
   * @returns Array of strings representing each line
   */
  render(width: number): string[] {
    // Calculate inner width (total width minus 2 border chars)
    const innerWidth = Math.max(0, width - 2);

    // Width available for content (inner width minus padding on both sides)
    const contentWidth = Math.max(0, innerWidth - this.options.padding * 2);

    // Render title and content components
    const titleLines = this.props.title.render(contentWidth);
    const contentLines = this.props.content.render(contentWidth);

    const lines: string[] = [];

    // Top border
    lines.push(this.topBorder(innerWidth));

    // Title section
    for (const line of titleLines) {
      lines.push(this.row(line, innerWidth));
    }

    // Separator (if enabled and both title and content exist)
    if (this.options.showSeparator && titleLines.length > 0 && contentLines.length > 0) {
      lines.push(this.separator(innerWidth));
    }

    // Content section
    for (const line of contentLines) {
      lines.push(this.row(line, innerWidth));
    }

    // Bottom border
    lines.push(this.bottomBorder(innerWidth));

    return lines;
  }

  /**
   * Invalidate the component, forcing a re-render
   */
  invalidate(): void {
    this.props.title.invalidate();
    this.props.content.invalidate();
  }

  /**
   * Update the title component
   */
  setTitle(title: Component): void {
    this.props.title = title;
  }

  /**
   * Update the content component
   */
  setContent(content: Component): void {
    this.props.content = content;
  }

  /**
   * Get current props
   */
  getProps(): AsciiBoxProps {
    return this.props;
  }
}

/**
 * Helper function to create an AsciiBox (recommended)
 *
 * @param theme - Theme instance for colors
 * @param props - Title and content components
 * @param options - Configuration options
 * @returns New AsciiBox instance
 *
 * @example
 * ```typescript
 * const box = createAsciiBox(theme, {
 *   title: new Text("My Title", 0, 0),
 *   content: new Text("Content goes here", 0, 0),
 * });
 * ```
 */
export function createAsciiBox(
  theme: Theme,
  props: AsciiBoxProps,
  options?: Partial<AsciiBoxOptions>
): AsciiBox {
  return new AsciiBox(theme, props, AsciiBox.createOptions(options));
}
