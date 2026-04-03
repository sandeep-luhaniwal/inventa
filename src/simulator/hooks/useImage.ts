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
    el.src = src;
    el.onload = () => {
      cache[src] = el;
      setImg(el);
    };
  }, [src]);

  return img;
}
