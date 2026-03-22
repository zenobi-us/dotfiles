export interface WorkflowSpec {
    name: string;
    description: string;
    version?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    triggerTurn?: boolean;
    completion?: CompletionSpec;
    steps: Record<string, StepSpec>;
    artifacts?: Record<string, ArtifactSpec>;
    source: "user" | "project";
    filePath: string;
}
export interface ArtifactSpec {
    path: string;
    from: string;
    schema?: string;
}
export interface RetryConfig {
    maxAttempts?: number;
    onExhausted?: "fail" | "skip";
    steeringMessage?: string;
}
export interface StepSpec {
    agent?: string;
    model?: string;
    input?: Record<string, unknown>;
    output?: StepOutputSpec;
    when?: string;
    timeout?: {
        seconds: number;
    };
    retry?: RetryConfig;
    loop?: LoopSpec;
    gate?: GateSpec;
    transform?: TransformSpec;
    parallel?: Record<string, StepSpec>;
    pause?: string | boolean;
    monitor?: string;
    command?: string;
    forEach?: string;
    as?: string;
    workflow?: string;
}
export interface LoopSpec {
    maxAttempts: number;
    attempts?: string;
    steps: Record<string, StepSpec>;
    onExhausted?: StepSpec;
}
export interface GateSpec {
    check: string;
    onPass?: "continue" | "break";
    onFail?: "continue" | "break" | "fail";
}
export interface TransformSpec {
    /**
     * A mapping of output field names to ${{ }} expressions.
     * The result is an object with each field resolved.
     * No LLM invocation — pure data transformation.
     */
    mapping: Record<string, unknown>;
}
export interface StepOutputSpec {
    format?: "json" | "text";
    schema?: string;
    path?: string;
}
export interface AgentSpec {
    name: string;
    description?: string;
    role?: string;
    systemPrompt?: string;
    promptTemplate?: string;
    taskTemplate?: string;
    model?: string;
    thinking?: string;
    tools?: string[];
    extensions?: string[];
    skills?: string[];
    output?: string;
    inputSchema?: Record<string, unknown>;
    outputFormat?: "json" | "text";
    outputSchema?: string;
}
export interface ExecutionState {
    input: unknown;
    steps: Record<string, StepResult>;
    status: "running" | "completed" | "failed" | "paused";
    loop?: LoopState;
    workflowName?: string;
    specVersion?: string;
    startedAt?: string;
    updatedAt?: string;
}
export interface LoopState {
    stepName: string;
    iteration: number;
    maxAttempts: number;
    priorAttempts: LoopAttempt[];
}
export interface LoopAttempt {
    iteration: number;
    steps: Record<string, StepResult>;
}
export interface StepResult {
    step: string;
    agent: string;
    status: "completed" | "failed" | "skipped";
    output?: unknown;
    textOutput?: string;
    outputPath?: string;
    sessionLog?: string;
    usage: StepUsage;
    durationMs: number;
    error?: string;
    truncated?: boolean;
    warnings?: string[];
    attempt?: number;
    totalAttempts?: number;
    priorErrors?: string[];
}
export interface StepUsage {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    cost: number;
    turns: number;
}
export interface WorkflowResult {
    workflow: string;
    runId: string;
    status: "completed" | "failed" | "paused";
    steps: Record<string, StepResult>;
    output?: unknown;
    totalUsage: StepUsage;
    totalDurationMs: number;
    runDir: string;
    artifacts?: Record<string, string>;
}
export interface CompletionSpec {
    message?: string;
    include?: string[];
    template?: string;
}
export interface ExpressionScope {
    input: unknown;
    steps: Record<string, StepResult>;
    [key: string]: unknown;
}
export interface CompletionScope {
    input: unknown;
    steps: Record<string, StepResult>;
    totalUsage: StepUsage;
    totalDurationMs: number;
    runDir: string;
    runId: string;
    workflow: string;
    status: "completed" | "failed";
    output?: unknown;
    [key: string]: unknown;
}
//# sourceMappingURL=types.d.ts.map