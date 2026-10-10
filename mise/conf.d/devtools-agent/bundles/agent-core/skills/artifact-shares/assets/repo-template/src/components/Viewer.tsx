"use client";

/*!
 * Media viewer. A React port of the zeno lightbox v2.
 *
 * Kept from v2:
 *   - a slide holds an <img> or a <video>
 *   - a video opens paused on its first frame, with controls, and never
 *     autoplays. Changing slide or closing pauses it, so sound stops
 *   - the left and right arrow keys seek the video while it has focus, rather
 *     than changing slide
 *   - click the image to toggle 1:1 zoom. A video is never zoomed, because its
 *     own controls need the click
 *   - Esc closes. Click outside the media closes
 *
 * Changed from v2: this is a component, not a script that scans the DOM. The
 * caller owns the slide list, so prev and next cross group boundaries the way
 * the eye does.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { isVideo, type Slide } from "./media";

export type ViewerProps = {
  slides: Slide[];
  index: number | null;
  onIndex: (index: number) => void;
  onClose: () => void;
  /** Wrap at the ends. */
  loop?: boolean;
  /** Corner hint text. Empty or absent hides the hint. */
  hint?: string;
  label?: string;
};

export function Viewer({
  slides,
  index,
  onIndex,
  onClose,
  loop = true,
  hint,
  label = "Media viewer",
}: ViewerProps) {
  const [zoomed, setZoomed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const open = index !== null && index >= 0 && index < slides.length;
  const slide = open ? slides[index] : undefined;

  const step = useCallback(
    (delta: number) => {
      if (index === null || slides.length === 0) return;
      const next = index + delta;
      if (next < 0) onIndex(loop ? slides.length - 1 : 0);
      else if (next >= slides.length) onIndex(loop ? 0 : slides.length - 1);
      else onIndex(next);
    },
    [index, loop, onIndex, slides.length],
  );

  // A new slide starts unzoomed, and the video of the slide left behind stops.
  useEffect(() => {
    setZoomed(false);
    const video = videoRef.current;
    if (!video) return;
    return () => {
      video.pause();
    };
  }, [index]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      // While the video has focus the arrow keys seek it.
      if (document.activeElement?.tagName === "VIDEO") return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    }

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open, step]);

  if (!open || !slide) return null;

  const video = isVideo(slide.src);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex flex-col bg-overlay text-overlay-ink"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-overlay-border px-4 py-3">
        <p className="min-w-0 truncate font-mono text-xs text-overlay-ink-muted">
          {slide.caption ?? slide.src}
        </p>
        <p className="shrink-0 font-mono text-xs text-overlay-ink-muted">
          {index + 1} / {slides.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="shrink-0 rounded-badge bg-overlay-surface px-3 py-1 text-xs font-semibold text-overlay-ink hover:bg-overlay-surface-hover focus-visible:outline-2 focus-visible:outline-overlay-accent"
        >
          Close
        </button>
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {video ? (
          <video
            ref={videoRef}
            key={slide.src}
            src={slide.src}
            controls
            playsInline
            className="max-h-full max-w-full rounded-md shadow-overlay"
          />
        ) : (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.caption ?? ""}
            onClick={() => setZoomed((value) => !value)}
            className={
              zoomed
                ? "max-w-none cursor-zoom-out rounded-md shadow-overlay"
                : "max-h-full max-w-full cursor-zoom-in rounded-md object-contain shadow-overlay"
            }
          />
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-overlay-border px-4 py-3">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous"
          disabled={slides.length < 2}
          className="rounded-badge bg-overlay-surface px-3 py-1 text-xs font-semibold text-overlay-ink hover:bg-overlay-surface-hover disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-overlay-accent"
        >
          Prev
        </button>
        {hint ? <p className="truncate text-xs text-overlay-ink-muted">{hint}</p> : <span />}
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next"
          disabled={slides.length < 2}
          className="rounded-badge bg-overlay-surface px-3 py-1 text-xs font-semibold text-overlay-ink hover:bg-overlay-surface-hover disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-overlay-accent"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/** Thumbnail for one slide. A video thumbnail carries no controls: controls
 *  would take the click that opens the viewer. */
export function Thumb({ slide, onOpen }: { slide: Slide; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid min-w-0 gap-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {isVideo(slide.src) ? (
        <video
          src={slide.src}
          preload="metadata"
          playsInline
          muted
          className="h-[120px] w-full rounded-md border border-border bg-overlay object-cover object-left-top hover:border-accent"
        />
      ) : (
        <img
          src={slide.src}
          alt={slide.caption ?? ""}
          loading="lazy"
          className="h-[120px] w-full rounded-md border border-border bg-bg object-cover object-left-top hover:border-accent"
        />
      )}
      <p className="m-0 font-mono text-xs break-words text-ink-muted">{slide.caption}</p>
    </button>
  );
}
