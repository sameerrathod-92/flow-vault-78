import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, MetricStrip, Metric } from "@/components/page-header";
import { inr, inrShort } from "@/lib/format";
import { seedRevenue, seedHourly } from "@/lib/demo";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({ component: Analytics });

function Analytics() {
  const rev = seedRevenue(30);
  const hourly = seedHourly();
  const total = rev.reduce((s, r) => s + r.revenue, 0);
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Executive" title="Analytics" subtitle="Revenue, forecast, and merchant intelligence across the last 30 days." />
      <MetricStrip cols={5}>
        <Metric label="GTV (30d)" value={inrShort(total)} trend={9.4} accent="success" />
        <Metric label="Net revenue" value={inrShort(total * 0.022)} trend={11.2} />
        <Metric label="Success rate" value="97.4%" accent="success" trend={0.6} />
        <Metric label="Avg ticket" value={inr(842)} trend={4.1} />
        <Metric label="Refund rate" value="1.32%" accent="warning" trend={-0.2} />
      </MetricStrip>
      <Panel title="Revenue and 7-day forecast" eyebrow="Trend">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={rev}>
            <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => inrShort(Number(v))} />
            <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 11 }} formatter={(v: number) => inr(v)} />
            <Area dataKey="revenue" stroke="var(--color-primary)" fill="url(#rev)" strokeWidth={1.5} />
            <Line dataKey="forecast" stroke="var(--color-muted-foreground)" strokeDasharray="4 3" strokeWidth={1.2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Cash flow" eyebrow="Money">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rev.slice(-14)}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => inrShort(Number(v))} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 11 }} formatter={(v: number) => inr(v)} />
              <Bar dataKey="revenue" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Hourly volume" eyebrow="Load">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hourly}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 11 }} />
              <ReferenceLine y={80} stroke="var(--color-warning)" strokeDasharray="3 3" />
              <Line dataKey="orders" stroke="var(--color-info)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
