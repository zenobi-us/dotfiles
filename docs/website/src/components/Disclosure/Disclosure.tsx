import type { ReactNode } from "react";

/** A native `<details>` block, so long reference lists stay closed until the reader opens them. */
function Root(props: { children: ReactNode }) {
  return <details className="group border border-border [&+&]:border-t-0">{props.children}</details>;
}

function Summary(props: { title: string; count: number }) {
  return (
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-[12px] hover:bg-card">
      <span>
        <span aria-hidden="true" className="mr-2 text-primary group-open:hidden">
          +
        </span>
        <span aria-hidden="true" className="mr-2 hidden text-primary group-open:inline">
          −
        </span>
        {props.title}
      </span>
      <span className="text-[11px] text-muted">{props.count}</span>
    </summary>
  );
}

function Content(props: { children: ReactNode }) {
  return <div className="border-t border-border p-3">{props.children}</div>;
}

export const Disclosure = Object.assign(Root, { Root, Summary, Content });
