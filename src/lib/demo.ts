/**
 * Deterministic realistic banking demo data.
 * Used to populate charts, tables, and side-panels so the UI never shows an
 * empty state during evaluation.
 */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const R = mulberry32(9911);
const pick = <T,>(arr: T[]) => arr[Math.floor(R() * arr.length)];
const between = (a: number, b: number) => a + Math.floor(R() * (b - a));

export const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi"];
export const MERCHANT_NAMES = [
  "Bombay Canteen",
  "Toit Bengaluru",
  "Blue Tokai Coffee",
  "Farzi Cafe",
  "Social Offline",
  "SodaBottleOpenerWala",
  "Indigo Deli",
  "Punjab Grill",
  "Third Wave Coffee",
  "Mainland China",
  "Barbeque Nation",
  "Copper Chimney",
];
export const CUSTOMER_FIRST = ["Aarav", "Vihaan", "Aditya", "Diya", "Isha", "Kavya", "Rohan", "Aisha", "Neha", "Rahul", "Priya", "Sana", "Kabir", "Meera", "Zoya"];
export const CUSTOMER_LAST = ["Sharma", "Verma", "Iyer", "Khan", "Nair", "Menon", "Kapoor", "Bose", "Gupta", "Patel", "Reddy", "Singh"];
export const METHODS = ["UPI", "CARD", "WALLET", "NETBANKING"];
export const CATEGORIES = ["Casual Dining", "QSR", "Cafe", "Fine Dining", "Cloud Kitchen", "Pub"];

/* ---- charts ---- */

export function seedRevenue(days = 30) {
  const out: { date: string; revenue: number; forecast?: number }[] = [];
  let base = 12_00_000;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const weekday = d.getDay();
    const swing = weekday === 5 || weekday === 6 ? 1.35 : weekday === 0 ? 1.15 : 1;
    const noise = 0.85 + R() * 0.35;
    base += (R() - 0.45) * 40_000;
    out.push({ date: d.toISOString().slice(0, 10), revenue: Math.round(base * swing * noise) });
  }
  // 7-day forecast
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({ date: d.toISOString().slice(0, 10), revenue: 0, forecast: Math.round(base * (1.05 + R() * 0.15)) });
  }
  return out;
}

export function seedHourly() {
  return Array.from({ length: 24 }, (_, h) => {
    const peak = h >= 12 && h <= 14 ? 3.2 : h >= 19 && h <= 22 ? 3.6 : h >= 9 && h < 11 ? 1.5 : h < 6 ? 0.3 : 1;
    return { hour: `${String(h).padStart(2, "0")}`, orders: Math.round(20 * peak + R() * 12), amount: Math.round(35_000 * peak + R() * 12_000) };
  });
}

export function seedHeatmap() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.flatMap((day, di) =>
    Array.from({ length: 24 }, (_, h) => {
      const peak = h >= 12 && h <= 14 ? 2.4 : h >= 19 && h <= 22 ? 2.8 : 1;
      const wknd = di >= 4 ? 1.4 : 1;
      return { day, hour: h, value: Math.round(peak * wknd * (10 + R() * 40)) };
    }),
  );
}

export function seedRiskTimeline() {
  const out: { t: string; score: number; blocked: number }[] = [];
  for (let i = 47; i >= 0; i--) {
    const d = new Date();
    d.setMinutes(d.getMinutes() - i * 30);
    out.push({
      t: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
      score: Math.round(18 + R() * 45 + (i < 6 ? 25 : 0)),
      blocked: Math.round(R() * 4),
    });
  }
  return out;
}

export function seedApiLogs() {
  const paths = [
    "POST /v1/transactions",
    "POST /v1/refunds",
    "GET  /v1/merchants",
    "GET  /v1/settlements",
    "POST /v1/webhooks/replay",
    "GET  /v1/transactions/:id",
  ];
  return Array.from({ length: 24 }, () => {
    const status = R() < 0.86 ? 200 : R() < 0.6 ? 400 : R() < 0.5 ? 401 : 500;
    const d = new Date();
    d.setSeconds(d.getSeconds() - between(1, 3600));
    return {
      id: crypto.randomUUID().slice(0, 8),
      path: pick(paths),
      status,
      latency_ms: between(24, 480),
      ip: `10.${between(0, 255)}.${between(0, 255)}.${between(1, 255)}`,
      at: d,
    };
  }).sort((a, b) => b.at.getTime() - a.at.getTime());
}

export function seedFraudCases(n = 12) {
  const kinds = ["Card testing", "Velocity spike", "Geo mismatch", "Failed MFA", "BIN attack", "Chargeback risk"];
  return Array.from({ length: n }, (_, i) => {
    const created = new Date();
    created.setMinutes(created.getMinutes() - between(2, 240));
    return {
      id: `RSK-${8000 + i}`,
      kind: pick(kinds),
      score: between(62, 98),
      amount: between(2_000, 92_000),
      merchant: pick(MERCHANT_NAMES),
      customer: `${pick(CUSTOMER_FIRST)} ${pick(CUSTOMER_LAST)}`,
      ip: `${between(103, 223)}.${between(0, 255)}.${between(0, 255)}.${between(1, 255)}`,
      device: pick(["iOS 17.4", "Android 14", "Chrome 124", "Safari 17", "Edge 124"]),
      created,
      status: pick(["Manual review", "Auto-blocked", "Escalated", "Pending"]),
    };
  });
}

export function seedGeo() {
  return CITIES.map((c) => ({
    city: c,
    tx: between(200, 4200),
    risk: between(2, 28),
  })).sort((a, b) => b.tx - a.tx);
}

export function seedApprovals() {
  return [
    { id: "APR-2201", label: "Settlement batch #SB-7742", amount: 42_18_400, requestor: "M. Iyer", eta: "2h" },
    { id: "APR-2202", label: "Merchant KYC — Toit Bengaluru", amount: 0, requestor: "R. Nair", eta: "40m" },
    { id: "APR-2203", label: "Refund override — TXN 91821", amount: 18_500, requestor: "A. Sharma", eta: "5m" },
    { id: "APR-2204", label: "Webhook secret rotation", amount: 0, requestor: "K. Menon", eta: "1h" },
  ];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}