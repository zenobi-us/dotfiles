import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { AnnotationImage } from './components/annotation-image';
import type { Asset, Case, CasesResponse, Session, SessionResponse } from './types';

function text(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'Unknown';
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}
function Fields({ entries }: { entries: [string, unknown][] }) {
  return <dl>{entries.map(([label, value]) => <div className="field" key={label}><dt>{label}</dt><dd>{text(value)}</dd></div>)}</dl>;
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="section"><h3>{title}</h3>{children}</section>;
}
async function request<T>(path: string, kind: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal, credentials: 'same-origin' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const body = await response.json();
  if (body.schema !== 'collect-feedback/v1' || body.kind !== kind || body.success !== true) {
    throw new Error(text(body.error ?? `Unsupported ${kind} response`));
  }
  return body as T;
}
function listKeys(event: KeyboardEvent<HTMLElement>) {
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  let next: number;
  switch (event.key) {
    case 'ArrowDown': next = Math.min(index + 1, buttons.length - 1); break;
    case 'ArrowUp': next = Math.max(index - 1, 0); break;
    case 'Home': next = 0; break;
    case 'End': next = buttons.length - 1; break;
    default: return;
  }
  event.preventDefault();
  buttons[next]?.click();
  buttons[next]?.focus();
}
function AssetInspector({ asset, sessionId, writeToken }: { asset: Asset; sessionId: string; writeToken: string }) {
  const [failed, setFailed] = useState(false);
  const url = `/api/v1/assets/${encodeURIComponent(asset.id)}`;
  return <>
    <Section title="Original media">
      {failed && <p role="alert" className="error">Media could not be loaded. The asset may be missing, changed, or unavailable. Reload the session after checking the server.</p>}
      {asset.mediaType.startsWith('image/') ? <AnnotationImage asset={asset} sessionId={sessionId} writeToken={writeToken} onError={() => setFailed(true)} />
        : asset.mediaType.startsWith('video/') ? <video className="original" src={url} controls preload="metadata" onError={() => setFailed(true)} aria-label={`Original recording ${asset.id}`} />
          : <p className="muted">Preview unavailable for {asset.mediaType}. This viewer displays images and video.</p>}
      <p className="muted">Original evidence · no image transformations</p>
      <a href={url} target="_blank" rel="noreferrer">Open original asset ↗</a>
    </Section>
    <Separator />
    <Section title="Asset identity"><Fields entries={[
      ['Asset ID', asset.id], ['Case ID', asset.caseId], ['Step ID', asset.stepId], ['SHA-256', asset.sha256], ['Path', asset.path], ['Media type', asset.mediaType],
      ['Dimensions', asset.width != null && asset.height != null ? `${asset.width} × ${asset.height}` : undefined], ['Captured at', asset.capturedAt],
      ['Driver', asset.driver], ['Driver version', asset.driverVersion], ['Capture method', asset.captureMethod], ['Surface', asset.surface], ['Capture sequence', asset.captureSequence], ['Source URL', asset.url], ['Viewport', asset.viewport],
    ]} /></Section>
  </>;
}
function App() {
  const [data, setData] = useState<{ session: Session; cases: Case[]; writeToken: string }>();
  const [error, setError] = useState<string>();
  const [reload, setReload] = useState(0);
  const [caseId, setCaseId] = useState<string>();
  const [assetId, setAssetId] = useState<string>();
  const sessionColumn = useRef<HTMLElement>(null);
  const caseColumn = useRef<HTMLElement>(null);
  const assetColumn = useRef<HTMLElement>(null);
  const originatingAsset = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    setError(undefined);
    setData(undefined);
    Promise.all([
      request<SessionResponse>('/api/v1/session', 'session', abort.signal),
      request<CasesResponse>('/api/v1/cases', 'cases', abort.signal),
    ]).then(([session, cases]) => {
      setData({ session: session.session, cases: cases.cases, writeToken: session.writeToken });
      setCaseId(cases.cases[0]?.id);
      setAssetId(undefined);
    }).catch((cause: unknown) => {
      if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : String(cause));
    });
    return () => abort.abort();
  }, [reload]);
  const selectedCase = data?.cases.find(item => item.id === caseId);
  const asset = selectedCase?.assets.find(item => item.id === assetId);
  function reveal(column: HTMLElement | null, focus = false) {
    column?.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'instant' });
    if (focus) column?.focus({ preventScroll: true });
  }
  function selectCase(item: Case) {
    setCaseId(item.id);
    setAssetId(undefined);
  }
  function backToCases() {
    reveal(caseColumn.current);
    if (originatingAsset.current?.isConnected) originatingAsset.current.focus({ preventScroll: true });
    else caseColumn.current?.focus({ preventScroll: true });
  }
  return <div className="app">
    <header className="app-header"><h1>Collect feedback <span className="muted">/ evidence viewer</span></h1><a href="/api/v1/export" target="_blank" rel="noreferrer">Export saved annotations ↗</a></header>
    {!data ? <main className="load-state" aria-live="polite">{error ? <><h2>Session unavailable</h2><p role="alert" className="error">{error}</p><Button variant="outline" onClick={() => setReload(value => value + 1)}>Reload session</Button></> : <p role="status">Loading session and cases…</p>}</main> : <main className="finder" aria-label="Evidence browser">
      <section className="column session-column" ref={sessionColumn} tabIndex={-1} aria-labelledby="session-title">
        <div className="column-heading"><h2 id="session-title">01 / Session</h2><Badge variant="outline">{data.cases.length} cases</Badge></div>
        <div className="column-body">
          <Section title="Session identity"><Fields entries={[
            ['Session ID', data.session.id], ['Created at', data.session.createdAt], ['Source run', data.session.source.runId], ['Started at', data.session.source.startedAt], ['Finished at', data.session.source.finishedAt], ['Surface', data.session.source.surface], ['Driver', data.session.source.driver],
          ]} /></Section>
          <Separator />
          <Section title="Browse evidence"><p className="muted">Select a case, then an asset. Arrow keys move through each list. Enter or Space selects.</p><Button variant="outline" onClick={() => reveal(caseColumn.current, true)}>Browse cases →</Button></Section>
          <Separator />
          <Section title="Immutable source"><p>Original captures stay unchanged. Select an image to draw a feedback pin and save a note.</p></Section>
        </div>
      </section>
      <section className="column case-column" ref={caseColumn} tabIndex={-1} aria-labelledby="case-title" onKeyDown={event => { if (event.key === 'ArrowLeft') { event.preventDefault(); reveal(sessionColumn.current, true); } }}>
        <div className="column-heading"><h2 id="case-title">02 / Cases</h2><Button variant="ghost" className="back" onClick={() => reveal(sessionColumn.current, true)}>← Session</Button></div>
        <div className="column-body">
          {data.cases.length === 0 ? <p className="empty">This session contains no cases.</p> : <>
            <nav className="selection-list" aria-label="Cases" onKeyDown={listKeys}>{data.cases.map(item => <Button key={item.id} variant="ghost" className="selection-row" aria-pressed={item.id === caseId} onClick={() => selectCase(item)}><span>{item.id}<small>{item.purpose}</small></span><span aria-hidden="true">›</span></Button>)}</nav>
            {selectedCase && <>
              <Separator />
              <Section title="Case details"><Fields entries={[
                ['Case ID', selectedCase.id], ['Source run', selectedCase.source.runId], ['Source case', selectedCase.source.caseId], ['Purpose', selectedCase.purpose], ['Preconditions', selectedCase.preconditions], ['Expected', selectedCase.expected], ['Limits', selectedCase.limits], ['Side effects', selectedCase.sideEffects],
              ]} /></Section>
              <Separator />
              <Section title="Steps and results">{selectedCase.steps.length === 0 ? <p className="muted">No steps recorded.</p> : selectedCase.steps.map(step => <article className="step" key={step.id}><h4>{step.order} / {step.purpose}</h4><Badge variant="outline" className="result">{text(step.assertionResult)}</Badge><Fields entries={[
                ['Step ID', step.id], ['Actions', step.actions], ['Expected', step.expected], ['Observed', step.observed],
              ]} /></article>)}</Section>
              <Separator />
              <Section title="Assets">{selectedCase.assets.length === 0 ? <p className="muted">No assets recorded for this case.</p> : <nav className="selection-list" aria-label="Assets" onKeyDown={listKeys}>{selectedCase.assets.map(item => <Button key={item.id} variant="ghost" className="selection-row" aria-pressed={item.id === assetId} onClick={event => { originatingAsset.current = event.currentTarget; setAssetId(item.id); reveal(assetColumn.current, true); }}><span>{item.id}<small>{item.mediaType} · {item.capturedAt ?? 'Capture time unknown'}</small></span><span aria-hidden="true">›</span></Button>)}</nav>}</Section>
            </>}
          </>}
        </div>
      </section>
      <section className="column asset-column" ref={assetColumn} tabIndex={-1} aria-labelledby="asset-title" onKeyDown={event => { if (!event.defaultPrevented && event.key === 'ArrowLeft' && !(event.target as HTMLElement).closest('textarea, input, select, [contenteditable="true"], .annotation-workspace, .annotation-editor')) { event.preventDefault(); backToCases(); } }}>
        <div className="column-heading"><h2 id="asset-title">03 / Asset inspector</h2><Button variant="ghost" className="back" onClick={backToCases}>← Cases</Button></div>
        <div className="column-body">{asset ? <AssetInspector key={`${caseId}/${asset.id}`} asset={asset} sessionId={data.session.id} writeToken={data.writeToken} /> : <p className="empty">Select an asset from the case to inspect its original media and capture metadata.</p>}</div>
      </section>
    </main>}
  </div>;
}
createRoot(document.getElementById('root')!).render(<App />);
