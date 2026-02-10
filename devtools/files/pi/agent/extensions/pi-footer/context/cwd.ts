import { Footer } from "../footer.ts";

Footer.registerContextValue("cwd", (props) => {
  return props.ctx.cwd.split("/").pop() || props.ctx.cwd;
});
