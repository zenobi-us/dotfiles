export const workshopPalette = {
  ground: '#e5eae8',
  surface: '#f9faf5',
  ink: '#283538',
  muted: '#647477',
  accent: '#b56548',
  line: '#a9b8b5',
};

export const diagramLabels = ['01 / COMPONENT MAP', '02 / SESSION HANDOFF', '03 / REVIEW GATES'];
export const diagramNames = ['Who owns what', 'What happens when you act', 'What permits the next command'];
export const diagramSummaries = [
  'The worktree playbook resolves the canonical issue, asks shared-context for workflow records, asks Worktrunk for the Git worktree, and asks muxer-subagents for fresh agent sessions. Parent and child sessions write receipts to the resolved workflow record path.',
  'A user starts implementation, the playbook resolves the workflow and creates a source worktree, then a fresh agent session runs. After checking its receipt and closing its pane, the user requests review in a different session in the same worktree.',
  'Implementation leads to review. Failed review requires a fix and another review. Success applies only to the current commit and tree; source changes invalidate it. Submission is optional before finish, which preserves resources on failure.',
];
