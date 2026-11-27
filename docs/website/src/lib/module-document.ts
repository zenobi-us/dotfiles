export type ModuleItem = {
  id: string;
  title: string;
  description: string;
  kind: "tool" | "command" | "extension" | "plugin" | "integration" | "configuration" | "bundle";
  sources: string[];
} & ({ readme: string; howto: string; href?: never } | { href: string; readme?: never; howto?: never });

export type ModuleSummary = {
  id: string;
  family: string;
  title: string;
  description: string;
  configurations: string[];
  items: ModuleItem[];
};

export type ModuleDocument = {
  html: string;
  source: string;
};
