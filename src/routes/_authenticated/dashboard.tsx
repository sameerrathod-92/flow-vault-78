import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Activity,
  IndianRupee,
  Clock,
  CheckCircle2,
  Undo2,
  XCircle,
  ShoppingBag,
  ReceiptText,
  Store,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { PageHeader, StatusPill } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useMerchants, useTransactions } from "@/lib/queries";
import { dt, inr, inrShort, num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function Dashboard() {
  const { data: tx = [], isLoading } = useTransactions(1000);
  const { data: merchants = [] } = useMerchants();

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todays = tx.filter((t) => new Date(t.occurred_at) >= today);
    const todaysRevenue = todays.filter((t) => t.status === "SUCCESS").reduce((s, t) => s + Number(t.amount), 0);
    const pending = tx.filter((t) => t.status === "PENDING");
    const completed = tx.filter((t) => t.status === "SUCCESS");
    const refunds = tx.filter((t) => t.status === "REFUND" || t.status === "REFUNDED");
    const cancelled = tx.filter((t) => t.status === "CANCELLED");
    const aov = completed.length ? completed.reduce((s, t) => s + Number(t.amount), 0) / completed.length : 0;
    return { todays, todaysRevenue, pending, completed, refunds, cancelled, aov };
  }, [tx]);

  const revenueTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    tx.forEach((t) => {
      if (t.status !== "SUCCESS") return;
      const k = new Date(t.occurred_at).toISOString().slice(0, 10);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + Number(t.amount));
    });
    return Array.from(map.entries()).map(([d, v]) => ({
      date: new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: Math.round(v),
    }));
  }, [tx]);

  const ordersByHour = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, orders: 0 }));
    stats.todays.forEach((t) => {
      const h = new Date(t.occurred_at).getHours();
      buckets[h].orders += 1;
    });
    return buckets;
  }, [stats.todays]);

  const paymentMethods = useMemo(() => {
    const map = new Map<string, number>();
    tx.forEach((t) => map.set(t.payment_method, (map.get(t.payment_method) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [tx]);

  const topMerchants = useMemo(() => {
    const map = new Map<string, number>();
    tx.filter((t) => t.status === "SUCCESS").forEach((t) => {
      const k = t.merchant_name ?? "Unknown";
      map.set(k, (map.get(k) ?? 0) + Number(t.amount));
    });
    return Array.from(map.entries())
      .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [tx]);

  const weekly = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const arr = days.map((d) => ({ day: d, revenue: 0 }));
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);
    tx.forEach((t) => {
      if (t.status !== "SUCCESS") return;
      const d = new Date(t.occurred_at);
      if (d >= since) arr[d.getDay()].revenue += Number(t.amount);
    });
    return arr.map((a) => ({ ...a, revenue: Math.round(a.revenue) }));
  }, [tx]);

  const monthly = useMemo(() => {
    const arr: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      arr.push({ month: d.toLocaleString("en-IN", { month: "short" }), revenue: 0 });
    }
    const monthKey = (d: Date) => d.toLocaleString("en-IN", { month: "short" });
    tx.forEach((t) => {
      if (t.status !== "SUCCESS") return;
      const k = monthKey(new Date(t.occurred_at));
      const m = arr.find((x) => x.month === k);
      if (m) m.revenue += Number(t.amount);
    });
    return arr.map((a) => ({ ...a, revenue: Math.round(a.revenue) }));
  }, [tx]);

  const recent = tx.slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Console"
        subtitle={isLoading ? "Loading realtime feed…" : `Live feed · ${num(tx.length)} transactions tracked`}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Transactions" value={num(tx.length)} icon={Activity} delta={12.4} index={0} />
        <StatCard label="Today's Revenue" value={inrShort(stats.todaysRevenue)} icon={IndianRupee} delta={8.2} accent="success" index={1} />
        <StatCard label="Pending Payments" value={num(stats.pending.length)} icon={Clock} accent="warning" index={2} />
        <StatCard label="Completed Payments" value={num(stats.completed.length)} icon={CheckCircle2} accent="success" index={3} />
        <StatCard label="Refunds" value={num(stats.refunds.length)} icon={Undo2} accent="accent" index={4} />
        <StatCard label="Cancelled Orders" value={num(stats.cancelled.length)} icon={XCircle} accent="destructive" index={5} />
        <StatCard label="Today's Orders" value={num(stats.todays.length)} icon={ShoppingBag} index={6} />
        <StatCard label="Avg Order Value" value={inr(stats.aov)} icon={ReceiptText} index={7} />
        <StatCard label="Active Merchants" value={num(merchants.length)} icon={Store} hint="Connected partners" index={8} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/50 p-5 glass shadow-elegant lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground">Last 14 days · INR</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => inrShort(Number(v))} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} formatter={(v: number) => inr(v)} />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
          <h3 className="font-display text-lg font-semibold">Payment Methods</h3>
          <p className="text-xs text-muted-foreground">Distribution</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={paymentMethods} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                {paymentMethods.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
          <h3 className="font-display text-lg font-semibold">Orders / Hour (today)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ordersByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={10} interval={2} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Bar dataKey="orders" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
          <h3 className="font-display text-lg font-semibold">Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => inrShort(Number(v))} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} formatter={(v: number) => inr(v)} />
              <Bar dataKey="revenue" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
          <h3 className="font-display text-lg font-semibold">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => inrShort(Number(v))} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} formatter={(v: number) => inr(v)} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-chart-2)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
          <h3 className="font-display text-lg font-semibold">Top Merchants</h3>
          <p className="text-xs text-muted-foreground">By revenue contribution</p>
          <div className="mt-4 space-y-3">
            {topMerchants.map((m, i) => {
              const max = Math.max(...topMerchants.map((x) => x.revenue), 1);
              return (
                <div key={m.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">
                      <span className="text-muted-foreground">#{i + 1}</span> {m.name}
                    </span>
                    <span className="font-mono font-semibold">{inr(m.revenue)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${(m.revenue / max) * 100}%`, background: "var(--gradient-primary)" }} />
                  </div>
                </div>
              );
            })}
            {!topMerchants.length && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
          <h3 className="font-display text-lg font-semibold">Recent Transactions</h3>
          <p className="text-xs text-muted-foreground">Live stream</p>
          <div className="mt-4 divide-y divide-border/50">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.merchant_name}</div>
                  <div className="text-xs text-muted-foreground">{t.customer_name} · {dt(t.occurred_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={t.status} />
                  <span className="w-20 text-right font-mono font-semibold">{inr(Number(t.amount))}</span>
                </div>
              </div>
            ))}
            {!recent.length && <p className="py-4 text-sm text-muted-foreground">No transactions yet — POST one via /api/v1/transactions.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}