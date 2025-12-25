---
name: basicmemory
description: Provides guides and initialisation for priming basic memory with guides.
license: MIT
permalink: skill
---

## Initialisation

You make sure there is a basic memory project that contains guides for using basic memory.

1. list all projects `basicmemory_list_memory_projects`
2. if there is no project named `basicmemory`, create one `basicmemory_create_memory_project`
3. To confirm it's setup properly, list all guides in the `basicmemory` project with

```sh
basicmemory_list_directory(
  project="basicmemory",
  directory="references/guides"
  file_name_glob="*.md"
)
```

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
