import { runCli } from "./generate-report.ts";

process.exit(await runCli(process.argv, console.log, console.error));
