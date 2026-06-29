import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, KeyRound, Plus, Sparkles, Trash2, Send } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiCredentials, useMerchants } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/api")({
  component: ApiPage,
});

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transactions-ingest`;

function ApiPage() {
  const { data: creds = [], refetch } = useApiCredentials();
  const { data: merchants = [] } = useMerchants();
  const [name, setName] = useState("");
  const [webhook, setWebhook] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const copy = async (v: string, k: string) => {
    await navigator.clipboard.writeText(v);
    setCopied(k);
    setTimeout(() => setCopied(null), 1200);
  };

  const create = async () => {
    if (!name) return toast.error("Name required");
    const { error } = await supabase.from("api_credentials").insert({ name, webhook_url: webhook || null });
    if (error) return toast.error(error.message);
    toast.success("Credentials generated");
    setName(""); setWebhook("");
    refetch();
  };

  const revoke = async (id: string) => {
    await supabase.from("api_credentials").delete().eq("id", id);
    refetch();
  };

  const seedDemo = async () => {
    setSeeding(true);
    try {
      let merchantKey: string | undefined = merchants[0]?.api_key;
      if (!merchantKey) {
        const seed = [
          { merchant_code: "REST001", name: "Royal Spice", city: "Delhi" },
          { merchant_code: "REST002", name: "Sushi Sora", city: "Mumbai" },
          { merchant_code: "REST003", name: "Café Aurora", city: "Bengaluru" },
          { merchant_code: "REST004", name: "Burger Republic", city: "Pune" },
        ];
        const { data } = await supabase.from("merchants").insert(seed).select("*");
        merchantKey = data?.[0]?.api_key;
      }
      const list = (await supabase.from("merchants").select("*")).data ?? [];
      const customers = ["Rahul Sharma", "Aisha Khan", "Vikram Iyer", "Sneha Patel", "Arjun Mehta", "Priya Nair", "Rohan Das"];
      const methods = ["UPI", "CARD", "NETBANKING", "WALLET", "CASH"];
      const statuses = ["SUCCESS", "SUCCESS", "SUCCESS", "SUCCESS", "PENDING", "REFUND", "FAILED", "CANCELLED"];
      const types = ["Food Order", "Beverage", "Catering"];
      const bookings = ["Dine In", "Takeaway", "Delivery"];
      const foods = ["Pizza", "Burger", "Pasta", "Biryani", "Sushi Roll", "Latte", "Pancakes", "Tikka"];
      const payloads: any[] = [];
      for (let i = 0; i < 60; i++) {
        const m = list[Math.floor(Math.random() * list.length)];
        const amt = Math.round((Math.random() * 4500 + 250) * 100) / 100;
        const tax = Math.round(amt * 0.18 * 100) / 100;
        const occurred = new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000));
        payloads.push({
          merchantId: m.merchant_code, merchantName: m.name,
          transactionId: `TXN${Date.now().toString(36).toUpperCase()}${i}`,
          customerName: customers[Math.floor(Math.random() * customers.length)],
          orderId: `ORD${1000 + i}`,
          transactionType: types[Math.floor(Math.random() * types.length)],
          bookingType: bookings[Math.floor(Math.random() * bookings.length)],
          paymentMethod: methods[Math.floor(Math.random() * methods.length)],
          amount: amt, tax,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          items: [{ name: foods[Math.floor(Math.random() * foods.length)], qty: 1 + Math.floor(Math.random() * 3), price: amt }],
          timestamp: occurred.toISOString(),
        });
      }
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": merchantKey! },
        body: JSON.stringify(payloads),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      toast.success(`Ingested ${j.inserted} demo transactions`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSeeding(false);
    }
  };

  const sample = `{
  "merchantId": "REST001",
  "merchantName": "Royal Spice",
  "transactionId": "TXN1001",
  "customerName": "Rahul Sharma",
  "orderId": "ORD001",
  "transactionType": "Food Order",
  "bookingType": "Dine In",
  "paymentMethod": "UPI",
  "amount": 1250,
  "tax": 225,
  "status": "SUCCESS",
  "items": [{ "name": "Pizza", "qty": 2, "price": 450 }],
  "timestamp": "2026-06-29T20:30:00Z"
}`;

  const curl = `curl -X POST ${FN_URL} \\
  -H "Authorization: Bearer <MERCHANT_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '${sample.replace(/\n\s*/g, " ")}'`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Integration"
        subtitle="Issue bank-grade credentials and stream transactions over REST"
        actions={<Button variant="outline" className="gap-2" onClick={seedDemo} disabled={seeding}><Sparkles className="h-4 w-4" /> {seeding ? "Seeding…" : "Seed demo data"}</Button>}
      />

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="keys">Credentials</TabsTrigger>
          <TabsTrigger value="docs">REST Documentation</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <div className="rounded-2xl border border-border/50 p-5 glass shadow-elegant">
            <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><KeyRound className="h-5 w-5 text-primary" /> Generate Credentials</div>
            <div className="grid gap-3 md:grid-cols-3">
              <div><Label>Integration Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Partner Gateway" /></div>
              <div className="md:col-span-2"><Label>Webhook URL</Label><Input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://partner.example/hooks" /></div>
            </div>
            <div className="mt-3">
              <Button onClick={create} className="gap-2" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}><Plus className="h-4 w-4" /> Generate Keys</Button>
            </div>
          </div>

          <div className="space-y-3">
            {creds.map((c: any) => (
              <div key={c.id} className="rounded-2xl border border-border/50 p-4 glass shadow-elegant">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-display font-semibold">{c.name}</div>
                  <Button size="sm" variant="ghost" className="gap-1 text-rose-400" onClick={() => revoke(c.id)}><Trash2 className="h-3 w-3" /> Revoke</Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <KeyField label="API Key" value={c.api_key} onCopy={() => copy(c.api_key, c.id + "k")} copied={copied === c.id + "k"} />
                  <KeyField label="Secret Key" value={c.secret_key} mask onCopy={() => copy(c.secret_key, c.id + "s")} copied={copied === c.id + "s"} />
                  <KeyField label="Webhook URL" value={c.webhook_url ?? "—"} onCopy={() => c.webhook_url && copy(c.webhook_url, c.id + "w")} copied={copied === c.id + "w"} />
                  <KeyField label="Ingestion Endpoint" value={FN_URL} onCopy={() => copy(FN_URL, c.id + "u")} copied={copied === c.id + "u"} />
                </div>
              </div>
            ))}
            {!creds.length && <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">No credentials issued yet. Merchants also receive their own API keys automatically.</div>}
          </div>
        </TabsContent>

        <TabsContent value="docs">
          <div className="space-y-4 rounded-2xl border border-border/50 p-5 glass shadow-elegant">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Endpoint</div>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/40 px-3 py-2">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">POST</span>
                <code className="flex-1 truncate font-mono text-sm">{FN_URL}</code>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => copy(FN_URL, "url")}>{copied === "url" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}</button>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Headers</div>
              <pre className="mt-1 overflow-x-auto rounded-lg border border-border/50 bg-secondary/40 p-3 font-mono text-xs">{`Authorization: Bearer <MERCHANT_API_KEY>\nContent-Type: application/json`}</pre>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Request body</div>
              <pre className="mt-1 overflow-x-auto rounded-lg border border-border/50 bg-secondary/40 p-3 font-mono text-xs">{sample}</pre>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">cURL</div>
              <pre className="mt-1 overflow-x-auto rounded-lg border border-border/50 bg-secondary/40 p-3 font-mono text-xs">{curl}</pre>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Response</div>
              <pre className="mt-1 overflow-x-auto rounded-lg border border-border/50 bg-secondary/40 p-3 font-mono text-xs">{`{ "ok": true, "inserted": 1, "transactions": [...] }`}</pre>
            </div>
            <p className="text-xs text-muted-foreground">Every accepted transaction is stored in Supabase and pushed to subscribed clients via realtime — the dashboard updates instantly without refresh.</p>
          </div>
        </TabsContent>

        <TabsContent value="playground">
          <Playground />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KeyField({ label, value, mask, onCopy, copied }: { label: string; value: string; mask?: boolean; onCopy: () => void; copied: boolean }) {
  const display = mask ? value.slice(0, 10) + "•••••••••••" : value;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/40 px-3 py-2">
        <code className="flex-1 truncate font-mono text-xs">{display}</code>
        <button onClick={onCopy} className="text-muted-foreground hover:text-foreground">{copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}</button>
      </div>
    </div>
  );
}

function Playground() {
  const { data: merchants = [] } = useMerchants();
  const [body, setBody] = useState(`{
  "merchantId": "REST001",
  "merchantName": "Royal Spice",
  "transactionId": "TXN${Date.now().toString(36).toUpperCase()}",
  "customerName": "Rahul Sharma",
  "orderId": "ORD001",
  "transactionType": "Food Order",
  "bookingType": "Dine In",
  "paymentMethod": "UPI",
  "amount": 1250,
  "tax": 225,
  "status": "SUCCESS",
  "items": [{ "name": "Pizza", "qty": 2, "price": 450 }],
  "timestamp": "${new Date().toISOString()}"
}`);
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const key = merchants[0]?.api_key;
    if (!key) return toast.error("Onboard a merchant first to get an API key");
    setLoading(true);
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body,
      });
      const j = await res.json();
      setResponse(JSON.stringify(j, null, 2));
      if (res.ok) toast.success("Transaction streamed live");
      else toast.error(j.error ?? "Failed");
    } catch (e: any) {
      setResponse(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border/50 p-4 glass shadow-elegant">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-display text-sm font-semibold">Request body</div>
          <Button size="sm" onClick={send} disabled={loading} className="gap-2" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
            <Send className="h-3.5 w-3.5" /> {loading ? "Sending…" : "POST"}
          </Button>
        </div>
        <textarea
          className="min-h-[360px] w-full rounded-lg border border-border/50 bg-secondary/40 p-3 font-mono text-xs outline-none focus:border-primary/60"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="rounded-2xl border border-border/50 p-4 glass shadow-elegant">
        <div className="mb-2 font-display text-sm font-semibold">Response</div>
        <pre className="min-h-[360px] overflow-auto rounded-lg border border-border/50 bg-secondary/40 p-3 font-mono text-xs">{response || "Awaiting first request…"}</pre>
      </div>
    </div>
  );
}