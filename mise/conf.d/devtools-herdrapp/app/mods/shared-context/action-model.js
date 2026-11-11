// Presets add instructions to the canonical skill command; they do not replace workflow checks.
export const ACTION_PRESETS = {
  "ask-matt": [
    { label: "What next?", prompt: "What should I do next on this record, and why?" },
    { label: "Why is this blocked?", prompt: "Why is this record blocked? Identify the blockers and what would unblock it." },
    { label: "Summarise this record", prompt: "Summarise the goal, current state, and remaining work." },
    { label: "What am I missing?", prompt: "What assumptions, risks, or missing decisions should I address?" },
  ],
  start: [
    { label: "No extra instructions", prompt: "" },
    { label: "Plan before implementing", prompt: "Read the ticket and propose an implementation plan before changing code." },
    { label: "Focus on acceptance criteria", prompt: "Implement the ticket against its acceptance criteria. Keep unrelated changes out of scope." },
  ],
  review: [
    { label: "No extra instructions", prompt: "" },
    { label: "Check acceptance criteria", prompt: "Review the changes against every acceptance criterion. Report gaps with file and line references." },
    { label: "Look for edge cases", prompt: "Review error handling, state transitions, and boundary conditions for consumer-visible bugs." },
  ],
  fix: [
    { label: "No extra instructions", prompt: "" },
    { label: "Address review findings", prompt: "Address the current review findings. Keep the changes scoped to those findings." },
    { label: "Reproduce, then fix", prompt: "Reproduce the reported problem, fix its cause, and verify the affected user flow." },
  ],
  submit: [
    { label: "No extra instructions", prompt: "" },
    { label: "Capture evidence + attach to ticket", prompt: "Capture evidence from the running app, attach it to the ticket, and include the evidence link in the submission. Report any acceptance criteria that could not be verified." },
    { label: "Include a verification summary", prompt: "Include the checks performed, their results, and any known limitations in the submission." },
  ],
  finish: [
    { label: "No extra instructions", prompt: "" },
    { label: "Verify acceptance criteria", prompt: "Verify the ticket acceptance criteria and report any unresolved gaps before finishing." },
    { label: "Check docs and handoff", prompt: "Check that documentation and the handoff describe the delivered behaviour and any remaining risks." },
  ],
  grill: [
    { label: "No extra instructions", prompt: "" },
    { label: "Challenge the assumptions", prompt: "Challenge the core assumptions. Ask me one question at a time." },
    { label: "Find missing decisions", prompt: "Find ambiguous requirements and missing decisions. Ask one question at a time before proposing changes." },
    { label: "Reduce the scope", prompt: "Challenge the scope and identify what can be removed without losing the intended outcome." },
  ],
  "to-tickets": [
    { label: "No extra instructions", prompt: "" },
    { label: "Small, end-to-end slices", prompt: "Split the work into small, end-to-end tickets with observable acceptance criteria and explicit dependencies." },
    { label: "Check for missing requirements", prompt: "Identify missing requirements and unresolved decisions before creating tickets." },
  ],
  prototype: [
    { label: "No extra instructions", prompt: "" },
    { label: "Compare three approaches", prompt: "Prototype three viable approaches and explain their main trade-offs." },
    { label: "Exercise the risky interaction", prompt: "Prototype the riskiest interaction, including its error and recovery states." },
  ],
};

/**
 * Combine the selected preset and optional detail without adding an empty user request.
 * @param {keyof typeof ACTION_PRESETS} action
 * @param {number} preset
 * @param {string} detail
 * @returns {string}
 */
export function actionPrompt(action, preset, detail) {
  const choice = ACTION_PRESETS[action]?.[preset];
  if (!choice) throw new Error("Select an available action preset.");
  return [choice.prompt, detail.trim()].filter(Boolean).join("\n\n");
}
