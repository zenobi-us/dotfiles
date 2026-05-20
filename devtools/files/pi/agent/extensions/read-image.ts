import { promises as fs, constants as fsConstants } from "node:fs";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";

const ReadImageParams = Type.Object({
  path: Type.String({ description: "Path to the image file to read (relative or absolute)" }),
});

type ToolCtx = { cwd: string; model?: { input?: string[] } };

function isAbortSignalLike(value: unknown): value is AbortSignal {
  return !!value
    && typeof value === "object"
    && "aborted" in value
    && typeof (value as any).aborted === "boolean"
    && typeof (value as any).addEventListener === "function";
}

function isContextLike(value: unknown): value is ToolCtx {
  return !!value && typeof value === "object" && typeof (value as any).cwd === "string";
}

function normalizeExecuteArgs(onUpdateArg: unknown, ctxArg: unknown, signalArg: unknown) {
  if (isContextLike(signalArg)) {
    return {
      signal: isAbortSignalLike(onUpdateArg) ? onUpdateArg : undefined,
      ctx: signalArg,
    };
  }

  if (isContextLike(ctxArg)) {
    return {
      signal: isAbortSignalLike(signalArg) ? signalArg : undefined,
      ctx: ctxArg,
    };
  }

  throw new Error("Invalid tool execution context");
}

function getNonVisionImageNote(model?: { input?: string[] }): string | undefined {
  if (!model || model.input?.includes("image")) return undefined;
  return "[Current model does not support images. The image will be omitted from this request.]";
}

function detectSupportedImageMimeType(buffer: Buffer): string | undefined {
  if (buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a) {
    return "image/png";
  }

  if (buffer.length >= 3
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (buffer.length >= 6) {
    const sig = buffer.subarray(0, 6).toString("ascii");
    if (sig === "GIF87a" || sig === "GIF89a") return "image/gif";
  }

  if (buffer.length >= 12) {
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  }

  return undefined;
}

export default function readImageExtension(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "read_image",
    label: "read_image",
    description: "Read image file contents (jpg, png, gif, webp). Returns image as attachment.",
    parameters: ReadImageParams,

    async execute(_toolCallId, params, signalArg, onUpdateArg, ctxArg) {
      const { signal, ctx } = normalizeExecuteArgs(onUpdateArg, ctxArg, signalArg);
      if (signal?.aborted) throw new Error("Operation aborted");

      const relativePath = (params as { path: string }).path;
      const absolutePath = path.isAbsolute(relativePath)
        ? relativePath
        : path.resolve(ctx.cwd, relativePath);

      await fs.access(absolutePath, fsConstants.R_OK);
      if (signal?.aborted) throw new Error("Operation aborted");

      const buffer = await fs.readFile(absolutePath);
      const mimeType = detectSupportedImageMimeType(buffer);

      if (!mimeType) {
        throw new Error("File is not a supported image. Supported: jpg, png, gif, webp.");
      }

      const base64 = buffer.toString("base64");
      let textNote = `Read image file [${mimeType}]`;
      const nonVisionImageNote = getNonVisionImageNote(ctx.model);
      if (nonVisionImageNote) textNote += `\n${nonVisionImageNote}`;

      return {
        content: [
          { type: "text" as const, text: textNote },
          { type: "image" as const, data: base64, mimeType },
        ],
      };
    },

    renderCall(args, theme) {
      const p = (args as { path?: string }).path ?? "...";
      return new Text(
        `${theme.fg("toolTitle", theme.bold("read_image"))} ${theme.fg("accent", p)}`,
        0,
        0,
      );
    },

    renderResult(result, _options, theme) {
      const text = (result.content?.find((c: any) => c.type === "text") as { text?: string } | undefined)?.text
        ?? "Read image file";
      return new Text(`\n${theme.fg("toolOutput", text)}`, 0, 0);
    },
  });
}
