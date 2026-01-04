
import { Cli } from "clerc";
import { friendlyErrorPlugin } from "@clerc/plugin-friendly-error";
import { notFoundPlugin } from "@clerc/plugin-not-found";
import { strictFlagsPlugin } from "@clerc/plugin-strict-flags";
import { updateNotifierPlugin } from "@clerc/plugin-update-notifier";

import pkg from "../package.json" assert { type: "json" };

import { getGitTag } from "./macros/GitInfo.ts" with { type: "macro" };
import { NotebookCommand } from "./cmds/notebook/NotebookCmd.ts";
import { NotebookListCommand } from "./cmds/notebook/NotebookListCmd.ts";
import { NotebookAddContextPathCommand } from "./cmds/notebook/NotebookAddContextPathCmd.ts";
import { NotesCommand } from "./cmds/notes/NotesCmd.ts";
import { NotesAddCommand } from "./cmds/notes/NotesAddCmd.ts";
import { NotesListCommand } from "./cmds/notes/NotesListCmd.ts";
import { NotesRemoveCommand } from "./cmds/notes/NotesRemoveCmd.ts";
import { NotesSearchCommand } from "./cmds/notes/NotesSearchCmd.ts";


Cli() // Create a new CLI with help and version plugins
  .name("wiki") // Optional, CLI readable name
  .scriptName("wiki") // CLI script name (the command used to run the CLI)
  .description("A wiki CLI") // CLI description
  .version(getGitTag() || 'dev') // CLI version
  .use(friendlyErrorPlugin()) // use the friendly error plugin to handle errors gracefully
  .use(notFoundPlugin()) // use the not found plugin to handle unknown commands
  .use(strictFlagsPlugin()) // use the strict flags plugin to enforce strict flag parsing
  .use(updateNotifierPlugin({
    notify: {},
    // @ts-expect-error pkg is json
    pkg
  })) // use the update notifier plugin to notify users of updates
  .command([
    NotebookCommand,
    NotebookListCommand,
    NotebookAddContextPathCommand,
    NotesCommand,
    NotesAddCommand,
    NotesListCommand,
    NotesRemoveCommand,
    NotesSearchCommand,
  ]) // register the notebook and notes commands
  .parse(); // Parse the CLI arguments and execute commands 
