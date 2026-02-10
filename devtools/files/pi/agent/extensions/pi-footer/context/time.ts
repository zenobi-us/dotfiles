import type { ContextValueProvider } from "../types.ts";
import { Footer } from "../footer.ts";

const timeProvider: ContextValueProvider = () => {
  const now = new Date();
  return now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

Footer.registerContextValue("time", timeProvider);
