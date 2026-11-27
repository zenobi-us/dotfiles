import { createFileRoute } from "@tanstack/react-router";
import { PageKinds } from "../components/PageKinds/PageKinds";

export const Route = createFileRoute("/page-kinds")({
  head: () => ({
    meta: [
      { title: "Page kinds — dotfiles" },
      {
        name: "description",
        content:
          "Choose a website page kind with labelled layout thumbnails, component recipes and composition guidance.",
      },
    ],
  }),
  component: PageKinds,
});
