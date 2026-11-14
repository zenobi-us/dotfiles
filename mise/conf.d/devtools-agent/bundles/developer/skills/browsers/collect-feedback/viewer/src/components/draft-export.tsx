// Complete UI exports must account for every draft, including drafts on another image.
import { useState } from 'react';
import { useDrafts } from '../drafts';
import type { Case } from '../types';
import { Button } from './ui/button';

export function DraftExport({ cases, open }: { cases: Case[]; open: (caseId: string, assetId: string) => void }) {
  const { store, records, memoryOnly, unreadable, busy } = useDrafts();
  const [resolving, setResolving] = useState(false);
  const blocked = records.length > 0 || unreadable || busy.length > 0;
  return <>
    <Button variant="outline" onClick={() => {
      if (blocked) setResolving(true);
      else window.open('/api/v1/export', '_blank', 'noopener,noreferrer');
    }}>Export saved annotations ↗</Button>
    {memoryOnly && <p role="alert" className="error">Browser storage failed. Drafts are memory-only and may not survive reload. Save them before leaving this tab.</p>}
    {resolving && blocked && <section className="draft-resolution" aria-label="Resolve unfinished drafts">
      <h2>Resolve unfinished drafts before export</h2>
      <p>Open each draft to save it, or explicitly discard it. Export contains server-saved annotations only.</p>
      {busy.length > 0 && <p role="status">Wait for pending saves before exporting or discarding drafts.</p>}
      {unreadable && <><p role="alert">Stored drafts could not be read. Keep this tab open to resolve memory-only drafts.</p><Button variant="outline" disabled={busy.length > 0} onClick={() => store.discardUnreadable()}>Discard unreadable stored drafts</Button></>}
      {records.map(record => {
        const note = record.annotation;
        const asset = cases.find(item => item.id === note.caseId)?.assets.find(item => item.id === note.assetId && item.sha256 === note.sourceSha256 && item.width === note.originalWidth && item.height === note.originalHeight);
        return <div className="draft-resolution-row" key={note.id}>
          <p>{note.caseId} / {note.assetId} · {note.priority} · {note.comment || '(Empty comment)'}</p>
          {asset ? <Button variant="outline" disabled={busy.length > 0} onClick={() => { open(note.caseId, note.assetId); setResolving(false); }}>Open draft</Button> : <p className="error">Source identity changed or is unavailable. This draft cannot move to another image.</p>}
          <Button variant="outline" disabled={busy.length > 0} onClick={() => store.remove(note)}>Discard draft</Button>
        </div>;
      })}
      <Button variant="ghost" onClick={() => setResolving(false)}>Keep drafts and close export</Button>
    </section>}
  </>;
}
