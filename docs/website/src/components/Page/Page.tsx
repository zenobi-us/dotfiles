import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Prose } from "../Prose";

const widths = {
  /** Centred column, as on the landing page. */
  contained: "w-[min(1280px,calc(100%-32px))] tiny:w-[calc(100%-24px)]",
  /** Edge-to-edge column for wide diagrams. */
  full: "w-[calc(100%-32px)] max-w-none pb-6 narrow:w-[calc(100%-24px)]",
};

function Main(props: { id: string; width?: keyof typeof widths; children: ReactNode }) {
  return (
    <main
      id={props.id}
      tabIndex={-1}
      className={cx("m-auto pt-4 focus:outline-none", widths[props.width ?? "contained"])}
    >
      {props.children}
    </main>
  );
}

/** The bordered block that opens a page: eyebrow, title, description and details. */
function Header(props: { children: ReactNode }) {
  return <div className="border border-border bg-background p-5 narrow:p-4">{props.children}</div>;
}

function Eyebrow(props: { children: string }) {
  return <p className="text-[10px] tracking-[.1em] text-muted uppercase">{props.children}</p>;
}

function Title(props: { children: string }) {
  return <h1 className="my-3 text-[24px] leading-[1.2] tracking-[-.02em]">{props.children}</h1>;
}

function Description(props: { html: string }) {
  return <Prose html={props.html} className="[&_p]:max-w-[100ch]" />;
}

function Details(props: { items: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-[11px] text-muted">
      {props.items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

export const Page = Object.assign(Main, { Main, Header, Eyebrow, Title, Description, Details });
