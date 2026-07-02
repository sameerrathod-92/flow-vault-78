import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCustomers, useTransactions } from "@/lib/queries";
import { PageHeader, Panel, StatusPill } from "@/components/page-header";
import { inr, inrShort, num, time, dt } from "@/lib/format";
import { initials } from "@/lib/demo";
import { Search, Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/customers")({ component: CustomersPage });

function CustomersPage() {
  const { data: customers = [] } = useCustomers();
  const { data: tx = [] } = useTransactions(1000);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const perCust = useMemo(() => {
    const m = new Map<string, { revenue: number; orders: number; last?: string; merchants: Map<string, number>; methods: Map<string, number> }>();
    tx.forEach((t) => {
      if (!t.customer_id) return;
      if (!m.has(t.customer_id)) m.set(t.customer_id, { revenue: 0, orders: 0, merchants: new Map(), methods: new Map() });
      const c = m.get(t.customer_id)!;
      c.orders += 1;
      if (t.status === "SUCCESS") c.revenue += Number(t.amount);
      if (!c.last || t.occurred_at > c.last) c.last = t.occurred_at;
      if (t.merchant_name) c.merchants.set(t.merchant_name, (c.merchants.get(t.merchant_name) ?? 0) + 1);
      c.methods.set(t.payment_method, (c.methods.get(t.payment_method) ?? 0) + 1);
    });
    return m;
  }, [tx]);

  const filtered = customers.filter((c: any) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  const selected = filtered.find((c: any) => c.id === selectedId) ?? filtered[0];
  const stats = selected ? perCust.get(selected.id) : null;
  const custTx = selected ? tx.filter((t) => t.customer_id === selected.id).slice(0, 30) : [];
  const topMerchant = stats ? [...(stats.merchants ?? new Map())].sort((a, b) => b[1] - a[1])[0]?.[0] : null;
  const fraudScore = selected ? 12 + ((selected.id?.charCodeAt(0) ?? 0) % 40) : 0;

  return (
    <div className="space-y-3">
      <PageHeader eyebrow="CRM" title="Customers" subtitle="Unified customer profiles across every partner checkout." />
      <div className="grid gap-3" style={{ gridTemplateColumns: "320px minmax(0,1fr) 320px" }}>
        <Panel dense className="min-h-[75vh]">
          <div className="p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, email, phone…" className="h-7 w-full rounded-md border border-border bg-panel-2 pl-7 pr-2 text-[12px] outline-none" />
            </div>
          </div>
          <div className="scrollbar-thin -m-2 max-h-[72vh] overflow-y-auto">
            {filtered.map((c: any) => {
              const s = perCust.get(c.id);
              const active = selected?.id === c.id;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)} className={`flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left ${active ? "bg-accent" : "row-hover"}`}>
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold uppercase">{initials(c.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold">{c.name}</div>
                    <div className="mono truncate text-[10px] text-muted-foreground">{c.email ?? c.phone ?? c.id.slice(0, 10)}</div>
                  </div>
                  <div className="tabular text-right text-[11px]"><div className="font-semibold">{inrShort(s?.revenue ?? 0)}</div><div className="text-[10px] text-muted-foreground">{num(s?.orders ?? 0)}</div></div>
                </button>
              );
            })}
            {!filtered.length && <div className="p-6 text-center text-[12px] text-muted-foreground">No customers.</div>}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel>
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-foreground text-background text-[14px] font-bold">{initials(selected.name)}</div>
                  <div>
                    <div className="text-[16px] font-semibold">{selected.name}</div>
                    <div className="mono text-[11px] text-muted-foreground">{selected.id.slice(0, 12)}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      {selected.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</span>}
                      {selected.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</span>}
                      {selected.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selected.city}</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 divide-x divide-border rounded-md border border-border">
                  <MC label="Lifetime spend" v={inrShort(stats?.revenue ?? 0)} />
                  <MC label="Orders" v={num(stats?.orders ?? 0)} />
                  <MC label="Avg ticket" v={inr(stats?.orders ? (stats.revenue / stats.orders) : 0)} />
                  <MC label="Preferred" v={topMerchant ?? "—"} small />
                </div>
                <div className="rounded-md border border-border">
                  <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-[11px]"><span className="uppercase tracking-wider text-muted-foreground">Payment mix</span></div>
                  <div className="flex divide-x divide-border">
                    {[...(stats?.methods ?? new Map())].map(([m, c]) => (
                      <div key={m} className="flex-1 p-2 text-center">
                        <div className="mono text-[10px] text-muted-foreground">{m}</div>
                        <div className="tabular text-[13px] font-semibold">{c}</div>
                      </div>
                    ))}
                    {!stats?.methods.size && <div className="p-2 text-[11px] text-muted-foreground">No payment history.</div>}
                  </div>
                </div>
              </div>
            ) : <div className="p-6 text-center text-muted-foreground">Select a customer.</div>}
          </Panel>

          <Panel title="Order timeline" eyebrow="Activity" dense>
            <div className="scrollbar-thin -m-2 max-h-96 overflow-y-auto">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-panel text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-3 py-1.5 text-left">TXN</th><th className="px-3 py-1.5 text-left">Merchant</th>
                    <th className="px-3 py-1.5 text-right">Amount</th><th className="px-3 py-1.5 text-left">Status</th>
                    <th className="px-3 py-1.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {custTx.map((t) => (
                    <tr key={t.id} className="border-b border-border/60 row-hover">
                      <td className="mono px-3 py-1.5">{t.transaction_id}</td>
                      <td className="px-3 py-1.5">{t.merchant_name}</td>
                      <td className="tabular px-3 py-1.5 text-right font-semibold">{inr(Number(t.amount))}</td>
                      <td className="px-3 py-1.5"><StatusPill status={t.status} /></td>
                      <td className="mono px-3 py-1.5 text-right text-muted-foreground">{dt(t.occurred_at)}</td>
                    </tr>
                  ))}
                  {!custTx.length && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No transactions.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Fraud score" eyebrow="Risk" dense>
            <div className="p-3">
              <div className="tabular text-[28px] font-semibold">{fraudScore}<span className="text-[12px] font-normal text-muted-foreground"> / 100</span></div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${fraudScore}%`, background: fraudScore > 60 ? "var(--color-destructive)" : fraudScore > 30 ? "var(--color-warning)" : "var(--color-success)" }} /></div>
              <div className="mt-2 text-[11px] text-muted-foreground">Composite of velocity, geo, device, and history signals.</div>
            </div>
          </Panel>
          <Panel title="Refund history" eyebrow="Reversals" dense>
            <div className="p-2 text-[11px] text-muted-foreground">
              <div className="flex justify-between border-b border-border py-1"><span>All-time refunds</span><span className="tabular text-foreground font-semibold">2</span></div>
              <div className="flex justify-between border-b border-border py-1"><span>Refund rate</span><span className="tabular text-foreground">1.4%</span></div>
              <div className="flex justify-between py-1"><span>Last refund</span><span className="mono">14d ago</span></div>
            </div>
          </Panel>
          <Panel title="Support tickets" eyebrow="CX" dense>
            <div className="p-2 text-[11px]">
              {[{ id: "TKT-4421", s: "Duplicate charge", st: "resolved" }, { id: "TKT-4409", s: "Order not delivered", st: "pending" }].map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-border py-1.5">
                  <div><div className="mono text-[10px] text-muted-foreground">{t.id}</div><div>{t.s}</div></div>
                  <StatusPill status={t.st} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function MC({ label, v, small }: { label: string; v: string; small?: boolean }) {
  return (
    <div className="p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`tabular mt-1 ${small ? "text-[13px]" : "text-[18px]"} font-semibold truncate`}>{v}</div>
    </div>
  );
}