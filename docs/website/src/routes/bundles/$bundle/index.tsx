import { createFileRoute, notFound } from "@tanstack/react-router";
import { DataTable } from "../../../components/DataTable";
import { DocSection } from "../../../components/DocSection";
import { Page } from "../../../components/Page";
import { Prose } from "../../../components/Prose";
import { SectionLinks } from "../../../components/SectionLinks";
import { SiteFooter } from "../../../components/SiteFooter";
import { SiteHeader } from "../../../components/SiteHeader";
import { SkillIndex } from "../../../components/SkillIndex";
import { SkipLink } from "../../../components/SkipLink";
import { SupportMatrix } from "../../../components/SupportMatrix";
import {
  type Bundle,
  bundleOf,
  type BundleDoc,
  docsOfKind,
  harnessSupport,
  howTosOfSkill,
  invocationOf,
  navigation,
  partsOf,
} from "../../../content";
import { siteHref } from "../../../lib/siteHref";

export const Route = createFileRoute("/bundles/$bundle/")({
  loader: (context) => {
    const bundle = bundleOf(context.params.bundle);
    if (!bundle) throw notFound();
    return bundle;
  },
  head: (context) => ({
    meta: [
      { title: `${context.params.bundle} — agent bundles — dotfiles` },
      { name: "description", content: context.loaderData?.manifest.description ?? "" },
    ],
  }),
  component: BundlePage,
});

const parts = [
  { id: "explanation", number: "01", title: "Explanation" },
  { id: "tutorial", number: "02", title: "Tutorial" },
  { id: "how-to", number: "03", title: "How-to guides" },
  { id: "reference", number: "04", title: "Reference" },
];

function BundlePage() {
  const bundle = Route.useLoaderData();
  const nav = navigation.bundles;
  const name = bundle.manifest.name;
  const supported = harnessSupport.harnesses.filter((harness) =>
    partsOf(bundle).some((part) => part.harnesses.includes(harness.id)),
  );
  return (
    <>
      <SkipLink href="#main">{`Skip to the ${name} bundle`}</SkipLink>
      <SiteHeader>
        <SiteHeader.Brand href={siteHref("/")} {...navigation.brand} />
        <SiteHeader.Nav label={nav.label}>
          {nav.links.map((link) => (
            <SiteHeader.NavLink key={link.href} {...link} href={siteHref(link.href)}>
              {link.label}
            </SiteHeader.NavLink>
          ))}
        </SiteHeader.Nav>
        <SiteHeader.Repository href={navigation.repository.href}>{navigation.repository.label}</SiteHeader.Repository>
      </SiteHeader>
      <Page.Main id="main">
        <Page.Header>
          <Page.Eyebrow>{`Agent bundles / ${name}`}</Page.Eyebrow>
          <Page.Title>{name}</Page.Title>
          <p className="text-[12px] text-muted">{bundle.manifest.description}.</p>
          <Page.Details
            items={[
              `version ${bundle.manifest.version}`,
              `${bundle.skills.length} skills · ${bundle.agents.length} agents · ${bundle.hooks.length} hooks`,
              `Loads in ${supported.map((harness) => harness.name).join(", ") || "no harness"}`,
            ]}
          />
        </Page.Header>
        <SectionLinks label="Jump to a part">
          {parts.map((part) => (
            <SectionLinks.Link key={part.id} href={`#${part.id}`} number={part.number}>
              {part.title}
            </SectionLinks.Link>
          ))}
        </SectionLinks>

        <DocSection id="explanation">
          <DocSection.Heading
            number="01"
            eyebrow="Understanding-oriented"
            title="Explanation"
            summary="Why the bundle is built this way."
          />
          <DocSection.Content>
            <Articles docs={docsOfKind(bundle, "explanation")} />
          </DocSection.Content>
        </DocSection>

        <DocSection id="tutorial">
          <DocSection.Heading
            number="02"
            eyebrow="Learning-oriented"
            title="Tutorial"
            summary={`Use the ${name} bundle for the first time.`}
          />
          <DocSection.Content>
            <Articles docs={docsOfKind(bundle, "tutorial")} />
          </DocSection.Content>
        </DocSection>

        <DocSection id="how-to">
          <DocSection.Heading
            number="03"
            eyebrow="Task-oriented"
            title="How-to guides"
            summary="Steps for one task each."
          />
          <DocSection.Content>
            <HowTos bundle={bundle} />
            <DocSection.Article title={`Reload ${name} after a change`}>
              <DataTable label={`Reload ${name}`}>
                <DataTable.Head columns={["Harness", "Steps"]} />
                <DataTable.Body>
                  {supported.map((harness) => (
                    <DataTable.Row key={harness.id}>
                      <DataTable.Cell>{harness.name}</DataTable.Cell>
                      <DataTable.Cell muted>{harness.reload.replaceAll("<bundle>", name)}</DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable.Body>
              </DataTable>
            </DocSection.Article>
          </DocSection.Content>
        </DocSection>

        <DocSection id="reference">
          <DocSection.Heading
            number="04"
            eyebrow="Information-oriented"
            title="Reference"
            summary="Read from the bundle files at build time."
          />
          <DocSection.Content>
            <Reference bundle={bundle} />
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

/** Hand-written docs of one kind, in file-name order. */
function Articles(props: { docs: BundleDoc[] }) {
  return props.docs.map((doc) => (
    <DocSection.Article key={doc._meta.path} title={doc.title}>
      <Prose
        html={doc.html}
        className="[&_li+li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:max-w-[90ch] [&_p+p]:mt-3"
      />
    </DocSection.Article>
  ));
}

/** Guides leave the bundle page; links open each skill's dedicated how-to page. */
function HowTos(props: { bundle: Bundle }) {
  return (
    <ul className="mb-6 space-y-3">
      {props.bundle.skills
        .filter((skill) => howTosOfSkill(skill).length > 0)
        .map((skill) => (
          <li key={skill.path}>
            <a href={siteHref(`/bundles/${skill.bundle}/skill/${skill.name}/how-to/`)}>{skill.name}: how-to guides →</a>
          </li>
        ))}
    </ul>
  );
}

function Reference(props: { bundle: Bundle }) {
  const name = props.bundle.manifest.name;
  const supported = harnessSupport.harnesses.filter((harness) => harness.status === "supported");
  return (
    <>
      <DocSection.Article title="Harness support">
        <SupportMatrix parts={partsOf(props.bundle)} />
      </DocSection.Article>

      <DocSection.Article title="Install paths">
        <DataTable label={`How each harness loads ${name}`}>
          <DataTable.Head columns={["Harness", "Install", "Reads"]} />
          <DataTable.Body>
            {supported.map((harness) => (
              <DataTable.Row key={harness.id}>
                <DataTable.Cell>{harness.name}</DataTable.Cell>
                <DataTable.Cell muted>{harness.install.replaceAll("<bundle>", name)}</DataTable.Cell>
                <DataTable.Cell muted>{harness.reads.join(", ")}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable.Body>
        </DataTable>
      </DocSection.Article>

      {props.bundle.skills.length > 0 && (
        <DocSection.Article title={`Skills (${props.bundle.skills.length})`}>
          <SkillIndex>
            <SkillIndex.Filter label="Filter skills" placeholder="type to fuzzy match, as in fzf" />
            <SkillIndex.Groups categories={props.bundle.categories}>
              {(category, skills) => (
                <DataTable label={`${category} skills`}>
                  <DataTable.Head columns={["Skill", "Invoked by", "Scripts", "Description", "Guide"]} />
                  <DataTable.Body>
                    {skills.map((skill) => (
                      <DataTable.Row key={skill.path} id={skill.anchor}>
                        <DataTable.Cell code>
                          <a href={siteHref(`/bundles/${name}/skill/${skill.name}/`)}>{skill.name} →</a>
                        </DataTable.Cell>
                        <DataTable.Cell muted>{invocationOf(skill)}</DataTable.Cell>
                        <DataTable.Cell muted>{skill.hasScripts ? "yes" : "—"}</DataTable.Cell>
                        <DataTable.Cell muted>{skill.description}</DataTable.Cell>
                        <DataTable.Cell>
                          {howTosOfSkill(skill).length > 0 ? (
                            <a href={siteHref(`/bundles/${name}/skill/${skill.name}/how-to/`)}>How-to →</a>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable.Body>
                </DataTable>
              )}
            </SkillIndex.Groups>
          </SkillIndex>
        </DocSection.Article>
      )}

      {props.bundle.agents.length > 0 && (
        <DocSection.Article title={`Agents (${props.bundle.agents.length})`}>
          <DataTable label={`${name} agents`}>
            <DataTable.Head columns={["Agent", "Tools", "Description"]} />
            <DataTable.Body>
              {props.bundle.agents.map((agent) => (
                <DataTable.Row key={agent.name}>
                  <DataTable.Cell code>{agent.name}</DataTable.Cell>
                  <DataTable.Cell muted>{agent.tools}</DataTable.Cell>
                  <DataTable.Cell muted>{firstParagraph(agent.description)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable.Body>
          </DataTable>
        </DocSection.Article>
      )}

      {props.bundle.hooks.length > 0 && (
        <DocSection.Article title={`Hooks (${props.bundle.hooks.length})`}>
          <DataTable label={`${name} hooks`}>
            <DataTable.Head columns={["Event", "Command"]} />
            <DataTable.Body>
              {props.bundle.hooks.map((hook) => (
                <DataTable.Row key={`${hook.event}:${hook.command}`}>
                  <DataTable.Cell>{hook.event}</DataTable.Cell>
                  <DataTable.Cell muted>
                    <code className="break-all">{hook.command}</code>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable.Body>
          </DataTable>
        </DocSection.Article>
      )}
    </>
  );
}

/** Agent descriptions can hold long example blocks. The table shows only the first paragraph. */
function firstParagraph(text: string) {
  return text.split(/\n\s*\n/)[0]?.trim() ?? "";
}
