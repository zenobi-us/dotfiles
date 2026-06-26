import type { CommentIntent, DiffReviewComment, ReviewFile, ReviewScope, ReviewSubmitPayload } from "./types.js";
import { formatIntentLabel, getReviewFileDisplayPath } from "./types.js";

function getCommentFilePath(file: ReviewFile | undefined, scope: ReviewScope): string {
  return file == null ? "(unknown file)" : getReviewFileDisplayPath(file, scope);
}

function formatLocation(comment: DiffReviewComment, file: ReviewFile | undefined): string {
  const filePath = getCommentFilePath(file, comment.scope);

  if (comment.side === "file" || comment.startLine == null) {
    return filePath;
  }

  const lineRange = comment.endLine != null && comment.endLine !== comment.startLine
    ? `${comment.startLine}-${comment.endLine}`
    : `${comment.startLine}`;

  if (comment.scope === "all-files") {
    return `${filePath}:${lineRange}`;
  }

  const suffix = comment.side === "deleted" ? "deleted" : "added";
  return `${filePath}:${lineRange} (${suffix})`;
}

function scopeOrder(scope: ReviewScope): number {
  switch (scope) {
    case "git-diff": return 0;
    case "last-commit": return 1;
    case "all-files": return 2;
  }
}

function sortComments(comments: DiffReviewComment[], fileMap: Map<string, ReviewFile>): DiffReviewComment[] {
  return [...comments]
    .filter((comment) => comment.body.trim().length > 0)
    .sort((a, b) => {
      const aFile = fileMap.get(a.fileId);
      const bFile = fileMap.get(b.fileId);
      const byScope = scopeOrder(a.scope) - scopeOrder(b.scope);
      if (byScope !== 0) return byScope;

      const byPath = getCommentFilePath(aFile, a.scope).localeCompare(getCommentFilePath(bFile, b.scope));
      if (byPath !== 0) return byPath;

      if (a.side !== b.side) return a.side === "file" ? -1 : 1;

      const aLine = a.startLine ?? -1;
      const bLine = b.startLine ?? -1;
      if (aLine !== bLine) return aLine - bLine;

      return a.id.localeCompare(b.id);
    });
}

interface PromptItem {
  location: string;
  body: string;
}

interface IntentSectionContent {
  reviewWide: string | null;
  files: PromptItem[];
  lines: PromptItem[];
}

function getIntentSectionContent(files: ReviewFile[], payload: ReviewSubmitPayload, intent: CommentIntent): IntentSectionContent {
  const fileMap = new Map(files.map((file) => [file.id, file]));
  const comments = sortComments(payload.comments, fileMap).filter((comment) => comment.intent === intent);

  return {
    reviewWide: payload.allIntent === intent ? payload.allComment.trim() || null : null,
    files: comments
      .filter((comment) => comment.side === "file")
      .map((comment) => {
        const file = fileMap.get(comment.fileId);
        return {
          location: formatLocation(comment, file),
          body: comment.body.trim(),
        };
      }),
    lines: comments
      .filter((comment) => comment.side !== "file")
      .map((comment) => {
        const file = fileMap.get(comment.fileId);
        return {
          location: formatLocation(comment, file),
          body: comment.body.trim(),
        };
      }),
  };
}

function hasIntentSectionContent(section: IntentSectionContent): boolean {
  return section.reviewWide != null || section.files.length > 0 || section.lines.length > 0;
}

function pushReviewWideSection(lines: string[], body: string): void {
  lines.push("Review-wide:");
  for (const line of body.split(/\r?\n/)) lines.push(line);
}

function pushFilesSection(lines: string[], items: PromptItem[]): void {
  if (items.length === 0) return;
  lines.push("Files:");
  items.forEach((item, index) => {
    lines.push(`- ${item.location}`);
    for (const line of item.body.split(/\r?\n/)) {
      lines.push(`  ${line}`);
    }
    if (index < items.length - 1) lines.push("");
  });
}

function pushLinesSection(lines: string[], items: PromptItem[]): void {
  if (items.length === 0) return;
  lines.push("Lines:");
  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.location}`);
    for (const line of item.body.split(/\r?\n/)) {
      lines.push(`   ${line}`);
    }
    if (index < items.length - 1) {
      lines.push("");
    }
  });
}

function pushIntentSection(lines: string[], title: string, section: IntentSectionContent): void {
  if (!hasIntentSectionContent(section)) return;
  lines.push(title);
  lines.push("");

  const blocks: string[][] = [];
  if (section.reviewWide != null) {
    const block: string[] = [];
    pushReviewWideSection(block, section.reviewWide);
    blocks.push(block);
  }
  if (section.files.length > 0) {
    const block: string[] = [];
    pushFilesSection(block, section.files);
    blocks.push(block);
  }
  if (section.lines.length > 0) {
    const block: string[] = [];
    pushLinesSection(block, section.lines);
    blocks.push(block);
  }

  blocks.forEach((block, index) => {
    lines.push(...block);
    if (index < blocks.length - 1) lines.push("");
  });
}

export function composeReviewPrompt(files: ReviewFile[], payload: ReviewSubmitPayload): string {
  const lines: string[] = [];
  const fixSection = getIntentSectionContent(files, payload, "fix");
  const discussSection = getIntentSectionContent(files, payload, "discuss");
  const hasFix = hasIntentSectionContent(fixSection);
  const hasDiscuss = hasIntentSectionContent(discussSection);

  if (hasFix && !hasDiscuss) {
    lines.push("Address the following review feedback by making the requested changes.");
    lines.push("");
  } else if (hasDiscuss && !hasFix) {
    lines.push("Respond to the following review discussion items in prose only.");
    lines.push("Do not edit files, write code, run write/editing tools, or make repo changes.");
    lines.push("");
  } else {
    lines.push("Process the following review feedback.");
    lines.push("");
    lines.push("Rules:");
    lines.push("- For FIX items: make the requested changes.");
    lines.push("- For DISCUSS items: do not edit files, write code, run write/editing tools, or make repo changes in order to address them.");
    lines.push("- Treat DISCUSS items as non-actionable discussion prompts; answer them only in prose with explanation, rationale, or a proposal.");
    lines.push("- DISCUSS items must never be converted into code changes unless the user later gives an explicit follow-up request.");
    lines.push("- If both FIX and DISCUSS items are present, implement only the FIX items; answer the DISCUSS items separately in prose.");
    lines.push("");
  }

  pushIntentSection(lines, formatIntentLabel("fix"), fixSection);
  if (hasFix && hasDiscuss) lines.push("");
  pushIntentSection(lines, formatIntentLabel("discuss"), discussSection);

  return lines.join("\n").trim();
}
