// Screenshot geometry stays normalized; only the server derives original-pixel bounds.
// Drafts stay in memory. A stable request body makes an uncertain save safe to retry.
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Annotation, AnnotationInput, AnnotationResponse, AnnotationsResponse, Asset, Geometry, Priority } from '../types';

const priorities: [Priority, string][] = [['P1', 'Blocker'], ['P2', 'Friction'], ['P3', 'Polish']];
const clamp = (value: number, max = 1) => Math.max(0, Math.min(max, value));

// Boxes need two nonzero axes. Clamp extents after the origin to keep edge sums in bounds.
function boundedGeometry(geometry: Geometry, originalWidth: number, originalHeight: number): Geometry {
  if (geometry.width === 0 && geometry.height === 0) return { ...geometry, x: clamp(geometry.x), y: clamp(geometry.y) };
  const width = clamp(Math.max(1 / originalWidth, geometry.width));
  const height = clamp(Math.max(1 / originalHeight, geometry.height));
  const x = clamp(geometry.x, 1 - width);
  const y = clamp(geometry.y, 1 - height);
  return { x, y, width: Math.min(width, 1 - x), height: Math.min(height, 1 - y) };
}

export function AnnotationImage({ asset, sessionId, writeToken, onError }: {
  asset: Asset; sessionId: string; writeToken: string; onError: () => void;
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [draft, setDraft] = useState<AnnotationInput>();
  const [selectedId, setSelectedId] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string>();
  const [etag, setEtag] = useState('');
  const [position, setPosition] = useState({ left: 8, top: 8 });
  const stage = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const draftPin = useRef<HTMLButtonElement>(null);
  const selectedPin = useRef<HTMLButtonElement>(null);
  const drawing = useRef<{ x: number; y: number; pointerId: number } | undefined>(undefined);
  const submitted = useRef<AnnotationInput | undefined>(undefined);
  const inFlight = useRef(false);
  const selected = draft ?? annotations.find(note => note.id === selectedId);
  const selectedRevision = annotations.find(note => note.id === selectedId)?.revision;
  const canCreate = ready && !loading && !loadError && !draft && !!writeToken && !!asset.width && !!asset.height;

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setLoadError('');
    fetch('/api/v1/annotations', { signal: abort.signal, credentials: 'same-origin' }).then(async response => {
      const body: AnnotationsResponse = await response.json();
      if (!response.ok || body.schema !== 'collect-feedback/v1' || body.kind !== 'annotations' || body.success !== true) throw new Error('Could not load saved annotations.');
      setAnnotations(body.annotations.filter(note => note.sessionId === sessionId && note.assetId === asset.id && note.sourceSha256 === asset.sha256));
    }).catch((cause: unknown) => { if (!abort.signal.aborted) setLoadError(cause instanceof Error ? cause.message : String(cause)); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [sessionId, asset.id, asset.sha256, loadAttempt]);

  useEffect(() => {
    if (!draft) return;
    function warn(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ''; }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [!!draft]);

  // Use viewport coordinates for the portal so inspector scrolling cannot clip it.
  useLayoutEffect(() => {
    if (!selected) return;
    function place() {
      const pin = (draft ? draftPin : selectedPin).current;
      if (!pin || !editor.current) return;
      const target = pin.getBoundingClientRect();
      let bounds = editor.current.getBoundingClientRect();
      const visual = window.visualViewport;
      const left = (visual?.offsetLeft ?? 0) + 8;
      const top = (visual?.offsetTop ?? 0) + 8;
      const right = left + (visual?.width ?? window.innerWidth) - 16;
      const bottom = top + (visual?.height ?? window.innerHeight) - 16;
      const above = Math.max(0, target.top - top - 12);
      const below = Math.max(0, bottom - target.bottom - 12);
      const fitsBeside = target.right + 12 + bounds.width <= right || target.left - 12 - bounds.width >= left;
      editor.current.style.maxHeight = `${Math.max(48, fitsBeside ? bottom - top : Math.max(above, below))}px`;
      bounds = editor.current.getBoundingClientRect();
      const candidates = [
        { left: target.right + 12, top: target.top },
        { left: target.left - bounds.width - 12, top: target.top },
        { left: target.left, top: target.bottom + 12 },
        { left: target.left, top: target.top - bounds.height - 12 },
      ].map(point => ({ left: Math.max(left, Math.min(right - bounds.width, point.left)), top: Math.max(top, Math.min(bottom - bounds.height, point.top)) }));
      const chosen = candidates.find(point => point.left >= target.right + 4 || point.left + bounds.width <= target.left - 4 || point.top >= target.bottom + 4 || point.top + bounds.height <= target.top - 4) ?? candidates[0];
      setPosition(current => current.left === chosen.left && current.top === chosen.top ? current : chosen);
    }
    place();
    const observer = new ResizeObserver(place);
    if (stage.current) observer.observe(stage.current);
    if (editor.current) observer.observe(editor.current);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [selected, draft]);

  useLayoutEffect(() => {
    const pin = (draft ? draftPin : selectedPin).current;
    const reveal = () => {
      // Reveal the inspector first so narrow-screen column snapping cannot hide the pin.
      pin?.closest('.column')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      pin?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    };
    reveal();
    // Panning any clipping ancestor must not detach the visible editor from its pin.
    window.addEventListener('scroll', reveal, true);
    window.addEventListener('resize', reveal);
    window.visualViewport?.addEventListener('resize', reveal);
    window.visualViewport?.addEventListener('scroll', reveal);
    return () => {
      window.removeEventListener('scroll', reveal, true);
      window.removeEventListener('resize', reveal);
      window.visualViewport?.removeEventListener('resize', reveal);
      window.visualViewport?.removeEventListener('scroll', reveal);
    };
  }, [selected?.id, selected?.geometry, zoom]);

  function begin(geometry: Geometry, focus = false) {
    if (!canCreate) return;
    submitted.current = undefined;
    setSaveError('');
    setSavedId(undefined);
    setSelectedId(undefined);
    setDraft({ schema: 'collect-feedback/v1', kind: 'annotation', id: crypto.randomUUID(), sessionId, caseId: asset.caseId, assetId: asset.id, sourceSha256: asset.sha256, originalWidth: asset.width!, originalHeight: asset.height!, geometry, priority: 'P2', comment: '' });
    if (focus) requestAnimationFrame(() => draftPin.current?.focus());
  }
  function cancel() {
    if (inFlight.current) return;
    drawing.current = undefined;
    setDraft(undefined);
    setSelectedId(undefined);
    setSaveError('');
    submitted.current = undefined;
    viewport.current?.focus();
  }
  function point(event: PointerEvent<HTMLDivElement>) {
    const rect = stage.current!.getBoundingClientRect();
    return { x: clamp((event.clientX - rect.left) / rect.width), y: clamp((event.clientY - rect.top) / rect.height) };
  }
  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !canCreate || (event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    const origin = point(event);
    drawing.current = { ...origin, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    begin({ ...origin, width: 0, height: 0 });
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const origin = drawing.current;
    if (!origin || origin.pointerId !== event.pointerId) return;
    const end = point(event);
    const rect = stage.current!.getBoundingClientRect();
    const isPoint = Math.hypot((end.x - origin.x) * rect.width, (end.y - origin.y) * rect.height) < 4;
    const geometry = isPoint ? { x: origin.x, y: origin.y, width: 0, height: 0 } : { x: Math.min(origin.x, end.x), y: Math.min(origin.y, end.y), width: Math.abs(end.x - origin.x), height: Math.abs(end.y - origin.y) };
    setDraft(current => current && { ...current, geometry: boundedGeometry(geometry, current.originalWidth, current.originalHeight) });
  }
  async function save() {
    if (!draft || inFlight.current || !draft.comment.trim()) return;
    // Freeze the first attempted payload: the server may have committed even if its response was lost.
    const payload = submitted.current ?? { ...draft, geometry: boundedGeometry(draft.geometry, draft.originalWidth, draft.originalHeight), comment: draft.comment.trim() };
    submitted.current = payload;
    inFlight.current = true;
    setSaving(true);
    setSaveError('');
    try {
      const response = await fetch('/api/v1/annotations', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Write-Token': writeToken }, body: JSON.stringify(payload) });
      const body: (AnnotationResponse & { message?: unknown }) | null = await response.json().catch(() => null);
      if (!response.ok || !body || body.schema !== 'collect-feedback/v1' || body.kind !== 'annotation' || body.success !== true) {
        throw new Error(typeof body?.message === 'string' && body.message.trim() ? body.message : `Save failed: HTTP ${response.status}`);
      }
      const tag = response.headers.get('ETag');
      if (!tag || body.annotation.id !== payload.id || !Number.isInteger(body.annotation.revision)) throw new Error('Save acknowledgement is incomplete. Retry the same note.');
      setAnnotations(current => [...current.filter(note => note.id !== body.annotation.id), body.annotation]);
      setSelectedId(body.annotation.id);
      setSavedId(body.annotation.id);
      setEtag(tag);
      setDraft(undefined);
      submitted.current = undefined;
    } catch (cause: unknown) {
      setSaveError(`${cause instanceof Error ? cause.message : String(cause)} Draft kept in memory. Retry sends the same note and ID.`);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }
  function keys(event: KeyboardEvent<HTMLElement>) {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); cancel(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); void save(); return; }
    if (!draft || submitted.current || (event.target as HTMLElement).closest('textarea, input, select, [contenteditable="true"]')) return;
    const horizontal = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
    const vertical = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (!horizontal && !vertical) return;
    event.preventDefault();
    const dx = horizontal / draft.originalWidth;
    const dy = vertical / draft.originalHeight;
    setDraft(current => {
      if (!current) return current;
      const g = current.geometry;
      const geometry = event.shiftKey ? { ...g, width: clamp(g.width + dx, 1 - g.x), height: clamp(g.height + dy, 1 - g.y) } : { ...g, x: clamp(g.x + dx, 1 - g.width), y: clamp(g.y + dy, 1 - g.height) };
      return { ...current, geometry: boundedGeometry(geometry, current.originalWidth, current.originalHeight) };
    });
  }
  const locked = saving || !!submitted.current;
  return <div className="annotation-workspace" onKeyDown={keys}>
    <div className="annotation-toolbar" aria-label="Annotation tools">
      <Button variant="outline" disabled={!canCreate} onClick={() => begin({ x: .5, y: .5, width: 0, height: 0 }, true)}>Point</Button>
      <Button variant="outline" disabled={!canCreate} onClick={() => begin({ x: .4, y: .4, width: .2, height: .2 }, true)}>Box</Button>
      <label className="zoom-control">Zoom <select aria-label="Image zoom" value={zoom} onChange={event => setZoom(Number(event.target.value))}>{[1, 1.5, 2, 3, 4].map(value => <option key={value} value={value}>{value * 100}%</option>)}</select></label>
    </div>
    <p className="muted annotation-help" id={`pin-help-${asset.id}`}>Click for a point; drag in either direction for a box. Point and Box also create with the keyboard. Arrows move; Shift + arrows resize. Escape cancels; Ctrl/⌘ + Enter saves. Scroll to pan.</p>
    {loading && <p role="status">Loading annotations…</p>}
    {loadError && <div role="alert"><p className="error">{loadError}</p><Button variant="outline" onClick={() => setLoadAttempt(value => value + 1)}>Retry loading annotations</Button></div>}
    {(!asset.width || !asset.height) && <p className="muted">Annotation requires registered original image dimensions.</p>}
    <div className="image-viewport" ref={viewport} tabIndex={0} aria-label="Screenshot annotation canvas" aria-describedby={`pin-help-${asset.id}`}>
      <div className="image-stage" ref={stage} style={{ width: `${zoom * 100}%` }} onPointerDown={start} onPointerMove={move} onPointerUp={event => { if (drawing.current?.pointerId === event.pointerId) { move(event); drawing.current = undefined; draftPin.current?.focus(); } }} onPointerCancel={() => { drawing.current = undefined; setDraft(undefined); }}>
        <img src={`/api/v1/assets/${encodeURIComponent(asset.id)}`} alt={`Original evidence ${asset.id}`} draggable={false} onLoad={() => setReady(true)} onError={() => { setReady(false); onError(); }} />
        {annotations.map((note, index) => <div key={note.id} className={`annotation-region priority-${note.priority}`} style={{ left: `${note.geometry.x * 100}%`, top: `${note.geometry.y * 100}%`, width: `${note.geometry.width * 100}%`, height: `${note.geometry.height * 100}%` }}>
          <Button ref={note.id === selectedId ? selectedPin : undefined} variant="outline" className="annotation-pin" aria-label={`Annotation ${index + 1}, ${note.priority} ${priorities.find(([p]) => p === note.priority)?.[1]}: ${note.comment}`} aria-pressed={note.id === selectedId} disabled={!!draft} onClick={() => { setSelectedId(note.id); setSavedId(undefined); setEtag(''); }}>{index + 1}</Button>
        </div>)}
        {draft && <div className={`annotation-region draft-region priority-${draft.priority}`} style={{ left: `${draft.geometry.x * 100}%`, top: `${draft.geometry.y * 100}%`, width: `${draft.geometry.width * 100}%`, height: `${draft.geometry.height * 100}%` }}><Button ref={draftPin} variant="outline" className="annotation-pin" aria-label="Draft pin. Arrow keys move; Shift plus arrows resize." aria-pressed="true">+</Button></div>}
      </div>
    </div>
    {selected && createPortal(<div ref={editor} role="dialog" aria-modal="false" aria-label={draft ? 'New annotation' : 'Saved annotation'} className="annotation-editor" style={position} onKeyDown={keys}>
      <div className="annotation-editor-heading"><h3>{draft ? 'New annotation' : 'Saved annotation'}</h3><Button variant="ghost" disabled={saving} onClick={cancel} aria-label={draft ? 'Cancel annotation' : 'Close annotation'}>×</Button></div>
      {draft ? <form onSubmit={event => { event.preventDefault(); void save(); }}>
        <div className="priority-controls" role="group" aria-label="Priority">{priorities.map(([priority, label]) => <Button key={priority} type="button" variant="ghost" disabled={locked} aria-pressed={draft.priority === priority} className={`priority-${priority}`} onClick={() => setDraft(current => current && { ...current, priority })}><Badge variant="outline">{priority} {label}</Badge></Button>)}</div>
        <label className="comment-label" htmlFor={`comment-${draft.id}`}>Comment (required)</label>
        <textarea id={`comment-${draft.id}`} required value={draft.comment} readOnly={locked} onChange={event => setDraft(current => current && { ...current, comment: event.target.value })} rows={3} />
        <p className="muted">Draft is memory-only until saved.</p>
        {saveError && <p className="error" role="alert">{saveError}</p>}
        <div className="annotation-actions"><Button type="button" variant="outline" disabled={saving} onClick={cancel}>Cancel</Button><Button type="submit" disabled={saving || !draft.comment.trim()}>{saving ? 'Saving…' : saveError ? 'Retry save' : 'Save note'}</Button></div>
      </form> : <><Badge variant="outline" className={`priority-${selected.priority}`}>{selected.priority} {priorities.find(([priority]) => priority === selected.priority)?.[1]}</Badge><p className="saved-comment">{selected.comment}</p><p className="muted">Revision {selectedRevision} · read only</p>{savedId === selected.id && <p className="save-ack" role="status">Saved · revision {selectedRevision}<span className="etag">ETag {etag}</span></p>}</>}
    </div>, document.body)}
  </div>;
}
