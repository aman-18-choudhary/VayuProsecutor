import React from "react";
import { Card } from "../ui";
import { AlertTimelineData } from "../../lib/types";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function AlertTimeline({ data, loading }: { data: AlertTimelineData[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="p-5 h-64">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Alert Trends (24h)</h3>
        <div className="h-40 bg-bg-muted animate-pulse rounded-xl" />
      </Card>
    );
  }

  return (
    <Card className="p-5 h-64 flex flex-col">
      <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Alert Trends (24h)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} minTickGap={30} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
              labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
            />
            <Area type="monotone" dataKey="critical" name="Critical" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCritical)" />
            <Area type="monotone" dataKey="high" name="High" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#colorHigh)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
