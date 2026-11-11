// The bundle index holds summaries; each detail route imports one generated document.
export type SkillDocumentContent = {
  html: string;
  source: string;
  schemaVersion: string | number | null;
  version: string | number | null;
  references: { label: string; href: string; path: string }[];
  artifacts: { path: string; source: string }[];
};
