#!/usr/bin/env -S deno run --allow-read

/**
 * Miniproject Memory Validation Script
 * Validates .memory/ files for frontmatter compliance and naming conventions
 */

import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { parse as parseYaml } from "https://deno.land/std@0.224.0/yaml/mod.ts";
import { basename, join } from "https://deno.land/std@0.224.0/path/mod.ts";

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
}

const MEMORY_DIR = ".memory";
const ARCHIVE_DIR = join(MEMORY_DIR, "archive");

// Special files that don't follow the naming convention
const SPECIAL_FILES = [
  "summary.md",
  "todo.md",
  "team.md",
  "constitution.md",
];

// Files that can have flexible naming (knowledge-*.md)
const FLEXIBLE_PREFIX_FILES = ["knowledge-"];

// Valid file types with their required frontmatter fields
const FILE_TYPES: Record<string, string[]> = {
  task: ["id", "title", "created_at", "updated_at", "status", "epic_id", "phase_id", "assigned_to"],
  phase: ["id", "title", "created_at", "updated_at", "status", "epic_id", "start_criteria", "end_criteria"],
  epic: ["id", "title", "created_at", "updated_at", "status"],
  story: ["id", "title", "created_at", "updated_at", "status", "epic_id", "priority"],
  research: ["id", "title", "created_at", "updated_at", "status", "epic_id"],
  learning: ["id", "title", "created_at", "updated_at", "status", "tags"],
};

function extractFrontmatter(content: string): Record<string, unknown> | null {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) return null;
  
  try {
    return parseYaml(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function validateFilename(filename: string): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if it's a special file
  if (SPECIAL_FILES.includes(filename)) {
    return { valid: true, errors, warnings };
  }
  
  // Check if it's a flexible prefix file
  for (const prefix of FLEXIBLE_PREFIX_FILES) {
    if (filename.startsWith(prefix) && filename.endsWith(".md")) {
      return { valid: true, errors, warnings };
    }
  }
  
  // Standard naming convention: <type>-<8_char_hashid>-<title>.md
  const namePattern = /^(task|phase|epic|story|research|learning)-([a-z0-9]{8})-(.+)\.md$/;
  const match = filename.match(namePattern);
  
  if (!match) {
    errors.push(`Invalid filename format. Expected: <type>-<8_char_hashid>-<title>.md`);
    return { valid: false, errors, warnings };
  }
  
  const [, type, hashId, title] = match;
  
  // Validate hash ID is exactly 8 characters
  if (hashId.length !== 8) {
    errors.push(`Hash ID must be exactly 8 characters, got: ${hashId.length}`);
  }
  
  // Validate title is kebab-case
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(title)) {
    warnings.push(`Title should be kebab-case: ${title}`);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

function validateFrontmatter(
  filename: string,
  frontmatter: Record<string, unknown> | null
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Skip validation for special files and flexible prefix files
  if (SPECIAL_FILES.includes(filename)) {
    return { errors, warnings };
  }
  
  for (const prefix of FLEXIBLE_PREFIX_FILES) {
    if (filename.startsWith(prefix)) {
      return { errors, warnings };
    }
  }
  
  if (!frontmatter) {
    errors.push("Missing frontmatter");
    return { errors, warnings };
  }
  
  // Extract type from filename
  const typeMatch = filename.match(/^(task|phase|epic|story|research|learning)-/);
  if (!typeMatch) {
    return { errors, warnings };
  }
  
  const type = typeMatch[1];
  const requiredFields = FILE_TYPES[type] || [];
  
  // Check for required fields
  for (const field of requiredFields) {
    if (!(field in frontmatter)) {
      errors.push(`Missing required frontmatter field: ${field}`);
    }
  }
  
  // Validate status field values
  if (frontmatter.status) {
    const validStatuses = ["proposed", "planning", "todo", "in-progress", "completed", "archived"];
    if (!validStatuses.includes(frontmatter.status as string)) {
      warnings.push(
        `Invalid status value: ${frontmatter.status}. Expected one of: ${validStatuses.join(", ")}`
      );
    }
  }
  
  // Validate ID matches filename hash
  if (frontmatter.id && typeMatch) {
    const hashMatch = filename.match(/-([a-z0-9]{8})-/);
    if (hashMatch && frontmatter.id !== hashMatch[1]) {
      errors.push(
        `Frontmatter ID (${frontmatter.id}) doesn't match filename hash (${hashMatch[1]})`
      );
    }
  }
  
  return { errors, warnings };
}

async function validateFile(filePath: string): Promise<ValidationResult> {
  const filename = basename(filePath);
  const result: ValidationResult = {
    file: filePath,
    errors: [],
    warnings: [],
  };
  
  // Skip assets directory
  if (filePath.includes("/assets/")) {
    return result;
  }
  
  // Validate filename
  const filenameValidation = validateFilename(filename);
  result.errors.push(...filenameValidation.errors);
  result.warnings.push(...filenameValidation.warnings);
  
  // Read and validate file content
  try {
    const content = await Deno.readTextFile(filePath);
    const frontmatter = extractFrontmatter(content);
    
    const frontmatterValidation = validateFrontmatter(filename, frontmatter);
    result.errors.push(...frontmatterValidation.errors);
    result.warnings.push(...frontmatterValidation.warnings);
  } catch (error) {
    result.errors.push(`Failed to read file: ${error.message}`);
  }
  
  return result;
}

async function validateMemory(): Promise<void> {
  console.log("🔍 Validating .memory/ files...\n");
  
  const results: ValidationResult[] = [];
  
  try {
    for await (const entry of walk(MEMORY_DIR, { exts: [".md"] })) {
      if (entry.isFile) {
        const result = await validateFile(entry.path);
        if (result.errors.length > 0 || result.warnings.length > 0) {
          results.push(result);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error walking directory: ${error.message}`);
    Deno.exit(1);
  }
  
  // Report results
  if (results.length === 0) {
    console.log("✅ All memory files are valid!\n");
    Deno.exit(0);
  }
  
  let hasErrors = false;
  
  for (const result of results) {
    if (result.errors.length > 0) {
      hasErrors = true;
      console.log(`❌ ${result.file}`);
      for (const error of result.errors) {
        console.log(`   ERROR: ${error}`);
      }
    }
    
    if (result.warnings.length > 0) {
      if (result.errors.length === 0) {
        console.log(`⚠️  ${result.file}`);
      }
      for (const warning of result.warnings) {
        console.log(`   WARNING: ${warning}`);
      }
    }
    
    console.log("");
  }
  
  if (hasErrors) {
    console.log("❌ Validation failed with errors\n");
    Deno.exit(1);
  } else {
    console.log("⚠️  Validation completed with warnings only\n");
    Deno.exit(0);
  }
}

// Run validation
await validateMemory();
