import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Copy, Check, Wifi, WifiOff } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMerchants, useTransactions } from "@/lib/queries";
import { inr, num } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/merchants")({
  component: MerchantsPage,
});

function MerchantsPage() {
  const { data: merchants = [], refetch } = useMerchants();
  const { data: tx = [] } = useTransactions(2000);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", merchant_code: "", city: "", email: "", webhook_url: "" });
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const stats = useMemo(() => {
    const map = new Map<string, { revenue: number; today: number }>();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    tx.forEach((t) => {
      if (!t.merchant_id) return;
      const m = map.get(t.merchant_id) ?? { revenue: 0, today: 0 };
      if (t.status === "SUCCESS") m.revenue += Number(t.amount);
      if (new Date(t.occurred_at) >= today) m.today += 1;
      map.set(t.merchant_id, m);
    });
    return map;
  }, [tx]);

  const copy = async (text: string, k: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(k);
    setTimeout(() => setCopied(null), 1200);
  };

  const create = async () => {
    if (!form.name || !form.merchant_code) return toast.error("Name and code required");
    const { error } = await supabase.from("merchants").insert({ ...form });
    if (error) return toast.error(error.message);
    toast.success("Merchant onboarded");
    setOpen(false);
    setForm({ name: "", merchant_code: "", city: "", email: "", webhook_url: "" });
    refetch();
  };

  const toggleConn = async (id: string, status: string) => {
    const next = status === "connected" ? "disconnected" : "connected";
    await supabase.from("merchants").update({ connection_status: next }).eq("id", id);
    await supabase.from("notifications").insert({
      type: next === "connected" ? "merchant_connected" : "merchant_disconnected",
      title: `Merchant ${next}`,
      message: `Merchant connection set to ${next}`,
    });
    refetch();
  };

  const detail = selected ? merchants.find((m) => m.id === selected) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Merchant Management"
        subtitle={`${num(merchants.length)} partner restaurants connected`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                <Plus className="h-4 w-4" /> Onboard Merchant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Onboard new merchant</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Restaurant Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Merchant Code</Label><Input placeholder="REST001" value={form.merchant_code} onChange={(e) => setForm({ ...form, merchant_code: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div><Label>Webhook URL</Label><Input value={form.webhook_url} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={create} style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {merchants.map((m) => {
            const s = stats.get(m.id) ?? { revenue: 0, today: 0 };
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all glass shadow-elegant hover:shadow-glow ${selected === m.id ? "border-primary/60" : "border-border/50"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl font-display text-base font-semibold" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-display text-base font-semibold">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.merchant_code} · {m.city ?? "—"}</div>
                    </div>
                  </div>
                  <div className="hidden items-center gap-6 md:flex">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue</div>
                      <div className="font-mono text-sm font-semibold">{inr(s.revenue)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Today</div>
                      <div className="font-mono text-sm font-semibold">{s.today}</div>
                    </div>
                    <StatusPill status={m.connection_status} />
                  </div>
                </div>
              </button>
            );
          })}
          {!merchants.length && <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">No merchants yet — onboard your first restaurant.</div>}
        </div>

        <div className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
          {detail ? (
            <div className="space-y-4">
              <div>
                <div className="font-display text-xl font-semibold">{detail.name}</div>
                <div className="text-xs text-muted-foreground">{detail.merchant_code} · {detail.category}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Revenue" value={inr(stats.get(detail.id)?.revenue ?? 0)} />
                <Stat label="Today's Orders" value={String(stats.get(detail.id)?.today ?? 0)} />
                <Stat label="Settlement" value={detail.settlement_status} />
                <Stat label="Status" value={detail.connection_status} />
              </div>
              <KeyRow label="API Key" value={detail.api_key} onCopy={() => copy(detail.api_key, "k")} copied={copied === "k"} />
              <KeyRow label="Secret Key" value={detail.secret_key} mask onCopy={() => copy(detail.secret_key, "s")} copied={copied === "s"} />
              <KeyRow label="Webhook URL" value={detail.webhook_url ?? "—"} onCopy={() => detail.webhook_url && copy(detail.webhook_url, "w")} copied={copied === "w"} />
              <Button variant="outline" className="w-full gap-2" onClick={() => toggleConn(detail.id, detail.connection_status)}>
                {detail.connection_status === "connected" ? <><WifiOff className="h-4 w-4" /> Disconnect</> : <><Wifi className="h-4 w-4" /> Connect</>}
              </Button>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center text-center text-sm text-muted-foreground">Select a merchant to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-sm font-semibold capitalize">{value}</div>
    </div>
  );
}

function KeyRow({ label, value, mask, onCopy, copied }: { label: string; value: string; mask?: boolean; onCopy: () => void; copied: boolean }) {
  const display = mask ? value.slice(0, 10) + "•••••••••••" : value;
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/40 px-3 py-2">
        <code className="flex-1 truncate font-mono text-xs">{display}</code>
        <button onClick={onCopy} className="text-muted-foreground transition-colors hover:text-foreground">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}