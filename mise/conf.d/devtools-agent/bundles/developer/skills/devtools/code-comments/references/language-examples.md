# Language-Specific Documentation Patterns

Concrete examples for each language you work with.

## TypeScript / JavaScript

### File Header

```typescript
// api/users.ts
//
// User CRUD operations against the backend API.
// All functions return typed responses and throw ApiError on failure.
//
// Authentication: Requires valid JWT in AuthContext. These functions
// read the token automatically—callers don't pass it explicitly.
//
// Rate limiting: Backend limits to 100 req/min per user. The functions
// here don't handle rate limiting; see useRateLimitedQuery for that.
```

### TSDoc for Exported Functions

```typescript
/**
 * Fetches paginated user list with optional filters.
 *
 * @param options.page - 1-indexed page number (default: 1)
 * @param options.limit - Results per page, max 100 (default: 20)
 * @param options.role - Filter by role, omit for all roles
 * @returns Paginated response with users and total count
 *
 * @example
 * // Get first page of admins
 * const admins = await getUsers({ role: 'admin' });
 *
 * @throws {ApiError} 401 if not authenticated
 * @throws {ApiError} 403 if caller lacks user:read permission
 */
export async function getUsers(options: GetUsersOptions): Promise<PaginatedUsers>
```

### React Component Documentation

```tsx
// components/UserAvatar.tsx
//
// Displays user profile picture with fallback to initials.
// Handles loading states, broken image URLs, and missing users gracefully.
//
// Sizes: 'sm' (24px), 'md' (40px), 'lg' (64px), 'xl' (96px)
// Uses Next.js Image for automatic optimization on non-fallback images.

interface UserAvatarProps {
  /** User object, or null for anonymous/loading state */
  user: User | null;
  /** Display size - affects both dimensions and font size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show online indicator dot */
  showStatus?: boolean;
  /** Called when avatar is clicked, omit to disable click behavior */
  onClick?: () => void;
}

export function UserAvatar({ user, size = 'md', showStatus, onClick }: UserAvatarProps) {
  // Fallback chain: profile pic → initials → generic icon
  // This handles: new users without pics, broken S3 URLs, deleted accounts
```

### Hook Documentation

```typescript
// hooks/useDebounce.ts
//
// Debounces a value, returning the latest value after the specified delay
// with no intermediate updates. Useful for search inputs, form validation,
// and anything that triggers expensive operations on change.
//
// Unlike lodash debounce, this is reactive—works with React state.

/**
 * @param value - Value to debounce
 * @param delay - Milliseconds to wait after last change (default: 300)
 * @returns The debounced value
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 *
 * // API call only fires 500ms after user stops typing
 * useEffect(() => {
 *   if (debouncedSearch) fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 300): T
```

---

## Swift

### File Header with MARK Sections

```swift
// UserProfileViewController.swift
//
// Main profile screen showing user info, stats, and settings access.
// Manages its own data loading—doesn't require data to be passed in.
//
// Navigation: Presented modally from anywhere via UserProfileCoordinator.
// Deep link: myapp://profile/{userId}

import UIKit

// MARK: - UserProfileViewController

final class UserProfileViewController: UIViewController {

    // MARK: - Properties

    private let userId: String
    private let apiClient: APIClient

    // Lazy because we need self for the data source
    private lazy var tableView: UITableView = {
        let table = UITableView(frame: .zero, style: .insetGrouped)
        table.dataSource = self
        table.delegate = self
        return table
    }()

    // MARK: - Initialization

    /// Creates a profile view for the specified user.
    /// - Parameters:
    ///   - userId: User ID to display. Pass current user's ID for "my profile" mode.
    ///   - apiClient: API client for fetching profile data. Defaults to shared instance.
    init(userId: String, apiClient: APIClient = .shared) {
        self.userId = userId
        self.apiClient = apiClient
        super.init(nibName: nil, bundle: nil)
    }
```

### Method Documentation

```swift
/// Submits the current form data to create a new post.
///
/// Validates all fields before submission. If validation fails, highlights
/// the first invalid field and scrolls it into view.
///
/// - Returns: The created post on success
/// - Throws: `ValidationError` if form data is invalid
/// - Throws: `APIError` if the network request fails
///
/// - Note: This method is throttled—rapid calls within 2 seconds are ignored
///   to prevent duplicate posts from double-taps.
func submitPost() async throws -> Post {
```

### Property Documentation

```swift
/// Maximum retry attempts for failed network requests.
///
/// After this many failures, the request fails permanently and surfaces
/// an error to the user. Set lower for user-initiated actions (they can retry)
/// and higher for background sync (no user to retry).
private let maxRetryAttempts = 3

/// Cache for computed layout measurements.
///
/// Cleared on trait collection changes (rotation, dynamic type).
/// Keys are IndexPaths; values are cell heights.
private var heightCache: [IndexPath: CGFloat] = [:]
```

---

## Python

### Module Docstring

```python
"""
user_sync.py - Bidirectional sync between local DB and external identity provider.

Runs on a schedule (see celery_config.py) and can be triggered manually via
the admin panel. Handles conflicts by preferring the most recently modified
record, except for security-sensitive fields which always come from the IdP.

External dependencies:
- OKTA_API_KEY env var for IdP authentication
- Redis for distributed locking (prevents concurrent syncs)

Usage:
    # Full sync (typically nightly)
    sync_all_users()

    # Single user sync (on-demand)
    sync_user(user_id="abc123")
"""
```

### Function Docstring (Google Style)

```python
def calculate_subscription_price(
    plan: Plan,
    billing_cycle: BillingCycle,
    coupon_code: str | None = None,
) -> PriceBreakdown:
    """
    Calculate final price for a subscription including discounts and taxes.

    Applies coupon if valid, calculates regional tax based on the user's
    billing address, and determines any applicable volume discounts.

    Args:
        plan: The subscription plan to price.
        billing_cycle: Monthly or annual billing. Annual gets 2 months free.
        coupon_code: Optional promotional code. Invalid codes are silently
            ignored (returns full price).

    Returns:
        PriceBreakdown with subtotal, discount, tax, and total fields.
        All amounts in cents (USD).

    Raises:
        PlanNotAvailableError: If the plan is archived or region-restricted.

    Example:
        >>> breakdown = calculate_subscription_price(
        ...     plan=Plan.PRO,
        ...     billing_cycle=BillingCycle.ANNUAL,
        ...     coupon_code="SAVE20"
        ... )
        >>> print(f"Total: ${breakdown.total / 100:.2f}")
        Total: $191.20
    """
```

### Class Docstring

```python
class RateLimiter:
    """
    Token bucket rate limiter with Redis backend for distributed limiting.

    Each key (typically user ID or IP) gets its own bucket. Tokens refill
    continuously at the specified rate. Requests consume tokens; when the
    bucket is empty, requests are rejected until tokens refill.

    Thread-safe and works across multiple server instances via Redis.

    Attributes:
        capacity: Maximum tokens per bucket.
        refill_rate: Tokens added per second.
        redis: Redis client for distributed state.

    Example:
        limiter = RateLimiter(capacity=100, refill_rate=10)

        if limiter.allow(user_id):
            process_request()
        else:
            raise TooManyRequestsError()
    """
```

---

## React / Next.js Specific

### Page Component

```tsx
// app/dashboard/page.tsx
//
// Main dashboard showing user's projects, recent activity, and quick actions.
// Server component that fetches initial data, with client islands for interactivity.
//
// Auth: Requires login. Middleware redirects to /login if unauthenticated.
// Data: Fetches from /api/dashboard, cached for 60s (see revalidate below).

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/api';
import { ProjectList } from '@/components/ProjectList';
import { ActivityFeed } from '@/components/ActivityFeed';

export const revalidate = 60; // ISR: regenerate every 60 seconds

export default async function DashboardPage() {
  // Parallel fetch for independent data
  const [projects, activity] = await Promise.all([
    getDashboardData.projects(),
    getDashboardData.recentActivity(),
  ]);
```

### Context Provider

```tsx
// contexts/ThemeContext.tsx
//
// Provides theme state (light/dark/system) to the component tree.
// Persists preference to localStorage and syncs with system preference.
//
// Usage: Wrap app root with <ThemeProvider>, then use useTheme() in components.
// The provider handles SSR hydration mismatch by defaulting to system theme
// on first render, then applying stored preference after hydration.

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  /** Current theme setting (what user chose) */
  theme: Theme;
  /** Resolved theme (what's actually displayed—never 'system') */
  resolvedTheme: 'light' | 'dark';
  /** Update theme preference */
  setTheme: (theme: Theme) => void;
}
```

### API Route

```typescript
// app/api/webhooks/stripe/route.ts
//
// Handles Stripe webhook events for subscription lifecycle.
// Verifies webhook signature before processing—rejects unsigned requests.
//
// Events handled:
// - checkout.session.completed: Provision access
// - customer.subscription.updated: Sync plan changes
// - customer.subscription.deleted: Revoke access
// - invoice.payment_failed: Trigger dunning flow
//
// Idempotency: Events are deduplicated by event ID in Redis (24h TTL).
// Failed processing retries automatically via Stripe's retry logic.

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleSubscriptionChange, handlePaymentFailure } from '@/lib/billing';

export async function POST(request: Request) {
  // Signature verification happens first—reject unsigned requests immediately
  const signature = headers().get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
```
