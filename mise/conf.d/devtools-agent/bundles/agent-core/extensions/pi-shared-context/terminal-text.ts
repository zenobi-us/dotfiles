import { stripTerminalSequences } from "@earendil-works/pi-tui";

// Only trusted theme styling may emit terminal controls.
export function safeTerminalText(value: string, multiline = false): string {
  const text = stripTerminalSequences(value).replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ");
  return multiline ? text : text.replaceAll("\n", " ");
}
