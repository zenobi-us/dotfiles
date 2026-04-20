# ComfyUI API guidance

## Core endpoints to discover and use

- `GET /object_info` -> inspect node classes, inputs, and dropdown values
- `POST /prompt` -> submit a workflow
- `GET /queue` -> inspect queue state
- `GET /history` or `GET /history/{prompt_id}` -> inspect completed/failed runs
- `POST /interrupt` -> stop a running job when supported
- `GET /view?...` -> retrieve output files when the install exposes file serving
- WebSocket `/ws` -> observe progress/events when available

## Discovery rules

- Use `/object_info` before authoring workflows for unknown installs.
- Cache only within the current task unless the user asks to persist setup data.
- Parse responses defensively with `.get()` chains or equivalent.

## Submission pattern

1. Validate required node classes exist.
2. Confirm model and dropdown values from the target install.
3. Build or patch the workflow JSON.
4. Submit via `POST /prompt`.
5. Track `prompt_id`.
6. Watch WebSocket progress if available; otherwise poll history/queue.
7. Resolve outputs from history, not from hardcoded assumptions.

## Failure handling

Stop and surface a clear message when:
- a required node class is absent
- a model filename is unavailable in dropdown values
- the server rejects the workflow schema
- output extraction paths are ambiguous

## Local vs remote

Do not hardcode `127.0.0.1:8188` as the only target. Treat it as a common default example only.

Use patterns like:
- base URL from user config or environment
- host/port parameters in helper code
- explicit cloud-hosted differences when present
