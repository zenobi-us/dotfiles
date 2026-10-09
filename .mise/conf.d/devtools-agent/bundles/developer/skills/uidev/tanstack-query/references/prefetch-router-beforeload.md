---
title: Use TanStack Query in TanStack Router beforeLoad for Critical Guards
impact: HIGH
impactDescription: blocks unauthorized navigation early and warms critical data before route render
tags: tanstack-router, beforeLoad, ensureQueryData, auth, redirect, router-context
---

## Use TanStack Query in TanStack Router beforeLoad for Critical Guards

Use this pattern for **navigation-critical checks** (for example, auth) and **small critical preloads** that must exist before route render.

Avoid moving general data loading into `beforeLoad`; use route loaders/query hooks for non-critical data.

**Router + QueryClient wiring (required once):**

```tsx
// src/routes/__root.tsx
import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({})
```

```tsx
// src/router.tsx
import { createRouter } from '@tanstack/react-router'

export const router = createRouter({
  routeTree,
  context: { queryClient },
})
```

**Protected route with `ensureQueryData`:**

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/protected')({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(userQueryOptions)

    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    return { user }
  },
})
```

**Refresh guard state after auth changes:**

```tsx
await authClient.signOut()
router.invalidate() // force active routes to recompute context/loaders/guards
```

## Don’t duplicate existing rules

This rule is about **where** to run query-backed guards (router `beforeLoad`).
For adjacent concerns, reuse existing references:

- Waterfall mechanics and mitigation: `prefetch-avoid-waterfalls.md`
- Dependent prefetching strategy: `prefetch-in-queryfn.md`
- Conditional query execution (`enabled`): `cache-enabled-option.md`
- Centralized auth/server error handling: `error-global-handler.md`

## References

- TanStack Router docs: `router-context.md` (typed context + `queryClient`)
- TanStack Router docs: `authenticated-routes.md` (`beforeLoad` + `redirect`)
- TanStack Router docs: `external-data-loading.md` (`ensureQueryData` integration)
