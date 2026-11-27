import { createFileRoute } from "@tanstack/react-router";
import { DesignSystemOverview } from "../../components/DesignSystemOverview/DesignSystemOverview";

export const Route = createFileRoute("/design-system/")({
  head: () => ({
    meta: [
      { title: "Design system — dotfiles" },
      {
        name: "description",
        content:
          "The website design system: page-composition guidance, shared visual foundations and the live React component catalogue.",
      },
    ],
  }),
  component: DesignSystemOverview,
});
