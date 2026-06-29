export const inr = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));

export const inrShort = (n: number) => {
  const v = Number(n ?? 0);
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)}L`;
  if (Math.abs(v) >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
};

export const num = (n: number | null | undefined) => new Intl.NumberFormat("en-IN").format(Number(n ?? 0));

export const dt = (s?: string | null) =>
  s ? new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export const time = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

export const date = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const statusColor = (s: string) => {
  const v = s?.toLowerCase();
  if (v === "success" || v === "completed" || v === "settled" || v === "active" || v === "connected") return "success";
  if (v === "pending" || v === "processing") return "warning";
  if (v === "failed" || v === "cancelled" || v === "disconnected") return "destructive";
  if (v === "refund" || v === "refunded") return "accent";
  return "muted";
};

export function toCSV(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export function download(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}