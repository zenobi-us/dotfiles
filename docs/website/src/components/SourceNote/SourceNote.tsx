import { Prose } from "../Prose";

export function SourceNote(props: { label: string; html: string }) {
  return (
    <aside className="mt-4 border border-border px-5 py-4 text-[11px] text-muted narrow:p-4" aria-label={props.label}>
      <Prose html={props.html} className="[&_p]:max-w-[110ch]" />
    </aside>
  );
}
