import type { Plan } from "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/plan.ts";

export const plan: Plan = {
  schema: "collect-evidence/v1", kind: "plan",
  workId: "web-public", driver: "playwright",
  base: "http://127.0.0.1:18765",
  approval: { origins: ["http://127.0.0.1:18765"], confirmations: ["1.4"] },
  preconditions: [{ id: "controlled", desc: "Owned local page is ready", check: { goto: "/", locator: "h1", text: "Evidence controlled page" } }],
  tests: [{
    id: "1", claim: "Select a named project on the controlled page",
    pass: "The page shows Project selected: Aurora",
    fail: "The page does not show the selected project", requires: ["controlled"],
    steps: [
      { do: "navigate", says: "Open the controlled page", to: "/" },
      { do: "expect", says: "Check the page heading", locator: "h1", text: "Evidence controlled page", shot: "controlled-heading" },
      { do: "fill", says: "Set Project name to Aurora", locator: "#project", text: "Aurora" },
      { do: "click", says: "Select Select project", locator: "#choose" },
      { do: "expect", says: "Check that Aurora is selected", locator: "#status", text: "Project selected: Aurora", shot: "project-selected" },
    ],
  }],
};
