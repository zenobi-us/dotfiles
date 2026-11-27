import { allMiseModules } from "../.content-collections/generated";
import type { ModuleDocument, ModuleItem, ModuleSummary } from "./lib/module-document";

export type { ModuleDocument, ModuleItem, ModuleSummary } from "./lib/module-document";

export const modules: ModuleSummary[] = allMiseModules.toSorted((a, b) => a.id.localeCompare(b.id));
export const moduleFamilies = [...new Set(modules.map((module) => module.family))];

const documents = import.meta.glob<{ default: ModuleDocument }>("../.content-collections/module-documents/**/*.json");

export function moduleOf(id: string): ModuleSummary | undefined {
  return modules.find((module) => module.id === id);
}

export function moduleItemHref(module: ModuleSummary, item: ModuleItem): string {
  return item.href ?? `/modules/${module.id}/items/${item.id}/`;
}

export async function loadModuleDocument(module: string, key: string): Promise<ModuleDocument> {
  const load = documents[`../.content-collections/module-documents/${module}/${key}.json`];
  if (!load) throw new Error(`Module document is missing from the build: ${module}/${key}`);
  return (await load()).default;
}
