// Browser drafts are tab-local recovery records, never authoritative saved annotations.
// Synchronous updates survive image unmounts; pending payloads stay frozen across reloads.
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { AnnotationInput, Asset } from './types';

interface DraftRecord {
  schema: 'collect-feedback/v1'; kind: 'draft'; annotation: AnnotationInput;
  startingRevision: number | null; submitted?: AnnotationInput; error?: string;
}
interface Snapshot { records: DraftRecord[]; memoryOnly: boolean; unreadable: boolean; busy: string[] }
const identity = (note: AnnotationInput | Asset) => 'sourceSha256' in note
  ? JSON.stringify([note.caseId, note.assetId, note.sourceSha256, note.originalWidth, note.originalHeight])
  : JSON.stringify([note.caseId, note.id, note.sha256, note.width, note.height]);
function validInput(value: unknown, sessionId: string): value is AnnotationInput {
  if (!value || typeof value !== 'object') return false;
  const note = value as AnnotationInput;
  return note.schema === 'collect-feedback/v1' && note.kind === 'annotation' && note.sessionId === sessionId
    && [note.id, note.caseId, note.assetId, note.sourceSha256].every(item => typeof item === 'string' && item.length > 0)
    && typeof note.comment === 'string' && ['P1', 'P2', 'P3'].includes(note.priority)
    && Number.isInteger(note.originalWidth) && note.originalWidth > 0 && Number.isInteger(note.originalHeight) && note.originalHeight > 0
    && !!note.geometry && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(note.geometry[key as keyof typeof note.geometry]));
}
export class DraftStore {
  private snapshot: Snapshot = { records: [], memoryOnly: false, unreadable: false, busy: [] };
  private listeners = new Set<() => void>();
  private key: string;
  constructor(sessionId: string, sourceRunId: string) {
    this.key = `collect-feedback/v1/drafts/${JSON.stringify([sessionId, sourceRunId])}`;
    let raw: string | null;
    try { raw = sessionStorage.getItem(this.key); }
    catch { this.snapshot = { ...this.snapshot, memoryOnly: true }; return; }
    try {
      if (raw !== null) {
        const records: DraftRecord[] = JSON.parse(raw);
        if (!Array.isArray(records) || !records.every(record => record?.schema === 'collect-feedback/v1' && record.kind === 'draft'
          && validInput(record.annotation, sessionId)
          && (record.startingRevision === null || (Number.isInteger(record.startingRevision) && record.startingRevision > 0))
          && (record.submitted === undefined || (validInput(record.submitted, sessionId) && record.submitted.id === record.annotation.id && identity(record.submitted) === identity(record.annotation))))) throw Error('Unsupported drafts');
        this.snapshot.records = records;
      }
    } catch {
      // Keep unreadable bytes until the user explicitly discards them, not on the next keystroke.
      this.snapshot = { ...this.snapshot, memoryOnly: true, unreadable: true };
    }
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  get(asset: Asset) { return this.snapshot.records.find(record => identity(record.annotation) === identity(asset)); }
  private publish(persist: boolean) {
    if (persist && !this.snapshot.unreadable) {
      try { sessionStorage.setItem(this.key, JSON.stringify(this.snapshot.records)); }
      catch { this.snapshot = { ...this.snapshot, memoryOnly: true }; }
    }
    for (const listener of this.listeners) listener();
  }
  put(record: DraftRecord) {
    const key = identity(record.annotation);
    this.snapshot = { ...this.snapshot, records: [...this.snapshot.records.filter(item => identity(item.annotation) !== key), record] };
    this.publish(true);
  }
  update(asset: Asset, change: (record: DraftRecord) => DraftRecord) {
    const current = this.get(asset);
    if (current) this.put(change(current));
  }
  remove(asset: Asset | AnnotationInput) {
    this.snapshot = { ...this.snapshot, records: this.snapshot.records.filter(record => identity(record.annotation) !== identity(asset)) };
    this.publish(true);
  }
  setBusy(asset: Asset, busy: boolean) {
    const key = identity(asset);
    this.snapshot = { ...this.snapshot, busy: [...this.snapshot.busy.filter(item => item !== key), ...(busy ? [key] : [])] };
    this.publish(false);
  }
  isBusy(asset: Asset) { return this.snapshot.busy.includes(identity(asset)); }
  discardUnreadable() {
    try {
      sessionStorage.removeItem(this.key);
      this.snapshot = { ...this.snapshot, unreadable: false };
      this.publish(true);
    } catch {
      this.snapshot = { ...this.snapshot, memoryOnly: true, unreadable: false };
      this.publish(false);
    }
  }
}
export const DraftContext = createContext<DraftStore | undefined>(undefined);
export function useDrafts() {
  const store = useContext(DraftContext);
  if (!store) throw Error('Draft store is unavailable');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => {
    if (!snapshot.busy.length && !snapshot.unreadable && (!snapshot.memoryOnly || !snapshot.records.length)) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [snapshot.records.length, snapshot.unreadable, snapshot.memoryOnly, snapshot.busy.length]);
  return { store, ...snapshot };
}
