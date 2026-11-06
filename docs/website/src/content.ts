// The only module that reads generated content. Other modules import from here,
// so the path to content-collections output appears once and needs no tsconfig alias.
import {
  allDiagrams,
  allEntries,
  allSections,
  landing,
  navigation,
  sourceNote,
  workflowPage,
  type Section,
} from "../.content-collections/generated";

export type { Diagram, Entry, Section } from "../.content-collections/generated";
export { landing, navigation, sourceNote, workflowPage };

const byFilePath = (a: { _meta: { filePath: string } }, b: { _meta: { filePath: string } }) =>
  a._meta.filePath.localeCompare(b._meta.filePath);

/** Sections in folder-name order. */
export const sections = allSections.toSorted(byFilePath);

/** The entries in a section's folder, in file-name order. */
export function entriesOf(section: Section) {
  return allEntries.filter((entry) => entry._meta.directory === section._meta.directory).toSorted(byFilePath);
}

export const diagrams = allDiagrams.toSorted(byFilePath);
