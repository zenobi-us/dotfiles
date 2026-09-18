import { envValue, parseTomlEnv, projectRoot } from "./runtime.ts";
export function vstackLoadProjectEnv(root = projectRoot()): Record<string, string> { const values = parseTomlEnv(root); for (const [key, value] of Object.entries(values)) if (process.env[key] === undefined) process.env[key] = value; return values; }
export { envValue };
