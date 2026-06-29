import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader, StatusPill } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useMerchants, useSettlements, useTransactions } from "@/lib/queries";
import { date, inr, num } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet, Plus, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settlements")({
  component: SettlementsPage,
});

function SettlementsPage() {
  const { data: settlements = [], refetch } = useSettlements();
  const { data: tx = [] } = useTransactions(2000);
  const { data: merchants = [] } = useMerchants();

  const totals = useMemo(() => {
    const pending = settlements.filter((s) => s.status === "pending");
    const completed = settlements.filter((s) => s.status === "completed" || s.status === "settled");
    return {
      pending: pending.reduce((s, x) => s + Number(x.amount), 0),
      completed: completed.reduce((s, x) => s + Number(x.amount), 0),
      pendingCount: pending.length,
      completedCount: completed.length,
    };
  }, [settlements]);

  const generate = async () => {
    const by = new Map<string, number>();
    tx.filter((t) => t.status === "SUCCESS" && t.merchant_id).forEach((t) => {
      by.set(t.merchant_id!, (by.get(t.merchant_id!) ?? 0) + Number(t.amount));
    });
    const settledMap = new Map<string, number>();
    settlements.forEach((s) => settledMap.set(s.merchant_id, (settledMap.get(s.merchant_id) ?? 0) + Number(s.amount)));
    const rows = Array.from(by.entries())
      .map(([merchant_id, total]) => ({ merchant_id, due: total - (settledMap.get(merchant_id) ?? 0) }))
      .filter((r) => r.due > 100)
      .map((r) => ({
        merchant_id: r.merchant_id,
        amount: Math.round(r.due * 0.98 * 100) / 100,
        fee: Math.round(r.due * 0.02 * 100) / 100,
        status: "pending",
        reference: `STL-${Date.now().toString(36).toUpperCase()}-${r.merchant_id.slice(0, 4)}`,
      }));
    if (!rows.length) return toast.info("Nothing to settle.");
    const { error } = await supabase.from("settlements").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Queued ${rows.length} settlements`);
    refetch();
  };

  const markComplete = async (id: string) => {
    const { error } = await supabase.from("settlements").update({ status: "completed", settled_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({ type: "settlement_complete", title: "Settlement complete", message: `Settlement ${id.slice(0, 8)} marked complete.` });
    refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settlements"
        subtitle={`${num(merchants.length)} merchants · ${num(settlements.length)} settlement records`}
        actions={
          <Button onClick={generate} className="gap-2" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
            <Plus className="h-4 w-4" /> Generate Settlements
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Pending Settlement" value={inr(totals.pending)} subtitle={`${totals.pendingCount} payouts queued`} tone="warning" />
        <Card title="Completed Settlement" value={inr(totals.completed)} subtitle={`${totals.completedCount} payouts settled`} tone="success" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 glass shadow-elegant">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-right font-medium">Fee</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Settlement Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {settlements.map((s: any) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-mono text-xs">{s.reference}</td>
                <td className="px-4 py-3">{s.merchant?.name ?? s.merchant_id?.slice(0, 8)}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{inr(Number(s.amount))}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{inr(Number(s.fee))}</td>
                <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{s.settled_at ? date(s.settled_at) : "—"}</td>
                <td className="px-4 py-3 text-right">
                  {s.status === "pending" && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => markComplete(s.id)}>
                      <Check className="h-3 w-3" /> Mark Complete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!settlements.length && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No settlements yet — click "Generate Settlements" to compute payouts.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value, subtitle, tone }: { title: string; value: string; subtitle: string; tone: "success" | "warning" }) {
  const c = tone === "success" ? "text-emerald-400" : "text-amber-400";
  return (
    <div className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
          <div className={`mt-2 font-display text-3xl font-semibold ${c}`}>{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/40">
          <Wallet className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}