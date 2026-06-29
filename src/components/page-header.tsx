import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    success: "bg-success/15 text-success border-success/30",
    completed: "bg-success/15 text-success border-success/30",
    settled: "bg-success/15 text-success border-success/30",
    active: "bg-success/15 text-success border-success/30",
    connected: "bg-success/15 text-success border-success/30",
    pending: "bg-warning/15 text-warning border-warning/30",
    processing: "bg-warning/15 text-warning border-warning/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
    disconnected: "bg-destructive/15 text-destructive border-destructive/30",
    refund: "bg-accent/15 text-accent border-accent/30",
    refunded: "bg-accent/15 text-accent border-accent/30",
  };
  const cls = map[s] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}