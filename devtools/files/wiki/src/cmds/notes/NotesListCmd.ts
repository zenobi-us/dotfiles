
import { defineCommand } from "clerc";
import { Logger } from "../../services/LoggerService";
import { requireNotebookMiddleware } from "../../middleware/requireNotebookMiddleware";
import { createNoteService } from "../../services/NoteService";

export const NotesListCommand = defineCommand({
  name: "notes list",
  description: "List all notes in the project",
  flags: {},
  alias: [],
  parameters: []
}, async (ctx) => {
  const notebookPath = await requireNotebookMiddleware({
    notebookService: ctx.store.notebooKService,
    path: ctx.flags.notebook
  });

  if (!notebookPath) {
    return
  }

  Logger.debug("NotesListCmd %s", notebookPath);

  const notebook = await ctx.store.notebooKService?.getNotebook(notebookPath)
  const config = ctx.store.config;
  if (!notebook || !config) {
    return;
  }

   const noteService = createNoteService({
     notebook,
     config: config.store,
   });

   const results = await noteService.searchNotes({
     fields: ['content', 'markdown'],
     where: `SELECT * from read_markdown('${notebookPath}/**/*.md')`,
   });

   for (const note of results) {
     console.log(`- ${JSON.stringify(note.metadata)}`);
   }


})
