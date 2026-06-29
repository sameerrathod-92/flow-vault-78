import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download, CalendarDays, CalendarRange, Calendar, Store, Users, IndianRupee } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useCustomers, useMerchants, useTransactions } from "@/lib/queries";
import { inr, num, toCSV, download } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data: tx = [] } = useTransactions(5000);
  const { data: merchants = [] } = useMerchants();
  const { data: customers = [] } = useCustomers();

  const summary = useMemo(() => {
    const now = Date.now();
    const day = tx.filter((t) => now - new Date(t.occurred_at).getTime() < 24 * 3600e3);
    const week = tx.filter((t) => now - new Date(t.occurred_at).getTime() < 7 * 24 * 3600e3);
    const month = tx.filter((t) => now - new Date(t.occurred_at).getTime() < 30 * 24 * 3600e3);
    const rev = (a: typeof tx) => a.filter((t) => t.status === "SUCCESS").reduce((s, t) => s + Number(t.amount), 0);
    return {
      day: { count: day.length, rev: rev(day) },
      week: { count: week.length, rev: rev(week) },
      month: { count: month.length, rev: rev(month) },
    };
  }, [tx]);

  const exportDaily = () => downloadCSV("daily", tx.filter((t) => Date.now() - new Date(t.occurred_at).getTime() < 24 * 3600e3));
  const exportWeekly = () => downloadCSV("weekly", tx.filter((t) => Date.now() - new Date(t.occurred_at).getTime() < 7 * 24 * 3600e3));
  const exportMonthly = () => downloadCSV("monthly", tx.filter((t) => Date.now() - new Date(t.occurred_at).getTime() < 30 * 24 * 3600e3));

  const exportMerchant = () => {
    const rows = merchants.map((m: any) => {
      const own = tx.filter((t) => t.merchant_id === m.id);
      const success = own.filter((t) => t.status === "SUCCESS");
      return {
        merchant_code: m.merchant_code, name: m.name, city: m.city, status: m.connection_status,
        orders: own.length, successful: success.length,
        revenue: success.reduce((s, t) => s + Number(t.amount), 0),
      };
    });
    download(`merchant-report-${Date.now()}.csv`, toCSV(rows));
  };

  const exportCustomer = () => {
    const rows = customers.map((c: any) => {
      const own = tx.filter((t) => t.customer_id === c.id);
      const spend = own.filter((t) => t.status === "SUCCESS").reduce((s, t) => s + Number(t.amount), 0);
      return { name: c.name, email: c.email, phone: c.phone, transactions: own.length, total_spend: spend };
    });
    download(`customer-report-${Date.now()}.csv`, toCSV(rows));
  };

  const exportRevenue = () => {
    const map = new Map<string, number>();
    tx.filter((t) => t.status === "SUCCESS").forEach((t) => {
      const k = new Date(t.occurred_at).toISOString().slice(0, 10);
      map.set(k, (map.get(k) ?? 0) + Number(t.amount));
    });
    const rows = Array.from(map.entries()).sort().map(([date, revenue]) => ({ date, revenue }));
    download(`revenue-report-${Date.now()}.csv`, toCSV(rows));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate operational and financial reports on demand" />

      <div className="grid gap-4 md:grid-cols-3">
        <ReportCard icon={CalendarDays} title="Daily Report" subtitle={`${num(summary.day.count)} transactions · ${inr(summary.day.rev)}`} onExport={exportDaily} />
        <ReportCard icon={CalendarRange} title="Weekly Report" subtitle={`${num(summary.week.count)} transactions · ${inr(summary.week.rev)}`} onExport={exportWeekly} />
        <ReportCard icon={Calendar} title="Monthly Report" subtitle={`${num(summary.month.count)} transactions · ${inr(summary.month.rev)}`} onExport={exportMonthly} />
        <ReportCard icon={Store} title="Merchant Report" subtitle={`${num(merchants.length)} merchants`} onExport={exportMerchant} />
        <ReportCard icon={Users} title="Customer Report" subtitle={`${num(customers.length)} customers`} onExport={exportCustomer} />
        <ReportCard icon={IndianRupee} title="Revenue Report" subtitle="Day-by-day revenue breakdown" onExport={exportRevenue} />
      </div>
    </div>
  );
}

function downloadCSV(scope: string, rows: any[]) {
  download(`${scope}-report-${Date.now()}.csv`, toCSV(rows.map((t) => ({
    transaction_id: t.transaction_id, merchant: t.merchant_name, customer: t.customer_name,
    amount: t.amount, gst: t.tax, method: t.payment_method, status: t.status, date: t.occurred_at,
  }))));
}

function ReportCard({ icon: Icon, title, subtitle, onExport }: { icon: any; title: string; subtitle: string; onExport: () => void }) {
  return (
    <div className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
          <Icon className="h-5 w-5" />
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={onExport}><Download className="h-3.5 w-3.5" /> Export CSV</Button>
      </div>
      <div className="mt-3 font-display text-base font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}