import type { Config } from "./ConfigService";
import type { Notebook } from "./NotebookService";

export function createNoteService(args: {
  notebook: Notebook
  config: Config
}) {

  /**
    *
    * TODO: implement note creation
    */
  async function createNote(args: {
    title: string
    content?: string
  }): Promise<void> {
  }

  /**
    *
    * TODO: implement note read
    */
  async function readNote(noteId: string): Promise<string | null> {
    return null;
  }

  /**
    *
    * TODO: implement note removal
    */
  async function removeNote(noteId: string): Promise<void> {
  }

  /**
    *
    * TODO: implement note editing
    */
  async function editNote(noteId: string, content: string): Promise<void> {
  }

  /**
    *
    * TODO: implement note searching
    */
  async function searchNotes(query: string): Promise<string[]> {
    return [];
  }


  return {
    createNote,
    readNote,
    removeNote,
    editNote,
    searchNotes,
  }
}

