import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader, StatusPill } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useFraudAlerts, useTransactions } from "@/lib/queries";
import { dt, inr, num } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldAlert, AlertTriangle, Repeat, Copy, XCircle, ScanSearch } from "lucide-react";

export const Route = createFileRoute("/_authenticated/fraud")({
  component: FraudPage,
});

const LARGE_THRESHOLD = 25000;

function FraudPage() {
  const { data: tx = [] } = useTransactions(2000);
  const { data: alerts = [], refetch } = useFraudAlerts();

  const detected = useMemo(() => {
    const large = tx.filter((t) => Number(t.amount) >= LARGE_THRESHOLD);
    const failed = tx.filter((t) => t.status === "FAILED");
    const byCustomer = new Map<string, typeof tx>();
    tx.forEach((t) => {
      const k = t.customer_id ?? t.customer_name ?? "";
      if (!k) return;
      byCustomer.set(k, [...(byCustomer.get(k) ?? []), t]);
    });
    const multiple: typeof tx = [];
    byCustomer.forEach((arr) => {
      const within5min = arr
        .slice()
        .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
      for (let i = 1; i < within5min.length; i++) {
        if (new Date(within5min[i].occurred_at).getTime() - new Date(within5min[i - 1].occurred_at).getTime() < 5 * 60 * 1000) {
          multiple.push(within5min[i]);
        }
      }
    });
    const seen = new Map<string, number>();
    const duplicates: typeof tx = [];
    tx.forEach((t) => {
      const k = `${t.customer_id ?? t.customer_name}-${t.amount}-${t.merchant_id}`;
      seen.set(k, (seen.get(k) ?? 0) + 1);
      if ((seen.get(k) ?? 0) > 1) duplicates.push(t);
    });
    return { large, failed, multiple, duplicates };
  }, [tx]);

  const runScan = async () => {
    const inserts: any[] = [];
    detected.large.forEach((t) => inserts.push({ transaction_id: t.id, alert_type: "large_transaction", severity: "high", description: `Amount ${inr(Number(t.amount))} above threshold` }));
    detected.failed.forEach((t) => inserts.push({ transaction_id: t.id, alert_type: "failed_transaction", severity: "low", description: "Payment failed" }));
    detected.multiple.forEach((t) => inserts.push({ transaction_id: t.id, alert_type: "rapid_multiple", severity: "medium", description: "Multiple rapid payments by same customer" }));
    detected.duplicates.forEach((t) => inserts.push({ transaction_id: t.id, alert_type: "duplicate_transaction", severity: "medium", description: "Possible duplicate transaction" }));
    if (!inserts.length) return toast.info("No new alerts");
    const { error } = await supabase.from("fraud_alerts").insert(inserts);
    if (error) return toast.error(error.message);
    toast.success(`${inserts.length} alerts logged`);
    refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fraud Detection"
        subtitle="Realtime anomaly scanning across the transaction stream"
        actions={
          <Button onClick={runScan} className="gap-2" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
            <ScanSearch className="h-4 w-4" /> Run Fraud Scan
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Tile icon={AlertTriangle} label="Large Transactions" value={num(detected.large.length)} tone="warning" />
        <Tile icon={Repeat} label="Rapid Multiple Payments" value={num(detected.multiple.length)} tone="warning" />
        <Tile icon={XCircle} label="Failed Transactions" value={num(detected.failed.length)} tone="destructive" />
        <Tile icon={Copy} label="Duplicate Transactions" value={num(detected.duplicates.length)} tone="accent" />
      </div>

      <div className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
        <h3 className="mb-3 font-display text-lg font-semibold">Suspicious Activity Alerts</h3>
        <div className="overflow-hidden rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Transaction</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {alerts.map((a: any) => (
                <tr key={a.id}>
                  <td className="px-3 py-2 font-medium">{a.alert_type.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2"><StatusPill status={a.severity === "high" ? "failed" : a.severity === "medium" ? "pending" : "muted"} /></td>
                  <td className="px-3 py-2 font-mono text-xs">{a.transaction?.transaction_id ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{a.transaction ? inr(Number(a.transaction.amount)) : "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{a.description}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{dt(a.created_at)}</td>
                </tr>
              ))}
              {!alerts.length && <tr><td colSpan={6} className="px-3 py-12 text-center text-muted-foreground"><ShieldAlert className="mx-auto mb-2 h-6 w-6" />No alerts logged. Run a scan to detect anomalies.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "warning" | "destructive" | "accent" }) {
  const color = tone === "destructive" ? "text-rose-400" : tone === "accent" ? "text-cyan-400" : "text-amber-400";
  return (
    <div className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={`mt-2 font-display text-3xl font-semibold ${color}`}>{value}</div>
        </div>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  );
}