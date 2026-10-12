"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  kind?: "bus" | "stop" | "school" | "home";
};

export type LeafletMapProps = {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  polyline?: { lat: number; lng: number }[];
  follow?: string | null;
  className?: string;
};

const busIcon = L.divIcon({
  className: "",
  html: '<div class="bus-marker">🚌</div>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const dotIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div class="stop-marker" style="background:${color}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const stopIcon = dotIcon("#f59e0b");
const schoolIcon = dotIcon("#2563eb");
const homeIcon = dotIcon("#16a34a");

function iconFor(kind: MapMarker["kind"]) {
  if (kind === "bus") return busIcon;
  if (kind === "school") return schoolIcon;
  if (kind === "home") return homeIcon;
  return stopIcon;
}

function Follower({ follow, markers }: { follow: string | null; markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (!follow) return;
    const m = markers.find((x) => x.id === follow);
    if (m) map.panTo([m.lat, m.lng], { animate: true });
  }, [follow, markers, map]);
  return null;
}

export default function LeafletMap({ center, zoom = 13, markers = [], polyline, follow = null, className }: LeafletMapProps) {
  const line = useMemo(() => polyline?.map((p) => [p.lat, p.lng] as [number, number]) ?? [], [polyline]);

  return (
    <div className={className} style={{ height: "100%", width: "100%" }}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {line.length > 1 ? <Polyline positions={line} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.7 }} /> : null}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={iconFor(m.kind)}>
            <Popup>
              <strong>{m.label}</strong>
              {m.sublabel ? <div>{m.sublabel}</div> : null}
            </Popup>
          </Marker>
        ))}
        <Follower follow={follow} markers={markers} />
      </MapContainer>
    </div>
  );
}
