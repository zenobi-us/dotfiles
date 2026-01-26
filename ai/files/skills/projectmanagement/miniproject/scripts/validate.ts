#!/usr/bin/env bun
/**
 * Validate Miniproject Memory Files
 * 
 * Usage: 
 *   ./validate.ts [directory]
 * 
 * checks for:
 *   - Frontmatter existence
 *   - Common fields (id, title, created_at, updated_at, status)
 *   - Status validity
 *   - Type-specific required fields
 */

import { readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";

const SPECIAL_FILES = new Set(["summary.md", "todo.md", "team.md"]);
const VALID_STATUSES = new Set(["proposed", "planning", "todo", "in-progress", "completed", "archived"]);

interface Frontmatter {
  [key: string]: string | undefined;
}

async function parseFrontmatter(content: string): Promise<Frontmatter | null> {
  if (!content.startsWith("---")) return null;
  
  const endIndex = content.indexOf("\n---", 3);
  if (endIndex === -1) return null;

  const fmText = content.substring(3, endIndex);
  const data: Frontmatter = {};

  for (const line of fmText.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim();
      let val = line.substring(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      
      data[key] = val;
    }
  }
  return data;
}

async function checkFile(filepath: string): Promise<string | null> {
  const filename = basename(filepath);
  if (SPECIAL_FILES.has(filename)) return null;

  try {
    const file = Bun.file(filepath);
    const content = await file.text();

    const fm = await parseFrontmatter(content);
    if (!fm) {
      return `MISSING FRONTMATTER: ${filepath}`;
    }

    // Common fields check
    const commonFields = ["id", "title", "created_at", "updated_at", "status"];
    const missingCommon = commonFields.filter(k => !fm[k]);
    if (missingCommon.length > 0) {
      return `MISSING COMMON FIELDS [${missingCommon.join(", ")}]: ${filepath}`;
    }

    // Status check
    const status = fm["status"]?.toLowerCase() || "";
    if (!VALID_STATUSES.has(status)) {
      return `INVALID STATUS '${status}': ${filepath}`;
    }

    // Type specific checks
    if (filename.startsWith("task-")) {
      const req = ["epic_id", "phase_id", "assigned_to"];
      const missing = req.filter(k => !fm[k]);
      if (missing.length > 0) return `MISSING TASK FIELDS [${missing.join(", ")}]: ${filepath}`;
    } 
    else if (filename.startsWith("phase-")) {
      const req = ["epic_id", "start_criteria", "end_criteria"];
      const missing = req.filter(k => !fm[k]);
      if (missing.length > 0) return `MISSING PHASE FIELDS [${missing.join(", ")}]: ${filepath}`;
    }
    else if (filename.startsWith("research-")) {
      const req = ["epic_id"];
      const missing = req.filter(k => !fm[k]);
      if (missing.length > 0) return `MISSING RESEARCH FIELDS [${missing.join(", ")}]: ${filepath}`;
    }
    else if (filename.startsWith("learning-")) {
      const req = ["tags"];
      const missing = req.filter(k => !fm[k]);
      if (missing.length > 0) return `MISSING LEARNING FIELDS [${missing.join(", ")}]: ${filepath}`;
    }
    else if (filename.startsWith("knowledge-")) {
      const req = ["area", "tags", "learned_from"];
      const missing = req.filter(k => !fm[k]);
      if (missing.length > 0) return `MISSING KNOWLEDGE FIELDS [${missing.join(", ")}]: ${filepath}`;
    }

    return null;

  } catch (e) {
    return `ERROR reading ${filepath}: ${e}`;
  }
}

async function walk(dir: string): Promise<string[]> {
  let files: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(await walk(path));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(path);
      }
    }
  } catch (e) {
    // Ignore if directory doesn't exist
  }
  return files;
}

async function main() {
  const targetDir = Bun.argv[2] || ".memory";
  const files = await walk(targetDir);
  const violations: string[] = [];

  for (const file of files) {
    const result = await checkFile(file);
    if (result) {
      violations.push(result);
    }
  }

  if (violations.length > 0) {
    console.log("VIOLATIONS FOUND:");
    violations.forEach(v => console.log(v));
    process.exit(1);
  } else {
    console.log("No violations found.");
  }
}

main();
