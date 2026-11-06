import { createFileRoute } from "@tanstack/react-router";
import { DataTable } from "../../components/DataTable";
import { DocSection } from "../../components/DocSection";
import { Page } from "../../components/Page";
import { Prose } from "../../components/Prose";
import { ReferenceList } from "../../components/ReferenceList";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { SkipLink } from "../../components/SkipLink";
import { SupportMatrix } from "../../components/SupportMatrix";
import { bundleOf, bundles, bundlesHub, harnessSupport, navigation } from "../../content";
import { siteHref } from "../../lib/siteHref";

export const Route = createFileRoute("/bundles/")({
  head: () => ({
    meta: [{ title: bundlesHub.meta.title }, { name: "description", content: bundlesHub.meta.description }],
  }),
  component: BundlesPage,
});

function BundlesPage() {
  const nav = navigation.bundles;
  return (
    <>
      <SkipLink href="#main">{bundlesHub.skipLabel}</SkipLink>
      <SiteHeader>
        <SiteHeader.Brand href={siteHref("/")} {...navigation.brand} />
        <SiteHeader.Nav label={nav.label}>
          {nav.links.map((link) => (
            <SiteHeader.NavLink
              key={link.href}
              {...link}
              href={siteHref(link.href)}
              current={link.href === "/bundles/"}
            >
              {link.label}
            </SiteHeader.NavLink>
          ))}
        </SiteHeader.Nav>
        <SiteHeader.Repository href={navigation.repository.href}>{navigation.repository.label}</SiteHeader.Repository>
      </SiteHeader>
      <Page.Main id="main">
        <Page.Header>
          <Page.Eyebrow>{bundlesHub.eyebrow}</Page.Eyebrow>
          <Page.Title>{bundlesHub.title}</Page.Title>
          <Page.Details items={[`${bundles.length} bundles`, `${harnessSupport.harnesses.length} harnesses`]} />
        </Page.Header>

        <DocSection id="bundles">
          <DocSection.Heading
            number="01"
            eyebrow="Reference"
            title="Bundles"
            summary="Open a bundle for its tutorial, tasks, inventory and design."
          />
          <DocSection.Content>
            <ReferenceList>
              {bundles.map((manifest) => {
                const bundle = bundleOf(manifest.name);
                return (
                  <ReferenceList.Item
                    key={manifest.name}
                    href={siteHref(`/bundles/${manifest.name}/`)}
                    title={manifest.name}
                    description={`${manifest.description}. ${bundle?.skills.length ?? 0} skills · ${bundle?.agents.length ?? 0} agents · ${bundle?.hooks.length ?? 0} hooks.`}
                  />
                );
              })}
            </ReferenceList>
          </DocSection.Content>
        </DocSection>

        <DocSection id="support">
          <DocSection.Heading
            number="02"
            eyebrow="Reference"
            title="Harness support"
            summary="Which harness loads each bundle part."
          />
          <DocSection.Content>
            <SupportMatrix parts={harnessSupport.parts} />
          </DocSection.Content>
        </DocSection>

        <DocSection id="harnesses">
          <DocSection.Heading
            number="03"
            eyebrow="Reference"
            title="Harnesses"
            summary="How each harness finds the bundles."
          />
          <DocSection.Content>
            <DataTable label="Harnesses">
              <DataTable.Head columns={["Harness", "mise module", "Install", "Reads", "Hooks"]} />
              <DataTable.Body>
                {harnessSupport.harnesses.map((harness) => (
                  <DataTable.Row key={harness.id}>
                    <DataTable.Cell>
                      {harness.name}
                      {harness.status === "not-supported" && <span className="block text-error">not supported</span>}
                    </DataTable.Cell>
                    <DataTable.Cell code>{harness.module ?? "—"}</DataTable.Cell>
                    <DataTable.Cell muted>{harness.install}</DataTable.Cell>
                    <DataTable.Cell muted>{harness.reads.join(", ") || "—"}</DataTable.Cell>
                    <DataTable.Cell muted>{harness.hooks}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable.Body>
            </DataTable>
          </DocSection.Content>
        </DocSection>

        <DocSection id="how-bundles-work">
          <DocSection.Heading
            number="04"
            eyebrow="Explanation"
            title="How a bundle works"
            summary="One folder, three manifests, many harnesses."
          />
          <DocSection.Content>
            <Prose html={bundlesHub.html} className="[&_p]:max-w-[90ch] [&_p+p]:mt-3" />
          </DocSection.Content>
        </DocSection>

        <SiteFooter>
          <SiteFooter.Label>{nav.footer.label}</SiteFooter.Label>
          {nav.footer.links.map((link) => (
            <SiteFooter.Link key={link.href} {...link} href={siteHref(link.href)}>
              {link.label}
            </SiteFooter.Link>
          ))}
        </SiteFooter>
      </Page.Main>
    </>
  );
}
