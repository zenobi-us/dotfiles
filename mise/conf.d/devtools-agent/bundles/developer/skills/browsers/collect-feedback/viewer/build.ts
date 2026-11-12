import { resolve } from 'node:path';
import { rm } from 'node:fs/promises';
const directory = import.meta.dir;
process.chdir(directory);
await Bun.$`bunx --no-install tailwindcss -i ./src/styles.css -o ./.build/styles.css --minify`;
const result = await Bun.build({entrypoints:['./src/main.tsx'],target:'browser',format:'iife',minify:true,define:{'process.env.NODE_ENV':JSON.stringify('production')}});
if (!result.success) throw new AggregateError(result.logs, 'Viewer bundle failed');
let css = await Bun.file('./.build/styles.css').text();
for (const weight of [400,500]) {
  const font = await Bun.file(resolve(directory, 'node_modules/@fontsource/jetbrains-mono/files', `jetbrains-mono-latin-${weight}-normal.woff2`)).arrayBuffer();
  css = `@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${Buffer.from(font).toString('base64')}) format('woff2')}` + css;
}
const js = (await result.outputs[0].text()).replaceAll('</script', '<\\/script');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Evidence · Collect feedback</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
await Bun.write('./index.html', html);
await rm('./.build', {recursive:true,force:true});
console.log(`Built ${Buffer.byteLength(html)} bytes → index.html (JS, CSS, JetBrains Mono 400/500 embedded)`);
