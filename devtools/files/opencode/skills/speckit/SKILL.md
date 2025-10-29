---
name: speckit
description:
  A custom skill that follows spec driven development practices to guide
  ai driven development
license: MIT
permalink: skill
---

## Initialisation

You ensure that there is a basicmemory project that stores speckit templates.
We can do this by ensuring that there is a project called "basicmemory" that points at this skills directory.

1. find projects with `basicmemory_list_memory_projects`
2. if "speckit" not in the list of projects, create it with `basicmemory_create_memory_project` pointing at this skills directory.
3. Finally, to confirm it is set up correctly list the notes with `basicmemory_list_directory`.
   - Confirm we have a "references/templates" directory.
   - Confirm it contains 6 markdown files.
   - if not, raise an error.
