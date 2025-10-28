---
name: speckit
description: A custom skill that follows spec driven development practices to guide
  ai driven development
license: MIT
permalink: skill
---


## Initialisation

You ensure that there is a basicmemory project that stores speckit templates.
We can do this by ensuring that there is a project called "basicmemory" that points at this skills directory.

1. find projects with `basicmemory_list_projects`
2. if "speckit" not in the list of projects, create it with `basicmemory_create_project` pointing at this skills directory.
3. Finally, to confirm it is set up correctly list the notes in the "speckit" project with
  ```
  basicmemory_list_directory(
    project="speckit",
    dir_name="references/templates",
    file_name_glob="*.md",
    depth=3
  )
  ```

## Spec Driven Development (SDD) Skill

It provides these main operations:

- `constituion`: Define the constitution of the project.
- `specify`: Create a specification document.
- `clarify`: Ask questions to clarify unresolved aspects of the specification.
- `plan`: Develop a detailed implementation plan based on the specification.
- `tasks`: Break down the plan into manageable tasks.
- `analyze`: Review and analyze created documents for consistency and completeness.
- `implement`: Oversee the implementation of tasks.

Your primary method of discovering, reading and writing SDD documents is via `basic-memory_*` tools.

If you need to understand basicmemory, read the quickstart guide in the basicmemory project.

## **CRITICAL GATE**

Before continuing with any SDD operations, ensure that:

1. The basicmemory project is correctly set up as described in the Initialisation section above.
2. Our current worktree identifier is set to the project we are working on.
