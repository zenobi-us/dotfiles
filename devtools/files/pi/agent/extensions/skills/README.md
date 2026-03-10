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


