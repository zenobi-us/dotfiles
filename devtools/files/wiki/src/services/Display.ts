import { marked } from 'marked';
import TuiRenderer from 'marked-terminal';

marked.setOptions({
  renderer: new TuiRenderer()
});

const RenderMarkdownTui = async (markdown: string): Promise<string> => {
  return await marked(markdown);
}

export { RenderMarkdownTui };

