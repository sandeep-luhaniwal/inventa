"use client";

import React from "react";
import type { InorganicLibraryItem } from "@/chemistry/types";

interface InorganicThumbnailProps {
  item: InorganicLibraryItem;
}

function GlassDefs() {
  return (
    <defs>
      <linearGradient id="glassStroke" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id="glassFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.06" />
      </linearGradient>
      <linearGradient id="glassHighlight" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function GlassBottle() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
      <GlassDefs />
      <path
        d="M44 18h32v10c0 5 3 10 8 14v46c0 9-7 16-16 16H52c-9 0-16-7-16-16V42c5-4 8-9 8-14V18Z"
        fill="url(#glassFill)"
        stroke="url(#glassStroke)"
        strokeWidth="3"
        filter="url(#softGlow)"
      />
      <rect x="48" y="14" width="24" height="10" rx="3" fill="#dbeafe" fillOpacity="0.18" stroke="#dbeafe" strokeOpacity="0.6" />
      <path d="M55 25v67" stroke="url(#glassHighlight)" strokeWidth="4" strokeLinecap="round" />
      <path d="M80 46c-7 1-14 1-21 0" stroke="#e2e8f0" strokeOpacity="0.35" strokeWidth="2" />
    </svg>
  );
}

function SampleJar() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
      <GlassDefs />
      <rect x="34" y="20" width="52" height="10" rx="4" fill="#cbd5e1" fillOpacity="0.24" stroke="#e2e8f0" strokeOpacity="0.55" />
      <path
        d="M38 28h44c3 0 6 3 6 6v48c0 12-8 22-18 22H50c-10 0-18-10-18-22V34c0-3 3-6 6-6Z"
        fill="url(#glassFill)"
        stroke="url(#glassStroke)"
        strokeWidth="3"
        filter="url(#softGlow)"
      />
      <path d="M47 32v66" stroke="url(#glassHighlight)" strokeWidth="4" strokeLinecap="round" />
      <path d="M74 38c-8 1-16 1-24 0" stroke="#e2e8f0" strokeOpacity="0.35" strokeWidth="2" />
    </svg>
  );
}

function TestTube({ tall = false }: { tall?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
      <GlassDefs />
      <path
        d={tall ? "M52 12h16v74a12 12 0 1 1-24 0V12h8Z" : "M50 18h20v62a12 12 0 1 1-28 0V18h8Z"}
        fill="url(#glassFill)"
        stroke="url(#glassStroke)"
        strokeWidth="3"
        filter="url(#softGlow)"
      />
      <path d={tall ? "M49 18v65" : "M47 24v55"} stroke="url(#glassHighlight)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function BeakerThumb() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
      <GlassDefs />
      <path
        d="M36 20h48v8h-5v50c0 14-8 24-19 24H60c-11 0-19-10-19-24V28h-5v-8Z"
        fill="url(#glassFill)"
        stroke="url(#glassStroke)"
        strokeWidth="3"
        filter="url(#softGlow)"
      />
      <path d="M48 28v66" stroke="url(#glassHighlight)" strokeWidth="4" strokeLinecap="round" />
      <path d="M44 74c8-4 24-4 32 0" stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="3" />
    </svg>
  );
}

function FlaskThumb() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
      <GlassDefs />
      <path
        d="M53 16h14v18l20 42c5 11-3 24-16 24H49c-13 0-21-13-16-24l20-42V16Z"
        fill="url(#glassFill)"
        stroke="url(#glassStroke)"
        strokeWidth="3"
        filter="url(#softGlow)"
      />
      <path d="M58 20v62" stroke="url(#glassHighlight)" strokeWidth="4" strokeLinecap="round" />
      <path d="M43 73c9 4 25 4 34 0" stroke="#818cf8" strokeOpacity="0.45" strokeWidth="3" />
    </svg>
  );
}

function FunnelThumb() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
      <GlassDefs />
      <path
        d="M26 24h68L68 60v34a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V60L26 24Z"
        fill="url(#glassFill)"
        stroke="url(#glassStroke)"
        strokeWidth="3"
        filter="url(#softGlow)"
      />
      <path d="M60 30v36" stroke="url(#glassHighlight)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function TubeRackBottle() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden="true">
      <GlassDefs />
      <path
        d="M44 18h32v10c0 4 2 8 6 11v48c0 9-7 16-16 16H54c-9 0-16-7-16-16V39c4-3 6-7 6-11V18Z"
        fill="url(#glassFill)"
        stroke="url(#glassStroke)"
        strokeWidth="3"
        filter="url(#softGlow)"
      />
      <path d="M51 26v68" stroke="url(#glassHighlight)" strokeWidth="4" strokeLinecap="round" />
      <path d="M46 54h28M46 66h28M46 78h28" stroke="#fb7185" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function InorganicThumbnail({ item }: InorganicThumbnailProps) {
  switch (item.id) {
    case "beaker-250":
      return <BeakerThumb />;
    case "erlenmeyer-250":
      return <FlaskThumb />;
    case "funnel":
      return <FunnelThumb />;
    case "test-tube":
      return <TestTube tall />;
    case "test-tube-small":
      return <TestTube />;
    case "glass-bottle":
      return <GlassBottle />;
    case "sample-jar":
      return <SampleJar />;
    default:
      if (item.name.toLowerCase().includes("bottle")) {
        return <TubeRackBottle />;
      }
      return <GlassBottle />;
  }
}
