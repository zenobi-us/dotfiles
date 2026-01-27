---
name: storage-function-structure
description: Define the structure and organization of storage functions within a project.
---

# File Structure for Project Planning Artifacts

- [Planning Artifact] are stored in dedicated directories based on their type, with each file named using a short hash and a descriptive title.
- These directories are typically stored in a parent folder. defer to the storage backend conventions for exact paths.

## Directory and File Naming Conventions

- Each planning artifact type has its own directory:
  - `Prd/` for Product Requirements Documents
  - `Epic/` for Epics
  - `Spec/` for Specifications
  - `Story/` for User Stories
  - `Task/` for Tasks
  - `Decision/` for Decisions
  - `Research/` for Research Documents
  - `Retro/` for Retrospectives
  
- Files within these directories are named using the format:
  - `<short-hash>-<descriptive-title>.md`

```
Prd/
  feca343-the-prd-title.md
Epic/
  123e4567-an-epic-title.md
Spec/
  89ab0123-a-spec-title.md
Story/
  456def78-a-story-title.md
  321cba98-another-story-title.md
  334fed56-yet-another-story-title.md
Task/
  789abc12-a-task-title.md
  654ghi34-another-task-title.md
  987jkl56-yet-another-task-title.md
Decision/
  112mno78-a-decision-title.md
  223pqr90-another-decision-title.md
  334stu12-yet-another-decision-title.md
  fff44455-a-fourth-decision-title.md
Ressearch/
  445vwx34-a-research-title.md
  556yzb56-another-research-title.md
  667abc78-yet-another-research-title.md
  778def90-a-fourth-research-title.md
Retro/
  889ghi12-a-retro-title.md
  990jkl34-another-retro-title.md
  aabmno56-yet-another-retro-title.md
  bbcpqr78-a-fourth-retro-title.md
  ccdstu90-a-fifth-retro-title.md
```






