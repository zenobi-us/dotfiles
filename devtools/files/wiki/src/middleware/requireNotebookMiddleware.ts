import { dedent } from "../core/strings";
import { RenderMarkdownTui } from "../services/Display";
import type { NotebookService } from "../services/NotebookService";

export async function requireNotebookMiddleware(args: {
  path?: string,
  notebookService?: NotebookService
}) {

  const notebook = args?.path || await args.notebookService?.discoverNotebookPath();

  if (!notebook) {
    console.error(await RenderMarkdownTui(dedent(`

        # No Notebook Yet
        
        If you want to start using notebooks to manage your wiki, you first need to create a notebook.
        
        You can create a new notebook by running the following command:

        \`\`\`bash
        wiki notebook create [path]
        \`\`\`
    `)))
    return null;
  }


  return notebook;
}
