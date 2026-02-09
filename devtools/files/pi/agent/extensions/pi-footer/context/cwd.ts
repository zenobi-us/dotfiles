import type { FooterContextProvider } from "../types.ts";

export const cwdProvider: FooterContextProvider = (ctx) =>
  ctx.cwd.split("/").pop() || ctx.cwd;
