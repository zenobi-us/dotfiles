/**
 * Shared test helpers for pi-project tests — mock factories for ctx and pi.
 */
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
//# sourceMappingURL=test-helpers.js.map