"use client"
import { useState, useEffect } from "react";

const cache: Record<string, HTMLImageElement> = {};

export function useImage(src: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [prevSrc, setPrevSrc] = useState<string | null>(null);

  if (src !== prevSrc) {
    setPrevSrc(src);
    if (cache[src]) {
      setImg(cache[src]);
    } else {
      setImg(null);
    }
  }

  useEffect(() => {
    if (!src || cache[src]) return;

    const el = new window.Image();
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
