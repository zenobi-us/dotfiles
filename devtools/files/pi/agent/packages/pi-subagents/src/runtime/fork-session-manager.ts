/**
 * ForkSessionManager
 *
 * Coordinates concurrent session events during fork preparation:
 *
 * Scenario 1 — summary_candidate interrupted by context_prune+fork:
 *   A summary_candidate event arrives. Before it can be resolved, a
 *   context_prune event arrives that contains a `fork` entry. The manager
 *   stashes the summary candidate with a `pending` flag so it is not lost.
 *
 * Scenario 2 — fork_ready replays the stashed candidate:
 *   After the stash, a fork_ready event arrives. The manager recognises
 *   the pending stash and includes the stashed summary candidate in the
 *   fork payload, then clears the stash.
 */

export interface SummaryCandidateEventData {
	event: "summary_candidate";
	id: string;
	text: string;
	/** Number of tokens the candidate represents in the source session. */
	tokens?: number;
}

interface ForkEntryData {
	/** Child session file path that the fork will produce. */
	childSessionFile: string;
	/** Parent session entry id at which the fork boundary is set. */
	entryId: string;
}

export interface ContextPruneEventData {
	event: "context_prune";
	/** Number of pruned tokens (optional; present when a real prune occurred). */
	prunedTokens?: number;
	/** When the prune is also a fork, carries the fork target info. */
	fork?: ForkEntryData;
}

export interface ForkReadyEventData {
	event: "fork_ready";
	childSessionFile: string;
	parentSessionFile: string;
	/** Context window budget the child session was trimmed to fit. */
	childContextWindow: number;
}

export interface ForkPayload {
	childSessionFile: string;
	parentSessionFile: string;
	childContextWindow: number;
	/** Summary text that was stashed during interruption, if any. */
	stashedSummary?: string;
	/** Whether the summary was a pending candidate at interruption time. */
	stashedSummaryPending?: boolean;
}

export interface StashedSummaryCandidate {
	id: string;
	text: string;
	pending: true;
	interruptedAt: number;
}

/**
 * Tracks the lifecycle of a summary candidate during fork coordination.
 */
export class ForkSessionManager {
	/**
	 * The in-flight summary candidate not yet stashed.
	 * Set when handleSummaryCandidate is called, cleared when
	 * the candidate is stashed (by context_prune+fork) or
	 * dispatched (fork_ready without interruption).
	 */
	private inflightCandidate: SummaryCandidateEventData | null = null;

	/**
	 * The stashed summary candidate set by context_prune+fork interruption.
	 * Read and cleared by handleForkReady.
	 */
	private stash: StashedSummaryCandidate | null = null;

	// -- public accessors for test assertions ---------------

	/** The currently stashed summary candidate, or null. */
	get summaryCandidateStash(): StashedSummaryCandidate | null {
		return this.stash;
	}

	/** The in-flight candidate, or null. */
	get currentInflightCandidate(): SummaryCandidateEventData | null {
		return this.inflightCandidate;
	}

	// -- event handlers ------------------------------------

	/**
	 * Accept a summary_candidate event. The candidate is held in-flight
	 * until either a context_prune+fork interrupts it (→ stashing) or a
	 * fork_ready consumes it.
	 *
	 * If a previous candidate was already in-flight, it is silently
	 * replaced (last-in-wins).
	 */
	handleSummaryCandidate(data: SummaryCandidateEventData): void {
		this.inflightCandidate = { ...data };
	}

	/**
	 * Accept a context_prune event.
	 *
	 * When the prune carries a `fork` entry AND there is an in-flight
	 * summary candidate, the candidate is stashed with `pending: true`.
	 *
	 * Returns true if the in-flight candidate was interrupted and stashed.
	 */
	handleContextPrune(data: ContextPruneEventData): boolean {
		if (!data.fork || !this.inflightCandidate) {
			// No fork or nothing to stash — candidate remains in-flight.
			return false;
		}

		const candidate = this.inflightCandidate;
		this.inflightCandidate = null;

		this.stash = {
			id: candidate.id,
			text: candidate.text,
			pending: true,
			interruptedAt: Date.now(),
		};

		return true;
	}

	/**
	 * Accept a fork_ready event.
	 *
	 * If a stashed summary candidate exists, it is included in the fork
	 * payload as `stashedSummary` / `stashedSummaryPending`. The stash
	 * is then cleared.
	 *
	 * If an in-flight candidate exists (no interruption occurred), it
	 * is treated as the summary but not marked pending — it was naturally
	 * resolved.
	 */
	handleForkReady(data: ForkReadyEventData): ForkPayload {
		const payload: ForkPayload = {
			childSessionFile: data.childSessionFile,
			parentSessionFile: data.parentSessionFile,
			childContextWindow: data.childContextWindow,
		};

		// Priority: stashed > in-flight > nothing
		if (this.stash) {
			payload.stashedSummary = this.stash.text;
			payload.stashedSummaryPending = this.stash.pending;
			this.stash = null;
		} else if (this.inflightCandidate) {
			payload.stashedSummary = this.inflightCandidate.text;
			// Not pending because it was resolved naturally (no interruption).
			payload.stashedSummaryPending = false;
			this.inflightCandidate = null;
		}

		return payload;
	}

	/**
	 * Reset all internal state. Useful between tests or when a fork
	 * preparation cycle must be abandoned.
	 */
	reset(): void {
		this.inflightCandidate = null;
		this.stash = null;
	}
}
