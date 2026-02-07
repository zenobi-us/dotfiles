import type { FooterContextProvider } from "../types.ts";

export const cwdProvider: FooterContextProvider = (ctx) => ({
  text: ctx.ui.theme.fg("muted", ctx.cwd.split("/").pop() || ctx.cwd),
  align: "right",
  order: 20,
});
