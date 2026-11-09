import { createContext, useContext } from "react";

export type SkillIndexContextValue = { query: string; setQuery: (query: string) => void };

export const SkillIndexContext = createContext<SkillIndexContextValue | null>(null);

/** Gives the filter field and the groups the same query. */
export function useSkillIndex(): SkillIndexContextValue {
  const value = useContext(SkillIndexContext);
  if (!value) throw new Error("SkillIndex parts must be rendered inside <SkillIndex.Root>.");
  return value;
}
