import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DocSection } from "../../components/DocSection";
import { ModuleDocumentation } from "../../components/ModuleDocumentation";
import { Page } from "../../components/Page";
import { ReferenceList } from "../../components/ReferenceList";
import { siteHref } from "../../lib/siteHref";
import { moduleFamilies, modules } from "../../module-content";

export const Route = createFileRoute("/modules/")({
  head: () => ({
    meta: [
      { title: "Mise modules — dotfiles" },
      {
        name: "description",
        content: "Browse mise-managed tools, commands, integrations and configuration by module.",
      },
    ],
  }),
  component: ModulesPage,
});

function ModulesPage() {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const search = query.trim().toLowerCase();
  const matches = modules.filter(
    (module) =>
      (!family || module.family === family) &&
      `${module.id} ${module.title} ${module.description}`.toLowerCase().includes(search),
  );
  return (
    <ModuleDocumentation>
      <Page.Header>
        <Page.Eyebrow>Workstation / Reference / Directory</Page.Eyebrow>
        <Page.Title>Mise modules</Page.Title>
        <p className="text-[12px] text-muted">
          Tools, commands and custom features managed from mise/conf.d/. Choose a module to explore its capabilities and
          task guides.
        </p>
        <Page.Details items={[`${modules.length} modules`, "Repository-backed documentation"]} />
      </Page.Header>
      <div className="my-5 flex flex-wrap items-end gap-4 border border-border p-5 narrow:p-4">
        <label className="grid min-w-0 flex-1 gap-2 text-[11px]">
          Find a module
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. devtools-omp"
            className="min-h-11 w-full border border-border bg-background px-3 text-[13px] focus-visible:outline-2 focus-visible:outline-primary"
          />
        </label>
        <label className="grid gap-2 text-[11px]">
          Module family
          <select
            value={family}
            onChange={(event) => setFamily(event.target.value)}
            className="min-h-11 border border-border bg-background px-3 text-[13px] focus-visible:outline-2 focus-visible:outline-primary"
          >
            <option value="">All families</option>
            {moduleFamilies.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setFamily("");
          }}
          className="min-h-11 border border-border px-4 text-[12px] hover:bg-card focus-visible:outline-2 focus-visible:outline-primary"
        >
          Clear filters
        </button>
      </div>
      <p role="status" className="text-[11px] text-muted">
        {matches.length} of {modules.length} modules
      </p>
      {matches.length === 0 && (
        <p className="my-5 border border-border p-5">No matching modules. Try another name or clear the filters.</p>
      )}
      {moduleFamilies.map((name, index) => {
        const group = matches.filter((module) => module.family === name);
        if (group.length === 0) return null;
        return (
          <DocSection key={name} id={`family-${name}`}>
            <DocSection.Heading
              number={String(index + 1).padStart(2, "0")}
              eyebrow="Module family"
              title={name}
              summary={`${group.length} modules. Open a module for its overview, notable items and source context.`}
            />
            <DocSection.Content>
              <ReferenceList>
                {group.map((module) => (
                  <ReferenceList.Item
                    key={module.id}
                    href={siteHref(`/modules/${module.id}/`)}
                    title={module.title}
                    description={`${module.id} · ${module.items.length} notable items. ${module.description}`}
                  />
                ))}
              </ReferenceList>
            </DocSection.Content>
          </DocSection>
        );
      })}
    </ModuleDocumentation>
  );
}
