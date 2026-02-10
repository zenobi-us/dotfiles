import { Footer } from "../footer.ts";

Footer.registerContextProvider("cwd", (props) => {
  return props.ctx.cwd.split("/").pop() || props.ctx.cwd;
});
