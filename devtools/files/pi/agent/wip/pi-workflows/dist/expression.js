import { formatCost, formatDuration } from "./format.js";
const EXPR_PATTERN = /\$\{\{\s*(.*?)\s*\}\}/g;
/**
 * Built-in filters for expressions.
 * Applied via pipe syntax: ${{ totalDurationMs | duration }}
 */
const FILTERS = {
    duration: (v) => formatDuration(Number(v)),
    currency: (v) => formatCost(Number(v)),
    json: (v) => JSON.stringify(v, null, 2),
    length: (v) => (Array.isArray(v) ? v.length : typeof v === "string" ? v.length : 0),
    keys: (v) => (typeof v === "object" && v !== null ? Object.keys(v) : []),
    filter: (v) => (Array.isArray(v) ? v.filter(Boolean) : v),
};
/** Filter names derived from the FILTERS registry — add a filter above, this updates automatically. */
export const FILTER_NAMES = Object.keys(FILTERS);
/** Known root-level expression scope keys. */
export const EXPRESSION_ROOTS = ["input", "steps"];
/**
 * Error class for expression resolution failures.
 * Contains the original expression and a diagnostic reason.
 */
export class ExpressionError extends Error {
    expression;
    reason;
    constructor(expression, reason) {
        super(`Expression error in '\${{ ${expression} }}': ${reason}`);
        this.name = "ExpressionError";
        this.expression = expression;
        this.reason = reason;
    }
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
export function resolveExpression(expr, scope) {
    // Parse optional filter: "path | filterName"
    const pipeIdx = expr.indexOf("|");
    let pathExpr;
    let filterName;
    if (pipeIdx !== -1) {
        pathExpr = expr.slice(0, pipeIdx).trim();
        filterName = expr.slice(pipeIdx + 1).trim();
    }
    else {
        pathExpr = expr;
    }
    const segments = pathExpr.split(".");
    let current = scope;
    const traversed = [];
    for (const segment of segments) {
        // Container is undefined/null — can't traverse further. This is a broken reference.
        if (current === undefined || current === null) {
            const reason = buildErrorReason(segments, traversed, scope);
            throw new ExpressionError(expr, reason);
        }
        current = current[segment];
        traversed.push(segment);
        // Property doesn't exist on the container — return undefined (optional field).
        // But if this is the first segment (root lookup like "steps" or "input"),
        // or if we're looking up a step name that hasn't executed, that's an error.
        if (current === undefined) {
            // Root-level miss (e.g. "typo.something") — always an error
            if (traversed.length === 1) {
                const reason = buildErrorReason(segments, traversed, scope);
                throw new ExpressionError(expr, reason);
            }
            // Step reference that doesn't exist (e.g. "steps.nonexistent") — error
            if (segments[0] === "steps" && traversed.length === 2) {
                const reason = buildErrorReason(segments, traversed, scope);
                throw new ExpressionError(expr, reason);
            }
            // Otherwise: optional field on an existing object — return undefined
            return undefined;
        }
    }
    // Apply filter if specified
    if (filterName) {
        const filterFn = FILTERS[filterName];
        if (!filterFn) {
            throw new ExpressionError(expr, `unknown filter '${filterName}'`);
        }
        current = filterFn(current);
    }
    return current;
}
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
export function resolveExpressions(value, scope) {
    if (typeof value === "string") {
        return resolveStringExpressions(value, scope);
    }
    if (Array.isArray(value)) {
        return value.map((element) => resolveExpressions(element, scope));
    }
    if (value !== null && typeof value === "object") {
        const result = {};
        for (const [key, val] of Object.entries(value)) {
            result[key] = resolveExpressions(val, scope);
        }
        return result;
    }
    // number, boolean, null, undefined — pass through
    return value;
}
/**
 * Resolve expressions within a string value.
 * Handles whole-value expressions (type-preserving) and embedded expressions (string interpolation).
 */
function resolveStringExpressions(value, scope) {
    // Check if the entire string is a single whole-value expression
    const wholeMatch = value.match(/^\$\{\{\s*(.*?)\s*\}\}$/);
    if (wholeMatch) {
        return resolveExpression(wholeMatch[1], scope);
    }
    // Check if there are any expressions at all
    if (!value.includes("${{")) {
        return value;
    }
    // Embedded expressions: resolve each and interpolate as strings
    return value.replace(EXPR_PATTERN, (_match, expr) => {
        const resolved = resolveExpression(expr, scope);
        if (resolved === undefined || resolved === null)
            return "";
        return stringify(resolved);
    });
}
/**
 * Comparison operators, ordered from longest to shortest.
 * Order matters: the first-match scan in evaluateCondition must try
 * longer operators before shorter ones to avoid matching "!=" when
 * the actual operator is "!==" (or "==" when "===" is intended).
 */
const COMPARISON_OPS = ["!==", "===", "!=", "==", ">=", "<=", ">", "<"];
/**
 * Parse a right-hand operand string into a typed value.
 * Supports: string literals ('value' or "value"), number literals, boolean literals (true/false),
 * null, undefined, or expression paths resolved against scope.
 */
export function parseRightOperand(str, scope) {
    // String literals (single or double quoted)
    if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
        return str.slice(1, -1);
    }
    // Boolean literals
    if (str === "true")
        return true;
    if (str === "false")
        return false;
    // null / undefined
    if (str === "null")
        return null;
    if (str === "undefined")
        return undefined;
    // Number literals
    const num = Number(str);
    if (!Number.isNaN(num) && str !== "")
        return num;
    // Otherwise treat as expression path
    return resolveExpression(str, scope);
}
/**
 * Compare two values using a comparison operator.
 * == and === both use strict equality (===).
 */
export function compare(left, right, op) {
    switch (op) {
        case "==":
        case "===":
            return left === right;
        case "!=":
        case "!==":
            return left !== right;
        case ">":
            return left > right;
        case "<":
            return left < right;
        case ">=":
            return left >= right;
        case "<=":
            return left <= right;
        default:
            throw new ExpressionError(op, `unknown comparison operator '${op}'`);
    }
}
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
export function evaluateCondition(expr, scope) {
    const trimmed = expr.trim();
    // Check for comparison operators (split on first occurrence)
    for (const op of COMPARISON_OPS) {
        const opIdx = trimmed.indexOf(op);
        if (opIdx !== -1) {
            const leftExpr = trimmed.slice(0, opIdx).trim();
            const rightStr = trimmed.slice(opIdx + op.length).trim();
            // Resolve left side
            let leftValue;
            if (leftExpr.startsWith("!")) {
                leftValue = !resolveExpressionSafe(leftExpr.slice(1).trim(), scope);
            }
            else {
                leftValue = resolveExpressionSafe(leftExpr, scope);
            }
            const rightValue = parseRightOperand(rightStr, scope);
            return compare(leftValue, rightValue, op);
        }
    }
    // No comparison operator — evaluate as truthy/falsy
    if (trimmed.startsWith("!")) {
        const innerExpr = trimmed.slice(1).trim();
        const value = resolveExpressionSafe(innerExpr, scope);
        return !value;
    }
    const value = resolveExpressionSafe(trimmed, scope);
    return !!value;
}
/**
 * Resolve an expression, returning undefined for missing optional fields
 * instead of throwing. Root-level misses and missing step references still throw.
 */
function resolveExpressionSafe(expr, scope) {
    return resolveExpression(expr, scope);
}
/**
 * Stringify a resolved value for embedding in a larger string.
 * Objects and arrays use JSON.stringify; primitives use String().
 */
function stringify(value) {
    if (value !== null && typeof value === "object") {
        return JSON.stringify(value);
    }
    return String(value);
}
/**
 * Build a diagnostic error reason based on the path traversal state.
 * Provides context about step status when the path starts with "steps.".
 */
function buildErrorReason(segments, traversed, scope) {
    const failedSegment = traversed[traversed.length - 1];
    const parentPath = traversed.slice(0, -1).join(".");
    // Special case: referencing a step that doesn't exist in scope.steps
    if (segments[0] === "steps" && traversed.length === 2) {
        const stepName = segments[1];
        const stepsObj = scope.steps;
        if (stepsObj && !(stepName in stepsObj)) {
            return `step '${stepName}' has not been executed yet`;
        }
    }
    // When the path starts with "steps.", include step status context if available
    if (segments[0] === "steps" && segments.length >= 2) {
        const stepName = segments[1];
        const stepsObj = scope.steps;
        if (stepsObj) {
            const stepResult = stepsObj[stepName];
            if (stepResult && parentPath) {
                return `property '${failedSegment}' is undefined on ${parentPath} (step '${stepName}' status: ${stepResult.status})`;
            }
        }
    }
    if (parentPath) {
        return `property '${failedSegment}' is undefined on ${parentPath}`;
    }
    return `property '${failedSegment}' is undefined`;
}
//# sourceMappingURL=expression.js.map