import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { z } from "zod";
import type { ModuleSummary } from "./module-document.ts";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
const itemFields = {
  id: slug,
  title: text,
  description: text,
  kind: z.enum(["tool", "command", "extension", "plugin", "integration", "configuration", "bundle"]),
  sources: z.array(text).min(1),
};

export const moduleManifestSchema = z.strictObject({
  title: text,
  description: text,
  items: z
    .array(
      z.union([
        z.strictObject({ ...itemFields, readme: text, howto: text }),
        z.strictObject({ ...itemFields, href: text.regex(/^\/(?:bundles|modules)\/[a-z0-9/-]+\/$/) }),
      ]),
    )
    .min(1),
});

/** Resolve authored paths without allowing a manifest or symlink to escape its module. */
export function moduleFile(directory: string, path: string): string {
  const root = realpathSync(directory);
  const file = resolve(root, path);
  const local = relative(root, file);
  if (isAbsolute(path) || !local || local === ".." || local.startsWith(`..${sep}`))
    throw new Error(`Module path must stay within ${directory}: ${path}`);
  if (!existsSync(file)) throw new Error(`Module source does not exist: ${file}`);
  const target = relative(root, realpathSync(file));
  if (target === ".." || target.startsWith(`..${sep}`)) throw new Error(`Module symlink escapes ${directory}: ${path}`);
  if (/(?:^|\/)(?:credentials|\.env)(?:[./]|$)/i.test(path))
    throw new Error(`Credential files cannot be documentation sources: ${path}`);
  return file;
}

/** Shared discovery drives the build collection and static routes from the same records. */
export function moduleFiles(directory: string): ModuleSummary[] {
  const modules = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .map((entry): ModuleSummary => {
      const root = join(directory, entry.name);
      slug.parse(entry.name);
      const manifest = moduleManifestSchema.parse(JSON.parse(readFileSync(moduleFile(root, "docs.json"), "utf8")));
      if (!statSync(moduleFile(root, "README.md")).isFile())
        throw new Error(`Expected module README.md: ${entry.name}`);
      const ids = new Set<string>();
      for (const item of manifest.items) {
        if (ids.has(item.id)) throw new Error(`Duplicate item ID: ${entry.name}/${item.id}`);
        ids.add(item.id);
        for (const source of item.sources) moduleFile(root, source);
        if ("readme" in item) {
          for (const [path, name] of [
            [item.readme, "README.md"],
            [item.howto, "HOWTO.md"],
          ] as const) {
            const file = moduleFile(root, path);
            if (basename(path) !== name || !statSync(file).isFile())
              throw new Error(`Expected ${name} document for ${entry.name}/${item.id}: ${path}`);
          }
        }
      }
      return {
        id: entry.name,
        family: entry.name.includes("-") ? entry.name.split("-")[0]! : entry.name,
        title: manifest.title,
        description: manifest.description,
        configurations: readdirSync(root)
          .filter((name) => /^mise(?:\.[a-z0-9]+)?\.toml$/.test(name))
          .toSorted(),
        items: manifest.items,
      };
    });
  const destinations = new Set(
    modules.flatMap((module) =>
      module.items.filter((item) => !item.href).map((item) => `/modules/${module.id}/items/${item.id}/`),
    ),
  );
  for (const module of modules) {
    for (const item of module.items) {
      if (!item.href) continue;
      const bundle = item.href.match(/^\/bundles\/([a-z0-9-]+)\/$/);
      if (bundle && existsSync(join(directory, "devtools-agent/bundles", bundle[1]!, ".claude-plugin/plugin.json")))
        continue;
      if (!destinations.has(item.href))
        throw new Error(`Unknown canonical destination for ${module.id}/${item.id}: ${item.href}`);
    }
  }
  return modules;
}
