# Skills

- allows lazy loading skills (off by default)
- skills are registered by slugified path to `SKILL.md`.

## Why ? 

Here's a demo. 

- I have over 180 skills.
- My `AGENTS.md` says the LLM should always load the using superpowers skill.

`AGENTS.md`
> ...
> But it only works if you start with your superpowers skill. 
> Load your superpowers skill before proceeding.
> ...

This is what happens in these two scenarios:

`lazySkills: false | undefined`

```
[user] hi

  Thinking...

  [read] ~/.pi/agent/skills/superpowers/using-superpowers/SKILL.md
  ...

  Thinking...

[assistant] Hey - I'm using the using-superpowers skill now ...

            What are we doing now? 

↑54k ↓199 $0.098 (sub) 10.3%/272k (auto
```

`lazySkills: true`
```
[user] hi


  Thinking...

  [find_skills]
  {
    "query": "superpowers",
    "skills": [
      ...
      {
        "name": "superpowers-using-superpowers",
        "shortname": "using-superpowers", 
        ...
      }
      ...
    ]
  }

  Thinking...

  [read_skill]
  ...(skill contents)

[assistant] Hey - I'm using the using-superpowers skill now ...

            What are we doing now? 

↑19k ↓213 R6.8k $0.038 (sub) 3.8%/272k (auto)
```



## Skill Search Experience

When the agent uses `find_skills`, it now picks results in a way that better matches how humans actually type queries.

What this means for you as a user:

- **Natural phrases work**  
  If you type something like `how to debug flaky tests`, you should get skills that match the full intent of that phrase, not just exact token overlap.

- **Keyword queries still work**  
  If you type compact terms like `debug typescript -react`, it behaves like a focused skill search with exclusions.

- **Typos and wording differences are more forgiving**  
  Close wording, variations, and near matches are more likely to surface useful skills instead of returning nothing.

- **Results can be tuned by strategy**  
  Search can run in different modes (`lexical`, `bm25`, `vector`, `hybrid`) through settings, so teams can choose the style they prefer.

- **Hybrid mode gives balanced outcomes**  
  If enabled, hybrid combines multiple ranking styles so strong candidates from different approaches can rise to the top.

In short: you can type either **a sentence** or **a list of terms**, and the skill finder should feel more relevant and less brittle.

### Configurable search behavior

Set this in `.pi/settings.json` (project or agent-level):

```json
{
  "searchStrategy": "hybrid"
}
```

Allowed values:

- `lexical`
- `bm25`
- `vector`
- `hybrid`

## Package Skill Root Resolution

The extension now resolves skill roots from package sources instead of skipping non-local entries.

Supported source handling:

- **`npm:` sources**
  - Attempts `import.meta.resolve("<pkg>/package.json")` first.
  - Falls back to `npm root -g` lookup.
  - Reads skill roots from `pi.skills` in `package.json`, or `skills/` by convention.

- **`git:` / `http(s):` / `ssh:` sources**
  - Resolves repository identity to `<host>/<path>`.
  - Checks global clone location: `~/.pi/agent/git/<host>/<path>`.
  - Checks project clone location: `.pi/git/<host>/<path>`.
  - Reads skill roots from `pi.skills` or `skills/`.

- **`file:` and local paths**
  - Resolved as local package paths.
  - `file:` URLs are converted with `fileURLToPath` for safe path handling.

This keeps behavior aligned with Pi package docs for npm vs git install locations and allows skills from installed package sources to be discovered.