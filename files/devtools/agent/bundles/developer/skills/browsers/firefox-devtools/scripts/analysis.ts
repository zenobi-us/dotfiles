#!/usr/bin/env -S mise x -- bun --install=fallback
/** Print the maintained Firefox test analysis without shell pipelines. */
const root = new URL("..", import.meta.url).pathname;
const files = ["tests.ts", "integration.test.ts"];
for (const file of files) {
  const text = await Bun.file(`${root}/${file}`).text();
  const describes = [...text.matchAll(/describe\(['"]([^'"]+)/g)].map((m) => m[1]);
  const tests = [...text.matchAll(/\bit\(['"]([^'"]+)/g)].map((m) => m[1]);
  console.log(`${file}: ${text.split("\n").length - 1} lines, ${describes.length} groups, ${tests.length} tests`);
  for (const name of describes) console.log(`  - ${name}`);
}
