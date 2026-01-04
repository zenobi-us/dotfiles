
module 'marked-terminal' {
  import type { Renderer } from 'marked';

  interface TerminalRendererOptions {
    width?: number;
    reflowText?: boolean;
    tabStop?: number;
    codeBlockStyle?: 'indented' | 'fenced';
    showSectionPrefix?: boolean;
  }

  export default class TerminalRenderer extends Renderer {
    constructor(options?: TerminalRendererOptions);
  }
}


