#!/usr/bin/env -S mise x -- bun --install=fallback

import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { doctor, legacyPath, runLegacy } from "../../_shared/bun-compat.ts";

const app = new Crust("second-opinion").meta({ description: "Request a review from an external AI CLI." });
const forward = (name: string) => app.sub(name).run(() => runLegacy(legacyPath(import.meta.url, "second-opinion"), process.argv.slice(2)));
const doctorCommand = app.sub("doctor").run(() => doctor(["git", "jq"]));
const commands = ["review", "audit", "challenge", "quick", "detect"].map(forward);
let cli = app.use(helpPlugin()).command(doctorCommand);
for (const command of commands) cli = cli.command(command);
cli.execute();
