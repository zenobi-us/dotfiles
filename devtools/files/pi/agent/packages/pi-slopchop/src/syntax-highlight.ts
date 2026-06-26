export interface SyntaxSegment {
  text: string;
  token?: "attr" | "string" | "number" | "literal" | "meta";
}

function pushSegment(segments: SyntaxSegment[], text: string, token?: SyntaxSegment["token"]): void {
  if (text.length === 0) return;
  const last = segments[segments.length - 1];
  if (last && last.token === token) {
    last.text += text;
    return;
  }
  segments.push({ text, token });
}

export function tokenizeJsonLine(text: string): SyntaxSegment[] {
  if (text.length === 0) return [{ text }];

  const segments: SyntaxSegment[] = [];
  let cursor = 0;

  const pushPlain = (nextCursor: number) => {
    if (nextCursor > cursor) {
      pushSegment(segments, text.slice(cursor, nextCursor));
      cursor = nextCursor;
    }
  };

  while (cursor < text.length) {
    const char = text[cursor]!;

    if (char === '"') {
      let end = cursor + 1;
      let escaped = false;
      while (end < text.length) {
        const next = text[end]!;
        if (escaped) {
          escaped = false;
        } else if (next === "\\") {
          escaped = true;
        } else if (next === '"') {
          end += 1;
          break;
        }
        end += 1;
      }

      const tokenText = text.slice(cursor, end);
      let lookahead = end;
      while (lookahead < text.length && /\s/.test(text[lookahead]!)) lookahead += 1;
      const token: SyntaxSegment["token"] = lookahead < text.length && text[lookahead] === ":" ? "attr" : "string";
      pushSegment(segments, tokenText, token);
      cursor = end;
      continue;
    }

    if (/[\[{}\]:,]/.test(char)) {
      pushSegment(segments, char, "meta");
      cursor += 1;
      continue;
    }

    if (/[-0-9]/.test(char)) {
      let end = cursor + 1;
      while (end < text.length && /[0-9eE+\-.]/.test(text[end]!)) end += 1;
      pushPlain(cursor);
      pushSegment(segments, text.slice(cursor, end), "number");
      cursor = end;
      continue;
    }

    if (text.startsWith("true", cursor) || text.startsWith("false", cursor) || text.startsWith("null", cursor)) {
      const literal = text.startsWith("true", cursor)
        ? "true"
        : text.startsWith("false", cursor)
          ? "false"
          : "null";
      pushSegment(segments, literal, "literal");
      cursor += literal.length;
      continue;
    }

    const nextSpecial = text.slice(cursor).search(/["\[{}\]:,-]|true|false|null|[0-9]/);
    if (nextSpecial === -1) {
      pushSegment(segments, text.slice(cursor));
      break;
    }

    const nextCursor = cursor + nextSpecial;
    pushSegment(segments, text.slice(cursor, nextCursor));
    cursor = nextCursor;
  }

  return segments.length > 0 ? segments : [{ text }];
}
