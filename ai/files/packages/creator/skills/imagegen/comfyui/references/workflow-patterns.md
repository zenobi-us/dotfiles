# Workflow patterns

## Core rule

Build workflows from discovered capabilities, not from remembered local graphs.

## Programmatic graph rules

- Node IDs in API JSON should be strings.
- Track node IDs centrally to avoid silent overwrite.
- Keep links explicit: `[source_node_id, output_index]`.
- Use filename-only values for model fields unless a confirmed subdirectory path is required.
- Avoid absolute filesystem paths inside graph JSON.

## Template-first strategy

Preferred order:
1. Start from a known-good workflow exported in API format, if one exists for the target install.
2. Patch only the parameters required for the task.
3. Fall back to constructing a graph from scratch only when no suitable template exists.

## Validation before submit

Validate all required layers:
1. Model family
2. Text encoder path
3. VAE path
4. Custom node availability

Before submit, check:
- every referenced node class exists in `/object_info`
- every model/LoRA/VAE/encoder value is available on the target install
- family-specific encoder and VAE rules are satisfied
- custom node dependencies are present

## Compatibility mismatch patterns

Watch for:
- trying to reuse an SDXL-style graph for a family that needs separate encoder or diffusion loaders
- reusing a LoRA trained for one base model on another family
- assuming a custom node class exists because it existed on another machine
- reusing example sampler/scheduler settings without confirming support on the current install

Rule of thumb:
- if the workflow crosses families or versions, validate from live install data before submit.

## Missing requirement handling

When a needed requirement is absent:
- stop
- name the missing node/model clearly
- say what it is needed for
- offer the nearest compatible alternative if one is known

## Graph hygiene

- Prefer stable exported API-format graphs as the base.
- Use meaningful titles when the target workflow will be edited repeatedly.
- Keep save/output nodes obvious.
- Remove dead nodes before publishing a reusable graph.

## Debug checklist

When a graph fails:
1. Reconfirm node classes from `/object_info`.
2. Reconfirm each dropdown value from the target install.
3. Check family-specific encoder/VAE rules.
4. Check custom-node availability.
5. Check history output parsing assumptions.
6. Reduce the graph to the smallest failing case.

## Portability mindset

Write helpers so the caller provides:
- base URL
- checkpoint / UNet / encoder / VAE names
- LoRA names
- output naming rules
- optional custom-node variants

Do not bury those choices as hidden defaults unless they are generic fallbacks.
