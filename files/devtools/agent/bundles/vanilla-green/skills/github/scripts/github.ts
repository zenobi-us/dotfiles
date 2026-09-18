#!/usr/bin/env -S mise x -- bun --install=fallback

import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { doctor, legacyPath, runLegacy } from "../../_shared/bun-compat.ts";

const app = new Crust("github").meta({ description: "Run GitHub repository operations." });
const forward = (name: string) => app.sub(name).run(() => runLegacy(legacyPath(import.meta.url, "github.sh"), process.argv.slice(2)));
const doctorCommand = app.sub("doctor").run(() => doctor(["git", "gh"]));
const commands = ["pr-data", "pr-view", "pr-threads", "pr-review-status", "pr-list-ready", "pr-list-failing", "pr-create", "pr-edit-body", "pr-merge", "pr-cross-check", "pr-issue", "label-add", "label-remove", "await-mergeable", "ci-logs", "bot-token", "dismiss-review", "resolve-thread", "unresolve-thread", "post-reply", "post-comment", "find-comment", "edit-comment", "sticky-comment"].map(forward);
let cli = app.use(helpPlugin()).command(doctorCommand);
for (const command of commands) cli = cli.command(command);
cli.execute();
