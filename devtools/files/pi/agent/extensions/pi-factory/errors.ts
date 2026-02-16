export type ErrorCode = "INVALID_INPUT" | "MODEL_NOT_FOUND" | "CANCELLED" | "RUNTIME" | "CONFIRMATION_REJECTED";

export interface ThreadRef {
	runId: string;
	taskId?: string;
	step?: number;
}

export interface ErrorDetails {
	code: ErrorCode;
	message: string;
	recoverable: boolean;
	thread?: ThreadRef;
	meta?: Record<string, unknown>;
}

export class FactoryError extends Error {
	readonly details: ErrorDetails;
	constructor(details: ErrorDetails) {
		super(`${details.code}: ${details.message}`);
		this.name = "FactoryError";
		this.details = details;
	}
}

export function toErrorDetails(error: unknown, fallback?: Partial<ErrorDetails>): ErrorDetails {
	if (error instanceof FactoryError) return error.details;
	return {
		code: fallback?.code ?? "RUNTIME",
		message: error instanceof Error ? error.message : String(error),
		recoverable: fallback?.recoverable ?? false,
		thread: fallback?.thread,
		meta: fallback?.meta,
	};
}
