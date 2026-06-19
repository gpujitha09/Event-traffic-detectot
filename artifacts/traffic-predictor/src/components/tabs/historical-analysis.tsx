import { useGetHistory, useGetHistoryStats } from "@workspace/api-client-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoricalAnalysisTab() {
  const { data: stats, isLoading: statsLoading } = useGetHistoryStats();
  const { data: history, isLoading: historyLoading } = useGetHistory();

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          [
            { label: "Total Events", value: stats?.total_events ?? 0, color: "text-blue-400" },
            { label: "High Priority", value: stats?.high_priority_count ?? 0, color: "text-red-400" },
            { label: "Low Priority", value: stats?.low_priority_count ?? 0, color: "text-green-400" },
            { label: "Unique Causes", value: stats?.unique_causes ?? 0, color: "text-purple-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center" data-testid={`stat-${label.replace(/ /g, "-").toLowerCase()}`}>
              <div className={`text-3xl font-black ${color}`}>{value.toLocaleString()}</div>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
            </div>
          ))
        )}
      </div>

      {/* Charts */}
      {historyLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground mb-4">Top 10 Event Causes</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={history?.top_causes ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="cause" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", fontSize: 12 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground mb-4">Events by Hour of Day</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={history?.events_by_hour ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v}:00`} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", fontSize: 12 }} labelFormatter={(v) => `${v}:00`} />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground mb-4">High Priority Events by Zone</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={history?.high_priority_by_zone ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="zone" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", fontSize: 12 }} />
                <Bar dataKey="high_count" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
