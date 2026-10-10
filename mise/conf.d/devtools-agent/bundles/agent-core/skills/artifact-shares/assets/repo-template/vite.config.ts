import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import press from "fumapress/vite";
import { fumadocsMdx } from "fumadocs-mdx/vite";

// GitHub Pages serves this repo at https://<owner>.github.io/<repo>/, so every
// built URL needs the /<repo>/ prefix. The deploy workflow sets BASE_PATH from
// the repository name, so no file in this repo names the repo.
//
// fumapress rejects a basePath that does not end with "/".
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  plugins: [
    press({ basePath: basePath.endsWith("/") ? basePath : `${basePath}/` }),
    fumadocsMdx(),
    tailwindcss(),
  ],
});
