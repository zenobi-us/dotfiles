#!/usr/bin/env -S mise exec -- bun run --install=fallback
/**
 * Print the real pixel size of image files: one "<name> <w> <h>" line each.
 *
 *     imgsize.ts shots/*.png
 *
 * PNG and JPEG are read straight from the file header, so no external tool is
 * needed.
 *
 * This exists so that nobody has to guess a size, and so that no agent has to
 * invent a shim to satisfy the validator. Reading the header is the whole job.
 */
import { basename } from "node:path";

export type Size = { width: number; height: number };

/** PNG: the IHDR chunk always sits at byte 8, width and height at 16..24. */
function pngSize(buf: Uint8Array): Size | null {
  if (buf.length < 24) return null;
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (signature.some((byte, i) => buf[i] !== byte)) return null;

  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const ihdr = String.fromCharCode(...buf.subarray(12, 16));
  if (ihdr !== "IHDR") return null;

  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** JPEG: walk the marker chain to the first SOF segment, which carries the size. */
function jpegSize(buf: Uint8Array): Size | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let at = 2;

  while (at < buf.length - 1) {
    if (buf[at] !== 0xff) {
      at += 1;
      continue;
    }
    while (buf[at] === 0xff) at += 1; // skip fill bytes
    const marker = buf[at];
    at += 1;

    // Standalone markers carry no length segment.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) continue;
    if (at + 2 > buf.length) return null;

    const length = view.getUint16(at);
    // SOF0..SOF15, excluding DHT (c4), JPG (c8) and DAC (cc).
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isStartOfFrame) {
      if (at + 7 > buf.length) return null;
      return { height: view.getUint16(at + 3), width: view.getUint16(at + 5) };
    }
    at += length;
  }
  return null;
}

/** ImageMagick, for anything that is neither PNG nor JPEG. */
function identifySize(file: string): Size | null {
  const run = Bun.spawnSync(["identify", "-format", "%w %h", file]);
  if (run.exitCode !== 0) return null;
  const [w, h] = new TextDecoder().decode(run.stdout).trim().split(/\s+/);
  const width = Number(w);
  const height = Number(h);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { width, height };
}

export async function sizeOf(file: string): Promise<Size | null> {
  let buf: Uint8Array;
  try {
    buf = new Uint8Array(await Bun.file(file).arrayBuffer());
  } catch {
    return null;
  }
  return pngSize(buf) ?? jpegSize(buf) ?? identifySize(file);
}

async function main(files: string[]): Promise<number> {
  if (files.length === 0) {
    console.error("usage: imgsize.ts <image> [<image> ...]");
    return 2;
  }

  let code = 0;
  for (const file of files) {
    const size = await sizeOf(file);
    if (!size) {
      console.error(
        `error: cannot read the size of ${file}. Install ImageMagick, or save the screenshot as PNG.`,
      );
      code = 1;
      continue;
    }
    console.log(`${basename(file)} ${size.width} ${size.height}`);
  }
  return code;
}

if (import.meta.main) {
  process.exit(await main(Bun.argv.slice(2)));
}
