import type { FooterContextProvider } from "../types.ts";
import { Footer } from "../footer.ts";

const timeProvider: FooterContextProvider = () => {
  const now = new Date();
  return now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

Footer.registerContextProvider("time", timeProvider);
