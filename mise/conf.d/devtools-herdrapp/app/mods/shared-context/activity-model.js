// Keep invalid events visible. Validated receipts alone omit the records that need repair.
export function workflowActivity(workflow) {
  const events = workflow?.events ?? workflow?.receipts ?? [];
  const invalidEvents = events.filter(event => Boolean(event.error));
  const groups = new Map();
  for (const event of invalidEvents) {
    const group = groups.get(event.error) ?? { message: event.error, events: [] };
    group.events.push(event);
    groups.set(event.error, group);
  }
  // The loader also joins event errors into workflow.error. Show that cause only once.
  const eventErrors = invalidEvents.map(event => `${event.ref}: ${event.error}`).join("\n");
  const error = workflow?.error && workflow.error !== eventErrors ? workflow.error : undefined;
  const invalid = invalidEvents.length > 0 || workflow?.inspection?.historyValid === false;
  return {
    events, invalidEvents, groups: [...groups.values()], error,
    needsReview: invalid || Boolean(error),
    summary: invalidEvents.length ? `Workflow history invalid · ${invalidEvents.length} ${invalidEvents.length === 1 ? "receipt" : "receipts"}` : invalid ? "Workflow history is invalid" : "Workflow validation needs review",
  };
}
