import type { ComponentType } from "react";
import { Handoff } from "./handoff";
import { Lifecycle } from "./lifecycle";
import { Ownership } from "./ownership";
import { Records } from "./records";
import type { DiagramProps } from "./types";

/** Maps the `diagram` key in a diagram's Markdown front matter to the component that draws it. */
export const diagramComponents = {
  ownership: Ownership,
  handoff: Handoff,
  lifecycle: Lifecycle,
  records: Records,
} satisfies Record<string, ComponentType<DiagramProps>>;
