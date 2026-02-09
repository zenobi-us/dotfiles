import type { FooterContextProvider } from "../types.ts";
import { Footer } from "../footer.ts";

const cwdProvider: FooterContextProvider = (ctx) =>
  ctx.cwd.split("/").pop() || ctx.cwd;

Footer.registerContextProvider("cwd", cwdProvider);
