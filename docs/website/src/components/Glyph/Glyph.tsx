/** A decorative arrow or mark. Screen readers skip it. */
export function Glyph(props: { children?: string }) {
  if (!props.children) return null;
  return <span aria-hidden="true">{props.children}</span>;
}
