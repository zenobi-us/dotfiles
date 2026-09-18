#!/usr/bin/env -S mise x -- bun --install=fallback
import { spawnSync } from "node:child_process";
const result = spawnSync("bun", ["test", "tests.ts", "integration.test.ts"], { stdio: "inherit" });
process.exit(result.status ?? 1);
