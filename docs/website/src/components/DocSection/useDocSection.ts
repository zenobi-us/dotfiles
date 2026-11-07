import { createContext, useContext } from "react";

export type DocSectionContextValue = { id: string; titleId: string };

export const DocSectionContext = createContext<DocSectionContextValue | null>(null);

/** Gives section parts the section id, so the heading and `aria-labelledby` agree. */
export function useDocSection(): DocSectionContextValue {
  const value = useContext(DocSectionContext);
  if (!value) throw new Error("DocSection parts must be rendered inside <DocSection.Root>.");
  return value;
}
