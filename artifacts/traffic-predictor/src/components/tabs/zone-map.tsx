import { useEffect, useRef } from "react";
import type { PredictionResult } from "@workspace/api-client-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface ZoneMapTabProps {
  lastPrediction: PredictionResult | null;
}

export default function ZoneMapTab({ lastPrediction }: ZoneMapTabProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const lat = lastPrediction?.latitude ?? 12.9716;
    const lng = lastPrediction?.longitude ?? 77.5946;

    mapRef.current = L.map(containerRef.current, { zoomControl: true }).setView([lat, lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
    });

    const lat = lastPrediction?.latitude ?? 12.9716;
    const lng = lastPrediction?.longitude ?? 77.5946;
    map.setView([lat, lng], 13);

    if (lastPrediction) {
      const band = lastPrediction.severity_band;
      const color = band === "High" ? "#ef4444" : band === "Medium" ? "#f97316" : "#22c55e";

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>${lastPrediction.event_cause}</b><br/>${lastPrediction.zone}`)
        .openPopup();

      L.circle([lat, lng], {
        radius: lastPrediction.impact_radius_meters,
        color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: "4 4",
      }).addTo(map);

      const divA: L.LatLngExpression[] = [[lat, lng], [lat + 0.012, lng + 0.012]];
      const divB: L.LatLngExpression[] = [[lat, lng], [lat - 0.012, lng - 0.012]];

      L.polyline(divA, { color: "#9ca3af", weight: 2, dashArray: "6 4" }).addTo(map);
      L.polyline(divB, { color: "#9ca3af", weight: 2, dashArray: "6 4" }).addTo(map);

      const divIcon = L.divIcon({
        className: "",
        html: `<div style="background:#1e293b;border:1px solid #4b5563;color:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:10px;white-space:nowrap;">`,
        iconAnchor: [40, 10],
      });

      L.marker([lat + 0.012, lng + 0.012], {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:#1e293b;border:1px solid #4b5563;color:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:10px;white-space:nowrap;">Diversion Route A</div>`,
          iconAnchor: [60, 10],
        }),
      }).addTo(map);

      L.marker([lat - 0.012, lng - 0.012], {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:#1e293b;border:1px solid #4b5563;color:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:10px;white-space:nowrap;">Diversion Route B</div>`,
          iconAnchor: [60, 10],
        }),
      }).addTo(map);
    }
  }, [lastPrediction]);

  return (
    <div className="flex flex-col h-full gap-3">
      {!lastPrediction && (
        <div className="bg-card border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground font-mono">
          No prediction yet — run a prediction in the Predict tab to see the event location on the map.
        </div>
      )}
      {lastPrediction && (
        <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-4 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Last Event</span>
          <span className="text-sm font-semibold">{lastPrediction.event_cause}</span>
          <span className="text-xs text-muted-foreground">{lastPrediction.zone}</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              lastPrediction.severity_band === "High"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : lastPrediction.severity_band === "Medium"
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                : "bg-green-500/20 text-green-400 border border-green-500/30"
            }`}
          >
            {lastPrediction.severity_band}
          </span>
          <span className="text-xs text-muted-foreground">Radius: {lastPrediction.impact_radius_meters}m</span>
        </div>
      )}
      <div ref={containerRef} className="flex-1 rounded-lg border border-border overflow-hidden" style={{ minHeight: 400 }} />
    </div>
  );
}
