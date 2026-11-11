// Bundles the original PNG bytes so the preview works offline without changing screenshots.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const template = await readFile(join(root, "source.html"), "utf8");
const data = JSON.parse(await readFile(join(root, "screen-data.json"), "utf8"));
if (!data.length || !data.every(screen => screen.sha256 && screen.src.startsWith("data:image/png;base64,"))) {
  throw new Error("Preview input must contain native PNG screenshots and their source hashes.");
}
if (template.split("__SCREEN_DATA__").length !== 2) throw new Error("Expected exactly one screenshot-data insertion point.");
const html = template.replace("__SCREEN_DATA__", JSON.stringify(data).replaceAll("<", "\\u003c"));
await mkdir(join(root, "site"), { recursive: true });
await writeFile(join(root, "site/index.html"), html);
console.log(JSON.stringify({ output: join(root, "site/index.html"), screenshots: data.length, bytes: Buffer.byteLength(html), options: 3 }));
