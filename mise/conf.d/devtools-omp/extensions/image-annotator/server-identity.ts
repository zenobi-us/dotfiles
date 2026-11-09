// Identity survives service restarts and address changes. Damaged state is never replaced.
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, lstat } from "node:fs/promises";
import { resolve } from "node:path";

export async function loadCoordinatorIdentity(directory: string): Promise<string> {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = resolve(directory, "coordinator-id");
  let stored: string;
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || (info.mode & 0o077)) throw new Error("Stored server identity must be a private regular file.");
    stored = await readFile(path, "utf8");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
    const id = randomBytes(16).toString("hex");
    try {
      await writeFile(path, `${id}\n`, { flag: "wx", mode: 0o600 });
      return id;
    } catch (writeError) {
      if (!(writeError instanceof Error) || !("code" in writeError) || writeError.code !== "EEXIST") throw writeError;
      stored = await readFile(path, "utf8");
    }
  }
  const id = stored.trim();
  if (!/^[a-f0-9]{32}$/.test(id)) throw new Error("Stored server identity is damaged. Preserve the file and repair it before startup.");
  return id;
}
