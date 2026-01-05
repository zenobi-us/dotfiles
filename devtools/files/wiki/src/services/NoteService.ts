import { type } from "arktype";
import type { ConfigService } from "./ConfigService";
import type { Notebook } from "./NotebookService";
import { open } from "@evan/duckdb";

type Database = ReturnType<typeof open>;

const NoteSchema = type({
  metadata: type({ '[string]': 'string | number | boolean' }),
  content: 'string',
})

export type Note = typeof NoteSchema.infer;

export function createNoteService(args: {
  notebook: Notebook | null
  config: ConfigService
}) {
  let db: Database | null = null;

  /**
   * Initializes the DuckDB instance as a singleton.
   * Loads the markdown extension for parsing markdown files.
   */
  function getDb(): Database {
    if (db !== null) {
      return db;
    }

    db = open(":memory:");
    const connection = db.connect();

    try {
      // Install and load the markdown extension
      connection.query("INSTALL markdown FROM community;");
      connection.query("LOAD markdown;");
    } catch (error) {
      throw new Error(
        `Failed to initialize markdown extension: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      connection.close();
    }

    return db;
  }

  /**
   * Reads a markdown note by ID from the notebook path.
   * @param noteId - The note identifier (filename without extension)
   * @returns The markdown content as a string, or null if not found
   */
  async function readNote(filepath: string): Promise<Note | null> {
    const database = getDb();
    const connection = database.connect();

    try {

      try {
        const result = connection.query<Note>(
          `SELECT content, metadata FROM read_markdown('${filepath.replace(/'/g, "''")}')`
        )

        if (result?.length === 0) {
          return null;
        }
        if (!result[0]) {
          return null;
        }

        return result[0]

        // Reconstruct markdown from content
      } catch {
        return null;
      }
    } finally {
      connection.close();
    }
  }

  /**
   * Searches notes using a user-provided DuckDB SQL query.
   * The query should reference the notebook path and can use markdown functions.
   * @param query - Raw DuckDB SQL query
   * @returns Array of note IDs (filenames without extension) matching the query
   */
  async function searchNotes<F extends 'content' | 'markdown'>(query: {
    fields: F[],
    where?: string
  }) {
    const database = getDb();
    const connection = database.connect();
    const fields = query
      ? query.fields.join(", ")
      : "*";

    const where = query.where

    return connection.query<Note>(`
      SELECT ${fields} FROM (${query})
      ${where ? `WHERE ${where}` : ''}
    `);
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
  };
}
