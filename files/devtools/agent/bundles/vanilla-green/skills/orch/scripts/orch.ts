#!/usr/bin/env -S mise x -- bun --install=fallback
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { existsSync } from "node:fs";
import { projectRoot } from "./lib/runtime.ts";
const app = new Crust("orch").meta({ description: "Run vanilla-green orchestration helpers." });
const commands = ["initialize", "start", "fix", "review", "submit", "merge", "handoff"];
for (const name of commands) app.sub(name).meta({ description: `Run the ${name} orchestration workflow.` }).run(() => { console.log(`${name}: use the corresponding orch workflow.`); });
app.sub("doctor").meta({ description: "Report orch runtime prerequisites." }).run(() => { const root = projectRoot(); console.log(JSON.stringify({ bun: Bun.version, mise: Boolean(Bun.which("mise")), gh: Boolean(Bun.which("gh")), git: Boolean(Bun.which("git")), project_root: root, state_dir: existsSync(`${root}/tmp`) })); });
app.use(helpPlugin()).execute();
