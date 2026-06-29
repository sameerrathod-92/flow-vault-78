import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/page-header";
import { useTransactions } from "@/lib/queries";
import { inr, inrShort } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function AnalyticsPage() {
  const { data: tx = [] } = useTransactions(2000);

  const data = useMemo(() => {
    const daily = new Map<string, number>();
    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, orders: 0 }));
    const foods = new Map<string, number>();
    const merchants = new Map<string, { revenue: number; orders: number }>();
    let successCount = 0, refundCount = 0, completedAmt = 0, completedCount = 0;

    tx.forEach((t) => {
      const d = new Date(t.occurred_at);
      const k = d.toISOString().slice(0, 10);
      daily.set(k, (daily.get(k) ?? 0) + (t.status === "SUCCESS" ? Number(t.amount) : 0));
      hourly[d.getHours()].orders += 1;
      if (t.status === "SUCCESS") { successCount++; completedAmt += Number(t.amount); completedCount++; }
      if (t.status === "REFUND" || t.status === "REFUNDED") refundCount++;

      const m = merchants.get(t.merchant_name ?? "Unknown") ?? { revenue: 0, orders: 0 };
      m.orders++;
      if (t.status === "SUCCESS") m.revenue += Number(t.amount);
      merchants.set(t.merchant_name ?? "Unknown", m);

      (t.items as Array<{ name?: string; qty?: number }> | null)?.forEach?.((it) => {
        if (!it?.name) return;
        foods.set(it.name, (foods.get(it.name) ?? 0) + (it.qty ?? 1));
      });
    });

    const dailySeries = Array.from(daily.entries())
      .sort()
      .slice(-14)
      .map(([d, v]) => ({ date: new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), revenue: Math.round(v) }));

    const topFoods = Array.from(foods.entries()).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 8);
    const ranking = Array.from(merchants.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    const aov = completedCount ? completedAmt / completedCount : 0;
    const successRate = tx.length ? (successCount / tx.length) * 100 : 0;
    const refundRate = tx.length ? (refundCount / tx.length) * 100 : 0;

    return { dailySeries, hourly, topFoods, ranking, aov, successRate, refundRate };
  }, [tx]);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Deep insights across merchants and customers" />

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Average Order Value" value={inr(data.aov)} />
        <Kpi label="Payment Success Rate" value={`${data.successRate.toFixed(1)}%`} tone="success" />
        <Kpi label="Refund Percentage" value={`${data.refundRate.toFixed(1)}%`} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Daily Revenue" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.dailySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => inrShort(Number(v))} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} formatter={(v: number) => inr(v)} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Peak Hours">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={10} interval={2} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Bar dataKey="orders" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Top Selling Foods">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.topFoods} dataKey="qty" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                {data.topFoods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Merchant Ranking" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.ranking} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => inrShort(Number(v))} />
              <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} width={100} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} formatter={(v: number) => inr(v)} />
              <Bar dataKey="revenue" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border/50 p-5 glass shadow-elegant ${className}`}>
      <h3 className="mb-3 font-display text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  const color = tone === "success" ? "text-emerald-400" : tone === "warning" ? "text-amber-400" : "";
  return (
    <div className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-3xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}