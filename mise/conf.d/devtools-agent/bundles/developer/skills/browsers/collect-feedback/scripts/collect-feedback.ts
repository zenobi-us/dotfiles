#!/usr/bin/env -S mise x -- bun --install=fallback
// Installed CLI resolves its code and bundled viewer relative to this file.
import { runCli } from "./collect-feedback/commands.ts";
await runCli();
