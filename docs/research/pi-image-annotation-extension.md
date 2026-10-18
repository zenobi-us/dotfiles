# Pi image annotation extension research

- **Purpose:** Assess how to build a Pi extension that opens a pasted or local image in Excalidraw and sends the annotated image to Pi.
- **Date:** 2026-10-17
- **Reader:** The extension author.
- **Sources:** Official Pi documentation and source, plus official Excalidraw developer documentation and source links.
- **Finding:** Pi can expose images when it processes submitted input, but its extension API does not expose an unsent image attachment getter or setter. A command cannot replace a pasted image in the live draft through the documented API.
- **Recommendation:** Support `/annotate <imagepath>` as the reliable first path. For pasted images, intercept submitted input through Pi's `input` event, annotate, then send a replacement message. This replaces the submitted input flow, not the editor's unsent draft.

## 1. Pi extension surface

Pi extensions are TypeScript modules. Each extension can register a slash command with `pi.registerCommand()`. The command handler receives its command text and an extension context. The official [extension guide](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) shows this registration pattern and the `pi --extension ./hello.ts` development option.

The API supports process execution. `ctx.exec(command, args, options)` launches a process without a shell and returns its output and exit status. The [Pi executor source](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/exec.ts) confirms that it uses `spawn()` with `shell: false`, captures standard output and error, and supports a timeout and abort signal. Use an explicit executable and argument array. Do not build a shell command from an image path.

A separate local web wrapper is a practical option for Excalidraw. The extension can start or connect to that wrapper and open it in a browser. `ctx.exec()` waits for the launched process to exit, so a long-running server needs lifecycle handling rather than a blocking `ctx.exec()` call. The extension API includes command-scoped process execution, but the cited API does not define a dedicated browser-launch method.

## 2. Pi image input and unsent drafts

Pi's exported extension types distinguish the editor's text from submitted image content:

| Need | Documented API | Result |
|---|---|---|
| Read unsent editor text | `ctx.ui.getEditorText()` | Text only. |
| Set unsent editor text | `ctx.ui.setEditorText(text)` | Text only. |
| Read images on input | `pi.on("input", handler)` | `InputEvent.images` may contain images when Pi receives input. |
| Transform received input | Return `{ action: "transform", text, images }` from the input handler. | Replaces the text and image list before processing. |
| Stop normal input processing | Return `{ action: "handled" }`. | The extension handles the received input. |
| Send a user message | `pi.sendUserMessage(content, options)` | Adds a user message and starts a turn. |

These signatures appear in the official [Pi extension type definitions](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/extensions/types.ts), including `ExtensionUIContext`, `InputEvent`, `InputEventResult`, and `ExtensionAPI`. `ImageContent` contains a base64 `data` string and a `mimeType`, as defined in the official [Pi AI type definitions](https://github.com/badlogic/pi-mono/blob/main/packages/ai/src/types.ts).

The API exposes no getter for pending editor image attachments and no setter for them. Its editor getter and setter cover text. The input event receives `images` only when Pi receives input. Therefore, a slash command handler cannot read a still-unsent pasted image from the editor through the documented extension API. The API also has no supported operation to remove or replace an image in that live draft.

A submitted input can still be transformed. The `input` handler sees the submitted text and image attachments and can return a replacement text/image list. It can also handle the input itself. This allows a pasted-image workflow after the user submits `/annotate` with an image. It does not preserve the in-progress draft state or update it in place. If the annotation flow sends a new user message, it creates a new submission rather than editing the old editor buffer. The command handler itself has no image parameter in the documented registered-command API.

## 3. Excalidraw image integration

Excalidraw stores images as `image` elements linked by `fileId` to entries in the scene's `files` object. The official [Excalidraw JSON schema](https://docs.excalidraw.com/docs/codebase/json-schema) documents file objects with a MIME type and a `dataURL`. The [`initialData` API](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/initialdata) accepts `elements`, `appState`, and `files`, so a wrapper can load a supplied image directly into an initial scene.

Use a normal image element as the canvas image. Size and position it to match the source image, then lock it so annotation strokes do not move it. Excalidraw's `viewBackgroundColor` is a canvas colour setting, not an image-background mechanism; the image element provides the background-like visual while retaining the image in the scene. The [Excalidraw API](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/excalidraw-api) exposes `getSceneElements()` and `getFiles()` to read the final scene.

Export the scene with `exportToBlob({ elements, appState, files, mimeType: "image/png" })`. The official [export utility documentation](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export) requires the `files` input for images and states that `exportToBlob()` returns a `Promise<Blob>`. Export PNG for Pi image input. Convert the blob to base64 and construct `{ type: "image", data, mimeType: "image/png" }`.

The [Excalidraw integration guide](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/integration) describes embedding the editor in a React application. A small local wrapper can supply the initial scene, provide a Done button, and return the PNG to its caller. The wrapper should keep the source image data local and avoid uploading it to a remote service.

## 4. Recommended end-to-end design

1. **Parse input.** Register `/annotate <imagepath>` for the reliable path. Resolve relative paths against the Pi context working directory. Read the image and convert it into a local data URL for the Excalidraw scene.
2. **Open the wrapper.** Launch the local Excalidraw wrapper with an opaque session identifier, not a raw shell-interpolated path. Load the image as an image element and include its file data in `initialData`.
3. **Annotate.** Keep the image element fixed. Let the user draw over it. On Done, export the complete scene as PNG with `exportToBlob()` and return the bytes to the extension through a local IPC endpoint or a wrapper-owned file.
4. **Send result.** Build a Pi `ImageContent` from the PNG. For a path-based command, send it with `pi.sendUserMessage()`, optionally retaining the command's remaining text as the prompt.
5. **Add pasted-image support.** Use the `input` event to inspect a submitted `/annotate` message and its `images`. Return `handled` while the wrapper runs, then send the annotated image in a new user message. Preserve non-command text and any unselected attachments explicitly. This is a submitted-input workflow, not live draft replacement.

## 5. Limitations and design choices

- **No draft replacement:** The documented extension API cannot inspect or mutate the unsent image attachment list. Exact “Done replaces the image in the unsent editor” behavior needs a Pi API change or a custom editor integration that owns image attachment state.
- **Command limitation:** A command handler can parse an image path, but the documented command signature does not carry pasted image data. The `input` event is the relevant extension hook for received images.
- **Submission timing:** Pasted-image annotation can begin only after Pi receives the input. The user must submit the annotation request first. The extension must prevent the original `/annotate` request from reaching the model, then send the completed message only after Done.
- **Mode limitation:** Pi supports interactive, RPC, JSON, and print modes. Custom terminal UI is interactive-only, while RPC forwards only supported UI requests. Check `ctx.mode` and `ctx.hasUI`; the browser wrapper needs an explicit supported launch path in the deployment environment. See the [Pi extension UI and mode guidance](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md).
- **Image fidelity:** Excalidraw's PNG export rasterizes the image and annotations together. The exported image may differ in dimensions or metadata from the source. Retain the original image only if the user asks for it or the output workflow needs it.
- **Security:** Treat command paths and wrapper callbacks as untrusted input. Use argument arrays, bind any local callback server to loopback, and use a per-run unguessable identifier. Pi extensions run with the host process's operating-system permissions, as stated in the [official extension guide](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md).

## Sources

- [Pi extensions guide](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md)
- [Pi extension API types](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/extensions/types.ts)
- [Pi process execution source](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/exec.ts)
- [Pi AI image content types](https://github.com/badlogic/pi-mono/blob/main/packages/ai/src/types.ts)
- [Excalidraw JSON schema](https://docs.excalidraw.com/docs/codebase/json-schema)
- [Excalidraw initialData API](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/initialdata)
- [Excalidraw API](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/excalidraw-api)
- [Excalidraw export utilities](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export)
- [Excalidraw integration guide](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/integration)
