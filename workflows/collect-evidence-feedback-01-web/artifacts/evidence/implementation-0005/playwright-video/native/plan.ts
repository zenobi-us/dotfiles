import type { Plan } from "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts";
export const plan: Plan = {
  schema: "collect-evidence/v1", kind: "plan", workId: "web-public", driver: "playwright",
  base: "http://127.0.0.1:18765", video: true,
  approval: { origins: ["http://127.0.0.1:18765"], confirmations: ["1.3"] },
  tests: [{
    id: "1", claim: "Record a controlled project selection", pass: "Orbit is selected in the final frame", fail: "Orbit is not selected", steps: [
      { do: "navigate", says: "Open the controlled page", to: "/" },
      { do: "expect", says: "Check the initial project state", locator: "#status", text: "No project selected", shot: "initial-project" },
      { do: "click", says: "Select Select project", locator: "#choose" },
      { do: "expect", says: "Check that Orbit is selected", locator: "#status", text: "Project selected: Orbit", shot: "selected-project" },
    ]
  }],
};
