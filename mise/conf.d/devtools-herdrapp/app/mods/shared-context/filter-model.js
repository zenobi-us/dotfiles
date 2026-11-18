// Statuses combine with OR. Grouping changes presentation, never membership.
// Everything includes unclassified records; Reset restores initiative grouping.
// Review includes fix/finish/submit. Blocked includes error/unknown.
export const STATUS_FILTERS = Object.freeze([
  ["ready", "Ready"], ["active", "Active"], ["review", "Review"],
  ["blocked", "Blocked"], ["completed", "Completed"], ["other", "Other"],
]);
export const GROUPING_OPTIONS = Object.freeze([
  ["initiative", "Initiative"], ["status", "Status"], ["type", "Record type"], ["none", "None"],
]);
export const DEFAULT_FILTERS = Object.freeze({ groupBy: "initiative", ...Object.fromEntries(STATUS_FILTERS.map(([key]) => [key, true])) });
export const FILTER_PRESETS = Object.freeze([
  { id: "everything", label: "Everything", description: "Every status, including completed", statuses: STATUS_FILTERS.map(([key]) => key) },
  { id: "next-actions", label: "Next actions", description: "Ready + Review", statuses: ["ready", "review"] },
  { id: "in-flight", label: "In flight", description: "Active + Blocked", statuses: ["active", "blocked"] },
]);

export function statusFilterKey(state) {
  const value = state?.trim().toUpperCase();
  return value === "READY" ? "ready" : value === "ACTIVE" ? "active"
    : ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(value) ? "review"
      : ["BLOCKED", "ERROR", "UNKNOWN"].includes(value) ? "blocked"
        : ["DONE", "COMPLETED", "CLOSED", "RESOLVED", "COMPLETE"].includes(value) ? "completed" : "other";
}

export function matchesFilters(state, filters) {
  return Boolean(filters[statusFilterKey(state)]);
}

/** Replace status selections while preserving the current tree structure. */
export function applyFilterPreset(filters, id) {
  const preset = FILTER_PRESETS.find(preset => preset.id === id);
  return { ...filters, ...Object.fromEntries(STATUS_FILTERS.map(([key]) => [key, preset.statuses.includes(key)])) };
}

/** Identify the status preset, independent of initiative grouping. */
export function selectedFilterPreset(filters) {
  return FILTER_PRESETS.find(preset => STATUS_FILTERS.every(([key]) => Boolean(filters[key]) === preset.statuses.includes(key)))?.id ?? "custom";
}

/** Migrate stored grouping flags and preserve selections from four-flag filters. */
export function restoreFilters(saved) {
  if (!saved) return { ...DEFAULT_FILTERS };
  const { initiatives, groupBy, ...statuses } = saved;
  const wasAll = ["initiatives", "ready", "review", "blocked"].every(key => saved[key]);
  return { ...DEFAULT_FILTERS, active: wasAll, completed: wasAll, other: wasAll, ...statuses, groupBy: groupBy ?? (initiatives === false ? "none" : "initiative") };
}

export function filterRestrictions(filters) {
  return STATUS_FILTERS.filter(([key]) => !filters[key]).length;
}
