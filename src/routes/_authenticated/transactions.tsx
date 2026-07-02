import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTransactions, type Transaction } from "@/lib/queries";
import { PageHeader, Panel, StatusPill } from "@/components/page-header";
import { inr, dt, time } from "@/lib/format";
import { Search, Filter, Download, ChevronLeft, ChevronRight, X, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

const METHODS = ["ALL", "UPI", "CARD", "WALLET", "NETBANKING"] as const;
const STATUSES = ["ALL", "SUCCESS", "PENDING", "FAILED", "REFUND", "CANCELLED"] as const;

function riskScore(t: Transaction) {
  const amt = Number(t.amount);
  const base = amt > 50_000 ? 68 : amt > 25_000 ? 42 : amt > 10_000 ? 22 : 8;
  const seed = t.id.charCodeAt(0) + t.id.charCodeAt(3);
  return Math.min(96, base + (seed % 22));
}

function TransactionsPage() {
  const { data: tx = [], isLoading } = useTransactions(1000);
  const [q, setQ] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("ALL");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [minAmt, setMinAmt] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tx.filter((t) => {
      if (query && !`${t.transaction_id} ${t.merchant_name} ${t.customer_name} ${t.order_id}`.toLowerCase().includes(query)) return false;
      if (method !== "ALL" && t.payment_method !== method) return false;
      if (status !== "ALL" && t.status !== status) return false;
      if (minAmt && Number(t.amount) < Number(minAmt)) return false;
      return true;
    });
  }, [tx, q, method, status, minAmt]);

  const selected = rows.find((r) => r.id === selectedId) ?? rows[0] ?? null;

  const kpi = useMemo(() => {
    const total = rows.reduce((s, t) => s + Number(t.amount), 0);
    const success = rows.filter((r) => r.status === "SUCCESS").length;
    const pending = rows.filter((r) => r.status === "PENDING").length;
    const failed = rows.filter((r) => r.status === "FAILED").length;
    return { total, success, pending, failed };
  }, [rows]);

  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow="Ledger"
        title="Transactions"
        subtitle="Live ingest stream from partner merchant checkouts. Row updates propagate within 250ms."
        meta={
          <div className="mono flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>
              <span className="tabular text-foreground">{rows.length.toLocaleString()}</span> results ·{" "}
              <span className="tabular text-foreground">{inr(kpi.total)}</span> total
            </span>
          </div>
        }
        actions={
          <>
            <button className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-[11px] text-muted-foreground row-hover hover:text-foreground">
              <Filter className="h-3 w-3" /> Saved views
            </button>
            <button className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-foreground px-2 text-[11px] font-semibold text-background hover:opacity-90">
              <Download className="h-3 w-3" /> Export
            </button>
          </>
        }
      />

      <div className="panel flex flex-wrap items-center gap-2 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="TXN ID, merchant, customer, order…"
            className="mono h-7 w-72 rounded-md border border-border bg-panel-2 pl-7 pr-2 text-[12px] outline-none focus:border-foreground/40"
          />
        </div>
        <div className="flex overflow-hidden rounded-md border border-border">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`h-7 px-2 text-[11px] font-medium border-r border-border last:border-r-0 ${status === s ? "bg-foreground text-background" : "text-muted-foreground row-hover hover:text-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-md border border-border">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`h-7 px-2 text-[11px] font-medium border-r border-border last:border-r-0 ${method === m ? "bg-foreground text-background" : "text-muted-foreground row-hover hover:text-foreground"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <input
          value={minAmt}
          onChange={(e) => setMinAmt(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Min ₹"
          className="tabular h-7 w-20 rounded-md border border-border bg-panel-2 px-2 text-[12px] outline-none focus:border-foreground/40"
        />
        <div className="ml-auto mono flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>Success <span className="tabular text-[color:var(--color-success)] font-semibold">{kpi.success}</span></span>
          <span>Pending <span className="tabular text-[color:var(--color-warning)] font-semibold">{kpi.pending}</span></span>
          <span>Failed <span className="tabular text-[color:var(--color-destructive)] font-semibold">{kpi.failed}</span></span>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: selected ? "minmax(0,1fr) 520px" : "1fr" }}>
        <Panel dense className="min-h-[70vh]">
          <div className="scrollbar-thin -m-2 overflow-auto">
            <table className="w-full min-w-[900px] text-[12px]">
              <thead className="sticky top-0 z-10 bg-panel text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-1.5 text-left">Transaction ID</th>
                  <th className="px-3 py-1.5 text-left">Merchant</th>
                  <th className="px-3 py-1.5 text-left">Customer</th>
                  <th className="px-3 py-1.5 text-right">Amount</th>
                  <th className="px-3 py-1.5 text-left">Method</th>
                  <th className="px-3 py-1.5 text-left">Status</th>
                  <th className="px-3 py-1.5 text-right">Risk</th>
                  <th className="px-3 py-1.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Loading ledger…</td></tr>
                )}
                {!isLoading && rows.slice(0, 300).map((t) => {
                  const r = riskScore(t);
                  const active = selected?.id === t.id;
                  return (
                    <tr key={t.id} onClick={() => setSelectedId(t.id)} className={`cursor-pointer border-b border-border/60 ${active ? "bg-accent" : "row-hover"}`}>
                      <td className="mono px-3 py-1.5 text-foreground">{t.transaction_id}</td>
                      <td className="px-3 py-1.5">{t.merchant_name ?? "—"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{t.customer_name ?? "—"}</td>
                      <td className="tabular px-3 py-1.5 text-right font-semibold">{inr(Number(t.amount))}</td>
                      <td className="mono px-3 py-1.5 text-[11px] text-muted-foreground">{t.payment_method}</td>
                      <td className="px-3 py-1.5"><StatusPill status={t.status} /></td>
                      <td className="px-3 py-1.5 text-right">
                        <span className={`mono tabular text-[11px] font-semibold ${r > 65 ? "text-[color:var(--color-destructive)]" : r > 40 ? "text-[color:var(--color-warning)]" : "text-[color:var(--color-success)]"}`}>{r}</span>
                      </td>
                      <td className="mono px-3 py-1.5 text-right text-[11px] text-muted-foreground">{time(t.occurred_at)}</td>
                    </tr>
                  );
                })}
                {!isLoading && rows.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No transactions match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <AnimatePresence>
          {selected && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <TxnDrawer tx={selected} onClose={() => setSelectedId(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TxnDrawer({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const [tab, setTab] = useState<"overview" | "timeline" | "payload" | "webhook" | "risk" | "settlement" | "audit" | "receipt">("overview");
  const risk = riskScore(tx);
  const tabs: [typeof tab, string][] = [
    ["overview", "Overview"], ["timeline", "Timeline"], ["payload", "Payload"], ["webhook", "Webhook"],
    ["risk", "Risk"], ["settlement", "Settlement"], ["audit", "Audit"], ["receipt", "Receipt"],
  ];
  return (
    <div className="panel sticky top-[60px] flex max-h-[calc(100vh-80px)] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Transaction detail</div>
          <div className="mono text-[13px] font-semibold">{tx.transaction_id}</div>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded p-1 text-muted-foreground row-hover hover:text-foreground" title="Copy ID"><Copy className="h-3.5 w-3.5" /></button>
          <button className="rounded p-1 text-muted-foreground row-hover hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></button>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground row-hover hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="border-b border-border p-3">
          <div className="tabular text-[26px] font-semibold tracking-tight">{inr(Number(tx.amount))}</div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <StatusPill status={tx.status} /> · {tx.payment_method} · {dt(tx.occurred_at)}
          </div>
        </div>

        <nav className="scrollbar-hidden flex overflow-x-auto border-b border-border">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap border-b-2 px-3 py-1.5 text-[11px] font-medium ${tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground row-hover hover:text-foreground"}`}>{l}</button>
          ))}
        </nav>

        <div className="p-3 text-[12px]">
          {tab === "overview" && (
            <div className="space-y-3">
              <KV k="Merchant" v={tx.merchant_name ?? "—"} sub={tx.merchant_code ?? ""} />
              <KV k="Customer" v={tx.customer_name ?? "—"} sub={tx.customer_id?.slice(0, 12)} />
              <KV k="Order ID" v={tx.order_id ?? "—"} mono />
              <KV k="Type" v={tx.transaction_type ?? "payment"} />
              <KV k="Booking" v={tx.booking_type ?? "dine-in"} />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <MiniStat label="Base" value={inr(Number(tx.amount) - Number(tx.tax))} />
                <MiniStat label="GST 18%" value={inr(Number(tx.tax))} />
                <MiniStat label="Payable" value={inr(Number(tx.amount))} />
              </div>
            </div>
          )}
          {tab === "timeline" && (
            <ol className="relative space-y-3 border-l border-border pl-4">
              {["Order placed", "Payment initiated", "Bank auth received", "Settled to merchant"].map((s, i) => (
                <li key={s} className="relative">
                  <span className="absolute -left-[19px] top-1 h-2 w-2 rounded-full bg-foreground" />
                  <div className="text-[12px] font-medium">{s}</div>
                  <div className="mono text-[11px] text-muted-foreground">{time(tx.occurred_at)} · +{i * 380}ms</div>
                </li>
              ))}
            </ol>
          )}
          {tab === "payload" && (
            <pre className="mono scrollbar-thin max-h-96 overflow-auto rounded-md border border-border bg-panel-2 p-3 text-[11px]">{JSON.stringify({ transaction_id: tx.transaction_id, order_id: tx.order_id, merchant: { code: tx.merchant_code, name: tx.merchant_name }, amount: Number(tx.amount), tax: Number(tx.tax), payment_method: tx.payment_method, status: tx.status, customer: { name: tx.customer_name }, occurred_at: tx.occurred_at, items: tx.items ?? [] }, null, 2)}</pre>
          )}
          {tab === "webhook" && (
            <div className="space-y-2 text-[12px]">
              <KV k="Endpoint" v={"https://api.merchant.example/hooks/nexus"} mono />
              <KV k="Attempts" v={"1 of 3"} />
              <KV k="Last status" v={"200 OK"} />
              <KV k="Signature" v={"sha256=8f4a…9c2b"} mono />
              <div className="mt-2 rounded-md border border-border bg-panel-2 p-2 mono text-[11px] text-muted-foreground">
                x-nexus-event: payment.captured{"\n"}x-nexus-delivery: {tx.id.slice(0, 12)}
              </div>
            </div>
          )}
          {tab === "risk" && (
            <div className="space-y-3">
              <div className="rounded-md border border-border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk score</div>
                <div className="tabular mt-1 text-[28px] font-semibold">{risk} <span className="text-[12px] font-normal text-muted-foreground">/ 100</span></div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${risk}%`, background: risk > 65 ? "var(--color-destructive)" : risk > 40 ? "var(--color-warning)" : "var(--color-success)" }} />
                </div>
              </div>
              <KV k="IP" v="103.24.88.14" mono />
              <KV k="Device" v="Chrome 124 / macOS" />
              <KV k="Geo" v="Mumbai, IN" />
              <KV k="Velocity" v="2 txns · 15 min" />
            </div>
          )}
          {tab === "settlement" && (
            <div className="space-y-2">
              <KV k="Batch" v="SB-7742" mono />
              <KV k="Stage" v="Processing" />
              <KV k="Net payout" v={inr(Number(tx.amount) * 0.978)} />
              <KV k="Fee (2.2%)" v={inr(Number(tx.amount) * 0.022)} />
              <KV k="Expected T+1" v={dt(new Date(Date.now() + 86_400_000).toISOString())} />
            </div>
          )}
          {tab === "audit" && (
            <div className="space-y-2 text-[12px]">
              {["created", "authorized", "captured"].map((e) => (
                <div key={e} className="flex items-center justify-between border-b border-border pb-1.5">
                  <div className="mono">{e}</div>
                  <div className="text-muted-foreground">system · {time(tx.occurred_at)}</div>
                </div>
              ))}
            </div>
          )}
          {tab === "receipt" && (
            <div className="rounded-md border border-border p-3 text-[12px]">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{tx.merchant_name}</div>
                <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-success)]" />
              </div>
              <div className="mono mt-1 text-[10px] text-muted-foreground">Order {tx.order_id} · {dt(tx.occurred_at)}</div>
              <div className="my-2 border-t border-dashed border-border" />
              <div className="tabular flex justify-between"><span>Subtotal</span><span>{inr(Number(tx.amount) - Number(tx.tax))}</span></div>
              <div className="tabular flex justify-between text-muted-foreground"><span>GST 18%</span><span>{inr(Number(tx.tax))}</span></div>
              <div className="tabular mt-1 flex justify-between border-t border-dashed border-border pt-1 font-semibold"><span>Paid</span><span>{inr(Number(tx.amount))}</span></div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2"><span className="kbd">J</span><span className="kbd">K</span><span>navigate</span></div>
        <div className="flex items-center gap-1">
          <button className="rounded border border-border p-1 row-hover"><ChevronLeft className="h-3 w-3" /></button>
          <button className="rounded border border-border p-1 row-hover"><ChevronRight className="h-3 w-3" /></button>
        </div>
      </div>
    </div>
  );
}

function KV({ k, v, sub, mono }: { k: string; v: React.ReactNode; sub?: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3 border-b border-border pb-2 text-[12px]">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</span>
      <div>
        <div className={mono ? "mono" : ""}>{v}</div>
        {sub && <div className="mono text-[10px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="tabular mt-1 text-[13px] font-semibold">{value}</div>
    </div>
  );
}