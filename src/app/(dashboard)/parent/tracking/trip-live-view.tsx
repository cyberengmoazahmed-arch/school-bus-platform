"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { LiveMap, type MapMarker } from "@/components/maps/live-map";
import { EmptyState } from "@/components/ui/misc";

type LiveChild = {
  studentId: string;
  studentName: string;
  grade: string;
  schoolName: string;
  tripStatus: string | null;
  direction: string | null;
  busCode: string | null;
  driverName: string | null;
  assignmentStatus: string | null;
  etaMinutes: number | null;
  distanceKm: number | null;
  live: { lat: number; lng: number; speed: number | null; stale: boolean; recordedAt: string } | null;
};

const CAIRO = { lat: 30.0444, lng: 31.2357 };

export function TripLiveView({ studentIds }: { studentIds: string[] }) {
  const [snapshot, setSnapshot] = useState<LiveChild[] | null>(null);
  const [connected, setConnected] = useState(false);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;

    const connect = () => {
      if (cancelled) return;
      es?.close();
      es = new EventSource("/api/parent/live");
      es.onopen = () => setConnected(true);
      es.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        if (data.type === "snapshot") setSnapshot(data.cards);
      };
      es.onerror = () => {
        setConnected(false);
        es?.close();
        retryRef.current = setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      cancelled = true;
      es?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [studentIds]);

  const liveCards = (snapshot ?? []).filter((c) => c.live && c.tripStatus === "IN_PROGRESS");

  const markers: MapMarker[] = [];
  for (const c of liveCards) {
    if (!c.live) continue;
    markers.push({
      id: `bus:${c.busCode}`,
      lat: c.live.lat,
      lng: c.live.lng,
      label: `${c.busCode ?? "bus"} — ${c.studentName}`,
      sublabel: c.live.stale ? "stale" : `${Math.round(c.live.speed ?? 0)} km/h`,
      kind: "bus",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span className={connected ? "h-2.5 w-2.5 rounded-full bg-success" : "h-2.5 w-2.5 rounded-full bg-danger animate-pulse"} />
        {connected ? "Live — connected" : "Connecting…"}
      </div>

      {liveCards.length > 0 ? (
        <LiveMap
          center={markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : CAIRO}
          zoom={13}
          markers={markers}
          follow={markers[0]?.id ?? null}
          height={420}
        />
      ) : (
        <EmptyState
          title="No active buses right now"
          description="When a bus starts its route you'll see it moving on the map in real time."
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(snapshot ?? []).map((c) => (
          <div key={c.studentId} className="rounded-card border border-border bg-card p-4">
            <p className="font-medium">{c.studentName}</p>
            <p className="text-sm text-muted-foreground">
              {c.grade} · {c.schoolName}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge status={c.assignmentStatus ?? c.tripStatus ?? "SCHEDULED"} />
              {c.busCode ? <Badge tone="primary">{c.busCode}</Badge> : null}
              {c.etaMinutes != null ? <Badge tone="info">~{c.etaMinutes} min</Badge> : null}
            </div>
            {c.driverName ? <p className="mt-2 text-xs text-muted-foreground">Driver: {c.driverName}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}