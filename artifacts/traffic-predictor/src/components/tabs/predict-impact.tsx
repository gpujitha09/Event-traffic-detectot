import { useRef, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePredictImpact } from "@workspace/api-client-react";
import type { PredictionResult, EventInput } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formSchema = z.object({
  event_type: z.enum(["planned", "unplanned"]),
  event_cause: z.string(),
  requires_road_closure: z.boolean(),
  veh_type: z.string(),
  zone: z.string(),
  corridor: z.string(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  hour: z.number().min(0).max(23),
  day_of_week: z.coerce.number().min(0).max(6),
  month: z.coerce.number().min(1).max(12),
});

type FormValues = z.infer<typeof formSchema>;

function EventMap({ prediction }: { prediction: PredictionResult | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current).setView([12.9716, 77.5946], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.eachLayer((l) => { if (!(l instanceof L.TileLayer)) map.removeLayer(l); });

    const lat = prediction?.latitude ?? 12.9716;
    const lng = prediction?.longitude ?? 77.5946;
    map.setView([lat, lng], 13);

    if (prediction) {
      const color = prediction.severity_band === "High" ? "#ef4444" : prediction.severity_band === "Medium" ? "#f97316" : "#22c55e";
      L.marker([lat, lng]).addTo(map).bindPopup(`<b>${prediction.event_cause}</b><br/>${prediction.zone}`).openPopup();
      L.circle([lat, lng], { radius: prediction.impact_radius_meters, color, fillColor: color, fillOpacity: 0.15, weight: 2, dashArray: "4 4" }).addTo(map);
      const divA: L.LatLngExpression[] = [[lat, lng], [lat + 0.012, lng + 0.012]];
      const divB: L.LatLngExpression[] = [[lat, lng], [lat - 0.012, lng - 0.012]];
      L.polyline(divA, { color: "#9ca3af", weight: 2, dashArray: "6 4" }).addTo(map);
      L.polyline(divB, { color: "#9ca3af", weight: 2, dashArray: "6 4" }).addTo(map);
      L.marker([lat + 0.012, lng + 0.012], { icon: L.divIcon({ className: "", html: `<div style="background:#1e293b;border:1px solid #4b5563;color:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:10px;white-space:nowrap;">Diversion Route A</div>`, iconAnchor: [60, 10] }) }).addTo(map);
      L.marker([lat - 0.012, lng - 0.012], { icon: L.divIcon({ className: "", html: `<div style="background:#1e293b;border:1px solid #4b5563;color:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:10px;white-space:nowrap;">Diversion Route B</div>`, iconAnchor: [60, 10] }) }).addTo(map);
    }
  }, [prediction]);

  return <div ref={containerRef} className="w-full rounded-lg border border-border overflow-hidden" style={{ height: 320 }} />;
}

interface PredictImpactTabProps {
  onPrediction: (r: PredictionResult) => void;
  lastPrediction: PredictionResult | null;
}

export default function PredictImpactTab({ onPrediction, lastPrediction }: PredictImpactTabProps) {
  const [hourVal, setHourVal] = useState(9);
  const predict = usePredictImpact({
    mutation: { onSuccess: (data) => onPrediction(data) },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      event_type: "unplanned",
      event_cause: "vehicle_breakdown",
      requires_road_closure: false,
      veh_type: "private_car",
      zone: "Central Zone 1",
      corridor: "CBD 1",
      latitude: 12.9716,
      longitude: 77.5946,
      hour: 9,
      day_of_week: 0,
      month: 6,
    },
  });

  function onSubmit(values: FormValues) {
    predict.mutate({ data: values as EventInput });
  }

  const band = lastPrediction?.severity_band;
  const bandColorClass = band === "High" ? "text-red-400 border-red-500/30 bg-red-500/10" : band === "Medium" ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : "text-green-400 border-green-500/30 bg-green-500/10";
  const scoreBarColor = band === "High" ? "bg-red-500" : band === "Medium" ? "bg-orange-500" : "bg-green-500";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground mb-4">Event Parameters</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="event_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Event Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-event-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="unplanned">Unplanned</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="event_cause" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Event Cause</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-event-cause"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["accident","congestion","construction","debris","fog_low_visibility","others","pot_holes","procession","protest","public_event","road_conditions","test_demo","tree_fall","vehicle_breakdown","vip_movement","water_logging"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="requires_road_closure" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Road Closure</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "true")} value={field.value ? "true" : "false"}>
                      <FormControl><SelectTrigger data-testid="select-road-closure"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="veh_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Vehicle Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-veh-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["auto","bmtc_bus","heavy_vehicle","ksrtc_bus","lcv","others","private_bus","private_car","taxi","truck"].map(v => <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="zone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Zone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-zone"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {["Central Zone 1","Central Zone 2","East Zone 1","East Zone 2","North Zone 1","North Zone 2","South Zone 1","South Zone 2","West Zone 1","West Zone 2"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="corridor" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Corridor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-corridor"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {["Airport New South Road","Bannerghata Road","Bellary Road 1","Bellary Road 2","CBD 1","CBD 2","Hennur Main Road","Hosur Road","IRR(Thanisandra road)","Magadi Road","Mysore Road","Non-corridor","ORR East 1","ORR East 2","ORR North 1","ORR North 2","ORR West 1","Old Airport Road","Old Madras Road","Tumkur Road","Varthur Road","West of Chord Road"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="latitude" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Latitude</FormLabel>
                    <FormControl><Input type="number" step="any" data-testid="input-latitude" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="longitude" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Longitude</FormLabel>
                    <FormControl><Input type="number" step="any" data-testid="input-longitude" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="hour" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Hour of Day: <span className="text-primary">{hourVal}:00</span></FormLabel>
                  <FormControl>
                    <Slider
                      min={0} max={23} step={1}
                      value={[hourVal]}
                      onValueChange={([v]) => { setHourVal(v); field.onChange(v); }}
                      data-testid="slider-hour"
                    />
                  </FormControl>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="day_of_week" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Day of Week</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                      <FormControl><SelectTrigger data-testid="select-day"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="month" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase text-muted-foreground">Month</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                      <FormControl><SelectTrigger data-testid="select-month"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full font-mono uppercase tracking-wider mt-2" disabled={predict.isPending} data-testid="button-predict">
                {predict.isPending ? "Predicting..." : "Run Prediction"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Result Card */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground mb-4">Prediction Result</h2>
          {!lastPrediction ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm font-mono gap-2">
              <div className="text-4xl font-bold opacity-20">--</div>
              <div className="text-xs uppercase tracking-wider opacity-50">Submit the form to see results</div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Score */}
              <div className="text-center space-y-2">
                <div className={`text-7xl font-black tabular-nums ${band === "High" ? "text-red-400" : band === "Medium" ? "text-orange-400" : "text-green-400"}`}>
                  {lastPrediction.severity_score.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground font-mono">/ 100 severity score</div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-700 ${scoreBarColor}`} style={{ width: `${lastPrediction.severity_score}%` }} />
                </div>
                <Badge className={`text-sm px-4 py-1 border ${bandColorClass}`} variant="outline">
                  {lastPrediction.severity_band}
                </Badge>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Police Units", value: lastPrediction.police_units_needed },
                  { label: "Barricade Points", value: lastPrediction.barricade_points },
                  { label: "Radius (m)", value: lastPrediction.impact_radius_meters },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-md p-3 text-center border border-border">
                    <div className="text-xl font-bold">{value}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="rounded-md bg-primary/10 border border-primary/20 p-3">
                <div className="text-xs font-mono uppercase tracking-wider text-primary/70 mb-1">Recommended Action</div>
                <div className="text-sm">{lastPrediction.recommended_action}</div>
              </div>

              {/* Diversions */}
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Diversion Routes</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border text-sm">
                    <span className="text-xs font-mono text-primary w-6">A</span>
                    <span>{lastPrediction.diversion_route_1}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border text-sm">
                    <span className="text-xs font-mono text-primary w-6">B</span>
                    <span>{lastPrediction.diversion_route_2}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground mb-3">Impact Zone Map</h2>
        <EventMap prediction={lastPrediction} />
      </div>
    </div>
  );
}
