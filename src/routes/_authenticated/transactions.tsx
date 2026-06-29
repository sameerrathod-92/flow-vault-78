import { createFileRoute } from "@tanstack/react-router";
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