import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/page-header";
import { FileText, Download, Calendar, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({ component: Reports });

function Reports() {
  const saved = [
    { name: "Daily reconciliation", schedule: "Every day · 07:00 IST", format: "CSV" },
    { name: "Weekly merchant payouts", schedule: "Mon · 09:00 IST", format: "XLSX" },
    { name: "Monthly GST summary", schedule: "1st · 10:00 IST", format: "PDF" },
    { name: "Fraud investigation log", schedule: "On demand", format: "CSV" },
    { name: "Customer refund report", schedule: "Fri · 18:00 IST", format: "XLSX" },
  ];
  const recent = Array.from({ length: 8 }).map((_, i) => ({
    id: `EXP-${5200 + i}`, name: saved[i % saved.length].name,
    when: new Date(Date.now() - i * 3600_000 * 6).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    size: `${(1.4 + Math.random() * 8).toFixed(1)} MB`, rows: 2400 + Math.round(Math.random() * 40000),
  }));
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Reporting" title="Reports" subtitle="Saved reports, scheduled exports, and one-off runs." />
      <div className="grid gap-3" style={{ gridTemplateColumns: "360px minmax(0,1fr)" }}>
        <Panel title="Saved reports" eyebrow="Library" dense>
          <div className="scrollbar-thin -m-2 max-h-[70vh] overflow-y-auto">
            {saved.map((r) => (
              <div key={r.name} className="flex items-center gap-2 border-b border-border px-3 py-2 row-hover">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium">{r.name}</div>
                  <div className="mono flex items-center gap-1 text-[10px] text-muted-foreground"><Calendar className="h-2.5 w-2.5" />{r.schedule}</div>
                </div>
                <span className="chip">{r.format}</span>
                <button className="rounded p-1 row-hover"><Play className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel title="Recent exports" eyebrow="History" dense>
            <div className="scrollbar-thin -m-2 max-h-[52vh] overflow-y-auto">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-panel text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border"><th className="px-3 py-1.5 text-left">ID</th><th className="px-3 py-1.5 text-left">Report</th><th className="px-3 py-1.5 text-left">Generated</th><th className="px-3 py-1.5 text-right">Rows</th><th className="px-3 py-1.5 text-right">Size</th><th className="px-3 py-1.5 text-right">Action</th></tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 row-hover">
                      <td className="mono px-3 py-1.5">{r.id}</td>
                      <td className="px-3 py-1.5">{r.name}</td>
                      <td className="mono px-3 py-1.5 text-muted-foreground">{r.when}</td>
                      <td className="tabular px-3 py-1.5 text-right">{r.rows.toLocaleString()}</td>
                      <td className="tabular px-3 py-1.5 text-right">{r.size}</td>
                      <td className="px-3 py-1.5 text-right"><button className="inline-flex items-center gap-1 text-[11px] text-foreground hover:underline"><Download className="h-3 w-3" />Download</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="New export" eyebrow="Ad hoc">
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <label className="col-span-2"><div className="text-muted-foreground mb-1">Report type</div><select className="h-8 w-full rounded-md border border-border bg-panel-2 px-2">{saved.map((s) => <option key={s.name}>{s.name}</option>)}</select></label>
              <label><div className="text-muted-foreground mb-1">From</div><input type="date" className="h-8 w-full rounded-md border border-border bg-panel-2 px-2" /></label>
              <label><div className="text-muted-foreground mb-1">To</div><input type="date" className="h-8 w-full rounded-md border border-border bg-panel-2 px-2" /></label>
              <label><div className="text-muted-foreground mb-1">Format</div><select className="h-8 w-full rounded-md border border-border bg-panel-2 px-2"><option>CSV</option><option>XLSX</option><option>PDF</option></select></label>
              <div className="col-span-4 flex justify-end"><button className="flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-[11px] font-semibold text-background">Generate export</button></div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
