import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { useCustomers, useTransactions } from "@/lib/queries";
import { dt, inr, num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const { data: customers = [] } = useCustomers();
  const { data: tx = [] } = useTransactions(2000);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const enriched = useMemo(() => {
    return customers.map((c) => {
      const own = tx.filter((t) => t.customer_id === c.id);
      const spend = own.filter((t) => t.status === "SUCCESS").reduce((s, t) => s + Number(t.amount), 0);
      const last = own[0];
      const fav = new Map<string, number>();
      own.forEach((t) => t.merchant_name && fav.set(t.merchant_name, (fav.get(t.merchant_name) ?? 0) + 1));
      const favourite = Array.from(fav.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      const refunds = own.filter((t) => t.status === "REFUND" || t.status === "REFUNDED");
      return { ...c, spend, last, favourite, refunds, history: own };
    });
  }, [customers, tx]);

  const filtered = enriched.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.email?.toLowerCase().includes(q.toLowerCase()));
  const detail = selected ? enriched.find((c) => c.id === selected) : enriched[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Profiles" subtitle={`${num(customers.length)} unique customers`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customers…" className="pl-9 bg-secondary/50" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {filtered.map((c) => (
              <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full rounded-xl border p-3 text-left transition-colors glass hover:bg-secondary/40 ${(detail?.id === c.id) ? "border-primary/60" : "border-border/50"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email ?? c.phone ?? "—"}</div>
                  </div>
                  <div className="text-right font-mono text-xs font-semibold">{inr(c.spend)}</div>
                </div>
              </button>
            ))}
            {!filtered.length && <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">No customers yet.</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 p-5 glass shadow-elegant lg:col-span-2">
          {detail ? (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-xl font-semibold" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                  {detail.name.charAt(0)}
                </div>
                <div>
                  <div className="font-display text-xl font-semibold">{detail.name}</div>
                  <div className="text-xs text-muted-foreground">{detail.email ?? "—"} · {detail.phone ?? "—"} · {detail.city ?? "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Mini label="Total Spending" value={inr(detail.spend)} />
                <Mini label="Transactions" value={String(detail.history.length)} />
                <Mini label="Last Txn" value={detail.last ? dt(detail.last.occurred_at) : "—"} />
                <Mini label="Favourite" value={detail.favourite} />
              </div>

              <div>
                <div className="mb-2 font-display text-sm font-semibold">Payment History</div>
                <div className="overflow-hidden rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-left text-[10px] uppercase text-muted-foreground">
                      <tr><th className="px-3 py-2">TXN</th><th className="px-3 py-2">Merchant</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">When</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {detail.history.slice(0, 12).map((t) => (
                        <tr key={t.id}>
                          <td className="px-3 py-2 font-mono text-[11px]">{t.transaction_id}</td>
                          <td className="px-3 py-2">{t.merchant_name}</td>
                          <td className="px-3 py-2 text-right font-mono">{inr(Number(t.amount))}</td>
                          <td className="px-3 py-2"><StatusPill status={t.status} /></td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{dt(t.occurred_at)}</td>
                        </tr>
                      ))}
                      {!detail.history.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No transactions.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {detail.refunds.length > 0 && (
                <div>
                  <div className="mb-2 font-display text-sm font-semibold">Refund History</div>
                  <div className="space-y-2">
                    {detail.refunds.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-sm">
                        <span className="font-mono text-xs">{r.transaction_id}</span>
                        <span className="font-mono font-semibold">{inr(Number(r.amount))}</span>
                        <span className="text-xs text-muted-foreground">{dt(r.occurred_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center text-muted-foreground">Select a customer</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-sm font-semibold">{value}</div>
    </div>
  );
}