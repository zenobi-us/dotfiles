import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

const variants = {
  default: "border-border text-foreground hover:bg-background",
  primary: "border-primary bg-primary text-background hover:bg-foreground",
};

export function Button(props: { href: string; variant?: keyof typeof variants; children: ReactNode }) {
  return (
    <a
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-3 border px-4 py-2 text-[12px] no-underline",
        variants[props.variant ?? "default"],
      )}
      href={props.href}
    >
      {props.children}
    </a>
  );
}
