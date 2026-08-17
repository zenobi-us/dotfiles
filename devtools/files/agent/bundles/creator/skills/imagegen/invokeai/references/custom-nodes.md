# Create and maintain custom nodes

InvokeAI calls executable workflow nodes **invocations**. Custom invocations are loaded from node packs under the configured `custom_nodes_dir` (default `nodes/`).

Treat every node pack as executable code with the permissions of the InvokeAI process.

## Required node pack structure

```text
<invokeai-root>/nodes/
└── q-prompt-tools/
    ├── __init__.py          # imports every invocation class to register
    ├── normalize_prompt.py
    ├── README.md
    ├── requirements.txt     # optional; installed manually
    └── tests/
        └── test_normalize_prompt.py
```

Loader behavior in current source:
- scans top-level directories in `custom_nodes_dir`
- skips files, hidden directories, and names starting with `_`
- requires the pack directory to contain `__init__.py`
- imports that `__init__.py`
- only node classes imported by the pack are registered
- logs failed packs and may report partial loading
- requires restart after node definition changes

Do not put all implementation into the root `nodes/README.md` or assume recursive discovery imports classes automatically.

## Import only the public API

Custom nodes should import from `invokeai.invocation_api`, which re-exports the supported invocation API. Reaching into `invokeai.app.*` or backend internals couples the pack to unstable implementation details.

## Minimal text node

`normalize_prompt.py`:

```python
from invokeai.invocation_api import (
    BaseInvocation,
    InputField,
    InvocationContext,
    StringOutput,
    invocation,
)


@invocation(
    "q_normalize_prompt",
    title="Normalize Prompt",
    tags=["prompt", "text", "normalize"],
    category="prompt",
    version="1.0.0",
)
class NormalizePromptInvocation(BaseInvocation):
    """Trim outer whitespace and lowercase a prompt."""

    prompt: str = InputField(description="Prompt to normalize")

    def invoke(self, context: InvocationContext) -> StringOutput:
        return StringOutput(value=self.prompt.strip().lower())
```

`__init__.py`:

```python
from .normalize_prompt import NormalizePromptInvocation

__all__ = ["NormalizePromptInvocation"]
```

Use a globally distinctive invocation type such as `q_normalize_prompt`. Type collisions can override core or other custom nodes.

## Decorator and field rules

Current `@invocation` arguments include:
- unique non-whitespace type string
- title
- searchable tags
- category
- semantic version
- default cache behavior
- classification
- bottleneck classification

Every input should use `InputField`; every custom output field should use `OutputField`. Return annotations must be subclasses of `BaseInvocationOutput` registered with `@invocation_output`, unless using a public built-in output such as `StringOutput` or `ImageOutput`.

Use typed fields. The schema drives validation, frontend rendering, graph compatibility, and OpenAPI generation.

## InvocationContext

Use the provided context for application services:
- `context.images` to read/save images
- `context.models`/model helpers to load models
- `context.logger` for logs
- board/metadata support through public mixins and context APIs

Do not open the database directly or invent output file paths. Saving via context creates the required file and record state.

Example image pattern:

```python
pil_image = context.images.get_pil(self.image.image_name)
result = transform(pil_image)
image_dto = context.images.save(result)
return ImageOutput.build(image_dto)
```

Read the local public API and existing core invocation examples for the installed version before using less common context services.

## Dependencies

The Custom Node Manager currently does not automatically install `requirements.txt`/`pyproject.toml` dependencies because dependency conflicts could break InvokeAI.

Document an explicit installation command inside the activated InvokeAI environment. Prefer minimum compatible constraints over tight transitive pins. Review dependency overlap with InvokeAI before installation.

Do not run a node pack's install script blindly.

## Unit test

```python
from typing import cast

from invokeai.invocation_api import InvocationContext

from q_prompt_tools.normalize_prompt import NormalizePromptInvocation


def test_normalize_prompt() -> None:
    invocation = NormalizePromptInvocation(prompt="  HeLLo WORLD  ")
    context = cast(InvocationContext, None)  # Node does not use context.

    result = invocation.invoke(context)

    assert result.value == "hello world"
```

Run in the InvokeAI environment:

```bash
pytest /path/to/q-prompt-tools/tests/test_normalize_prompt.py -q
```

For a source checkout, run the smallest relevant fast backend tests first, then broader `pytest tests/ -m 'not slow'` as needed.

## Integration verification

1. Place/clone the reviewed pack under the configured custom nodes directory.
2. Install reviewed dependencies manually in the correct InvokeAI environment.
3. Restart InvokeAI; `dev_reload` does not reload node definitions.
4. Inspect logs for `Loading node pack ...` or a full traceback.
5. Fetch `/openapi.json` and confirm the invocation type/schema exists.
6. Confirm the node appears in the workflow editor.
7. Execute a minimal graph and inspect the completed queue result.
8. Export a small example workflow.

Use the Custom Node Manager's install/uninstall lifecycle for packaged node repositories when appropriate. A repository is the pack; its root `__init__.py` is mandatory.

## Including workflows in a pack

Current manager recursively detects JSON files with top-level `nodes` and `edges`, imports them into the workflow library, tags them with the pack, and removes associated workflows on uninstall.

Create examples in the target InvokeAI workflow editor and export them. Do not hand-write stale editor workflow JSON from memory.

## Debugging failures

| Symptom | Check |
|---|---|
| Pack ignored | directory level/name and missing `__init__.py` |
| Some nodes absent | pack `__init__.py` did not import them |
| Import traceback | dependency/version/import error in logs |
| Node in Python but not UI | restart and inspect OpenAPI schema |
| Workflow validation failure | node type/field/version drift |
| Image saved but absent from gallery | node bypassed `context.images.save()` |
| Existing node changed unexpectedly | invocation type collision |
| Changes not applied | full restart required |

## Compatibility policy

- Give each node a semver version.
- Keep type strings stable after workflows depend on them.
- Add fields compatibly when possible.
- Test against supported InvokeAI release ranges.
- Pin CI/test matrices to explicit versions.
- Avoid private imports.
- Include migration notes when schema changes break workflows.

## Primary sources

Verified against InvokeAI main commit `68b90174aafebbbba45d14b049fb6852271c76a8`:

- [`invokeai/invocation_api/__init__.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/invocation_api/__init__.py)
- [Invocation/node architecture](https://invoke-ai.github.io/InvokeAI/development/architecture/invocations/)
- [Creating node packs](https://invoke-ai.github.io/InvokeAI/development/guides/creating-node-pack/)
- [`load_custom_nodes.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/invocations/load_custom_nodes.py)
- [`baseinvocation.py`](https://github.com/invoke-ai/InvokeAI/blob/68b90174aafebbbba45d14b049fb6852271c76a8/invokeai/app/invocations/baseinvocation.py)
- [API development / InvocationContext](https://invoke-ai.github.io/InvokeAI/development/guides/api-development/)
