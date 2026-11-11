// Use expanded initiative membership, not dependency edges or the visible queue.
import { itemType, ticketDisplayState } from "./tree.js";

const CATEGORIES = new Map([
  ["DONE", "done"], ["ACTIVE", "active"], ["BLOCKED", "blocked"],
  ["READY", "ready"], ["REVIEW", "ready"], ["FIX", "ready"], ["FINISH", "ready"], ["SUBMIT", "ready"],
]);

/** Count recorded completion before workflow recommendations; missing finish history does not reopen a ticket. */
export function initiativeProgress(snapshot) {
  const tickets = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
  const results = new Map();
  for (const initiative of snapshot.initiatives) {
    if (initiative.group) continue;
    const progress = { total: 0, done: 0, active: 0, blocked: 0, ready: 0, unavailable: 0, percent: null };
    for (const id of new Set(initiative.ticketIds)) {
      const ticket = tickets.get(id);
      if (ticket && itemType(ticket) !== "ticket") continue;
      progress.total++;
      const category = ticket && CATEGORIES.get(ticketDisplayState(ticket, snapshot.states?.[id]));
      if (category) progress[category]++;
      else progress.unavailable++;
    }
    // Empty or incomplete observations never imply 0% or 100%. Round down until every ticket is done.
    if (progress.total && !progress.unavailable) progress.percent = Math.floor(100 * progress.done / progress.total);
    results.set(initiative.id, progress);
  }
  return results;
}
