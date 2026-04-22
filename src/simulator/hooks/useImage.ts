"use client"
import { useState, useEffect } from "react";

const cache: Record<string, HTMLImageElement> = {};

export function useImage(src: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(() => cache[src] ?? null);

  useEffect(() => {
    if (!src) return;
    if (cache[src]) {
      setImg(cache[src]);
      return;
    }
    const el = new window.Image();
    // crossOrigin is only needed for external URLs (not data: URLs)
    // Setting it on data: URLs causes issues in some browsers
    if (!src.startsWith("data:")) {
      el.crossOrigin = "anonymous";
    }
    el.src = src;
    el.onload = () => {
      cache[src] = el;
      setImg(el);
    };
  }, [src]);

  return img;
}
