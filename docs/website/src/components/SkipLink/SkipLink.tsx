export function SkipLink(props: { href: string; children: string }) {
  return (
    <a
      className="fixed top-2 left-2 z-[100] -translate-y-[160%] border border-primary bg-background px-4 py-3 focus:translate-y-0"
      href={props.href}
    >
      {props.children}
    </a>
  );
}
