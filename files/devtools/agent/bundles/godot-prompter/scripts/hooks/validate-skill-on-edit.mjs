#!/usr/bin/env node
// PostToolUse hook: runs scripts/validate-skills.mjs after Edit/Write of a
// skills/*/SKILL.md or agents/*.md file. Non-blocking — surfaces validator
// errors to the model via hookSpecificOutput.additionalContext. Warnings are
// not surfaced (token-budget warnings are noisy by design).
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

const input = readStdin();
if (!input) process.exit(0);

const filePath = input?.tool_input?.file_path ?? input?.tool_response?.filePath ?? '';
const norm = filePath.replace(/\\/g, '/');
const isSkill = /(^|\/)skills\/[^/]+\/SKILL\.md$/.test(norm);
const isAgent = /(^|\/)agents\/[^/]+\.md$/.test(norm);
if (!isSkill && !isAgent) process.exit(0);

const result = spawnSync('node', ['scripts/validate-skills.mjs', '--json'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
});

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  process.exit(0);
}

const errors = report.errors ?? [];
if (errors.length === 0) process.exit(0); // no errors — stay silent

const context =
  `Skill validator reported ${errors.length} error(s) after this edit:\n` +
  errors.map((e) => `- ${e.file} [${e.rule}]: ${e.message}`).join('\n') +
  `\n\nRun \`node scripts/validate-skills.mjs\` locally for the full report (warnings included).`;

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: context,
    },
  })
);
