"use client";

/*!
 * A grid of thumbnails with one viewer behind it.
 *
 * Generated share MDX calls this for a screenshot run. `FileTree` does not:
 * it owns one viewer across every group, so its prev and next cross group
 * boundaries.
 */

import { useState } from "react";
import { Thumb, Viewer } from "./Viewer";
import { baseName, type Slide } from "./media";
import { asset } from "./base";

export type GalleryProps = {
  slides?: Slide[];
  /** Shorthand: a list of URLs, captioned with the file name. */
  paths?: string[];
  hint?: string;
};

export function toSlides({ slides, paths }: GalleryProps): Slide[] {
  if (slides) return slides.map((slide) => ({ ...slide, src: asset(slide.src) }));
  return (paths ?? []).map((src) => ({ src: asset(src), caption: baseName(src) }));
}

export function Gallery(props: GalleryProps) {
  const slides = toSlides(props);
  const [index, setIndex] = useState<number | null>(null);

  if (slides.length === 0) return null;

  return (
    <div className="not-prose my-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
        {slides.map((slide, position) => (
          <Thumb key={slide.src} slide={slide} onOpen={() => setIndex(position)} />
        ))}
      </div>
      <Viewer
        slides={slides}
        index={index}
        onIndex={setIndex}
        onClose={() => setIndex(null)}
        hint={props.hint ?? "Click image to zoom · Esc to close"}
      />
    </div>
  );
}

/** One media file, with its caption. The single-slide case of Gallery. */
export function Figure({
  src,
  caption,
  alt,
}: {
  src: string;
  caption?: string;
  alt?: string;
}) {
  return <Gallery slides={[{ src, caption: caption ?? alt ?? baseName(src) }]} />;
}
