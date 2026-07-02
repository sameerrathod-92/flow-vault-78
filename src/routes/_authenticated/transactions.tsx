import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTransactions, type Transaction } from "@/lib/queries";
import { PageHeader, Panel, StatusPill } from "@/components/page-header";
import { inr, dt, time } from "@/lib/format";
import { CATEGORIES, MERCHANT_NAMES, initials } from "@/lib/demo";
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

/* ---------- helpers ---------- */

const METHODS = ["ALL", "UPI", "CARD", "WALLET", "NETBANKING"] as const;
const STATUSES = ["ALL", "SUCCESS", "PENDING", "FAILED", "REFUND", "CANCELLED"] as const;

function riskScore(t: Transaction) {
  const amt = Number(t.amount);
  const base = amt > 50_000 ? 68 : amt > 25_000 ? 42 : amt > 10_000 ? 22 : 8;
  const seed = t.id.charCodeAt(0) + t.id.charCodeAt(3);
  return Math.min(96, base + (seed % 22));
}

/* ---------- page ---------- */

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
      if (query && !`${t.transaction_id} ${t.merchant_name} ${t.customer_name} ${t.order_id}`.toLowerCase().includes(query))
        return false;
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

      {/* Filter bar */}
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
              className={`h-7 px-2 text-[11px] font-medium border-r border-border last:border-r-0 ${
                status === s ? "bg-foreground text-background" : "text-muted-foreground row-hover hover:text-foreground"
              }`}
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
              className={`h-7 px-2 text-[11px] font-medium border-r border-border last:border-r-0 ${
                method === m ? "bg-foreground text-background" : "text-muted-foreground row-hover hover:text-foreground"
              }`}
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
          <span>
            Success <span className="tabular text-[color:var(--color-success)] font-semibold">{kpi.success}</span>
          </span>
          <span>
            Pending <span className="tabular text-[color:var(--color-warning)] font-semibold">{kpi.pending}</span>
          </span>
          <span>
            Failed <span className="tabular text-[color:var(--color-destructive)] font-semibold">{kpi.failed}</span>
          </span>
        </div>
      </div>

      {/* Table + drawer */}
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
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      Loading ledger…
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  rows.slice(0, 300).map((t) => {
                    const r = riskScore(t);
                    const active = selected?.id === t.id;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        className={`cursor-pointer border-b border-border/60 ${
                          active ? "bg-accent" : "row-hover"
                        }`}
                      >
                        <td className="mono px-3 py-1.5 text-foreground">{t.transaction_id}</td>
                        <td className="px-3 py-1.5">{t.merchant_name ?? "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{t.customer_name ?? "—"}</td>
                        <td className="tabular px-3 py-1.5 text-right font-semibold">{inr(Number(t.amount))}</td>
                        <td className="mono px-3 py-1.5 text-[11px] text-muted-foreground">{t.payment_method}</td>
                        <td className="px-3 py-1.5">
                          <StatusPill status={t.status} />
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <span
                            className={`mono tabular text-[11px] font-semibold ${
                              r > 65 ? "text-[color:var(--color-destructive)]" : r > 40 ? "text-[color:var(--color-warning)]" : "text-[color:var(--color-success)]"
                            }`}
                          >
                            {r}
                          </span>
                        </td>
                        <td className="mono px-3 py-1.5 text-right text-[11px] text-muted-foreground">
                          {time(t.occurred_at)}
                        </td>
                      </tr>
                    );
                  })}
                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No transactions match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <TxnDrawer tx={selected} onClose={() => setSelectedId(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- drawer ---------- */

function TxnDrawer({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const [tab, setTab] = useState<"overview" | "timeline" | "payload" | "webhook" | "risk" | "settlement" | "audit" | "receipt">("overview");
  const risk = riskScore(tx);
  const tabs: [typeof tab, string][] = [
    ["overview", "Overview"],
    ["timeline", "Timeline"],
    ["payload", "API Payload"],
    ["webhook", "Webhook"],
    ["risk", "Risk"],
    ["settlement", "Settlement"],
    ["audit", "Audit"],
    ["receipt", "Receipt"],
  ];
  return (
    <div className="panel sticky top-[60px] flex max-h-[calc(100vh-80px)] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Transaction detail</div>
          <div className="mono text-[13px] font-semibold">{tx.transaction_id}</div>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded p-1 text-muted-foreground row-hover hover:text-foreground" title="Copy ID">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button className="rounded p-1 text-muted-foreground row-hover hover:text-foreground" title="Open">
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground row-hover hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
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
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`whitespace-nowrap border-b-2 px-3 py-1.5 text-[11px] font-medium ${
                tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground row-hover hover:text-foreground"
              }`}
            >
              {l}
            </button>
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
                  <div className="mono text-[11px] text-muted-foreground">
                    {time(tx.occurred_at)} · +{i * 380}ms
                  </div>
                </li>
              ))}
            </ol>
          )}
          {tab === "payload" && (
            <pre className="mono scrollbar-thin max-h-96 overflow-auto rounded-md border border-border bg-panel-2 p-3 text-[11px]">
{JSON.stringify(
  {
    transaction_id: tx.transaction_id,
    order_id: tx.order_id,
    merchant: { code: tx.merchant_code, name: tx.merchant_name },
    amount: Number(tx.amount),
    tax: Number(tx.tax),
    payment_method: tx.payment_method,
    status: tx.status,
    customer: { name: tx.customer_name },
    occurred_at: tx.occurred_at,
    items: tx.items ?? [],
  },
  null,
  2,
)}
            </pre>
          )}
          {tab === "webhook" && (
            <div className="space-y-2 text-[12px]">
              <KV k="Endpoint" v={"https://api.merchant.example/hooks/nexus"} mono />
              <KV k="Attempts" v={"1 of 3"} />
              <KV k="Last status" v={"200 OK"} />
              <KV k="Signature" v={"sha256=8f4a…9c2b"} mono />
              <div className="mt-2 rounded-md border border-border bg-panel-2 p-2 mono text-[11px] text-muted-foreground">
                x-nexus-event: payment.captured{"\n"}
                x-nexus-delivery: {tx.id.slice(0, 12)}
              </div>
            </div>
          )}
          {tab === "risk" && (
            <div className="space-y-3">
              <div className="rounded-md border border-border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk score</div>
                <div className="tabular mt-1 text-[28px] font-semibold">
                  {risk} <span className="text-[12px] font-normal text-muted-foreground">/ 100</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${risk}%`,
                      background:
                        risk > 65
                          ? "var(--color-destructive)"
                          : risk > 40
                            ? "var(--color-warning)"
                            : "var(--color-success)",
                    }}
                  />
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
              <div className="mono mt-1 text-[10px] text-muted-foreground">
                Order {tx.order_id} · {dt(tx.occurred_at)}
              </div>
              <div className="my-2 border-t border-dashed border-border" />
              <div className="tabular flex justify-between">
                <span>Subtotal</span>
                <span>{inr(Number(tx.amount) - Number(tx.tax))}</span>
              </div>
              <div className="tabular flex justify-between text-muted-foreground">
                <span>GST 18%</span>
                <span>{inr(Number(tx.tax))}</span>
              </div>
              <div className="tabular mt-1 flex justify-between border-t border-dashed border-border pt-1 font-semibold">
                <span>Paid</span>
                <span>{inr(Number(tx.amount))}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="kbd">J</span>
          <span className="kbd">K</span>
          <span>navigate</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded border border-border p-1 row-hover">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button className="rounded border border-border p-1 row-hover">
            <ChevronRight className="h-3 w-3" />
          </button>
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
import { useMemo, useState } from "react";
import { Download, Search, Filter } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMerchants, useTransactions } from "@/lib/queries";
import { dt, inr, num, time, toCSV, download } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const { data: tx = [], isLoading } = useTransactions(2000);
  const { data: merchants = [] } = useMerchants();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [merchant, setMerchant] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [minAmt, setMinAmt] = useState("");

  const filtered = useMemo(() => {
    return tx.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (method !== "all" && t.payment_method !== method) return false;
      if (merchant !== "all" && t.merchant_id !== merchant) return false;
      if (dateFrom && new Date(t.occurred_at) < new Date(dateFrom)) return false;
      if (minAmt && Number(t.amount) < Number(minAmt)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [t.transaction_id, t.merchant_name, t.customer_name, t.order_id].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tx, search, status, method, merchant, dateFrom, minAmt]);

  const methods = useMemo(() => Array.from(new Set(tx.map((t) => t.payment_method))), [tx]);

  const exportCSV = () => {
    const rows = filtered.map((t) => ({
      transaction_id: t.transaction_id,
      merchant: t.merchant_name,
      customer: t.customer_name,
      order_id: t.order_id,
      amount: t.amount,
      gst: t.tax,
      method: t.payment_method,
      status: t.status,
      type: t.transaction_type,
      booking: t.booking_type,
      datetime: t.occurred_at,
    }));
    download(`transactions-${Date.now()}.csv`, toCSV(rows));
  };

  const exportExcel = () => {
    const rows = filtered.map((t) => ({
      "Transaction ID": t.transaction_id,
      Merchant: t.merchant_name,
      Customer: t.customer_name,
      "Order ID": t.order_id,
      Amount: t.amount,
      GST: t.tax,
      Method: t.payment_method,
      Status: t.status,
      Type: t.transaction_type,
      Booking: t.booking_type,
      Date: t.occurred_at,
    }));
    download(`transactions-${Date.now()}.xls`, toCSV(rows), "application/vnd.ms-excel");
  };

  const exportPDF = () => {
    const html = `<!doctype html><html><head><title>Transactions</title>
      <style>body{font-family:Inter,system-ui;padding:24px}h1{margin:0 0 16px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f4f5f7}</style>
      </head><body><h1>Nexus Bank — Transactions Report</h1>
      <table><thead><tr><th>TXN</th><th>Merchant</th><th>Customer</th><th>Order</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead><tbody>
      ${filtered.map((t) => `<tr><td>${t.transaction_id}</td><td>${t.merchant_name ?? ""}</td><td>${t.customer_name ?? ""}</td><td>${t.order_id ?? ""}</td><td>${inr(Number(t.amount))}</td><td>${t.payment_method}</td><td>${t.status}</td><td>${dt(t.occurred_at)}</td></tr>`).join("")}
      </tbody></table></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle={isLoading ? "Loading…" : `${num(filtered.length)} of ${num(tx.length)} transactions`}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={exportCSV}>CSV</DropdownMenuItem>
              <DropdownMenuItem onSelect={exportExcel}>Excel</DropdownMenuItem>
              <DropdownMenuItem onSelect={exportPDF}>PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="rounded-2xl border border-border/50 p-4 glass shadow-elegant">
        <div className="grid gap-3 md:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search TXN / merchant / customer…" className="pl-9 bg-secondary/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Input type="date" className="bg-secondary/50" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="number" placeholder="Min amount" className="bg-secondary/50" value={minAmt} onChange={(e) => setMinAmt(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REFUND">Refund</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              {methods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-6">
          <Select value={merchant} onValueChange={setMerchant}>
            <SelectTrigger className="bg-secondary/50 md:col-span-2"><SelectValue placeholder="Merchant" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All merchants</SelectItem>
              {merchants.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={() => { setSearch(""); setStatus("all"); setMethod("all"); setMerchant("all"); setDateFrom(""); setMinAmt(""); }}>
            <Filter className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 glass shadow-elegant">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Transaction ID</th>
                <th className="px-4 py-3 font-medium">Merchant</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">GST</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.slice(0, 200).map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs">{t.transaction_id}</td>
                  <td className="px-4 py-3 font-medium">{t.merchant_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.customer_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.order_id}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{inr(Number(t.amount))}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{inr(Number(t.tax))}</td>
                  <td className="px-4 py-3"><span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{t.payment_method}</span></td>
                  <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.transaction_type}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.booking_type}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.occurred_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{time(t.occurred_at)}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-muted-foreground">No transactions match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 200 && (
          <div className="border-t border-border/40 bg-secondary/30 px-4 py-2 text-center text-xs text-muted-foreground">
            Showing 200 of {num(filtered.length)} — refine filters or export to see more.
          </div>
        )}
      </div>
    </div>
  );
}