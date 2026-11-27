import { useEffect, useState } from "react";

// Resize to the document's content so a full-page composition does not add a second scrollbar.
export function useComponentExample(document: Document | null): number {
  const [height, setHeight] = useState(240);
  useEffect(() => {
    if (!document) return;
    const resize = () => setHeight(Math.max(160, Math.ceil(document.body.getBoundingClientRect().height)));
    const observer = new ResizeObserver(resize);
    observer.observe(document.body);
    resize();
    return () => observer.disconnect();
  }, [document]);
  return height;
}
