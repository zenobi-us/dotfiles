export interface Source { runId: string; startedAt?: string; finishedAt?: string; surface?: string; driver?: string }
export interface Session { id: string; createdAt?: string; source: Source; cases: {id: string; path: string}[] }
export interface Step { id: string; order: number; purpose: string; actions: unknown; expected: unknown; observed: unknown; assertionResult: unknown }
export interface Asset { id: string; caseId: string; stepId?: string; path: string; sha256: string; mediaType: string; width?: number; height?: number; capturedAt?: string; driver?: string; driverVersion?: string; captureMethod?: string; url?: string; surface?: string; captureSequence?: number; viewport?: unknown }
export interface Case { schema: string; kind: 'case'; id: string; sessionId: string; source: {runId: string; caseId: string}; purpose: string; preconditions: unknown; steps: Step[]; expected: unknown; limits: unknown; sideEffects: unknown; assets: Asset[] }
export interface SessionResponse {schema: 'collect-feedback/v1'; kind: 'session'; success: true; session: Session}
export interface CasesResponse {schema: 'collect-feedback/v1'; kind: 'cases'; success: true; cases: Case[]}
