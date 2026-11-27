import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocSection } from "../../../components/DocSection";
import { ModuleDocumentation } from "../../../components/ModuleDocumentation";
import { Page } from "../../../components/Page";
import { Prose } from "../../../components/Prose";
import { ReferenceList } from "../../../components/ReferenceList";
import { SectionLinks } from "../../../components/SectionLinks";
import { moduleSource } from "../../../lib/module-source";
import { siteHref } from "../../../lib/siteHref";
import { loadModuleDocument, moduleItemHref, moduleOf } from "../../../module-content";

export const Route = createFileRoute("/modules/$module/")({
  loader: async (context) => {
    const module = moduleOf(context.params.module);
    if (!module) throw notFound();
    return { module, document: await loadModuleDocument(module.id, "overview") };
  },
  head: (context) => ({
    meta: [
      { title: `${context.loaderData?.module.title ?? "Module"} — dotfiles` },
      { name: "description", content: context.loaderData?.module.description ?? "" },
    ],
  }),
  component: ModulePage,
});

function ModulePage() {
  const data = Route.useLoaderData();
  return (
    <ModuleDocumentation module={data.module}>
      <Page.Header>
        <Page.Eyebrow>{`${data.module.family} / Module overview`}</Page.Eyebrow>
        <Page.Title>{data.module.title}</Page.Title>
        <p className="text-[12px] text-muted">{data.module.description}</p>
        <Page.Details items={[data.module.id, `${data.module.items.length} notable items`]} />
      </Page.Header>
      <SectionLinks label="Module sections">
        <SectionLinks.Link href="#items" number="01">
          Notable items
        </SectionLinks.Link>
        <SectionLinks.Link href="#overview" number="02">
          Overview
        </SectionLinks.Link>
        <SectionLinks.Link href="#sources" number="03">
          Sources
        </SectionLinks.Link>
      </SectionLinks>
      <DocSection id="items">
        <DocSection.Heading
          number="01"
          eyebrow="Capabilities, not files"
          title="Notable items"
          summary="Open a capability for its reference and task guide. Existing documentation stays at its canonical destination."
        />
        <DocSection.Content>
          <ReferenceList>
            {data.module.items.map((item) => (
              <ReferenceList.Item
                key={item.id}
                href={siteHref(moduleItemHref(data.module, item))}
                title={item.title}
                description={`${item.kind} · ${item.description}${item.href ? " · Existing documentation" : ""}`}
              />
            ))}
          </ReferenceList>
        </DocSection.Content>
      </DocSection>
      <DocSection id="overview">
        <DocSection.Heading
          number="02"
          eyebrow="Module README"
          title="Overview"
          summary="Authored documentation lives beside this module's configuration."
        />
        <DocSection.Content>
          <Prose html={data.document.html} className="skill-prose" />
        </DocSection.Content>
      </DocSection>
      <DocSection id="sources">
        <DocSection.Heading
          number="03"
          eyebrow="Provenance"
          title="Sources"
          summary="Configuration variants describe repository sources, not whether this module is active on your machine."
        />
        <DocSection.Content>
          <p>
            <a href={data.document.source}>View module README ↗</a>
          </p>
          <ul className="mt-4 grid gap-2 text-[12px]">
            {data.module.configurations.map((path) => (
              <li key={path}>
                <a href={moduleSource(data.module.id, path)}>{path} ↗</a>
              </li>
            ))}
          </ul>
          {data.module.configurations.length === 0 && (
            <p className="mt-4 text-[12px] text-muted">
              This module has no root mise configuration. Its README describes the nested sources.
            </p>
          )}
        </DocSection.Content>
      </DocSection>
    </ModuleDocumentation>
  );
}
