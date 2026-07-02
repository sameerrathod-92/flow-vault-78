import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatusPill, MetricStrip, Metric } from "@/components/page-header";
import { inr } from "@/lib/format";
import { seedFraudCases, seedRiskTimeline, seedGeo, seedHeatmap } from "@/lib/demo";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/fraud")({ component: Fraud });

function Fraud() {
  const cases = seedFraudCases(18);
  const timeline = seedRiskTimeline();
  const geo = seedGeo();
  const heatmap = seedHeatmap();
  const highRisk = cases.filter((c) => c.score >= 80).length;
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Security Operations" title="Risk & Fraud" subtitle="Real-time monitoring across all merchant checkouts." />
      <MetricStrip cols={4}>
        <Metric label="Composite risk" value="42" hint="Elevated" accent="warning" trend={-3.2} />
        <Metric label="Threat level" value="AMBER" accent="warning" hint="2h rolling window" />
        <Metric label="High risk txns" value={String(highRisk)} accent="destructive" trend={18.6} />
        <Metric label="ML confidence" value="94.2%" accent="success" hint="v2.4 calibrated" />
      </MetricStrip>
      <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1fr) 340px" }}>
        <Panel title="Risk timeline · 24h" eyebrow="Signal">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline}>
              <defs><linearGradient id="rr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--color-destructive)" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval={5} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 11 }} />
              <Area dataKey="score" stroke="var(--color-destructive)" fill="url(#rr)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Geo activity" eyebrow="Origin" dense>
          <div className="scrollbar-thin max-h-[220px] overflow-y-auto p-1">
            {geo.map((g) => (
              <div key={g.city} className="flex items-center gap-2 border-b border-border px-2 py-1.5 text-[12px]">
                <span className="flex-1 truncate">{g.city}</span>
                <span className="tabular text-muted-foreground">{g.tx.toLocaleString()}</span>
                <span className={`tabular text-[11px] font-semibold ${g.risk > 20 ? "text-[color:var(--color-destructive)]" : g.risk > 10 ? "text-[color:var(--color-warning)]" : "text-[color:var(--color-success)]"}`}>{g.risk}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="7 x 24 heatmap" eyebrow="Velocity" dense>
        <div className="grid gap-0.5 p-2" style={{ gridTemplateColumns: "40px repeat(24, minmax(0,1fr))" }}>
          <div />{Array.from({ length: 24 }).map((_, h) => <div key={h} className="mono text-center text-[9px] text-muted-foreground">{String(h).padStart(2, "0")}</div>)}
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
            <div key={d} className="contents">
              <div className="mono text-[10px] text-muted-foreground">{d}</div>
              {heatmap.filter((c) => c.day === d).map((c) => {
                const alpha = Math.min(1, c.value / 100);
                return <div key={d + c.hour} className="h-4 rounded-sm" style={{ background: `color-mix(in oklab, var(--color-primary) ${alpha * 90}%, transparent)` }} title={`${d} ${c.hour}:00 · ${c.value}`} />;
              })}
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1fr) 380px" }}>
        <Panel title="Investigation queue" eyebrow="Analyst" action={<span className="chip">{cases.length} open</span>} dense>
          <div className="scrollbar-thin -m-2 max-h-[420px] overflow-y-auto">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-panel text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-1.5 text-left">Case</th><th className="px-3 py-1.5 text-left">Type</th>
                  <th className="px-3 py-1.5 text-right">Score</th><th className="px-3 py-1.5 text-right">Amount</th>
                  <th className="px-3 py-1.5 text-left">Merchant</th><th className="px-3 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 row-hover">
                    <td className="mono px-3 py-1.5">{c.id}</td>
                    <td className="px-3 py-1.5"><span className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-[color:var(--color-warning)]" />{c.kind}</span></td>
                    <td className={`tabular px-3 py-1.5 text-right font-semibold ${c.score >= 80 ? "text-[color:var(--color-destructive)]" : "text-[color:var(--color-warning)]"}`}>{c.score}</td>
                    <td className="tabular px-3 py-1.5 text-right">{inr(c.amount)}</td>
                    <td className="px-3 py-1.5">{c.merchant}</td>
                    <td className="px-3 py-1.5"><StatusPill status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel title="Device fingerprints" eyebrow="Devices" dense>
            <div className="p-2 text-[11px]">
              {["Chrome 124 / macOS","Safari 17 / iOS","Android 14 / Chrome","Edge 124 / Win 11"].map((d, i) => (
                <div key={d} className="flex items-center justify-between border-b border-border py-1"><span>{d}</span><span className="tabular text-muted-foreground">{[412, 268, 194, 87][i]}</span></div>
              ))}
            </div>
          </Panel>
          <Panel title="IP intelligence" eyebrow="Network" dense>
            <div className="p-2 text-[11px]">
              {[{ip:"103.24.88.14",loc:"Mumbai IN",risk:82},{ip:"49.207.55.4",loc:"Bengaluru IN",risk:14},{ip:"185.220.101.6",loc:"TOR exit",risk:98}].map((r) => (
                <div key={r.ip} className="flex items-center justify-between border-b border-border py-1">
                  <div><div className="mono">{r.ip}</div><div className="text-[10px] text-muted-foreground">{r.loc}</div></div>
                  <span className={`tabular font-semibold ${r.risk > 70 ? "text-[color:var(--color-destructive)]" : "text-[color:var(--color-success)]"}`}>{r.risk}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
