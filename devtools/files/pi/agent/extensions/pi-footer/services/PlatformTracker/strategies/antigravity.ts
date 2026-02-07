import { hasAuthKey, readPiAuthJson } from "../auth";
import { API_TIMEOUT_MS } from "../numbers";
import { ProviderStrategy } from "../types";

export const antigravityProvider: ProviderStrategy = {
  id: "antigravity",
  label: "Google Antigravity",
  hasAuthentication: () => hasAuthKey("google-antigravity"),
  fetchUsage: async () => {
    const auth = readPiAuthJson();
    const token = (
      auth["google-antigravity"] as { access?: string } | undefined
    )?.access;
    if (!token) return [];

    const res = await fetch(
      "https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      },
    );
    if (!res.ok) throw new Error(`antigravity ${res.status}`);

    const data = (await res.json()) as {
      models?: Record<
        string,
        { quotaInfo?: { remainingFraction?: number; limit?: string } }
      >;
    };

    const windows = [];
    for (const model of Object.values(data.models ?? {})) {
      const fraction = Math.max(
        0,
        Math.min(1, model.quotaInfo?.remainingFraction ?? 1),
      );
      const duration = Math.max(1, Number(model.quotaInfo?.limit ?? "100"));
      windows.push({ duration, remaining: duration * fraction });
    }

    return windows;
  },
};
