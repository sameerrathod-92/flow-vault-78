import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, MetricStrip, Metric } from "@/components/page-header";
import { inr, inrShort } from "@/lib/format";
import { MERCHANT_NAMES, initials } from "@/lib/demo";

export const Route = createFileRoute("/_authenticated/settlements")({ component: Settlements });

const STAGES = ["Received", "Processing", "Verified", "Ready", "Settled"] as const;

function seed() {
  const items: { id: string; stage: (typeof STAGES)[number]; amount: number; txns: number; merchant: string; approver: string; elapsed: string }[] = [];
  let n = 7700;
  STAGES.forEach((st, si) => {
    const count = [6, 5, 4, 3, 8][si];
    for (let i = 0; i < count; i++) {
      items.push({
        id: `SB-${n++}`, stage: st,
        amount: 150000 + Math.round(Math.random() * 4000000),
        txns: 40 + Math.round(Math.random() * 380),
        merchant: MERCHANT_NAMES[(n + i) % MERCHANT_NAMES.length],
        approver: ["M. Iyer", "R. Nair", "A. Sharma", "K. Menon"][(n + i) % 4],
        elapsed: `${(si + 1) * 12 + i}m`,
      });
    }
  });
  return items;
}

function Settlements() {
  const items = seed();
  const total = items.reduce((s, x) => s + x.amount, 0);
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Money movement" title="Settlement pipeline" subtitle="Batches flow left-to-right. Each stage is time-boxed with SLA." />
      <MetricStrip cols={4}>
        <Metric label="In-flight" value={inrShort(total)} hint={`${items.length} batches`} />
        <Metric label="Settled today" value={inrShort(total * 0.42)} accent="success" trend={6.2} />
        <Metric label="At-risk" value="2" accent="warning" hint="SLA breach imminent" />
        <Metric label="Cycle" value="T+1" hint="09:00 IST daily" />
      </MetricStrip>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(0,1fr))` }}>
        {STAGES.map((stage, si) => {
          const stageItems = items.filter((x) => x.stage === stage);
          const stageTotal = stageItems.reduce((s, x) => s + x.amount, 0);
          return (
            <div key={stage} className="panel flex flex-col min-h-[70vh]">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="mono h-5 w-5 grid place-items-center rounded-sm bg-foreground text-background text-[10px] font-bold">{si + 1}</span>
                  <span className="text-[12px] font-semibold uppercase tracking-wider">{stage}</span>
                </div>
                <div className="text-right"><div className="tabular text-[11px] font-semibold">{inrShort(stageTotal)}</div><div className="mono text-[9px] text-muted-foreground">{stageItems.length} batches</div></div>
              </div>
              <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-2">
                {stageItems.map((b) => (
                  <div key={b.id} className="rounded-md border border-border bg-panel-2 p-2 text-[11px] hover:border-foreground/30 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between"><span className="mono font-semibold">{b.id}</span><span className="mono text-[10px] text-muted-foreground">{b.elapsed}</span></div>
                    <div className="tabular mt-1 text-[14px] font-semibold">{inr(b.amount)}</div>
                    <div className="mt-1 truncate text-muted-foreground">{b.merchant}</div>
                    <div className="mt-2 flex items-center justify-between border-t border-border pt-1.5 text-[10px]">
                      <span className="text-muted-foreground">{b.txns} txns</span>
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-muted text-[8px] font-bold">{initials(b.approver)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
