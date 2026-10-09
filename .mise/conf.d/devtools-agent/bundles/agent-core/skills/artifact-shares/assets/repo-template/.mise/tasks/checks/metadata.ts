#!/usr/bin/env -S mise exec -- bun run --install=fallback

//MISE description="Fail when a published image carries embedded metadata"

/*!
 * A screenshot is not only pixels. PNG text chunks and JPEG EXIF carry the
 * user name, the machine name, the camera, the software, and sometimes the
 * GPS position of the person who took it. A share publishes the file byte for
 * byte, so every one of those reaches the site.
 *
 * This check reads the container format itself. No external tool, so it gives
 * the same answer on every machine. It reports what it found and stops; it
 * never rewrites a file, because the published bytes must stay identical to
 * the artifact that was tested.
 *
 *   checks/metadata.ts                fail on any finding
 *   checks/metadata.ts --allow        report and pass, when you have read it
 *   checks/metadata.ts --root <dir>   check somewhere else
 *
 * To fix a finding, strip the metadata in the source artifact and share it
 * again. Different bytes give a different hash, so the result is a new page.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const taskDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(taskDir, "..", "..", "..");

const argv = process.argv.slice(2);
const allow = argv.includes("--allow");
const rootFlag = argv.indexOf("--root");
const root = rootFlag === -1 ? repoRoot : path.resolve(argv[rootFlag + 1] ?? repoRoot);

const SKIP = new Set(["node_modules", "dist", ".source", ".git"]);
const IS_IMAGE = /\.(png|jpe?g|webp)$/i;

function walk(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(child);
    return entry.isFile() && IS_IMAGE.test(entry.name) ? [child] : [];
  });
}

/** Printable prefix of a value, so a person can judge a finding without
 *  opening the file. */
function preview(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes.slice(0, 80)) text += byte >= 32 && byte < 127 ? String.fromCharCode(byte) : ".";
  return text.trim();
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const PNG_TEXT = new Set(["tEXt", "zTXt", "iTXt", "eXIf"]);

function readPng(data: Buffer): string[] {
  const found: string[] = [];
  let offset = 8;
  while (offset + 8 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    if (type === "IEND") break;
    if (PNG_TEXT.has(type)) {
      const body = data.subarray(offset + 8, offset + 8 + Math.min(length, 200));
      const cut = body.indexOf(0);
      const keyword = cut === -1 ? type : body.toString("latin1", 0, cut);
      found.push(`${type} ${keyword}: ${preview(cut === -1 ? body : body.subarray(cut + 1))}`);
    }
    // length + type + data + CRC
    offset += 12 + length;
    if (length < 0 || offset <= 0) break;
  }
  return found;
}

const JPEG_SEGMENTS: Record<number, string> = {
  0xe1: "APP1 (EXIF or XMP)",
  0xed: "APP13 (Photoshop)",
  0xee: "APP14 (Adobe)",
  0xfe: "COM (comment)",
};

function readJpeg(data: Buffer): string[] {
  const found: string[] = [];
  let offset = 2;
  while (offset + 4 <= data.length) {
    if (data[offset] !== 0xff) break;
    const marker = data[offset + 1]!;
    // Start of scan: the rest is compressed pixels.
    if (marker === 0xda || marker === 0xd9) break;
    const length = data.readUInt16BE(offset + 2);
    const name = JPEG_SEGMENTS[marker];
    if (name) {
      const body = data.subarray(offset + 4, offset + 2 + Math.min(length, 200));
      found.push(`${name}: ${preview(body)}`);
    }
    offset += 2 + length;
    if (length < 2) break;
  }
  return found;
}

const WEBP_CHUNKS = new Set(["EXIF", "XMP "]);

function readWebp(data: Buffer): string[] {
  const found: string[] = [];
  let offset = 12;
  while (offset + 8 <= data.length) {
    const type = data.toString("ascii", offset, offset + 4);
    const length = data.readUInt32LE(offset + 4);
    if (WEBP_CHUNKS.has(type)) {
      found.push(`${type}: ${preview(data.subarray(offset + 8, offset + 8 + Math.min(length, 200)))}`);
    }
    // Chunks are padded to an even length.
    offset += 8 + length + (length % 2);
    if (length < 0) break;
  }
  return found;
}

function readMetadata(file: string): string[] {
  const data = readFileSync(file);
  if (data.length < 12) return [];
  if (PNG_MAGIC.every((byte, index) => data[index] === byte)) return readPng(data);
  if (data[0] === 0xff && data[1] === 0xd8) return readJpeg(data);
  if (data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") {
    return readWebp(data);
  }
  return [];
}

let images = 0;
let dirty = 0;

for (const file of walk(root).sort()) {
  if (!statSync(file).isFile()) continue;
  images += 1;
  const found = readMetadata(file);
  if (found.length === 0) continue;
  dirty += 1;
  console.error(`metadata check: ${path.relative(root, file)}`);
  for (const line of found) console.error(`  ${line}`);
}

if (dirty > 0 && !allow) {
  console.error("");
  console.error(`${dirty} of ${images} image(s) carry embedded metadata.`);
  console.error("Strip it in the source artifact, then share again. The new bytes get a new hash.");
  console.error("To publish anyway, having read the findings above, pass --allow.");
  process.exit(1);
}

console.log(
  dirty > 0
    ? `metadata check: ${dirty} of ${images} image(s) carry metadata, allowed`
    : `metadata check: ok (${images} image(s))`,
);
