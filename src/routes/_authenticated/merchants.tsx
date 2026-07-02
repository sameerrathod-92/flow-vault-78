import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMerchants, useTransactions } from "@/lib/queries";
import { PageHeader, Panel, StatusPill } from "@/components/page-header";
import { inr, inrShort, num, time } from "@/lib/format";
import { initials } from "@/lib/demo";
import { Search, Plus, ExternalLink, Copy, Activity } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/_authenticated/merchants")({ component: MerchantsPage });

function MerchantsPage() {
  const { data: merchants = [] } = useMerchants();
  const { data: tx = [] } = useTransactions(1000);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = merchants.filter((m: any) => `${m.name} ${m.merchant_code}`.toLowerCase().includes(q.toLowerCase()));
  const selected = filtered.find((m: any) => m.id === selectedId) ?? filtered[0];

  const perMerchant = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number; success: number }>();
    tx.forEach((t) => {
      if (!t.merchant_id) return;
      const k = t.merchant_id;
      if (!map.has(k)) map.set(k, { revenue: 0, orders: 0, success: 0 });
      const m = map.get(k)!;
      m.orders += 1;
      if (t.status === "SUCCESS") { m.success += 1; m.revenue += Number(t.amount); }
    });
    return map;
  }, [tx]);

  const selectedStats = selected ? perMerchant.get(selected.id) ?? { revenue: 0, orders: 0, success: 0 } : null;
  const selectedTx = selected ? tx.filter((t) => t.merchant_id === selected.id).slice(0, 40) : [];

  const trend = useMemo(() => {
    if (!selected) return [];
    const map = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); map.set(d.toISOString().slice(0, 10), 0);
    }
    selectedTx.forEach((t) => {
      const k = new Date(t.occurred_at).toISOString().slice(0, 10);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + Number(t.amount));
    });
    return Array.from(map.entries()).map(([d, v]) => ({ d: d.slice(5), v }));
  }, [selectedTx, selected]);

  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow="Partners"
        title="Merchants"
        subtitle="Onboarded restaurant partners routing checkout to Nexus Bank."
        actions={
          <button className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-foreground px-2 text-[11px] font-semibold text-background">
            <Plus className="h-3 w-3" /> Onboard merchant
          </button>
        }
      />

      <div className="grid gap-3" style={{ gridTemplateColumns: "300px minmax(0,1fr) 340px" }}>
        {/* LIST */}
        <Panel dense className="min-h-[75vh]">
          <div className="p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merchant…" className="h-7 w-full rounded-md border border-border bg-panel-2 pl-7 pr-2 text-[12px] outline-none" />
            </div>
          </div>
          <div className="scrollbar-thin -m-2 max-h-[70vh] overflow-y-auto">
            {filtered.map((m: any) => {
              const s = perMerchant.get(m.id);
              const active = selected?.id === m.id;
              return (
                <button key={m.id} onClick={() => setSelectedId(m.id)} className={`flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left ${active ? "bg-accent" : "row-hover"}`}>
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-muted text-[10px] font-bold uppercase">{initials(m.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold">{m.name}</div>
                    <div className="mono flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{m.merchant_code}</span>
                      <span>·</span>
                      <span>{m.city ?? "—"}</span>
                    </div>
                  </div>
                  <div className="tabular text-right text-[11px]">
                    <div className="font-semibold">{inrShort(s?.revenue ?? 0)}</div>
                    <div className="text-[10px] text-muted-foreground">{num(s?.orders ?? 0)}</div>
                  </div>
                </button>
              );
            })}
            {!filtered.length && <div className="p-6 text-center text-[12px] text-muted-foreground">No merchants.</div>}
          </div>
        </Panel>

        {/* PROFILE */}
        <div className="space-y-3">
          <Panel>
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-md bg-foreground text-background text-[13px] font-bold">{initials(selected.name)}</div>
                    <div>
                      <div className="text-[16px] font-semibold">{selected.name}</div>
                      <div className="mono text-[11px] text-muted-foreground">{selected.merchant_code} · {selected.category ?? "Restaurant"} · {selected.city ?? "—"}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusPill status={selected.connection_status} />
                        <StatusPill status={selected.settlement_status} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground row-hover hover:text-foreground">Rotate keys</button>
                    <button className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground row-hover hover:text-foreground"><ExternalLink className="h-3 w-3" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-4 divide-x divide-border rounded-md border border-border">
                  <MetricCell label="Revenue (30d)" value={inrShort(selectedStats?.revenue ?? 0)} trend={12.4} />
                  <MetricCell label="Orders" value={num(selectedStats?.orders ?? 0)} trend={8.1} />
                  <MetricCell label="Success rate" value={`${selectedStats?.orders ? Math.round((selectedStats.success / selectedStats.orders) * 100) : 0}%`} accent="success" />
                  <MetricCell label="Avg ticket" value={inr(selectedStats?.success ? selectedStats.revenue / selectedStats.success : 0)} />
                </div>
              </div>
            ) : <div className="p-6 text-center text-[12px] text-muted-foreground">Select a merchant.</div>}
          </Panel>

          <Panel title="Revenue · last 14 days" eyebrow="Trend" bodyClassName="pt-1">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trend}>
                <defs><linearGradient id="mtrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => inrShort(Number(v))} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 11 }} formatter={(v: number) => inr(v)} />
                <Area type="monotone" dataKey="v" stroke="var(--color-primary)" fill="url(#mtrend)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Recent transactions" eyebrow="Ledger" dense>
            <div className="scrollbar-thin -m-2 max-h-72 overflow-y-auto">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-panel text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-3 py-1.5 text-left">TXN</th>
                    <th className="px-3 py-1.5 text-left">Customer</th>
                    <th className="px-3 py-1.5 text-right">Amount</th>
                    <th className="px-3 py-1.5 text-left">Status</th>
                    <th className="px-3 py-1.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTx.slice(0, 20).map((t) => (
                    <tr key={t.id} className="border-b border-border/60 row-hover">
                      <td className="mono px-3 py-1.5">{t.transaction_id}</td>
                      <td className="px-3 py-1.5">{t.customer_name ?? "—"}</td>
                      <td className="tabular px-3 py-1.5 text-right font-semibold">{inr(Number(t.amount))}</td>
                      <td className="px-3 py-1.5"><StatusPill status={t.status} /></td>
                      <td className="mono px-3 py-1.5 text-right text-muted-foreground">{time(t.occurred_at)}</td>
                    </tr>
                  ))}
                  {!selectedTx.length && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No transactions.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* RIGHT RAIL */}
        <div className="space-y-3">
          <Panel title="API credentials" eyebrow="Access" dense>
            <div className="space-y-2 p-1 text-[11px]">
              <CredRow label="Publishable" value={selected?.merchant_code ? `pk_live_${selected.merchant_code.toLowerCase()}` : ""} />
              <CredRow label="Secret" value="sk_live_••••••••7f2a" secret />
              <CredRow label="Webhook" value={selected?.webhook_url ?? "https://api.merchant.example/hooks"} />
            </div>
          </Panel>

          <Panel title="Webhook health" eyebrow="Delivery" dense>
            <div className="p-2 text-[11px]">
              <div className="flex justify-between border-b border-border py-1"><span className="text-muted-foreground">Success (24h)</span><span className="tabular font-semibold text-[color:var(--color-success)]">99.6%</span></div>
              <div className="flex justify-between border-b border-border py-1"><span className="text-muted-foreground">Avg latency</span><span className="tabular font-semibold">218 ms</span></div>
              <div className="flex justify-between border-b border-border py-1"><span className="text-muted-foreground">Retries</span><span className="tabular font-semibold">4</span></div>
              <div className="flex justify-between py-1"><span className="text-muted-foreground">Last delivery</span><span className="mono">2m ago</span></div>
            </div>
          </Panel>

          <Panel title="Settlement" eyebrow="Payout" dense>
            <div className="p-2 text-[11px]">
              <div className="flex justify-between border-b border-border py-1"><span className="text-muted-foreground">Next payout</span><span className="tabular font-semibold">{inr((selectedStats?.revenue ?? 0) * 0.978)}</span></div>
              <div className="flex justify-between border-b border-border py-1"><span className="text-muted-foreground">MDR</span><span className="tabular">2.20%</span></div>
              <div className="flex justify-between border-b border-border py-1"><span className="text-muted-foreground">Cycle</span><span>T+1 · Daily</span></div>
              <div className="flex justify-between py-1"><span className="text-muted-foreground">Bank</span><span className="mono">HDFC ••1204</span></div>
            </div>
          </Panel>

          <Panel title="Live requests" eyebrow="Stream" dense>
            <div className="scrollbar-thin max-h-56 overflow-y-auto p-1 text-[10px]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="mono flex items-center gap-2 border-b border-border py-1">
                  <Activity className="h-2.5 w-2.5 text-[color:var(--color-success)]" />
                  <span className="text-muted-foreground">{new Date(Date.now() - i * 45_000).toLocaleTimeString("en-IN", { hour12: false })}</span>
                  <span>POST /v1/transactions</span>
                  <span className="ml-auto tabular text-[color:var(--color-success)]">200</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function MetricCell({ label, value, trend, accent }: { label: string; value: string; trend?: number; accent?: "success" }) {
  return (
    <div className="p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`tabular mt-1 text-[18px] font-semibold ${accent === "success" ? "text-[color:var(--color-success)]" : ""}`}>{value}</div>
      {typeof trend === "number" && (
        <div className={`tabular text-[10px] font-semibold ${trend >= 0 ? "text-[color:var(--color-success)]" : "text-[color:var(--color-destructive)]"}`}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%</div>
      )}
    </div>
  );
}

function CredRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-panel-2 p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mono mt-0.5 flex items-center justify-between gap-1 text-[11px]">
        <span className="truncate">{secret ? value : value}</span>
        <button className="rounded p-0.5 text-muted-foreground row-hover hover:text-foreground"><Copy className="h-3 w-3" /></button>
      </div>
    </div>
  );
}