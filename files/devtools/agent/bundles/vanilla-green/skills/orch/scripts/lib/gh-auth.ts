import { envValue, projectRoot, run } from "./runtime.ts";
export function ghAuthStatus(): boolean { return run(["gh", "api", "user"]).code === 0; }
export function loadEnvBotToken(root = projectRoot()): string { const token = process.env.GH_BOT_TOKEN ?? envValue(root, "GH_BOT_TOKEN", ""); if (token) process.env.GH_TOKEN = token; return token; }
export function ghWithToken(token: string, args: string[]) { return run(["gh", ...args], token ? { env: { ...process.env, GH_TOKEN: token } } : {}); }
