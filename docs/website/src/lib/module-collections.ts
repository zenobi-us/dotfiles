import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { defineCollection } from "@content-collections/core";
import { z } from "zod";
import { headingSlug } from "./headings";
import { compileDocument, type DocumentLinkTarget } from "./markdown";
import { moduleFiles, moduleManifestSchema } from "./module-files";
import { moduleSource } from "./module-source";
import { siteHref } from "./siteHref";

const directory = "../../mise/conf.d";
const modules = moduleFiles(resolve(import.meta.dirname, "../../../../mise/conf.d"));
const sources = new Map<string, { module: string; key: string; href: string }>();
for (const module of modules) {
  sources.set(`${module.id}/README.md`, { module: module.id, key: "overview", href: `/modules/${module.id}/` });
  for (const item of module.items) {
    if (item.href !== undefined) continue;
    const href = `/modules/${module.id}/items/${item.id}/`;
    for (const [path, key, destination] of [
      [item.readme, `${item.id}/overview`, href],
      [item.howto, `${item.id}/howto`, `${href}how-to/`],
    ] as const) {
      const file = `${module.id}/${path}`;
      if (sources.has(file)) throw new Error(`Documentation has more than one canonical page: ${file}`);
      sources.set(file, { module: module.id, key, href: destination });
    }
  }
}
const links = new Map<string, DocumentLinkTarget>();
for (const [file, page] of sources) {
  const path = file.replace(/\.md$/, "");
  links.set(moduleSource(page.module, file.slice(page.module.length + 1)), {
    href: siteHref(page.href),
    headingPrefix: `doc-${headingSlug(path)}-`,
  });
}

export const miseModules = defineCollection({
  name: "miseModules",
  directory,
  include: "*/docs.json",
  parser: "json",
  schema: moduleManifestSchema,
  transform: (document) => {
    const module = modules.find((entry) => entry.id === document._meta.directory);
    if (!module) throw new Error(`Unknown module manifest: ${document._meta.filePath}`);
    return module;
  },
});

/** Only manifest-listed Markdown is published; credentials and unrelated documents are never globbed. */
export const miseDocuments = defineCollection({
  name: "miseDocuments",
  directory,
  include: [...sources.keys()],
  schema: z.object({ content: z.string().min(1) }),
  transform: async (document, context) => {
    const page = sources.get(document._meta.filePath);
    if (!page) throw new Error(`Unregistered module document: ${document._meta.filePath}`);
    const source = moduleSource(page.module, document._meta.filePath.slice(page.module.length + 1));
    const html = await compileDocument(context, document, new URL(".", source).href, {
      linkTargets: links,
      omitTitle: true,
      omitInventory: page.key === "overview",
    });
    const file = join(".content-collections/module-documents", page.module, `${page.key}.json`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify({ html, source }));
    return { module: page.module, key: page.key };
  },
});
