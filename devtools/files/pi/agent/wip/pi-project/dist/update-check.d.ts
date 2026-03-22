/**
 * Run the update check and notify if a newer version exists.
 * Call fire-and-forget from the extension factory — non-blocking.
 */
export declare function checkForUpdates(notify: (message: string, level: "info" | "warning") => void): Promise<void>;
//# sourceMappingURL=update-check.d.ts.map