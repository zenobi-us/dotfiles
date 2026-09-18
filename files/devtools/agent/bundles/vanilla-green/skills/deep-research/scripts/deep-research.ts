#!/usr/bin/env -S mise x -- bun --install=fallback

import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { doctor, legacyPath, runLegacy } from "../../_shared/bun-compat.ts";

const app = new Crust("deep-research").meta({ description: "Run evidence-backed research reports." });
const forward = (name: string) => app.sub(name).run(() => runLegacy(legacyPath(import.meta.url, "deep-research"), process.argv.slice(2)));
const doctorCommand = app.sub("doctor").run(() => doctor([], ["EXA_API_KEY"]));
const commands = ["report", "json", "validate"].map(forward);
let cli = app.use(helpPlugin()).command(doctorCommand);
for (const command of commands) cli = cli.command(command);
cli.execute();
