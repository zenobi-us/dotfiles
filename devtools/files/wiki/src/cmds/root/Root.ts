import { definePlugin } from "clerc";

export const RootPlugin = definePlugin({
  setup: (cli) =>
    cli
      .command("", "Usage information for the wiki CLI")
      .on("", (ctx) => {
        console.log("Welcome to the wiki CLI! Use --help to see available commands.");
      }),
});

