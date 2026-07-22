#!/usr/bin/env -S mise x -- bun --install=auto

import { Crust } from "@crustjs/core";
import { helpPlugin } from "@crustjs/plugins";

const app = new Crust("private-share").flags({
  repo: {
    type: "string",
    description: "The repository to share into: owner/repo",
    required: true,
  },
});

const setupCmd = app
  .sub("setup")
  .meta({ description: "Setup the private share github repo" })
  .args({
    repo: {
      type: "string",
      description: "The repository to share into: owner/repo",
      required: true,
    },
  })
  .run(({ flags }) => {
    /**
     *
     * 1. ensure gh-cli is installed and authenticated: which gh && gh auth login
     * 2. create a new private repo with github pages enabled on the gh-pages branch at <owner>/<repo>
     * 3. upload assets/web to the gh-pages branch of the repo at the root so index.html is at the root of the branch
     * 4. write to ~/.config/private-share.json the repo and the gh-pages url
     */
  });

const shareCmd = app
  .sub("share")
  .meta({
    description:
      "Upload the artifact to share into the github repo and return the url to access it",
  })
  .args({
    path: {
      type: "string",
      description: "The path to the agent session or artifact to share",
    },
  })
  .run(({ flags }) => {
    /**
     * 1. read the ~/.config/private-share.json file to get the repo and gh-pages url
     * 2. copy the flags.path (file or folder) to repo/s/<hash>/ and add reference to the sessions.jsonl file
     * 3. if the path is a folder, create a zip of the folder and upload it to repo/s/<hash>.zip and return the url of the zip file: <gh-pages-url>/s/<hash>.zip
     * 4. commit and push the changes to the gh-pages branch of the repo
     * 5. return the url of the shared session: <gh-pages-url>/s/<hash>/
     */
  });

/**
 * Entry point
 */
app //
  .use(helpPlugin()) // Add help plugin
  .command(setupCmd) // Add setup command
  .command(shareCmd) // Add share command
  .execute(); // Execute the app
