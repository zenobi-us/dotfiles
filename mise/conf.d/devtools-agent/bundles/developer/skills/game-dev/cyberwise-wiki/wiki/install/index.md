# Installs and mod managers

How a modded install is assembled, and what each assembly method makes untrue
about the files on disk. This is manager behaviour rather than game behaviour, so
it drifts with manager releases rather than with game patches.

- [What the game directory shows you depends on how the mods got there](/install/how-the-install-is-assembled) - detecting the mode, and what manual, Vortex, MO2 and Wabbajack each change
- [The deployment manifest is the inventory, and it records where each file really went](/install/the-deployment-manifest) - real target paths, phantom missing files, and why "disabled" is not "removed"
- [A staging folder name is a record of the download, not of what is installed](/install/staging-folder-names) - the version lies, and two id-derivation bugs that resolve to somebody else's mod
- [A missing-requirement report is wrong in both directions](/install/auditing-dependencies) - id matching, framework aliasing, compatibility prose, and the orphaned optional file
- [A purge is not a vanilla game](/install/what-survives-a-purge) - what a purge leaves behind, and the long first launch that looks like a hang
- [Parking a directory selects an axis the mod list does not have](/install/selecting-mods-by-layer) - layer boundaries are directories; a manager selects mods
- [Fixing a bug in someone else's mod](/install/overriding-another-authors-mod) - override or patch, and why the override's danger is silence rather than breakage
- [Two downloads from one mod page may not be alternatives](/install/two-builds-of-one-filename) - and byte size is the only thing that identifies which build is deployed
- [Never write into a mod manager's staging folder](/install/never-write-into-a-managers-staging-folder) - what a file added there breaks, and the zip that delivers the same change as its own mod

## User data, which no manager can see

Saves and the state written beside them sit outside the install entirely, so every
install-side check is blind to them - and so is every install-side repair.

- [Saves live under Saved Games, by publisher and title](/install/where-the-game-keeps-its-saves) - re-derived in session after session; also why a purge, a verify and a clean reinstall all leave saves untouched
- [A storefront's cloud-save integration may not follow the storefront's own layout](/install/platform-cloud-saves-may-ignore-convention) - a documented per-app remote folder that does not exist, no per-game toggle, and deleted saves that came back *(draft: one machine, one storefront, one title)*

## Researching a mod

- [A mod page's own text may be unreachable to automated fetching](/install/a-mod-page-can-be-unreachable-to-tooling) - search results still carry mirrored copies, so the page looks retrievable until it is not; plan on asking for a paste rather than falling back to one
- [A hosting site's adult flag is per page, author-set, and answers a different question](/install/the-adult-flag-is-per-page-and-author-set) - one flagged optional file flags the whole page, a keyword heuristic misses more than half, and propagation across an id must name what it hid
