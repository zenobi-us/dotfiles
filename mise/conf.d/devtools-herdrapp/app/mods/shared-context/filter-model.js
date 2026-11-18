// Statuses combine with OR. Initiative grouping never changes membership.
// Everything includes unclassified records; Reset also restores grouping.
// Review includes fix/finish/submit. Blocked includes error/unknown.
export const STATUS_FILTERS = Object.freeze([
  ["ready", "Ready"], ["active", "Active"], ["review", "Review"],
  ["blocked", "Blocked"], ["completed", "Completed"], ["other", "Other"],
]);
export const DEFAULT_FILTERS = Object.freeze({ initiatives: true, ...Object.fromEntries(STATUS_FILTERS.map(([key]) => [key, true])) });
export const FILTER_KEYS = Object.freeze(Object.keys(DEFAULT_FILTERS));
export const FILTER_PRESETS = Object.freeze([
  { id: "everything", label: "Everything", description: "Every status, including completed", statuses: STATUS_FILTERS.map(([key]) => key) },
  { id: "next-actions", label: "Next actions", description: "Ready + Review", statuses: ["ready", "review"] },
  { id: "in-flight", label: "In flight", description: "Active + Blocked", statuses: ["active", "blocked"] },
]);

export function matchesFilters(state, filters) {
  const value = state?.trim().toUpperCase();
  const key = value === "READY" ? "ready" : value === "ACTIVE" ? "active"
    : ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(value) ? "review"
      : ["BLOCKED", "ERROR", "UNKNOWN"].includes(value) ? "blocked"
        : ["DONE", "COMPLETED", "CLOSED", "RESOLVED", "COMPLETE"].includes(value) ? "completed" : "other";
  return Boolean(filters[key]);
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

/** Preserve the old status selection when upgrading stored four-flag filters. */
export function restoreFilters(saved) {
  if (!saved) return { ...DEFAULT_FILTERS };
  const wasAll = ["initiatives", "ready", "review", "blocked"].every(key => saved[key]);
  return { ...DEFAULT_FILTERS, active: wasAll, completed: wasAll, other: wasAll, ...saved };
}

export function filterRestrictions(filters) {
  return FILTER_KEYS.filter(key => !filters[key]).length;
}
