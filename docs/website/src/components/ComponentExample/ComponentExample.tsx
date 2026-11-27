import { type KeyboardEvent, type ReactNode, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import appCss from "../../styles/app.css?url";
import { cx } from "../../lib/cx";
import { useComponentExample } from "./useComponentExample";

/** Keeps the live demo mounted when the reader switches to its usage code. */
export function ComponentExample(props: {
  id: string;
  title: string;
  code: string;
  isolated?: boolean;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [copyStatus, setCopyStatus] = useState("");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [frameDocument, setFrameDocument] = useState<Document | null>(null);
  // Prerendered frames can finish loading before hydration attaches onLoad.
  const connectFrame = useCallback((frame: HTMLIFrameElement | null) => {
    if (frame?.contentDocument?.getElementById("example-root")) setFrameDocument(frame.contentDocument);
  }, []);
  const frameHeight = useComponentExample(frameDocument);

  function moveTab(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home" ? "preview" : event.key === "End" ? "code" : tab === "preview" ? "code" : "preview";
    setTab(next);
    buttons.current[next === "preview" ? 0 : 1]?.focus();
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(props.code);
      setCopyStatus("Code copied.");
    } catch {
      setCopyStatus("Clipboard unavailable. Select the code and copy it manually.");
    }
  }

  return (
    <div className="min-w-0 border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card pr-3">
        <div role="tablist" aria-label={`${props.title} example`} className="flex">
          {(["preview", "code"] as const).map((value, index) => (
            <button
              key={value}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${props.id}-tab-${value}`}
              aria-controls={`${props.id}-panel-${value}`}
              aria-selected={tab === value}
              tabIndex={tab === value ? 0 : -1}
              onClick={() => setTab(value)}
              onKeyDown={moveTab}
              className={cx(
                "min-h-11 cursor-pointer border-r border-border px-4 text-[11px] hover:bg-background focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary",
                tab === value && "bg-background text-primary shadow-[inset_0_-2px_var(--color-primary)]",
              )}
            >
              {value === "preview" ? "Preview" : "Code"}
            </button>
          ))}
        </div>
        {tab === "code" ? (
          <button
            type="button"
            onClick={copyCode}
            className="min-h-11 cursor-pointer px-2 text-[11px] text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Copy code
          </button>
        ) : (
          <span className="text-[10px] text-muted">Live React{props.isolated ? " · isolated document" : ""}</span>
        )}
      </div>
      <div
        id={`${props.id}-panel-preview`}
        role="tabpanel"
        aria-labelledby={`${props.id}-tab-preview`}
        hidden={tab !== "preview"}
      >
        {props.isolated ? (
          <>
            <p className="border-b border-border px-4 py-2 text-[10px] text-muted">
              Isolated document. Links and keyboard focus work inside this frame.
            </p>
            <iframe
              ref={connectFrame}
              title={`${props.title} live demo`}
              sandbox="allow-same-origin allow-popups allow-top-navigation-by-user-activation"
              className="block w-full border-0"
              style={{ height: frameHeight }}
              srcDoc={`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${appCss}"></head><body id="top"><div id="example-root" class="p-4"></div></body></html>`}
              onLoad={(event) => setFrameDocument(event.currentTarget.contentDocument)}
            />
            {frameDocument?.getElementById("example-root") &&
              createPortal(
                // react-doctor-disable-next-line react-doctor/click-events-have-key-events -- Delegates native anchor clicks, including Enter activation; this wrapper has no action.
                <div
                  onClickCapture={(event) => {
                    const link = (event.target as Element).closest("a");
                    const href = link?.getAttribute("href");
                    if (href?.startsWith("#")) {
                      // srcdoc resolves native fragments against the parent URL, not the demo document.
                      const target = frameDocument.getElementById(href.slice(1));
                      if (target) {
                        event.preventDefault();
                        target.focus({ preventScroll: true });
                        target.scrollIntoView();
                      }
                    } else if (link) link.setAttribute("target", "_top");
                  }}
                >
                  {props.children}
                </div>,
                frameDocument.getElementById("example-root")!,
              )}
          </>
        ) : (
          <div className="min-w-0 p-5 narrow:p-4">{props.children}</div>
        )}
      </div>
      <div
        id={`${props.id}-panel-code`}
        role="tabpanel"
        aria-labelledby={`${props.id}-tab-code`}
        hidden={tab !== "code"}
      >
        <pre
          role="region"
          aria-label={`${props.title} usage code`}
          tabIndex={0}
          className="m-0 border-0 text-[11px] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary"
        >
          <code>{props.code}</code>
        </pre>
        <p role="status" className="border-t border-border px-4 py-3 text-[11px] text-muted">
          {copyStatus || "Usage example. Import components from src/components and diagrams from src/diagrams."}
        </p>
      </div>
    </div>
  );
}
