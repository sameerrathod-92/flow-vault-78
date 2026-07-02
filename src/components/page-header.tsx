import type { ReactNode } from "react";

/**
 * Dense enterprise page header — tight vertical rhythm, no decoration.
 * Meta slots on the right for filters, exports, quick actions.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  meta,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-6 border-b border-border pb-3">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-0.5 truncate text-[20px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[12px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta}
        {actions}
      </div>
    </div>
  );
}

const STATUS_MAP: Record<string, { fg: string; bg: string; dot: string }> = {
  success: { fg: "text-[color:var(--color-success)]", bg: "bg-[color:var(--color-success)]/10", dot: "bg-[color:var(--color-success)]" },
  completed: { fg: "text-[color:var(--color-success)]", bg: "bg-[color:var(--color-success)]/10", dot: "bg-[color:var(--color-success)]" },
  settled: { fg: "text-[color:var(--color-success)]", bg: "bg-[color:var(--color-success)]/10", dot: "bg-[color:var(--color-success)]" },
  active: { fg: "text-[color:var(--color-success)]", bg: "bg-[color:var(--color-success)]/10", dot: "bg-[color:var(--color-success)]" },
  connected: { fg: "text-[color:var(--color-success)]", bg: "bg-[color:var(--color-success)]/10", dot: "bg-[color:var(--color-success)]" },
  ready: { fg: "text-[color:var(--color-success)]", bg: "bg-[color:var(--color-success)]/10", dot: "bg-[color:var(--color-success)]" },
  verified: { fg: "text-[color:var(--color-success)]", bg: "bg-[color:var(--color-success)]/10", dot: "bg-[color:var(--color-success)]" },
  pending: { fg: "text-[color:var(--color-warning)]", bg: "bg-[color:var(--color-warning)]/12", dot: "bg-[color:var(--color-warning)]" },
  processing: { fg: "text-[color:var(--color-warning)]", bg: "bg-[color:var(--color-warning)]/12", dot: "bg-[color:var(--color-warning)]" },
  received: { fg: "text-[color:var(--color-info)]", bg: "bg-[color:var(--color-info)]/12", dot: "bg-[color:var(--color-info)]" },
  failed: { fg: "text-[color:var(--color-destructive)]", bg: "bg-[color:var(--color-destructive)]/10", dot: "bg-[color:var(--color-destructive)]" },
  cancelled: { fg: "text-[color:var(--color-destructive)]", bg: "bg-[color:var(--color-destructive)]/10", dot: "bg-[color:var(--color-destructive)]" },
  disconnected: { fg: "text-[color:var(--color-destructive)]", bg: "bg-[color:var(--color-destructive)]/10", dot: "bg-[color:var(--color-destructive)]" },
  refund: { fg: "text-foreground", bg: "bg-muted", dot: "bg-muted-foreground" },
  refunded: { fg: "text-foreground", bg: "bg-muted", dot: "bg-muted-foreground" },
};

export function StatusPill({ status, subtle = false }: { status: string; subtle?: boolean }) {
  const s = (status ?? "").toLowerCase();
  const style = STATUS_MAP[s] ?? { fg: "text-muted-foreground", bg: "bg-muted", dot: "bg-muted-foreground" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        subtle ? "text-muted-foreground bg-transparent border border-border" : `${style.bg} ${style.fg}`
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

export function Panel({
  title,
  action,
  eyebrow,
  className = "",
  bodyClassName = "",
  children,
  dense = false,
}: {
  title?: ReactNode;
  action?: ReactNode;
  eyebrow?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  dense?: boolean;
}) {
  return (
    <section className={`panel flex min-h-0 flex-col ${className}`}>
      {(title || action || eyebrow) && (
        <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
          <div className="flex min-w-0 items-center gap-2">
            {eyebrow && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {eyebrow}
              </span>
            )}
            {title && (
              <h3 className="truncate text-[12px] font-semibold text-foreground">{title}</h3>
            )}
          </div>
          {action && <div className="flex items-center gap-1.5">{action}</div>}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${dense ? "p-2" : "p-3"} ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function Metric({
  label,
  value,
  hint,
  trend,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: number;
  accent?: "success" | "warning" | "destructive" | "info";
}) {
  const accentColor =
    accent === "success"
      ? "text-[color:var(--color-success)]"
      : accent === "warning"
        ? "text-[color:var(--color-warning)]"
        : accent === "destructive"
          ? "text-[color:var(--color-destructive)]"
          : accent === "info"
            ? "text-[color:var(--color-info)]"
            : "text-foreground";
  return (
    <div className="flex flex-col justify-between gap-1 px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className={`tabular text-[22px] font-semibold leading-none tracking-tight ${accentColor}`}>
        {value}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {typeof trend === "number" && (
          <span
            className={`tabular font-semibold ${
              trend >= 0 ? "text-[color:var(--color-success)]" : "text-[color:var(--color-destructive)]"
            }`}
          >
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {hint && <span className="truncate">{hint}</span>}
      </div>
    </div>
  );
}

export function MetricStrip({ children, cols = 4 }: { children: ReactNode; cols?: number }) {
  return (
    <div
      className="panel grid divide-x divide-border"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}