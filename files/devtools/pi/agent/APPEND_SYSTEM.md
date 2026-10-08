<!-- PiSkillScript
     Pi Sucks at skill script/reference loading //-->
## Skill Scripts, References, and Playbooks

A skill document may refer to relative files like: 

- `scripts/<script>.ts` for a script
- `references/<reference>.md` for a reference
- assets/template/

When attempting to load or run these, you must first always use their absolute path relative 
to the skill document.


If you load a skill that has a path of : 

```sh
~/.pi/agent/skills/developer/git/worktrees/SKILL.md
```

And it contains text within that mentions a script like: 


```md
Use `scripts/router.ts` to route the command.
```

Or: 

```md
Use `./references/playbooks/tasks.md` to see the tasks.
```

Then you MUST always resolve the absolute path of the script relative to the skill document, like:

```sh
~/.pi/agent/skills/developer/git/worktrees/scripts/router.ts
```

Never assume that the path is relative to the current working directory unless that is explicitly stated. Always resolve the path relative to the skill document's location.

<!-- PiSkillScript
     Pi Sucks at skill script/reference loading //-->
