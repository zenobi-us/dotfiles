#!/usr/bin/env -S mise x -- bun --install=fallback

import { legacyPath, runLegacy } from "../../_shared/bun-compat.ts";

runLegacy(legacyPath(import.meta.url, "verification-scope"), process.argv.slice(2));
