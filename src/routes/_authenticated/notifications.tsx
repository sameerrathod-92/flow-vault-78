import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck, CreditCard, Undo2, Wallet, Plug, PlugZap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/queries";
import { dt } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

const ICONS: Record<string, any> = {
  payment_success: CreditCard,
  refund: Undo2,
  settlement_complete: Wallet,
  merchant_connected: Plug,
  merchant_disconnected: PlugZap,
};

function NotificationsPage() {
  const { data: items = [], refetch } = useNotifications();

  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${items.filter((i: any) => !i.read).length} unread`}
        actions={<Button variant="outline" className="gap-2" onClick={markAll}><CheckCheck className="h-4 w-4" /> Mark all read</Button>}
      />

      <div className="space-y-2">
        {items.map((n: any) => {
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <div key={n.id} className={`flex items-start gap-3 rounded-2xl border p-4 glass transition-colors ${n.read ? "border-border/40 opacity-70" : "border-primary/40 shadow-elegant"}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-sm font-semibold">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground">{dt(n.created_at)}</div>
                </div>
                {n.message && <div className="mt-0.5 text-sm text-muted-foreground">{n.message}</div>}
              </div>
              {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-primary shadow-glow" />}
            </div>
          );
        })}
        {!items.length && <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">You're all caught up.</div>}
      </div>
    </div>
  );
}