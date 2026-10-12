"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapPin, Clock3 } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { LiveMap, type MapMarker } from "@/components/maps/live-map";
import { relativeTime } from "@/lib/datetime";
import type { Dictionary, Locale } from "@/lib/i18n/client";

export type ChildCard = {
  studentId: string;
  studentName: string;
  grade: string;
  schoolName: string;
  tripStatus: string | null;
  direction: string | null;
  busCode: string | null;
  plateNumber: string | null;
  driverName: string | null;
  assignmentStatus: string | null;
  etaMinutes: number | null;
  distanceKm: number | null;
  subscriptionStatus: string | null;
  subscriptionRenewsAt: string | null;
  live: { lat: number; lng: number; speed: number | null; stale: boolean; recordedAt: string } | null;
};

export function ParentHome({ locale, t, cards }: { locale: Locale; t: Dictionary; cards: ChildCard[] }) {
  const liveCount = cards.filter((c) => c.tripStatus === "IN_PROGRESS").length;

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    for (const c of cards) {
      if (c.live)
        list.push({
          id: `bus:${c.busCode}`,
          lat: c.live.lat,
          lng: c.live.lng,
          label: `${c.busCode} — ${c.studentName}`,
          sublabel: c.live.stale ? "signal stale" : `${Math.round(c.live.speed ?? 0)} km/h`,
          kind: "bus",
        });
    }
    return list;
  }, [cards]);

  const firstLive = cards.find((c) => c.live);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t.parent.myChildren}</h1>
          <p className="text-sm text-muted-foreground">{t.common.dashboard}</p>
        </div>
        <Link href="/parent/children">
          <Button variant="outline">{t.parent.addChild}</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.parent.myChildren} value={cards.length} tone="primary" />
        <StatCard label={t.parent.onTheBus} value={cards.filter((c) => c.assignmentStatus === "ONBOARD").length} tone="primary" />
        <StatCard label={t.parent.assignedBus} value={cards.filter((c) => c.busCode).length} tone="neutral" />
        <StatCard
          label={t.common.dashboard}
          value={liveCount}
          tone="success"
          hint={liveCount > 0 && firstLive?.live ? relativeTime(firstLive.live.recordedAt, locale) : undefined}
        />
      </div>

      {firstLive?.live ? (
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin size={15} className="text-primary" /> Live
              {firstLive.live.stale ? <Badge tone="warning">stale signal</Badge> : <Badge tone="success">live</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <LiveMap
              center={{ lat: firstLive.live.lat, lng: firstLive.live.lng }}
              zoom={13}
              markers={markers}
              follow={markers[0]?.id ?? null}
              height={300}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((c) => (
          <Card key={c.studentId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{c.studentName}</span>
                <StatusBadge status={c.assignmentStatus ?? c.tripStatus ?? "SCHEDULED"} />
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t.common.grade} {c.grade} · {c.schoolName}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {c.tripStatus ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={c.direction === "MORNING" ? "primary" : "info"}>
                    {c.direction === "MORNING" ? "Morning" : "Afternoon"}
                  </Badge>
                  <Badge tone="neutral">{c.tripStatus.toLowerCase()}</Badge>
                  {c.busCode ? <Badge tone="primary">{c.busCode} · {c.plateNumber}</Badge> : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.common.noData}</p>
              )}

              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {c.driverName ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock3 size={14} /> {c.driverName}
                  </span>
                ) : null}
                {c.etaMinutes != null ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin size={14} /> {t.parent.minutesAway.replace("{minutes}", String(c.etaMinutes))} · {c.distanceKm?.toFixed(1)} km
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {c.subscriptionStatus === "ACTIVE" ? (
                  <Badge tone="success">{t.parent.subscriptionActive}</Badge>
                ) : c.subscriptionStatus ? (
                  <Badge tone="warning">{c.subscriptionStatus.toLowerCase()}</Badge>
                ) : (
                  <Link href="/parent/subscription">
                    <Button size="sm" variant="outline">{t.parent.subscription}</Button>
                  </Link>
                )}
                <Link href={`/parent/children/${c.studentId}`}>
                  <Button size="sm" variant="ghost">{t.common.details}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}