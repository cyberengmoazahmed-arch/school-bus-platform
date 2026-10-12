"use client";

import dynamic from "next/dynamic";
import type { LeafletMapProps } from "./leaflet-map";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center rounded-card bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export type LiveMapProps = LeafletMapProps & { height?: number | string };
export type { MapMarker } from "./leaflet-map";

export function LiveMap({ height = 360, className, ...props }: LiveMapProps) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-card" style={{ height }}>
      <LeafletMap {...props} className={className} />
    </div>
  );
}

export default LiveMap;
