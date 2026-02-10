import { TimeFrame } from "./numbers";
import { ProviderId } from "./types";

// export function readPiAuthJson(): Record<string, unknown> {
//   const path = join(homedir(), ".pi", "agent", "auth.json");
//   if (!existsSync(path)) return {};
//
//   try {
//     const raw = readFileSync(path, "utf8");
//     const data = JSON.parse(raw);
//     return typeof data === "object" && data ? data : {};
//   } catch {
//     return {};
//   }
// }
//
// export function hasAuthKey(key: string): boolean {
//   const auth = readPiAuthJson();
//   const value = auth[key] as { access?: string; refresh?: string } | undefined;
//   return Boolean(value?.access || value?.refresh);
// }

/**
 * Instead of this package knowing about the .pi/agent/auth.json.
 * Consumers of the tracker can instantiate this class and pass
 * in the hasAuthentication and fetchUsage functions, which can read from any
 * source (e.g., extension storage, environment variables) and implement any auth scheme (e.g., API keys, OAuth).
 */
export class AuthResolver {
  private store = new Map<
    ProviderId,
    {
      value: unknown;
      expiresAt?: number;
    }
  >();
  private resolvers = new Map<ProviderId, () => Promise<unknown | null>>();
  private options: { ttlMs: number } = {
    ttlMs: TimeFrame.FiveMinute,
  };

  constructor(
    resolvers: Record<ProviderId, () => Promise<unknown | null>> = {},
    options: {
      ttlMs?: number; // Optional TTL for cached auth values
    } = { ttlMs: TimeFrame.FiveMinute },
  ) {
    this.resolvers = new Map(Object.entries(resolvers));
    this.options = { ...this.options, ...options };
  }

  async resolve(providerId: string) {
    const resolver = this.resolvers.get(providerId);
    if (!resolver) return null;

    const cached = this.getCached(providerId);
    if (cached !== null) return cached;

    try {
      const value = await resolver();
      if (value !== null) {
        this.cache(providerId, value);
      }
      return value;
    } catch {
      return null;
    }
  }

  getCached(providerId: string): unknown | null {
    const entry = this.store.get(providerId);
    if (!entry) return null;

    // Check TTL
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(providerId);
      return null;
    }

    return entry.value;
  }

  cache(providerId: string, value: unknown) {
    this.store.set(providerId, { value });
  }

  hasAuth(providerId: string): boolean {
    return this.getCached(providerId) !== null;
  }
}
