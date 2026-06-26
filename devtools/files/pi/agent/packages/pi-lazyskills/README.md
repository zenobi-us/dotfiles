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

## Configuration

`pi-lazyskills` reads layered config from:

1. Environment variables: `SKILLS_<KEY>`
2. Project config: `.pi/skills.config.json`
3. Home config: `~/.pi/agent/skills.config.json`
4. Built-in defaults

Example:

```json
{
  "lazySkills": true,
  "searchStrategy": "hybrid",
  "lexicalThreshold": 0.5
}
```

Valid settings:

| Setting | Type | Values | Default |
| --- | --- | --- | --- |
| `lazySkills` | boolean | `true`, `false` | `true` |
| `searchStrategy` | string | `lexical`, `bm25`, `vector`, `hybrid` | `hybrid` |
| `lexicalThreshold` | number | `0` through `1` | `0.5` |

Invalid config falls back to built-in defaults.

### Search strategy

`searchStrategy` controls how `find_skills` ranks matches:

| Strategy | What | Why use it |
| --- | --- | --- |
| `lexical` | Scores phrase, term, and fuzzy token matches across qualified name, shortname, and description. Uses `lexicalThreshold` to drop weak matches. | Best when you want strict, predictable matching and fewer noisy results. |
| `bm25` | Uses BM25-style keyword ranking with boosted skill names and descriptions. | Best default for short keyword searches like `git commit` or `react form`. |
| `vector` | Uses local hashed token vectors plus a small synonym map; no external embedding service. | Best when wording differs, such as `troubleshoot auth` matching debug/diagnose skills. |
| `hybrid` | Runs `lexical`, `bm25`, and `vector`, then merges ranks with reciprocal rank fusion. | Best general-purpose mode when you do not know query shape. Costs more CPU, avoids choosing wrong. |

Use `bm25` for speed and keyword precision. Use `hybrid` when recall matters more than minimal ranking work.

### Lexical threshold

`lexicalThreshold` only affects the `lexical` strategy and the lexical part of `hybrid`.

It is a score cutoff from `0` to `1`:

| Value | Effect | Why use it |
| --- | --- | --- |
| `0` | Keep every lexical match with any score. | Maximum recall; useful when you suspect relevant skills are being hidden. |
| `0.3` | Keep weak fuzzy/partial matches. | Good for exploratory search, but noisier. |
| `0.5` | Balanced cutoff. | Default; removes obvious junk without being too strict. |
| `0.7` | Keep only strong matches. | Use when results are too noisy. |
| `1` | Keep only perfect lexical matches. | Rarely useful; mostly for debugging exact-match behavior. |

Lower values show more results. Higher values show fewer, stricter results.

## Todo / Ideas

- Add a new `tags` strategy. Like `lexical`, but only searches a skill's `tags` field for stricter matching control.
- Add a new `rag` strategy. Provide a basic local-only vector store, with an escape hatch for custom vector store services.


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