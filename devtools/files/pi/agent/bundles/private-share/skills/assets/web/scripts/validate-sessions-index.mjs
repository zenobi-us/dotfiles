#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const indexFile = 'sessions.jsonl';
const filenamePattern = /^sessions\/(?:\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)-[a-z0-9]+(?:_[a-z0-9]+)*\.html$/;
let failed = false;
const listedPaths = new Set();
const datePattern = /^(?:\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)$/;

function fail(message) {
  console.error(`sessions index validation: ${message}`);
  failed = true;
}

function collectHtmlFiles(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return collectHtmlFiles(path);
    return entry.isFile() && path.endsWith('.html') ? [path] : [];
  });
}

if (!existsSync(indexFile)) {
  fail(`${indexFile} does not exist`);
} else {
  const lines = readFileSync(indexFile, 'utf8').split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) return;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch (error) {
      fail(`${indexFile}:${lineNumber} invalid JSON: ${error.message}`);
      return;
    }

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      fail(`${indexFile}:${lineNumber} must be an object with date, path, title`);
      return;
    }

    const { date, path, title } = entry;

    if (typeof date !== 'string' || date.length === 0) {
      fail(`${indexFile}:${lineNumber} missing string date`);
      return;
    }

    if (!datePattern.test(date)) {
      fail(`${indexFile}:${lineNumber} date must be YYYY-MM-DD or YYYY-MM-DDTHH-MM-SSZ: ${date}`);
    }

    if (typeof path !== 'string' || path.length === 0) {
      fail(`${indexFile}:${lineNumber} missing string path`);
      return;
    }

    if (typeof title !== 'string' || title.length === 0) {
      fail(`${indexFile}:${lineNumber} missing string title`);
      return;
    }

    listedPaths.add(path);

    if (!filenamePattern.test(path)) {
      fail(`${indexFile}:${lineNumber} path must match <isodate>-<snake-case-description>.html under sessions/: ${path}`);
    }

    if (!path.startsWith(`sessions/${date}-`)) {
      fail(`${indexFile}:${lineNumber} path date prefix must match date field: ${path}`);
    }

    if (!existsSync(path)) {
      fail(`${indexFile}:${lineNumber} listed file does not exist: ${path}`);
    }
  });
}

collectHtmlFiles('sessions').forEach((path) => {
  if (!filenamePattern.test(path)) {
    fail(`session file must match <isodate>-<snake-case-description>.html: ${path}`);
  }

  if (!listedPaths.has(path)) {
    fail(`session file is missing from ${indexFile}: ${path}`);
  }
});

if (failed) {
  process.exit(1);
}

console.log('sessions index validation: ok');
