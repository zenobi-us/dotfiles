import { defineConfig } from "vitepress";

const repo = "https://github.com/Sunwood-ai-labs/proxmox-skill";

export default defineConfig({
  title: "Proxmox Skill",
  description: "Public Codex skill and CLI for safe Proxmox VE VM and LXC operations.",
  base: "/proxmox-skill/",
  cleanUrls: true,
  lastUpdated: true,
  head: [["link", { rel: "icon", href: "/proxmox-skill-mark.svg" }]],
  themeConfig: {
    logo: "/proxmox-skill-mark.svg",
    socialLinks: [{ icon: "github", link: repo }],
  },
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      title: "Proxmox Skill",
      description: "Safe Proxmox VE automation for Codex.",
      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/getting-started" },
          { text: "Commands", link: "/guide/command-reference" },
          { text: "Validation", link: "/guide/safety-and-validation" },
        ],
        sidebar: {
          "/guide/": [
            {
              text: "Guide",
              items: [
                { text: "Getting Started", link: "/guide/getting-started" },
                { text: "Command Reference", link: "/guide/command-reference" },
                { text: "Safety and Validation", link: "/guide/safety-and-validation" },
              ],
            },
          ],
        },
        outlineTitle: "On this page",
        docFooter: {
          prev: "Previous page",
          next: "Next page",
        },
        footer: {
          message: "Released under the MIT License.",
          copyright: "Copyright © 2026 Sunwood AI Labs",
        },
      },
    },
    ja: {
      label: "日本語",
      lang: "ja-JP",
      title: "Proxmox Skill",
      description: "Codex から安全に使える Proxmox VE automation。",
      themeConfig: {
        nav: [
          { text: "ガイド", link: "/ja/guide/getting-started" },
          { text: "コマンド", link: "/ja/guide/command-reference" },
          { text: "検証", link: "/ja/guide/safety-and-validation" },
        ],
        sidebar: {
          "/ja/guide/": [
            {
              text: "ガイド",
              items: [
                { text: "はじめに", link: "/ja/guide/getting-started" },
                { text: "コマンド一覧", link: "/ja/guide/command-reference" },
                { text: "安全設計と検証", link: "/ja/guide/safety-and-validation" },
              ],
            },
          ],
        },
        outlineTitle: "このページ",
        docFooter: {
          prev: "前のページ",
          next: "次のページ",
        },
        footer: {
          message: "MIT License で公開しています。",
          copyright: "Copyright © 2026 Sunwood AI Labs",
        },
      },
    },
  },
});
