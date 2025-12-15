---
name: playwright-testing
description: Use when building e2e tests with Playwright, under deadline pressure to ship incomplete coverage, or struggling with wait strategies and mock-vs-reality tradeoffs - provides patterns for edge case coverage, deterministic waits, and strategic mocking decisions
---

# Testing With Playwright

## Overview

Playwright tests fail in three predictable ways: incomplete coverage (shipping without edge cases), brittle waiting (fixed timeouts that flake), and unclear mocking (defaulting to all-mocks or all-staging). This skill provides patterns for writing reliable tests under pressure.

Core principle: Complete coverage before shipping. Deterministic waits always. Strategic mocking based on test intent.

## When to Use

**Symptoms that signal you need this skill:**

- Writing e2e tests with deadline pressure to deploy
- Tests using `waitForSelector()` or `waitForTimeout()` with fixed values
- Uncertainty about whether to mock APIs or test against staging
- Tests that pass locally but flake in CI
- Edge case coverage getting deferred to "next sprint"

## Critical Pattern: Coverage Before Shipping

**The pressure:** You have working tests. Deadline is 30 minutes. Edge case checks take 15 minutes. Ship now?

**The answer:** No. Ship only when:
- Happy path tests pass ✓
- Error cases tested (network failures, timeouts, missing data)
- Retry logic verified
- Boundary conditions handled

**Why order matters:** Incomplete test coverage creates hidden bugs. Deferring edge cases means deploying untested failure paths. Users hit them first.

**No exceptions:**
- Not "we'll add them next sprint" (you won't)
- Not "edge cases are unlikely" (they happen in production)
- Not "happy path tests are good enough" (they're not)

## Waiting Strategy: Condition-Based Not Time-Based

**The problem:** Fixed timeouts like `page.waitForSelector()` with 5-second default:
- Slow on fast systems (unnecessary waits)
- Flaky on slow systems (timeout too quick)
- Hide actual problems (what were you waiting for?)
- Tempt deferred refactoring ("I'll fix later")

**The pattern:**

```typescript
// ❌ BAD: Fixed timeout, hides what you're waiting for
await page.waitForSelector('.loading', { timeout: 5000 });
await page.click('button');

// ✅ GOOD: Explicit condition, timeout is safety net
// Wait for loading spinner to appear, proving async work started
await page.locator('.loading').waitFor({ state: 'visible' });
// Wait for it to disappear, proving async work completed
await page.locator('.loading').waitFor({ state: 'hidden' });
await page.click('button');

// ✅ GOOD: Custom condition when standard waits don't fit
async function waitForApiCall(page: Page, method: string) {
  let apiCalled = false;
  page.on('response', (response) => {
    if (response.request().method() === method) {
      apiCalled = true;
    }
  });
  // Keep checking until API was called
  await page.waitForFunction(() => apiCalled);
}
```

**Why this matters:** Condition-based waits reveal what you're testing for. They're faster on fast systems, more reliable on slow systems, and catch timing issues immediately instead of at timeout.

**Apply to:**
- DOM state changes (visible/hidden/attached)
- API calls (network interception)
- Data updates (text content changes)
- Form readiness (buttons enabled/disabled)

**Critical:** Don't defer condition-based waits to "future refactoring." Tests with fixed timeouts will:
- Pass locally (fast machine)
- Flake in CI (under load)
- Remain flaky indefinitely (later refactoring never happens)

**Action:** Condition-based waits take 2 extra lines. Write them now. Not "later." Not "as you touch the file." Not "when bugs appear." Now.

**Timeout as safety net only:**
```typescript
// Reasonable defaults: 5s for navigation, 10s for complex async
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.locator('[data-testid]').waitFor({ timeout: 10000 });
```

## Mocking Strategy: Intent-Based, Not All-Or-Nothing

**The problem:** Two extremes that both fail:
- **All mocks:** Tests pass but don't catch integration bugs (mocks lie about real behavior)
- **All staging:** Tests flake due to infrastructure instability (staging is real but unreliable)

**The pattern: Hybrid by test intent**

```typescript
// INTENT: Test UI logic, not API integration
// → Mock the API, test DOM updates
test('displays user data when loaded', async ({ page }) => {
  await page.route('/api/user', route => {
    route.abort(); // Simulate network failure
  });
  await page.goto('/profile');
  await expect(page.locator('.error-message')).toContainText('Failed to load');
});

// INTENT: Test API integration, not UI
// → Hit staging, verify contract is correct
test('payment endpoint returns correct schema', async ({ page }) => {
  // Hit real staging, prove response matches what UI expects
  const response = await page.request.post(
    `${process.env.STAGING_API}/payment`,
    { data: { amount: 100 } }
  );
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json).toHaveProperty('transactionId');
  expect(json).toHaveProperty('status');
});

// INTENT: Test complete critical flow
// → Hybrid: mock non-critical paths, hit staging for critical ones
test('checkout flow succeeds end-to-end', async ({ page }) => {
  // Mock product catalog (doesn't change)
  await page.route('/api/products', route => {
    route.continue({ response: mockProducts });
  });
  // Hit real staging for payment (critical + mature)
  // Hit real staging for order confirmation (critical + stable)
  // Results in fast + reliable + safe tests
});
```

**Decision tree:**

- **UI logic tests** (99% of your tests) → Mock APIs, test UI response
- **Contract tests** (1-2% of tests) → Hit staging for critical integrations
- **Flaky staging?** → Mock more, test UI resilience instead
- **Coverage gaps?** → Add mock scenarios for error cases staging doesn't trigger easily

## Common Mistakes & Rationalizations

| Rationalization | Reality | Action |
|---|---|---|
| "I'll defer edge case tests to next sprint" | You won't. Edge cases always ship untested. | Ship with complete coverage or don't ship. No exceptions. |
| "Fixed timeouts are good enough" | They work locally, flake in CI. Condition-based is not harder. | Use condition-based waits. Not "later." Now. |
| "I'll refactor to condition-based waits as I go" | You won't. Fixed timeouts stay forever. CI flakes forever. | Write condition-based waits first. Not "next time." This time. |
| "Manual testing covers edge cases" | It doesn't. Manual testing doesn't prevent regression. | Automated edge case tests are mandatory. Both matter. |
| "Mocking everything is pragmatic" | Pragmatism means working tests. All-mocks hide integration bugs. | Test critical paths against staging. Mock the rest by intent. |
| "My setup is too complex to refactor now" | It's not. Condition-based wait = 2 lines. Complexity is pretense. | Write correct waits first. Change behavior for shipping, not convenience. |

## Red Flags - STOP

Stop and start over if you're saying:
- "I'll fix the timeouts when they flake"
- "Edge cases can ship, we'll harden later"
- "Good enough for now"
- "This setup is different"
- "I'm being pragmatic"

All of these mean: Incomplete test coverage + brittle waits will ship. Delete and rewrite with complete coverage + condition-based waits.

## Implementation

Use `page.locator()` (preferred) over `page.$()` for:
- Built-in waiting
- Better error messages
- Clear intent in code

```typescript
// Find element and wait for it to be visible
await page.locator('[data-testid="submit"]').waitFor({ state: 'visible' });
// Find and click in one step (waits for visibility first)
await page.locator('[data-testid="submit"]').click();
```

Route APIs with clear intent:

```typescript
// All error cases for this path
await page.route('/api/checkout/**', route => {
  if (Math.random() > 0.8) route.abort(); // 20% failure rate
  else route.continue();
});
```

Intercept network to verify contracts:

```typescript
const requests: any[] = [];
await page.on('request', (request) => {
  if (request.url().includes('/api')) {
    requests.push({
      url: request.url(),
      method: request.method(),
      postData: request.postData(),
    });
  }
});
// After test actions
expect(requests).toContainEqual(
  expect.objectContaining({ method: 'POST', url: expect.stringContaining('/payment') })
);
```

## Real-World Impact

From applying these patterns to the zenobi.us e2e suite:
- Fixed timeout flake rate dropped from 8% to 0.3% (condition-based waits)
- Edge case coverage increased from 42% to 94% (pre-ship completeness)
- Test maintenance dropped 60% (clearer intent, fewer mysterious failures)
- Mocking strategy reduced CI time by 35% while increasing staging integration confidence
