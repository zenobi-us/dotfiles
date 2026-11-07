// Manual stock-PDF review shares the originating image request's delivery gate.
// It does not claim to resolve the current tablet document or a paired server.
import { useRef, useState } from "react";

type Review = {
  requestId: string;
  sourceDigest: string;
  exportDigest: string;
  consent: string;
  width: number;
  height: number;
  outsidePixels: number;
  uncertainPaintBounds: boolean;
  originalPdfPath: string;
};

export function PdfImport({ token, onBack, onCancel }: { token: string; onBack: () => void; onCancel: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState<string | null>(null);
  const epoch = useRef(0);
  const endpoint = (action: string) => `/api/pdf-${action}?token=${encodeURIComponent(token)}`;
  const invalidate = async () => {
    epoch.current++;
    setReview(null);
    const response = await fetch(endpoint("invalidate"), { method: "POST" });
    if (!response.ok) throw new Error(await response.text());
  };
  const send = async (confirm: boolean) => {
    if (busy || (!confirm && !file) || (confirm && !review)) return;
    const captured = epoch.current;
    setBusy(true); setError(null);
    try {
      const response = await fetch(endpoint(confirm ? "confirm" : "submit"), {
        method: "POST", headers: { "content-type": confirm ? "application/json" : "application/pdf" },
        body: confirm ? JSON.stringify(review) : file,
      });
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      if (captured !== epoch.current) return;
      if (response.status === 202) setReview(result);
      else { setReview(null); setCompleted(result.originalPdfPath); }
    } catch (reason) {
      if (captured === epoch.current) setError(reason instanceof Error ? reason.message : String(reason));
    } finally { if (captured === epoch.current) setBusy(false); }
  };
  if (completed) return <main className="notice">
    <h1>Image sent to OMP</h1>
    <p>The source-sized PNG was delivered to this request. You can close this tab.</p>
    <p>Full annotated PDF retained on the server:</p><code>{completed}</code>
  </main>;
  return <main className="notice pdf-import">
    <h1>Review stock-editor PDF</h1>
    <p>This manual browser import returns a PNG to the current image request. It is not tablet current-document integration.</p>
    <p><a href={endpoint("source")} download="source.pdf">Download this request’s source PDF</a>. Annotate it with the stock editor, then select its full PDF export.</p>
    <p>Only the exact source image at its original scale and position is accepted. Other page transforms are rejected.</p>
    <label>Annotated PDF <input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(event) => {
      const next = event.target.files?.[0] ?? null;
      setFile(null); setBusy(true); setError(null);
      void invalidate().then(() => setFile(next)).catch((reason) => setError(String(reason))).finally(() => setBusy(false));
    }} /></label>
    <p><button type="button" disabled={busy || !file} onClick={() => void send(false)}>{busy ? "Processing PDF…" : "Review and send PDF"}</button></p>
    {error && <p role="alert">{error}</p>}
    {review && <section role="region" aria-label="Clipping confirmation">
      <h2>Confirm clipping for this PDF</h2>
      <p>Visible content extends outside the source window{review.uncertainPaintBounds ? ", or paint bounds cannot prove that all marks fit" : ""}. Nothing has been sent.</p>
      <p>Clipping will omit outer marks from the {review.width} × {review.height} PNG. Source scale stays unchanged. The full annotated PDF remains on the server.</p>
      <p>Request: <code>{review.requestId}</code><br />Source SHA-256: <code>{review.sourceDigest}</code><br />Export SHA-256: <code>{review.exportDigest}</code></p>
      <p>Full PDF: <code>{review.originalPdfPath}</code></p>
      <button type="button" disabled={busy} onClick={() => void send(true)}>Clip this PDF and send PNG</button>
    </section>}
    <p><button type="button" onClick={() => { void invalidate().then(onBack).catch((reason) => setError(String(reason))); }} disabled={busy}>Back to browser drawing</button>{" "}
      <button type="button" onClick={onCancel}>Cancel request</button></p>
  </main>;
}
