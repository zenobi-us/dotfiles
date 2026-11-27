import { createFileRoute, notFound } from "@tanstack/react-router";
import { ModuleDocumentation } from "../../../../../components/ModuleDocumentation";
import { Page } from "../../../../../components/Page";
import { Prose } from "../../../../../components/Prose";
import { siteHref } from "../../../../../lib/siteHref";
import { loadModuleDocument, moduleOf } from "../../../../../module-content";

export const Route = createFileRoute("/modules/$module/items/$item/how-to")({
  loader: async (context) => {
    const module = moduleOf(context.params.module);
    const item = module?.items.find((entry) => entry.id === context.params.item && entry.href === undefined);
    if (!module || !item) throw notFound();
    return { module, item, document: await loadModuleDocument(module.id, `${item.id}/howto`) };
  },
  head: (context) => ({
    meta: [
      { title: `${context.loaderData?.item.title ?? "Item"} how-to — dotfiles` },
      { name: "description", content: context.loaderData?.item.description ?? "" },
    ],
  }),
  component: ModuleItemHowToPage,
});

function ModuleItemHowToPage() {
  const data = Route.useLoaderData();
  return (
    <ModuleDocumentation module={data.module} item={data.item} guide>
      <Page.Header>
        <Page.Eyebrow>{`${data.module.id} / How-to guide`}</Page.Eyebrow>
        <Page.Title>{`${data.item.title}: how-to`}</Page.Title>
        <div className="mt-4 text-[12px]">
          <a href={siteHref(`/modules/${data.module.id}/items/${data.item.id}/`)}>← Capability overview</a>
        </div>
      </Page.Header>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_280px] gap-8 narrow:grid-cols-1">
        <article className="min-w-0">
          <Prose html={data.document.html} className="skill-prose [&_img]:h-auto [&_img]:max-w-full" />
        </article>
        <ModuleDocumentation.Metadata module={data.module} item={data.item} source={data.document.source} />
      </div>
    </ModuleDocumentation>
  );
}
