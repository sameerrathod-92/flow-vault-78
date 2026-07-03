import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, Panel } from "@/components/page-header";
import { useApiCredentials, useTransactions, type Transaction } from "@/lib/queries";
import { Copy, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/api")({ component: ApiPage });

const SNIPPETS: Record<string, string> = {
  curl: `curl -X POST https://api.nexusbank.io/v1/transactions \\
  -H "Authorization: Bearer sk_live_••••" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":48200,"currency":"INR","order_id":"ORD-9182"}'`,
  node: `const res = await fetch("https://api.nexusbank.io/v1/transactions", {
  method: "POST",
  headers: { Authorization: "Bearer sk_live_••••", "Content-Type": "application/json" },
  body: JSON.stringify({ amount: 48200, currency: "INR", order_id: "ORD-9182" }),
});`,
  python: `import requests
r = requests.post("https://api.nexusbank.io/v1/transactions",
  headers={"Authorization": "Bearer sk_live_••••"},
  json={"amount": 48200, "currency": "INR", "order_id": "ORD-9182"})`,
};

function ApiPage() {
  const [lang, setLang] = useState<"curl" | "node" | "python">("curl");
  const { data: logs = [] } = useTransactions();

  const { data: apiKeys = [] } = useApiCredentials();
  const [selected, setSelected] = useState<Transaction | null>(null);

  useEffect(() => {
    if (logs.length > 0 && !selected) {
      setSelected(logs[0]);
    }
  }, [logs, selected]);
  void apiKeys;
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Developer" title="API & Webhooks" subtitle="Live REST documentation, request stream, and credential vault." />
      <div className="grid gap-3" style={{ gridTemplateColumns: "300px minmax(0,1fr) 380px" }}>
        <div className="space-y-3">
          <Panel title="API keys" eyebrow="Live" action={<button className="chip"><Plus className="h-2.5 w-2.5" /> New</button>} dense>
            <div className="p-2 space-y-1.5 text-[11px]">
              {[{name:"Production",key:"sk_live_9f4a…7c21"},{name:"Sandbox",key:"sk_test_1a83…2f9e"}].map((k) => (
                <div key={k.name} className="rounded-md border border-border bg-panel-2 p-2">
                  <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.name}</span><Copy className="h-3 w-3 text-muted-foreground" /></div>
                  <div className="mono mt-0.5">{k.key}</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Webhook URLs" eyebrow="Delivery" dense>
            <div className="p-2 text-[11px] mono space-y-1">
              <div className="rounded border border-border bg-panel-2 p-2 truncate">https://api.merchant.example/hooks/nexus</div>
              <div className="rounded border border-border bg-panel-2 p-2 truncate">https://ops.merchant.example/webhooks/payments</div>
            </div>
          </Panel>
          <Panel title="Signing secrets" eyebrow="HMAC" dense>
            <div className="p-2 text-[11px] mono">whsec_••••••••2b91</div>
          </Panel>
        </div>
        <div className="space-y-3">
          <Panel title="POST /v1/transactions" eyebrow="Endpoint">
            <div className="text-[12px] text-muted-foreground">Create a transaction and route to Nexus rails.</div>
            <div className="mt-2 flex gap-0 overflow-hidden rounded-md border border-border">
              {(["curl","node","python"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`h-7 flex-1 text-[11px] font-medium border-r border-border last:border-r-0 ${lang === l ? "bg-foreground text-background" : "text-muted-foreground row-hover"}`}>{l}</button>
              ))}
            </div>
            <pre className="mono mt-2 scrollbar-thin max-h-64 overflow-auto rounded-md border border-border bg-panel-2 p-3 text-[11px]">{SNIPPETS[lang]}</pre>
          </Panel>
          <Panel title="Authentication" eyebrow="Auth" dense>
            <div className="p-2 text-[12px] text-muted-foreground">Bearer tokens over TLS 1.3. Rotate keys every 90 days. Webhook signatures HMAC-SHA256.</div>
          </Panel>
        </div>
        <div className="space-y-3">
          <Panel title="Live request log" eyebrow="Stream" dense>
            <div className="scrollbar-thin -m-2 max-h-[380px] overflow-y-auto text-[11px]">
              {logs.map((l) => {
                const ok = l.status === "SUCCESS";
                const warn = l.status === "PENDING";
                return (
                  <button key={l.id} onClick={() => setSelected(l)} className={`flex w-full items-center gap-2 border-b border-border px-3 py-1.5 text-left ${selected?.id === l.id ? "bg-accent" : "row-hover"}`}>
                    <span className={`mono w-16 text-right font-semibold ${!ok && !warn ? "text-[color:var(--color-destructive)]" : warn ? "text-[color:var(--color-warning)]" : "text-[color:var(--color-success)]"}`}>{l.status}</span>
                    <span className="mono flex-1 truncate">{l.transaction_id}</span>
                    <span className="tabular text-muted-foreground">{l.payment_method}</span>
                  </button>
                );
              })}
            </div>
          </Panel>
          <Panel title="Latency" eyebrow="p50 / p95 / p99" dense>
            <div className="grid grid-cols-3 divide-x divide-border p-2 text-center text-[11px]">
              <div><div className="text-muted-foreground text-[10px]">p50</div><div className="tabular text-[15px] font-semibold">64ms</div></div>
              <div><div className="text-muted-foreground text-[10px]">p95</div><div className="tabular text-[15px] font-semibold">218ms</div></div>
              <div><div className="text-muted-foreground text-[10px]">p99</div><div className="tabular text-[15px] font-semibold text-[color:var(--color-warning)]">412ms</div></div>
            </div>
          </Panel>
          {selected && (
            <Panel title="Response payload" eyebrow={selected.transaction_id} dense>
              <pre className="mono scrollbar-thin max-h-64 overflow-auto p-2 text-[10px]">{JSON.stringify(selected, null, 2)}</pre>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
