/**
 * Shared test helpers — mock factories for ctx, pi, and workflow specs.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
/**
 * Create a mock extension context for testing.
 */
export function mockCtx(cwd) {
    return {
        cwd,
        hasUI: false,
        ui: {
            setWidget: () => { },
            notify: () => { },
            setStatus: () => { },
        },
    };
}
/**
 * Create a mock pi API for testing.
 */
export function mockPi() {
    const messages = [];
    return {
        sendMessage: (msg, opts) => messages.push({ msg, opts }),
        _messages: messages,
    };
}
/**
 * Create a minimal WorkflowSpec for testing.
 * A fresh temp directory is created for filePath.
 */
export function makeSpec(overrides) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wf-test-"));
    return {
        name: "test-workflow",
        description: "Test workflow",
        version: "1",
        source: "project",
        filePath: path.join(tmpDir, "test.workflow.yaml"),
        ...overrides,
    };
}
//# sourceMappingURL=test-helpers.js.map