"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Radio, Play, Flag, AlertTriangle, Loader2 } from "lucide-react";
import {
  startTripAction,
  endTripAction,
  markBoardedAction,
  markDroppedAction,
  markAbsentAction,
  gpsPingAction,
} from "@/app/actions/trips";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { LiveMap, type MapMarker } from "@/components/maps/live-map";
import { relativeTime } from "@/lib/datetime";
import type { Locale } from "@/lib/i18n/client";

export type DriverTripView = {
  id: string;
  direction: string;
  status: string;
  tripDate: string;
  startedAt: string | null;
  endedAt: string | null;
  reconciliationComplete: boolean;
  routeName: string;
  busCode: string;
  plateNumber: string;
  schoolName: string;
  stops: { id: string; label: string; lat: number; lng: number; sequence: number }[];
  assignments: {
    id: string;
    studentId: string;
    name: string;
    grade: string;
    phone: string | null;
    status: string;
    boardedAt: string | null;
    droppedAt: string | null;
    homeLat: number | null;
    homeLng: number | null;
  }[];
  gps: { lat: number; lng: number; speed: number | null; recordedAt: string } | null;
};

const CAIRO = { lat: 30.0444, lng: 31.2357 };

export function DriverToday({ locale, driverName, trips }: { locale: Locale; driverName: string; trips: DriverTripView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [gpsBusy, setGpsBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (msg: string | null) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    if (msg) noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  };

  const active = trips.find((t) => t.status === "IN_PROGRESS") ?? trips[0];
  const selected = trips.find((t) => t.id === (active?.id ?? "")) ?? active;

  const run = (fn: () => Promise<unknown>, okMsg?: string) =>
    startTransition(async () => {
      const res = (await fn()) as { ok: boolean; error?: string; unaccounted?: number } | undefined;
      if (res && !res.ok) {
        show(
          res.error === "UNACCOUNTED_STUDENTS"
            ? `Cannot finish: ${res.unaccounted} child(ren) unaccounted for.`
            : `Action failed: ${res.error}`,
        );
      } else {
        show(okMsg ?? null);
        router.refresh();
      }
    });

  // --- GPS simulation -----------------------------------------------------
  const sendGps = async (lat: number, lng: number, speed: number | null) => {
    if (!selected) return;
    setGpsBusy(true);
    const res = await gpsPingAction(selected.id, { lat, lng, speed, heading: null });
    setGpsBusy(false);
    if (res.ok) {
      show("GPS fix recorded.");
      router.refresh();
    } else {
      show(`GPS failed: ${res.error}`);
    }
  };

  const simulateGps = () => {
    if (!("geolocation" in navigator)) return pingFallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => void sendGps(pos.coords.latitude, pos.coords.longitude, Math.round(pos.coords.speed ?? 0)),
      () => pingFallback(),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  const pingFallback = () => {
    const base = selected?.gps ?? { lat: CAIRO.lat, lng: CAIRO.lng };
    const lat = base.lat + (Math.random() - 0.5) * 0.0009;
    const lng = base.lng + (Math.random() - 0.5) * 0.0009;
    void sendGps(lat, lng, 24 + Math.random() * 28);
  };
  // -------------------------------------------------------------------------

  const markers = useMemo<MapMarker[]>(() => {
    if (!selected) return [];
    const list: MapMarker[] = [];
    if (selected.gps)
      list.push({
        id: "bus",
        lat: selected.gps.lat,
        lng: selected.gps.lng,
        label: selected.busCode,
        sublabel: `${Math.round(selected.gps.speed ?? 0)} km/h`,
        kind: "bus",
      });
    for (const s of selected.stops.slice(0, 4))
      list.push({ id: `stop:${s.id}`, lat: s.lat, lng: s.lng, label: s.label, kind: "stop" });
    for (const a of selected.assignments)
      if (a.homeLat != null && a.homeLng != null && a.status === "EXPECTED")
        list.push({ id: `home:${a.studentId}`, lat: a.homeLat, lng: a.homeLng, label: a.name, kind: "home" });
    return list;
  }, [selected]);

  const counts = useMemo(() => {
    if (!selected) return { onboard: 0, dropped: 0, expected: 0, absent: 0, unaccounted: 0 };
    return selected.assignments.reduce(
      (acc, a) => {
        if (a.status === "ONBOARD") acc.onboard++;
        else if (a.status === "DROPPED") acc.dropped++;
        else if (a.status === "ABSENT") acc.absent++;
        else if (a.status === "UNACCOUNTED") acc.unaccounted++;
        else acc.expected++;
        return acc;
      },
      { onboard: 0, dropped: 0, expected: 0, absent: 0, unaccounted: 0 },
    );
  }, [selected]);

  if (!selected) {
    return (
      <EmptyState
        title="No trips scheduled today"
        description="You have no bus routes assigned for today."
      />
    );
  }

  const center = selected.gps ? { lat: selected.gps.lat, lng: selected.gps.lng } : CAIRO;
  const open = selected.status === "IN_PROGRESS";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Today, {driverName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {trips.length} trip(s) · bus {selected.busCode} · {selected.plateNumber}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {trips.map((t) => (
            <Button key={t.id} variant={t.id === selected.id ? "primary" : "outline"} size="sm" onClick={() => router.refresh()}>
              {t.direction === "MORNING" ? "Morning" : "Afternoon"} · {relativeTime(t.tripDate, locale).replace(" ago", "")}
            </Button>
          ))}
        </div>
      </div>

      {notice ? (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{notice}</div>
      ) : null}

      <Card className="p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Badge tone={open ? "primary" : "info"}>{selected.status}</Badge>
            {selected.routeName}
          </CardTitle>
        </CardHeader>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <LiveMap center={center} zoom={13} markers={markers} follow="bus" height={420} />
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Mini label="Onboard" value={counts.onboard} tone="primary" />
              <Mini label="Expected" value={counts.expected} tone="neutral" />
              <Mini label="Dropped" value={counts.dropped} tone="success" />
              <Mini label="Absent" value={counts.absent} tone="warning" />
              {counts.unaccounted > 0 ? <Mini label="Unaccounted" value={counts.unaccounted} tone="danger" /> : null}
            </div>

            <div className="flex flex-col gap-2">
              {selected.status === "SCHEDULED" ? (
                <Button size="lg" className="w-full" disabled={pending} onClick={() => run(() => startTripAction(selected.id), "Trip started.")}>
                  <Play size={16} /> Start trip
                </Button>
              ) : open ? (
                <>
                  <Button
                    size="lg"
                    className="w-full"
                    variant="success"
                    disabled={pending}
                    onClick={() => run(() => endTripAction(selected.id), "Trip completed — all accounted for.")}
                  >
                    <Flag size={16} /> Complete trip
                  </Button>
                  <Button size="md" className="w-full" variant="outline" disabled={gpsBusy} onClick={simulateGps}>
                    {gpsBusy ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />} Simulate GPS ping
                  </Button>
                </>
              ) : null}
            </div>

            <ReconcileBox selected={selected} />
          </div>
        </div>
      </Card>

      <div>
        <SectionHeader
          title="Manifest"
          description="Confirm each child: boarding, drop-off, or absent. Ending the trip is blocked while anyone is unaccounted for."
        />
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {selected.assignments.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {a.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {a.name} <span className="text-muted-foreground">· {a.grade}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{a.phone ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone(a.status)}>{a.status.toLowerCase()}</Badge>
                    {open && a.status !== "DROPPED" && a.status !== "ABSENT" ? (
                      <>
                        <Button size="sm" variant="success" disabled={pending} onClick={() => run(() => markBoardedAction(selected.id, a.id), `${a.name} boarded.`)}>
                          Board
                        </Button>
                        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => markDroppedAction(selected.id, a.id), `${a.name} dropped off.`)}>
                          Drop
                        </Button>
                        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => markAbsentAction(selected.id, a.id), `${a.name} marked absent.`)}>
                          Absent
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: "primary" | "success" | "warning" | "danger" | "neutral" }) {
  const tones = {
    primary: "text-blue-600",
    neutral: "text-slate-700",
    success: "text-green-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  } as const;
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className={tones[tone]}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ReconcileBox({ selected }: { selected: DriverTripView }) {
  const pending = selected.assignments.filter((a) => ["EXPECTED", "UNACCOUNTED"].includes(a.status)).length;
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle size={14} className="text-warning" />
        Reconciliation: {selected.assignments.length - pending}/{selected.assignments.length} accounted
        {selected.status === "COMPLETED" && selected.reconciliationComplete ? <Badge tone="success">complete</Badge> : null}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {pending > 0 ? `${pending} child(ren) still need action before ending.` : "All clear — you can end the trip."}
      </p>
    </div>
  );
}

function statusTone(status: string): "primary" | "success" | "warning" | "danger" | "neutral" {
  if (status === "ONBOARD") return "primary";
  if (status === "DROPPED") return "success";
  if (status === "ABSENT") return "warning";
  if (status === "UNACCOUNTED") return "danger";
  return "neutral";
}