---
description: Research a topic and build a single-page Diátaxis explainer in minimalist HTML
argument-hint: "<topic, file, URL, or question>"
---

# Create a Single-Page Explainer

## User Request

```text
$ARGUMENTS
```

## Goal

Research the request. Then build one HTML page that explains the subject.

Use the Diátaxis method. Keep each documentation type separate and clear.

The final result MUST be a web page, not a slide deck or presentation.

## Required Skills

Load these skills before you start:

- `research`
- `simple-english`
- `poster`
- The best domain skills for the subject
- A browser skill for final visual checks

## 1. Define the Subject

1. Identify the subject, audience, and expected outcome.
2. Read each supplied file or URL before you explain it.
3. Trace related local code when the request concerns a codebase.
4. Prefer primary sources, official documentation, specifications, and source code.
5. If the request has no clear subject, ask one focused question and stop.

Use an existing output convention when one exists.

Otherwise, write the page to:

```text
.tmp/explain/<subject-slug>/index.html
```

Store generated SVG files beside the HTML file in an `assets/` directory.

## 2. Delegate Research

Use the `subagent` tool to start two or three independent `researcher` subagents.

Start all independent research tasks in parallel.

Give each subagent one focused question and a clear output contract.

Each subagent MUST:

- Use the `research` skill.
- Use relevant domain skills.
- Prefer primary sources.
- Cite exact URLs and local file paths.
- Separate facts from interpretation.
- Report contradictions and uncertain claims.
- Return compact findings for synthesis.
- Avoid editing the final HTML page.

Use these research lanes when they fit:

1. **Source model:** Identify the main concepts, parts, and factual behavior.
2. **User model:** Identify common tasks, examples, risks, and mistakes.
3. **Reference model:** Collect exact commands, options, interfaces, limits, and terms.

Do not create extra research lanes without a clear need.

Read local source material while the subagents research independent questions.

After the subagents finish, compare their findings. Resolve conflicts before drafting.

## 3. Use the Diátaxis Method

Create these four sections on one page:

### Tutorial

Give the reader one guided path to a small, successful result.

- Teach through action.
- State prerequisites.
- Use tested steps.
- Explain only what the reader needs for the next step.

### How-to Guide

Show how to complete the most important real task.

- Start with the reader's goal.
- Put each condition before its instruction.
- Use one instruction per step.
- Include recovery steps for likely failures.

### Reference

Give exact factual information for lookup.

- Use tables, lists, signatures, commands, options, or state definitions.
- Keep facts concise.
- Do not add teaching narrative.
- Cite the source for facts that can change.

### Explanation

Explain why the subject works this way.

- Describe the model, design choices, trade-offs, and limits.
- Connect causes to effects.
- Separate verified facts from interpretation.
- Mark opinions with `[bias: ...]`.

Do not mix the purpose of one section into another section.

## 4. Write in Simplified Technical English

Apply the `simple-english` skill to all page text.

- Use active voice.
- Use one term for one concept.
- Use short, complete sentences.
- Keep procedural sentences at 20 words or fewer.
- Keep descriptive sentences at 25 words or fewer.
- Put conditions before instructions.
- Do not use contractions, filler, or decorative language.
- Keep code, commands, paths, identifiers, and quoted errors unchanged.

## 5. Plan the Visuals

Use visuals only when they improve understanding.

Use the `poster` skill and `poster_render` to create at least one useful visual summary.

Render each poster visual as SVG. Use black, white, and neutral gray only.

Good poster visuals include:

- A visual abstract
- A comparison matrix
- A sequence summary
- A compact reference figure
- A data chart when verified data exists

Create explanatory diagrams as minimalist grayscale SVG files or inline SVG elements.

All diagrams MUST:

- Use black, white, and neutral gray only.
- Use simple lines, boxes, arrows, and labels.
- Include an accessible title and description.
- Remain readable at mobile width.
- Avoid gradients, color accents, textures, and decorative effects.

Do not use Mermaid. Do not use raster images for diagrams.

## 6. Build the HTML Page

Create one responsive `index.html` page.

Use Tailwind utility classes for the page style.

Use the Tailwind CDN when the output directory has no existing Tailwind build.

Use this visual direction:

- Black text on a white background
- White text on black emphasis blocks
- Neutral gray borders and secondary text
- Strong typography
- Large margins and clear spacing
- Thin rules instead of shadows
- Square or slightly rounded corners
- No gradients
- No colored accents
- No glass effects
- No ornamental animation

The page MUST include:

1. A concise title and summary.
2. A compact navigation list for the four Diátaxis sections.
3. The Tutorial section.
4. The How-to Guide section.
5. The Reference section.
6. The Explanation section.
7. The generated visual summary.
8. Any necessary grayscale SVG diagrams.
9. A source list with clickable citations.
10. A short limitations section when evidence is incomplete.

Use semantic HTML landmarks and a logical heading order.

Add descriptive `alt` text to linked SVG files.

Add `<title>` and `<desc>` elements to inline SVG diagrams.

Make the page readable without JavaScript, except for the Tailwind CDN loader.

Do not add slide controls, carousels, hidden slides, or full-screen presentation behavior.

## 7. Validate the Result

Before completion:

1. Open the page with the browser tool.
2. Check the page at desktop and mobile widths.
3. Check that all SVG files load.
4. Check that no text or diagram overflows.
5. Check that navigation links reach the correct sections.
6. Check that citations open the correct sources.
7. Check that the page remains usable without custom JavaScript.
8. Check that all four Diátaxis sections have distinct purposes.
9. Run the `simple-english` self-check on the final text.
10. Remove unused assets and temporary files.

Fix errors before you report completion.

## Completion Report

Report only:

- The HTML file path.
- The generated SVG file paths.
- The main sources.
- Any unresolved evidence limits.
- Whether the page opened successfully in the browser.
