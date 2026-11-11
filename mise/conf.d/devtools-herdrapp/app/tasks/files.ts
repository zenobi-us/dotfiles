// Shared paths and atomic writes for the scoped Herdr-app setup tasks.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export const appHome = process.env.HERDR_APP_HOME ?? path.join(os.homedir(), ".config/herdr-app");

export async function atomicWrite(file: string, content: string | Uint8Array): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.next`;
  try {
    await fs.writeFile(temporary, content, { mode: 0o600 });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}
