// poster-make — register the `poster_render` tool so an agent can turn
// inline TSX into a rendered image (or HTML / PDF / SVG) file.
//
// Design: pure capability unlock. No session context, no state. The agent
// authors a single-file React component as a string, names an output path,
// and gets back a file on disk.
//
// There is deliberately NO `width`/`height` tool parameter. The canvas is
// declared inside the TSX (via Tailwind `w-[Npx]` on the root), so there's
// exactly one source of truth. Two sources = overflow + empty-strip bugs.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  Container,
  getCapabilities,
  Image,
  Text,
} from "@earendil-works/pi-tui";
import { Poster } from "poster-ai";
import { Type } from "typebox";

const FORMATS = ["png", "svg", "pdf", "jpg", "webp"] as const;
type Format = (typeof FORMATS)[number];

const MAX_WIDTH_CELLS = 90;
const ARCHIVE_DIR = ".poster/output";

const INLINE_MIME: Partial<Record<Format, string>> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

interface RenderDetails {
  path: string;
  archivePath: string;
  sourcePath: string;
  bytes: number;
  format: Format;
  base64?: string;
  mime?: string;
}

function inferFormat(out: string): Format | null {
  const ext = path.extname(out).toLowerCase().slice(1);
  if (ext === "jpeg") return "jpg";
  return (FORMATS as readonly string[]).includes(ext) ? (ext as Format) : null;
}

/**
 * Pre-flight check on the TSX source. Catches the three mistakes that
 * guarantee a broken canvas before we waste a puppeteer launch on them.
 *
 * Returns an error message if the TSX violates the contract, or null if OK.
 */
function validateTsx(tsx: string): string | null {
  if (!/\bw-\[\d+px\]/.test(tsx)) {
    return [
      "The TSX must declare an explicit canvas width on the root element — this is the single source of truth for the canvas.",
      "",
      "Fix: add `w-[Npx]` to the outermost <div>. Examples:",
      '  <div className="w-[1600px] p-10 ...">   // landscape / twitter / dashboard',
      '  <div className="w-[1200px] p-10 ...">   // square / poster / cover',
      '  <div className="w-[1080px] p-10 ...">   // story / wrapped',
      '  <div className="w-[1400px] p-10 ...">   // magazine / editorial',
      "",
      "Add `h-[Npx]` as well only if you need a fixed aspect (magazine covers, story format). Otherwise height emerges from content.",
    ].join("\n");
  }

  if (/\bmin-h-screen\b/.test(tsx)) {
    return [
      "`min-h-screen` is not allowed. It stretches the wrapper to an internal 3600px viewport instead of your declared canvas, which ruins the composition.",
      "",
      "If you need vertical flex distribution inside a fixed-height parent, use `h-full` on the inner wrapper. If you need a minimum canvas height, declare it on the root with `h-[Npx]` or `min-h-[Npx]`.",
    ].join("\n");
  }

  // Root-level `w-full` is a common footgun — it silently overrides `w-[Npx]`.
  // We can't reliably parse TSX without an AST, but the typical pattern is
  // `w-[Npx] ... w-full` or `w-full ... w-[Npx]` in the same className string
  // on the root element. Scan the first 1000 chars for both tokens together.
  const head = tsx.slice(0, 1500);
  if (/w-\[\d+px\]/.test(head) && /\bw-full\b/.test(head)) {
    const firstWPx = head.indexOf("w-[");
    const firstWFull = head.indexOf("w-full");
    if (
      firstWPx !== -1 &&
      firstWFull !== -1 &&
      Math.abs(firstWPx - firstWFull) < 200
    ) {
      return [
        "`w-full` appears next to `w-[Npx]` on (or near) the root element. `w-full` will override your explicit width.",
        "",
        "Fix: remove `w-full` from the root's className. Keep the `w-[Npx]` only.",
      ].join("\n");
    }
  }

  // Font-size floor. Anything ≤13px is illegible at display scale on a feed.
  const tinyFont = tsx.match(/text-\[(1[0-3])px\]|\btext-xs\b/);
  if (tinyFont) {
    return [
      `Font-size violation: \`${tinyFont[0]}\` is below the 14px floor. Tiny text disappears when the poster is viewed at half scale on a feed.`,
      "",
      "Fix: use `text-sm` (14px) or `text-[14px]` as the minimum. For Recharts SVG axis ticks inside chart props, `fontSize: 13` is acceptable, but Tailwind classes on HTML elements should be ≥14px.",
    ].join("\n");
  }

  // Percentage-height computed from a data expression is a classic
  // circular-layout trap: if the parent's height isn't fixed, the percentage
  // resolves to 0 and the element disappears. Catch the common shape
  // `height: ${expr}%` inside a template string or style object.
  if (/height:\s*[`"]?\$\{[^}]+\}%/.test(tsx)) {
    return [
      // biome-ignore lint/suspicious/noTemplateCurlyInString: literal ${} text shown to the agent
      "Percentage-height computed from an expression (`height: ${...}%`) is a classic layout trap. If the parent element's height isn't fixed, the percentage resolves to 0 and the element collapses.",
      "",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: literal ${} text shown to the agent
      "Fix: compute a pixel height instead. E.g. for a bar chart column, use `height: ${(v / max) * 80}px` with an explicit pixel ceiling. Or wrap the bars in a parent with an explicit `h-[Npx]` and use `h-full` / absolute positioning on the bar.",
    ].join("\n");
  }

  return null;
}

/** Parse the IHDR chunk of a PNG buffer for pixel dimensions. */
function readPngDims(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/**
 * Resolve the TSX source from the two mutually-exclusive parameters.
 * Returns the source string, or an error message if the inputs are invalid.
 */
function resolveTsx(
  cwd: string,
  inline: string | undefined,
  filePath: string | undefined,
): { tsx: string } | { error: string } {
  if (inline && filePath) {
    return {
      error:
        "Pass either `tsx` (inline source) or `tsxPath` (file on disk), not both.",
    };
  }
  if (filePath) {
    const srcPath = path.resolve(cwd, filePath);
    if (!existsSync(srcPath)) {
      return { error: `TSX source not found: ${srcPath}` };
    }
    return { tsx: readFileSync(srcPath, "utf-8") };
  }
  if (inline) {
    return { tsx: inline };
  }
  return {
    error: "Provide either `tsx` (inline source) or `tsxPath` (file on disk).",
  };
}

/** Archive the rendered output + its TSX source under `.poster/output/`. */
function archive(
  cwd: string,
  outPath: string,
  format: Format,
  tsx: string,
  payload: Buffer | string,
): { archivePath: string; sourcePath: string } {
  const dir = path.join(cwd, ARCHIVE_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const stem = path.basename(outPath, path.extname(outPath));
  const tag = `${stem}-${Date.now()}`;
  const archivePath = path.join(dir, `${tag}.${format}`);
  const sourcePath = path.join(dir, `${tag}.tsx`);

  if (typeof payload === "string") {
    writeFileSync(archivePath, payload, "utf-8");
  } else {
    writeFileSync(archivePath, payload);
  }
  writeFileSync(sourcePath, tsx, "utf-8");

  return { archivePath, sourcePath };
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "poster_render",
    label: "Poster Render",
    description:
      "Render a React component to an image (png/svg/pdf/jpg/webp). Pass a single-file TSX source as a string. Best for charts, dashboards, report cards, OG images, year-in-review, editorial data stories, event posters, cover images — anything that's a visual composition, not an interactive UI. See the `poster` skill for the full authoring guide.",
    promptSnippet:
      "Render inline TSX to an image. Use when the user asks for a chart, dashboard, report card, OG image, social share card, year-in-review, magazine layout, cover image, or any single-page visual deliverable.",
    parameters: Type.Object({
      tsx: Type.Optional(
        Type.String({
          description: [
            "Full TSX source for a self-contained React poster. Provide this on the FIRST render. Must `export default` a React component.",
            "",
            "For FURTHER EDITS: do NOT resend the TSX here. Edit the archived `.tsx` file on disk (path returned as `sourcePath` from the previous render) and pass it via `tsxPath` instead. This keeps round-trips small and the edit history auditable.",
            "",
            "Exactly one of `tsx` or `tsxPath` must be provided.",
            "",
            "",
            "HOW THE CANVAS IS SIZED — the most important rule:",
            "The root element declares the canvas via Tailwind. There is no width/height tool parameter — the root div IS the canvas. The renderer measures it exactly.",
            "",
            "DEFAULT TO WIDTH-ONLY. Content-driven height is the safe path — whatever you draw is captured in full. Only declare a fixed `h-[Npx]` when the platform REQUIRES it (OG images = 1200×630 exact).",
            "",
            '  <div className="w-[1600px] p-10 ...">             ← default: width only, height emerges',
            '  <div className="w-[1200px] h-[630px] p-10 ...">  ← OG image (required exact aspect)',
            "",
            "You MUST include `w-[Npx]` on the outermost <div>. Without it, the render falls back to default dimensions and content usually doesn't fit.",
            "",
            "WHEN TO USE h-[Npx]:",
            "- OG images (exactly 1200×630 — platforms crop anything else)",
            "- Exact-ratio social posts where you've already budgeted the content",
            "- Never for 'story format', 'magazine', 'wrapped', or 'dashboard' prompts — use width-only and let the canvas breathe",
            "",
            "WARNING: fixed-height roots usually have `overflow-hidden` (to clip gradient blobs to the canvas). Any content that exceeds the declared height gets silently cut off. If your content totals more than the declared height allows, DROP the `h-[Npx]` and go content-driven.",
            "",
            "BANNED classes — they break the canvas:",
            "- `min-h-screen` anywhere (stretches to 3600px viewport, not your canvas)",
            "- `w-full` on the root alongside `w-[Npx]` (overrides your explicit width)",
            "- `aspect-[W/H]` on the root without an explicit width (indeterminate box)",
            "",
            "AVAILABLE WITHOUT IMPORTS: Tailwind classes; fonts Inter (sans), 'Source Serif 4' (serif/italic), 'JetBrains Mono' (code) — set via inline `style={{ fontFamily: \"...\" }}`.",
            "AVAILABLE VIA IMPORT: recharts, lucide-react, react.",
            "",
            "OTHER NON-NEGOTIABLES:",
            "- Font-size floor is 14px. No `text-xs`, no `text-[11px]`. Use `text-sm` or `text-[14px]` minimum. Recharts axis ticks: `fontSize: 13`.",
            "- Use `tabular-nums` on every number that needs to align.",
            "",
            "SIGNATURE PATTERNS (use liberally):",
            "- Header row: flex items-end justify-between, with kicker+title on left, status chip on right. Kicker = `text-[14px] font-bold uppercase tracking-[0.3em] text-white/50`.",
            "- Italic reveal word in headlines via Source Serif 4 + gradient text fill (e.g. `linear-gradient(180deg,#fef3c7,#f472b6,#a855f7)` with WebkitBackgroundClip: text, color: transparent).",
            "- Cards: `rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5` with boxShadow `inset 0 1px 0 0 rgba(255,255,255,0.04), 0 20px 40px -24px rgba(0,0,0,0.6)`.",
            "- Dark backgrounds: layer two radial-gradient hotspots at opposite corners over a near-black base. Example: `radial-gradient(800px 500px at 90% 0%, rgba(139,92,246,0.18), transparent 60%), #0a0a0f`.",
            '- Recharts: always ResponsiveContainer; `tickLine={false} axisLine={false}`; `CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false}`; gradient area fills via <defs><linearGradient>.',
            "",
            "CANVAS WIDTHS by shape (height emerges from content unless noted):",
            "- Twitter / landscape share: w-[1600px]",
            "- Dashboard: w-[1600px]",
            "- Instagram square / cover: w-[1200px]",
            "- Story / wrapped / vertical social: w-[1080px]",
            "- Editorial / magazine / long-form: w-[1400px]",
            "- OG image: w-[1200px] h-[630px] (ONE exception — exact aspect required)",
            "",
            "CONTENT VOICE: realistic fake data, not foo/bar. Precise numbers ($48,291, +12.4%). Diverse names (Ava Chen, Sora Okafor, Kai Nakamura). Natural dates (Monday, 16 April 2026). Three-part kickers like `The Almanac · Vol. XII · Climate`.",
            "",
            "PICK ONE ACCENT FAMILY — don't mix: cyan/violet (tech), amber/rose (warm), emerald (growth), fuchsia/violet (consumer). Mixing three families = muddy output.",
            "",
            "Load the `poster` skill for the full catalog (layout grammar, composition skeletons, color system, pitfalls, worked examples).",
          ].join("\n"),
        }),
      ),
      tsxPath: Type.Optional(
        Type.String({
          description:
            "Path to a `.tsx` file on disk to render. Use this for iterative edits — typically the `sourcePath` returned by a previous render (e.g. `.poster/output/<name>-<ts>.tsx`). Mutually exclusive with `tsx`. Relative paths resolve against cwd.",
        }),
      ),
      out: Type.String({
        description:
          "Output file path. Format is inferred from the extension (.png / .svg / .pdf / .jpg / .webp). Relative paths resolve against cwd.",
      }),
      format: Type.Optional(
        StringEnum(FORMATS, {
          description: "Force format, overriding the file extension.",
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const format = params.format ?? inferFormat(params.out);
      if (!format) {
        throw new Error(
          `Cannot infer format from '${params.out}'. Use a .png/.svg/.pdf/.jpg/.webp extension, or pass \`format\`.`,
        );
      }

      const source = resolveTsx(ctx.cwd, params.tsx, params.tsxPath);
      if ("error" in source) throw new Error(source.error);
      const { tsx } = source;

      const violation = validateTsx(tsx);
      if (violation) throw new Error(violation);

      const outPath = path.resolve(ctx.cwd, params.out);

      try {
        const poster = new Poster({ installBrowser: true });
        const result = await poster.render({ tsx }, { format });

        if (typeof result === "string") {
          writeFileSync(outPath, result, "utf-8");
        } else {
          writeFileSync(outPath, result);
        }

        // Archive the image + its TSX source under `.poster/output/` so the
        // user can inspect what the agent actually authored, without
        // polluting the directory they asked the output be written to.
        const { archivePath, sourcePath } = archive(
          ctx.cwd,
          outPath,
          format,
          tsx,
          result,
        );

        const bytes =
          typeof result === "string"
            ? Buffer.byteLength(result, "utf-8")
            : result.length;

        // Surface the real rendered CSS dims for PNG so the agent can
        // sanity-check that auto-fit measured what they expected.
        let dimsLabel = "";
        if (typeof result !== "string") {
          const dims = readPngDims(result);
          if (dims) {
            const w = Math.round(dims.width / 2);
            const h = Math.round(dims.height / 2);
            dimsLabel = ` · ${w}×${h}`;
          }
        }

        const mime = INLINE_MIME[format];
        const base64 =
          mime && typeof result !== "string"
            ? result.toString("base64")
            : undefined;

        const details: RenderDetails = {
          path: outPath,
          archivePath,
          sourcePath,
          bytes,
          format,
          base64,
          mime,
        };

        return {
          content: [
            {
              type: "text",
              text: `Rendered ${outPath} · ${(bytes / 1024).toFixed(1)} KB${dimsLabel} · ${format}`,
            },
          ],
          details,
        };
      } catch (err) {
        throw new Error(`poster_render failed: ${(err as Error).message}`, {
          cause: err,
        });
      }
    },

    renderResult(result, _options, theme, context) {
      const details = result.details as RenderDetails | undefined;
      const container = new Container();
      if (!details) return container;

      const kb = (details.bytes / 1024).toFixed(1);
      const label = `${details.format} · ${kb} KB → ${details.path}`;
      container.addChild(new Text(theme.fg("muted", label), 0, 0));

      if (
        getCapabilities().images &&
        context.showImages &&
        details.base64 &&
        details.mime
      ) {
        container.addChild(
          new Image(
            details.base64,
            details.mime,
            { fallbackColor: (text) => theme.fg("dim", text) },
            { maxWidthCells: MAX_WIDTH_CELLS, filename: details.path },
          ),
        );
      }

      return container;
    },
  });
}
