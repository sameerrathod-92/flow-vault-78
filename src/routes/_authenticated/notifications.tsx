import { createFileRoute } from "@tanstack/react-router";
import { useNotifications } from "@/lib/queries";
import { PageHeader, Panel } from "@/components/page-header";
import { dt } from "@/lib/format";
import { Bell, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({ component: Notif });

function iconFor(t: string) {
  if (t?.includes("fraud") || t?.includes("alert")) return <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--color-warning)]" />;
  if (t?.includes("success") || t?.includes("settled")) return <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--color-success)]" />;
  return <Info className="h-3.5 w-3.5 text-[color:var(--color-info)]" />;
}

function Notif() {
  const { data = [] } = useNotifications();
  const unread = (data as any[]).filter((n) => !n.read).length;
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Activity" title="Activity feed" subtitle="System-wide events across payments, merchants, settlements, and risk." meta={<span className="chip">{unread} unread</span>} />
      <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
        <Panel dense>
          <div className="scrollbar-thin -m-2 max-h-[75vh] overflow-y-auto">
            {(data as any[]).map((n) => (
              <div key={n.id} className={`flex items-start gap-3 border-b border-border px-3 py-2 ${!n.read ? "bg-accent/40" : ""}`}>
                {iconFor(n.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="text-[12px] font-semibold">{n.title}</span><span className="chip">{n.type}</span></div>
                  {n.message && <div className="mt-0.5 text-[11px] text-muted-foreground">{n.message}</div>}
                </div>
                <span className="mono shrink-0 text-[10px] text-muted-foreground">{dt(n.created_at)}</span>
              </div>
            ))}
            {!(data as any[]).length && <div className="p-8 text-center text-[12px] text-muted-foreground">No activity yet.</div>}
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel title="Summary" eyebrow="24h" dense>
            <div className="p-2 text-[11px]">
              <div className="flex justify-between border-b border-border py-1"><span className="text-muted-foreground">Payments</span><span className="tabular font-semibold">184</span></div>
              <div className="flex justify-between border-b border-border py-1"><span className="text-muted-foreground">Settlements</span><span className="tabular font-semibold">12</span></div>
              <div className="flex justify-between border-b border-border py-1"><span className="text-muted-foreground">Fraud alerts</span><span className="tabular font-semibold text-[color:var(--color-warning)]">6</span></div>
              <div className="flex justify-between py-1"><span className="text-muted-foreground">System</span><span className="tabular font-semibold">3</span></div>
            </div>
          </Panel>
          <Panel title="Channels" eyebrow="Delivery" dense>
            <div className="p-2 text-[11px] space-y-1">
              {["Email · ops@nexusbank.io","Slack · #payments-ops","PagerDuty · P1 severity"].map((c) => (
                <div key={c} className="flex items-center gap-2 rounded border border-border bg-panel-2 p-2"><Bell className="h-3 w-3 text-muted-foreground" /><span className="truncate">{c}</span></div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
