/**
 * Nunjucks template rendering for agent prompts.
 * Provides three-tier template resolution (project > user > builtin)
 * and renders agent system prompts with step input as context.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
export function createTemplateEnv(cwd, builtinDir) {
    const projectDir = path.join(cwd, ".pi", "templates");
    const userDir = path.join(os.homedir(), ".pi", "agent", "templates");
    const defaultBuiltinDir = builtinDir ?? path.resolve(import.meta.dirname, "..", "templates");
    // Nunjucks FileSystemLoader searches directories in order — first match wins.
    // Only include directories that exist to avoid noisy warnings.
    const searchPaths = [];
    if (fs.existsSync(projectDir))
        searchPaths.push(projectDir);
    if (fs.existsSync(userDir))
        searchPaths.push(userDir);
    if (fs.existsSync(defaultBuiltinDir))
        searchPaths.push(defaultBuiltinDir);
    // If no template directories exist, use a no-op loader — plain text passes through.
    const loader = searchPaths.length > 0 ? new nunjucks.FileSystemLoader(searchPaths) : undefined;
    return new nunjucks.Environment(loader, {
        autoescape: false,
        throwOnUndefined: false,
    });
}
/** Sentinel used to protect ${{ }} workflow expressions from Nunjucks rendering. */
const WORKFLOW_EXPR_PLACEHOLDER = "\x00__PI_WORKFLOW_EXPR__";
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
export function renderTemplate(env, templateStr, context) {
    // Protect ${{ }} workflow expressions from Nunjucks
    const escaped = templateStr.replace(/\$\{\{/g, WORKFLOW_EXPR_PLACEHOLDER);
    const rendered = env.renderString(escaped, context);
    return rendered.replace(new RegExp(escapeRegExp(WORKFLOW_EXPR_PLACEHOLDER), "g"), "${{");
}
/** Escape special regex characters in a string. */
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
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
export function renderTemplateFile(env, templateName, context) {
    return env.render(templateName, context);
}
//# sourceMappingURL=template.js.map