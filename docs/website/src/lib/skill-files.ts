// Static hosting needs an explicit page for each installed skill and its how-to collection.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

export function skillFiles(directory: string): { name: string; hasHowTos: boolean }[] {
  if (!existsSync(directory)) return [];
  const files = readdirSync(directory, { withFileTypes: true });
  const children = files
    .filter((file) => file.isDirectory() && file.name !== "node_modules" && !file.name.startsWith("."))
    .flatMap((file) => skillFiles(join(directory, file.name)));
  if (files.some((file) => file.isFile() && file.name === "SKILL.md")) {
    const data = matter(readFileSync(join(directory, "SKILL.md"), "utf8")).data;
    return [
      { name: String(data.name), hasHowTos: files.some((file) => file.isFile() && /^how-to-.+\.md$/.test(file.name)) },
      ...children,
    ];
  }
  return children;
}
