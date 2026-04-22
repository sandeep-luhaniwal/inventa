"use client";

import { useEffect, useState } from "react";

export function useSvgImage(svgMarkup: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    let revoked = false;
    let active = true;

    const revoke = () => {
      if (!revoked) {
        URL.revokeObjectURL(url);
        revoked = true;
      }
    };

    const handleLoad = () => {
      if (active) setImage(img);
      revoke();
    };

    const handleError = () => {
      if (active) setImage(null);
      revoke();
    };

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);
    img.src = url;

    return () => {
      active = false;
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
      revoke();
    };
  }, [svgMarkup]);

  return image;
}
