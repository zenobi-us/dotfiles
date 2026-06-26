import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { getReviewWindowData, getSubmoduleReviewWindowData, loadReviewFileContents } from "./git.js";
import { composeReviewPrompt } from "./prompt.js";
import { loadCommentShortcuts } from "./shortcuts.js";
import { hasExactSubmoduleRange } from "./types.js";
import { runReviewApp } from "./ui/review-app.js";

export default function slopReviewExtension(pi: ExtensionAPI) {
  const initialShortcutConfig = loadCommentShortcuts();
  let activeReview = false;

  function notifyShortcutWarnings(ctx: ExtensionContext, warnings: string[]): void {
    if (warnings.length === 0 || !ctx.hasUI) return;
    ctx.ui.notify(`slopchop config: ${warnings.join(" ")}`, "warning");
  }

  async function openReview(ctx: ExtensionContext): Promise<void> {
    if (activeReview) {
      ctx.ui.notify("A review session is already open.", "warning");
      return;
    }

    activeReview = true;
    try {
      const { repoRoot, files } = await getReviewWindowData(pi, ctx.cwd);
      const shortcutConfig = loadCommentShortcuts();
      if (files.length === 0) {
        ctx.ui.notify("No reviewable files found for git diff, last commit, or all files.", "info");
        return;
      }

      notifyShortcutWarnings(ctx, shortcutConfig.warnings);

      const { result, files: submittedFiles } = await runReviewApp(ctx, {
        files,
        repoRoot,
        loadFileContents: (activeRepoRoot, file, scope) => loadReviewFileContents(pi, activeRepoRoot, file, scope),
        loadSubmoduleReviewData: (submodule) => {
          if (hasExactSubmoduleRange(submodule)) {
            return getSubmoduleReviewWindowData(pi, submodule.repoRoot, submodule.oldSha, submodule.newSha);
          }

          return getReviewWindowData(pi, submodule.repoRoot);
        },
        commentShortcuts: shortcutConfig.shortcuts,
      });

      if (result.type === "cancel") {
        ctx.ui.notify("Review cancelled.", "info");
        return;
      }

      const prompt = composeReviewPrompt(submittedFiles, result);
      ctx.ui.setEditorText(prompt);
      ctx.ui.notify("Inserted review feedback into the editor.", "info");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.ui.notify(`Could not open review UI: ${message}`, "error");
    } finally {
      activeReview = false;
    }
  }

  const reviewCommand = {
    description: "Review and annotate code changes",
    handler: async (_args: string, ctx: ExtensionContext) => {
      await openReview(ctx);
    },
  };

  pi.registerCommand("slopchop", reviewCommand);
  pi.registerCommand("diff", reviewCommand);

  pi.registerShortcut(initialShortcutConfig.globalShortcut, {
    description: "Open review UI",
    handler: async (ctx) => {
      await openReview(ctx);
    },
  });

  // The global shortcut is registered once at load and cannot be re-bound for the
  // rest of the session, so surface any config problems up front rather than
  // waiting for the first review to open.
  pi.on("session_start", async (event, ctx) => {
    if (event.reason === "startup" || event.reason === "reload") {
      notifyShortcutWarnings(ctx, initialShortcutConfig.warnings);
    }
  });

  pi.on("session_shutdown", async () => {
    activeReview = false;
  });
}
