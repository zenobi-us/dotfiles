import { createFileRoute } from "@tanstack/react-router";
import { DesignSystem } from "../../components/DesignSystem/DesignSystem";

export const Route = createFileRoute("/design-system/components")({
  head: () => ({
    meta: [
      { title: "Components — design system — dotfiles" },
      {
        name: "description",
        content:
          "The website design system: every component, compound part, variant and live React example in one chapter-style guide.",
      },
    ],
  }),
  component: DesignSystem,
});
