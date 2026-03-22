/** Filter names derived from the FILTERS registry — add a filter above, this updates automatically. */
export declare const FILTER_NAMES: string[];
/** Known root-level expression scope keys. */
export declare const EXPRESSION_ROOTS: readonly ["input", "steps"];
/**
 * Error class for expression resolution failures.
 * Contains the original expression and a diagnostic reason.
 */
export declare class ExpressionError extends Error {
    readonly expression: string;
    readonly reason: string;
    constructor(expression: string, reason: string);
}
/**
 * Resolve a single expression string (without the ${{ }} delimiters).
 * E.g. "steps.diagnose.output.rootCause" walks scope.steps.diagnose.output.rootCause
 *
 * Supports pipe filters: "totalDurationMs | duration"
 *
 * Scope is Record<string, unknown> — accepts ExpressionScope, CompletionScope, or any object.
 *
 * Throws ExpressionError if any segment of the path is undefined or null,
 * or if a filter name is unknown.
 */
export declare function resolveExpression(expr: string, scope: Record<string, unknown>): unknown;
/**
 * Resolve all ${{ }} expressions in a value.
 *
 * - If `value` is a string containing `${{ expr }}`, resolve the expression.
 * - If `value` is a string that IS entirely `${{ expr }}`, return the resolved value
 *   (preserving its type -- object, array, number, etc.).
 * - If `value` is a string with `${{ expr }}` embedded in other text,
 *   stringify the resolved value and interpolate.
 * - If `value` is an object, recursively resolve all values.
 * - If `value` is an array, recursively resolve all elements.
 * - If `value` is anything else (number, boolean, null), return as-is.
 *
 * Throws ExpressionError if a property path doesn't resolve.
 */
export declare function resolveExpressions(value: unknown, scope: Record<string, unknown>): unknown;
/**
 * Parse a right-hand operand string into a typed value.
 * Supports: string literals ('value' or "value"), number literals, boolean literals (true/false),
 * null, undefined, or expression paths resolved against scope.
 */
export declare function parseRightOperand(str: string, scope: Record<string, unknown>): unknown;
/**
 * Compare two values using a comparison operator.
 * == and === both use strict equality (===).
 */
export declare function compare(left: unknown, right: unknown, op: string): boolean;
/**
 * Evaluate a condition expression for boolean truthiness.
 *
 * Supports:
 * - Simple path expressions: truthy/falsy evaluation of the resolved value
 * - Negation with ! prefix
 * - Comparison operators: ==, !=, ===, !==, >, <, >=, <=
 * - Right operands: string literals, number literals, boolean literals, null, undefined, or expression paths
 *
 * JS truthiness rules: undefined, null, false, 0, "" are falsy; everything else is truthy.
 */
export declare function evaluateCondition(expr: string, scope: Record<string, unknown>): boolean;
//# sourceMappingURL=expression.d.ts.map