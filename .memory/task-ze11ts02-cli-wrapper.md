---
id: ze11ts02
title: Create Zellij CLI Wrapper Utilities
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: completed
epic_id: ze11ij01
phase_id: ze11ph01
assigned_to: unassigned
---

# Task: Create Zellij CLI Wrapper Utilities

## Objective

Build utility functions to execute Zellij commands safely with proper error handling.

## Steps

1. Implement `checkZellijInstalled(): boolean`
   - Use `which zellij` or check PATH
   - Return true if found, false otherwise

2. Implement `isInZellijSession(): boolean`
   - Check `process.env.ZELLIJ` exists
   - Return true if inside session

3. Implement `zellij(args: string[], cwd?: string): string`
   - Execute `zellij ${args.join(" ")}`
   - Return stdout as string
   - Throw descriptive error on failure
   - Include check for Zellij installation first

4. Implement `zellijAction(action: string, args: string[] = []): void`
   - Convenience wrapper for `zellij action <action> <args>`
   - Examples: `zellijAction("new-tab", ["--name", "mytab"])`

5. Add error messages:
   - "Zellij is not installed. Please install it first."
   - "Not inside a Zellij session. Please run this from within Zellij."
   - Include installation hint: "Install via: cargo install zellij"

## Expected Outcome

- All Zellij commands go through these wrappers
- Clear error messages when Zellij missing or not in session
- Commands are easy to compose

## Acceptance Criteria

- [ ] `checkZellijInstalled()` correctly detects binary
- [ ] `isInZellijSession()` uses environment variable
- [ ] `zellij()` throws descriptive errors
- [ ] `zellijAction()` works for common actions

## Lessons Learned

(To be filled after completion)
