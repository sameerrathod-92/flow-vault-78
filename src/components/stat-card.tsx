import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  accent = "primary",
  index = 0,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  accent?: "primary" | "accent" | "success" | "warning" | "destructive";
  index?: number;
}) {
  const accents: Record<string, string> = {
    primary: "from-primary/30 to-primary/0 text-primary",
    accent: "from-accent/30 to-accent/0 text-accent",
    success: "from-success/30 to-success/0 text-success",
    warning: "from-warning/30 to-warning/0 text-warning",
    destructive: "from-destructive/30 to-destructive/0 text-destructive",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 p-5 glass shadow-elegant"
    >
      <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${accents[accent]} blur-2xl opacity-60`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
          <div className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</div>
          {(delta !== undefined || hint) && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {delta !== undefined && (
                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold ${delta >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(delta).toFixed(1)}%
                </span>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 glass ${accents[accent].split(" ").pop()}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}