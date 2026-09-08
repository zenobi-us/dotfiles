---
type: Process
title: Whether a download is a main file, an add-on or a patch is only answerable from the hosting API
description: Folder names and mod descriptions carry no file category, so a page whose only files are MAIN looks identical to a page whose add-ons are orphaned - and that ambiguity produced a confident "this mod is missing its main file" that had to be retracted.
tags: [nexus, api, mod-hosting, verification, method, attribution]
status: stable
generated: { by: "claude", at: "2026-08-24T19:38:47-04:00" }
---

# Whether a download is a main file, an add-on or a patch is only answerable from the hosting API

Mod sites divide a page's downloads into categories - main file, update, optional,
miscellaneous, old version. **That category exists only on the page and in the
API. It is nowhere on disk.**

What is on disk is a folder name, a filename and whatever the manager recorded at
install time. None of them carry it, and none of them can be made to.

## The failure it causes

An install holds three folders from one mod page, all obviously add-ons -
expansions, extra content, a patch. There is no folder that looks like the base
mod.

Two explanations fit that evidence exactly:

1. The main file was never installed, and the add-ons are orphaned.
2. **The page has no main file.** Every file on it is an add-on to some other
   mod, and the install is complete.

Nothing distinguishable on disk separates those. Assuming the first produced a
confident "this mod is missing its main file" that had to be withdrawn once the
page was actually read.

## The endpoint that settles it

```
GET /v1/games/<game>/mods/<id>/files.json
```

Each entry carries `category_name` (with `category_id` alongside), which is the
page's own classification of that file. Reading it turns the guess into a fact,
and it is one request.

**Never claim a missing main file without reading the files endpoint.** The
claim is cheap to make, expensive to retract, and belongs to the same family as
every other derived identifier: [Documenting a large mod list without producing a
report nobody can trust](/process/running-a-documentation-pass) covers why an
unverified derivation is worse than an admitted gap.

## Generalising past one site

The specific path above is one host's. The transferable parts:

- **File categorisation is a property of the hosting platform, not of the
  artefact.** Whatever the site, it lives in the site's metadata.
- **A manager's staging record is not a substitute**, because it stores what was
  installed, not what was offered. A page's other files leave no trace at all.
- **The absence of a base install and the absence of a base file look the same.**
  When two hypotheses predict the identical filesystem, the filesystem is not
  where the answer is.

## What was not verified

The endpoint and the `category_name` field are recorded from a real response
during the diagnosis that produced this article; they were not re-queried when it
was written, and the category vocabulary a site uses may change. Only one hosting
platform was examined.

## Related

- [Documenting a large mod list without producing a report nobody can trust](/process/running-a-documentation-pass)
- [Two downloads from one mod page may not be alternatives](/install/two-builds-of-one-filename)
- [What the game directory shows you depends on how the mods got there](/install/how-the-install-is-assembled)
