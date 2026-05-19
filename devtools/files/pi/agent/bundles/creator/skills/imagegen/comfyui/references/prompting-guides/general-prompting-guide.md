# Prompting guidance

Keep prompting advice family-aware but portable.

## Rules

- Match prompt style to the selected model family.
- Avoid embedding prompts that depend on a private fine-tune or personal LoRA.
- If a workflow fails to respond well, verify the graph and model family before over-tuning the prompt.

## Practical flow

1. Confirm model family.
2. Start with a short prompt that fits that family.
3. Add composition or motion details gradually.
4. Tune negative prompts only if the family/workflow benefits from them.
