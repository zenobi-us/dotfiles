import { type RefObject, useEffect, useState } from "react";

/**
 * Reports whether the element is wider than its box, so the page can show a
 * "scroll sideways" hint. The hint starts hidden, which matches the prerendered HTML.
 */
export function useOverflowHint(ref: RefObject<HTMLElement | null>): boolean {
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setOverflowing(element.scrollWidth > element.clientWidth + 1);
    update();
    window.addEventListener("resize", update);
    document.fonts.ready.then(update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);

  return overflowing;
}
