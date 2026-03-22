/**
 * Shared formatting utilities for duration and cost display.
 * Used by state.ts (formatResult), expression.ts (filters), and tui.ts (widget).
 */
/**
 * Format duration in milliseconds to human-readable string.
 * <60s -> "42s", <60m -> "1m32s", >=60m -> "1h02m"
 */
export declare function formatDuration(ms: number): string;
/**
 * Format cost as a dollar string.
 */
export declare function formatCost(cost: number): string;
/**
 * Format token count as compact human-readable string.
 * <1000 -> "123 tok", <10000 -> "1.2k tok", <1000000 -> "42k tok", >=1000000 -> "1.2M tok"
 */
export declare function formatTokens(count: number): string;
//# sourceMappingURL=format.d.ts.map