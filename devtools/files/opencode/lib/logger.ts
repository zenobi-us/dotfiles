/**
 * Extensible Logger with namespace support, DEBUG environment variable filtering, and chalk coloring
 * 
 * Usage:
 *   const log = new Logger("skills.parser");
 *   log.info("Message");  // logs if DEBUG matches "skills.*" or "skills.parser"
 *   
 *   const childLog = log.extend("validation");
 *   childLog.info("Message");  // logs if DEBUG matches "skills.validation" or broader
 * 
 * Environment:
 *   DEBUG="*"              // All namespaces
 *   DEBUG="skills.*"       // All skill subnamespaces
 *   DEBUG="skills.parser"  // Specific namespace only
 *   DEBUG=""               // No logging (disabled)
 *   NO_COLOR=1             // Disable colors
 */

import chalk from "chalk";

type LogLevel = "log" | "warn" | "error";

const CHALK_COLORS = [
  chalk.cyan,
  chalk.green,
  chalk.blue,
  chalk.yellow,
  chalk.magenta,
] as const;

class Logger {
  private namespace: string;
  private enabled: boolean;

  constructor(namespace: string) {
    this.namespace = namespace;
    this.enabled = this.isEnabled(namespace);
  }

  /**
   * Create a child logger with extended namespace
   * Example: logger.extend("validation") → "parent.validation"
   */
  extend(childNamespace: string): Logger {
    return new Logger(`${this.namespace}.${childNamespace}`);
  }

  /**
   * Check if this namespace matches DEBUG pattern
   * Patterns:
   *   "*" → all namespaces
   *   "skills.*" → skills.* and all children
   *   "skills.parser" → exact match
   */
  private isEnabled(namespace: string): boolean {
    const debug = process.env.DEBUG;
    
    // If DEBUG not set or empty, disable logging
    if (!debug) return false;
    
    // "*" matches everything
    if (debug === "*") return true;
    
    // Check for wildcard patterns like "skills.*"
    const patterns = debug.split(",").map((p) => p.trim());
    
    return patterns.some((pattern) => {
      if (pattern === "*") return true;
      
      // Exact match
      if (pattern === namespace) return true;
      
      // Wildcard match: "skills.*" matches "skills.parser", "skills.validation", etc.
      if (pattern.endsWith(".*")) {
        const prefix = pattern.slice(0, -2); // Remove ".*"
        return namespace.startsWith(prefix + ".");
      }
      
      return false;
    });
  }

  /**
   * Hash namespace to a consistent color function
   */
  private getNamespaceColor(): (text: string) => string {
    let hash = 0;
    
    for (let i = 0; i < this.namespace.length; i++) {
      hash = ((hash << 5) - hash) + this.namespace.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return CHALK_COLORS[Math.abs(hash) % CHALK_COLORS.length];
  }

  private output(level: LogLevel, args: unknown[]): void {
    if (!this.enabled) return;
    
    const colorFn = this.getNamespaceColor();
    const prefix = colorFn(`[${this.namespace}]`);
    
    const consoleMethod = console[level];
    consoleMethod(prefix, ...args);
  }

  info(...args: unknown[]): void {
    this.output("log", args);
  }

  log(...args: unknown[]): void {
    this.output("log", args);
  }

  warn(...args: unknown[]): void {
    this.output("warn", args);
  }

  error(...args: unknown[]): void {
    this.output("error", args);
  }
}

export { Logger };
