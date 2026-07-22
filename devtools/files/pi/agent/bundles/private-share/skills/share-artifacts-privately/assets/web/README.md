# Personal Agent Session Shares

A simple way to share your personal agent sessions with others.

## Why

For those in a github org that can use private repos and github pages, this allows you to limit access to your personal agent sessions to only those in your org, and share them via github pages.

## How

1. `Use this template` to create a new repository for your personal agent session shares.
2. In the repository settings, enable github pages and set the source to the `main` branch and the folder to `/`. 
   This will allow you to share your personal agent sessions via github pages.
   (take note of the github pages url, you will need it later to access your shared sessions)
3. Then follow below instructions to add your personal agent session shares to the repository.


### Pi 

Install the extension

```bash
pi install github:GITHUB_REPO_YOU_JUST_CREATED
```


Then you can share your personal agent sessions using the `pi share` command. For example:

```bash
/share-session 
/share-session --session-id 1234
/share-session --session-id 1234 --name "My Personal Agent Session"
```

### Others

If you can your current session as a HTML file or an MD file, then: 


```bash
# Save your session as a HTML file or an MD
mv ./session-export.md ~/Projects/my-agent-sessions/sessions/
cd ~/Projects/my-agent-sessions
git commit -am "Add new personal agent session share"
git push
```

Then your sessions will be available at the url above.
