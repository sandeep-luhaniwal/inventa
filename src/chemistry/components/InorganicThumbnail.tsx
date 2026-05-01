"use client";

import {
  MeasureBottleAsset,
  RoundBottomFlaskAsset,
  SeparatoryFunnelAsset,
  TestTubeAsset,
} from "./LabAssets";

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
  const wrap = (el: React.ReactNode) => (
    <div className="h-20 w-20 flex items-center justify-center lg:h-24 lg:w-24 overflow-hidden">
      {el}
    </div>
  );

  switch (item.id) {
    case "round-bottom-flask":
      return wrap(<RoundBottomFlaskAsset />);
    case "separatory-funnel":
      return wrap(<SeparatoryFunnelAsset />);
    case "measure-bottle":
      return wrap(<MeasureBottleAsset />);
    case "test-tube":
      return wrap(<TestTubeAsset size="large" />);
    case "test-tube-small":
      return wrap(<TestTubeAsset size="small" />);
    case "test-tube-mini":
      return wrap(<TestTubeAsset size="mini" />);
    case "glass-bottle":
      return <GlassBottle />;
    default:
      if (item.name.toLowerCase().includes("bottle")) {
        return <TubeRackBottle />;
      }
      return <GlassBottle />;
  }
}
