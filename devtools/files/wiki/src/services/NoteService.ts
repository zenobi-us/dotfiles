import { type } from "arktype";
import type { Config } from "./ConfigService";
import type { Notebook } from "./NotebookService";
import type { DbService } from "./Db";
import { VARCHAR } from "@duckdb/node-api";
import { Logger } from "./LoggerService";


const NoteSchema = type({
  metadata: type({ '[string]': 'string | number | boolean' }),
  content: 'string',
})

export type Note = typeof NoteSchema.infer;

const Log = Logger.child({ namespace: "NoteService" });

export function createNoteService(options: {
  dbService: DbService,
  notebook: Notebook | null
  config: Config
}) {

  async function query<T>(query: string) {

    const database = await options.dbService.getDb();

    const result = await database.run(query);

    if (!result) {
      return [];
    }

    return result
  }


  /**
   * Reads a markdown note by ID from the notebook path.
   * @param noteId - The note identifier (filename without extension)
   * @returns The markdown content as a string, or null if not found
   */
  async function readNote(filepath: string) {

    const db = await options.dbService.getDb();

    try {
      const prepared = await db.prepare(`SELECT content, metadata FROM read_markdown('$filepath')`)
      prepared.bind({ filepath });
      const result = await prepared.run();


      const rows = await result.getRowObjectsJson()

      if (rows?.length === 0) {
        return null;
      }
      if (!rows[0]) {
        return null;
      }

      return rows[0]

    } catch {
      return null;
    }
  }

  /**
   * Searches notes using a user-provided DuckDB SQL query.
   * The query should reference the notebook path and can use markdown functions.
   * @param query - Raw DuckDB SQL query
   * @returns Array of note IDs (filenames without extension) matching the query
   */
  async function searchNotes(args?: {
    query?: string,
  }) {
    if (!options.notebook) {
      throw new Error("No notebook selected");
    }

    Log.debug('searchNotes: query=%s notebookPath=%s', args?.query, options.notebook.path);

    const db = await options.dbService.getDb();
    const prepared = await db.prepare(`
      SELECT * FROM read_markdown($filepath)
    `);
    prepared.bind({
      filepath: `${options.notebook.path}/**/*.md`,
    }, {
      filepath: VARCHAR,
    })

    const result = await prepared.run();

    const rows = await result.getRowObjectsJson();

    return rows || [];
  }

  /**
   * TODO: implement note creation
   */
  async function createNote(args: {
    title: string
    content?: string
  }): Promise<void> {
    // Not implemented
  }

  /**
   * TODO: implement note removal
   */
  async function removeNote(noteId: string): Promise<void> {
    // Not implemented
  }

  /**
   * TODO: implement note editing
   */
  async function editNote(noteId: string, content: string): Promise<void> {
    // Not implemented
  }

  return {
    createNote,
    readNote,
    removeNote,
    editNote,
    searchNotes,
    query,
  };
}
