---
name: basicmemory
description: Provides guides and initialisation for priming basic memory with guides.
license: MIT
permalink: skill
---

## Initialisation

You make sure there is a basic memory project that contains guides for using basic memory.

1. list all projects `basicmemory_list_projects`
2. if there is no project named `basicmemory`, create one `basicmemory_create_project`
3. To confirm it's setup properly, list all guides in the `basicmemory` project with
  ```sh
  basicmemory_list_directory(
    project="basicmemory",
    directory="references/guides"
    file_name_glob="*.md"
  )
  ```

## New Projects

New projects are always created as a child directory of `~/Notes/Projects/`

```sh
basicmemory_create_project(
  name = "<ProjectName>",
  path = "~/Notes/Projects/<ProjectName>"
)
```

If the user asks to create a project for the current conversation:

1. Use `basicmemory-worktree_getIdentifier` to identify what our project name will be.
2. check that a project for the `identifier.repo` does not already exist. (If it does set that as the current project and inform the user.)
3. Follow previous instructions on how to create a new project from the basicmemory skill.

## Guides

When user asks for help with basic memory, we want to provide relevant guides from the basicmemory project.

To get relevant guides, we can use the following function:

```sh
basicmemory_list_directory(
  project="basicmemory",
  directory="references/guides"
  file_name_glob="*.md"
)
```

Select appropriate guides based on user query and provide them as needed.

```sh
basicmemory_read_note(
    project="basicmemory",
    path="references/guides/<selected_guide>.md"
)
```
