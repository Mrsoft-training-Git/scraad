import { useEffect, useRef } from "react";

/**
 * Tracks the pointer over the returned ref and writes
 * --mx / --my CSS variables so `.cursor-glow` follows the cursor.
 * Disabled on touch / reduced-motion.
 */
export function useCursorGlow<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || isTouch) return;

    const handle = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      node.style.setProperty("--mx", `${x}%`);
      node.style.setProperty("--my", `${y}%`);
    };

    node.addEventListener("pointermove", handle);
    return () => node.removeEventListener("pointermove", handle);
  }, []);

  return ref;
}
