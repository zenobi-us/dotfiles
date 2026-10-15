import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const usagePath = fileURLToPath(new URL('../USAGE.md', import.meta.url));
const virtualId = 'virtual:worktree-diagrams';
const resolvedId = `\0${virtualId}`;

function worktreeDiagrams() {
  return {
    name: 'worktree-diagrams',
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      this.addWatchFile(usagePath);
      const output = execFileSync('mq', [
        '--allow-http-import', '-I', 'markdown', '-F', 'json',
        'import "github.com/harehare/okf.mq" | .code("mermaid")', usagePath,
      ], { encoding: 'utf8' });
      const blocks = JSON.parse(output);
      if (blocks.length !== 3 || blocks.some((block) => block.lang !== 'mermaid')) {
        throw new Error('USAGE.md must contain exactly three Mermaid diagrams.');
      }
      return `export default ${JSON.stringify(blocks.map((block) => block.value))}`;
    },
  };
}

export default defineConfig({ plugins: [worktreeDiagrams()] });
