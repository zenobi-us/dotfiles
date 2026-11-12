#!/usr/bin/env -S mise x -- bun --install=fallback
// Direct execution shares the public serve command; it never starts a second server.
import { runCli } from "./commands.ts";
await runCli(true);
