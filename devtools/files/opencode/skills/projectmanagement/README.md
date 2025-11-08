# Spec Driven Vibe Coding

> [!NOTE]
> This skill is easier to use when combined with the /project* commands.

## Workflow

**Contextual Phase**

1. `/project:current` - Continuously monitor project status and workflow

**Planning Phase**

1. `/project:brainstorm [problem]` - Brainstorm solutions for specific problems
2. `/project:plan:prd [idea]` - Create detailed product requirements
3. `/project:plan:feature [capability]` - Define new feature epics
4. `/project:plan:stories [epic]` - Break down epics into user stories
5. `/project:plan:tasks [story]` - Decompose stories into actionable tasks

**Implementation Phase**

1. `/project:do:task [task]` - Execute specific tasks
2. `/project:do:commit [message]` - Create semantic commits for completed work
3. `/project:do:review [task]` - Review completed tasks for quality assurance

## Storage Backends

Currently, this skill provides subskills for the following storage backends:

- Basic Memory: `skills_projectmanagement_storage_basicmemory`

## Roadmap

**Commands**

- [ ] `/project:research epicid [topic]` - Conduct research and engage in discussion with stakeholders.
- [ ] `/project:decide epicid [options]` - Facilitate decision-making processes.
- [ ] `/project:retro epicid [topic]` - Perform retrospectives on completed epics.

**Storage Backends**

- [ ] Provide other storage backend subskills (e.g., Github Projects, etc).