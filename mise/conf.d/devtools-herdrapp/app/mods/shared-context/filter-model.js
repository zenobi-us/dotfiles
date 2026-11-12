export const DEFAULT_FILTERS = Object.freeze({ initiatives: true, ready: true, review: true, blocked: true });
export const FILTER_KEYS = Object.freeze(Object.keys(DEFAULT_FILTERS));

export function matchesFilters(state, filters) {
  if (FILTER_KEYS.every(key => filters[key])) return true;
  return Boolean(filters.ready && state === "READY"
    || filters.review && ["REVIEW", "FIX", "FINISH", "SUBMIT"].includes(state)
    || filters.blocked && ["BLOCKED", "ERROR", "UNKNOWN"].includes(state));
}

export function filterRestrictions(filters) {
  return FILTER_KEYS.filter(key => !filters[key]).length;
}
