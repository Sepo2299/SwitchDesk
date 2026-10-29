import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type Analytics } from "../api";

export function ActivityChart({
  analytics
}: {
  analytics: Analytics | null;
}) {
  return <div className="activity-chart">
    {analytics?.activity?.length ? <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={analytics.activity} margin={{
        left: -28,
        right: 12,
        top: 20,
        bottom: 0
      }}>
        <defs>
          <linearGradient id="amber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dfa447" stopOpacity={.22} />
            <stop offset="100%" stopColor="#dfa447" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 5" stroke="#e9e8e3" />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{
          fontSize: 14,
          fill: '#92958f'
        }} dy={8} />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{
          fontSize: 14,
          fill: '#92958f'
        }} />
        <Tooltip contentStyle={{
          borderRadius: 10,
          border: '1px solid #e4e4de',
          fontSize: 16
        }} />
        <Area name="Created" type="monotone" dataKey="created" stroke="#c28a31" fill="url(#amber)" strokeWidth={2.5} />
        <Area name="Resolved" type="monotone" dataKey="resolved" stroke="#578c79" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
      </AreaChart>
    </ResponsiveContainer> : <p className="muted">No activity recorded yet.</p>}
  </div>;
}
