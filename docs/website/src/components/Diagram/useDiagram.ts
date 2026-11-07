import { createContext, useContext } from "react";

export type DiagramContextValue = { id: string };

export const DiagramContext = createContext<DiagramContextValue | null>(null);

/** Gives diagram parts the diagram id, so each edge points at this diagram's arrow markers. */
export function useDiagram(): DiagramContextValue {
  const value = useContext(DiagramContext);
  if (!value) throw new Error("Diagram parts must be rendered inside <Diagram.Svg>.");
  return value;
}
