/**
 * Nunjucks template rendering for agent prompts.
 * Provides three-tier template resolution (project > user > builtin)
 * and renders agent system prompts with step input as context.
 */
import nunjucks from "nunjucks";
/**
 * Create a Nunjucks environment with three-tier template resolution.
 *
 * Search order (first match wins):
 *   1. .pi/templates/           (project-level)
 *   2. ~/.pi/agent/templates/   (user-level)
 *   3. <package>/templates/     (builtin)
 *
 * Autoescape is disabled — we're rendering markdown, not HTML.
 *
 * @param cwd - project root directory
 * @param builtinDir - optional path to builtin templates (defaults to templates/ relative to package root)
 */
export declare function createTemplateEnv(cwd: string, builtinDir?: string): nunjucks.Environment;
/**
 * Render a template string through Nunjucks.
 *
 * Used for agent system prompts (the markdown body after frontmatter).
 * The context object contains the step's resolved input fields as top-level keys.
 *
 * Workflow expressions (${{ }}) are protected from Nunjucks interpretation
 * by escaping them before rendering and restoring them after.
 *
 * @param env - Nunjucks environment (from createTemplateEnv)
 * @param templateStr - the template text to render
 * @param context - variables available in the template
 * @returns rendered string
 */
export declare function renderTemplate(env: nunjucks.Environment, templateStr: string, context: Record<string, unknown>): string;
/**
 * Render a named template file through Nunjucks.
 *
 * Used when an agent spec references a template by path:
 *   prompt:
 *     system: analyzers/base-analyzer.md
 *
 * The file is resolved through the three-tier search (project > user > builtin).
 *
 * @param env - Nunjucks environment
 * @param templateName - relative path to the template file
 * @param context - variables available in the template
 * @returns rendered string
 */
export declare function renderTemplateFile(env: nunjucks.Environment, templateName: string, context: Record<string, unknown>): string;
//# sourceMappingURL=template.d.ts.map