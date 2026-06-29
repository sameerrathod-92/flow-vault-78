// Public REST endpoint: POST /functions/v1/transactions-ingest
// Accepts: { merchantId, merchantName, transactionId, customerName, orderId,
//   transactionType, bookingType, paymentMethod, amount, tax, status, items, timestamp }
// Auth: header `Authorization: Bearer <merchant api_key>` OR `x-api-key: <api_key>`
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const auth = req.headers.get("authorization") ?? "";
  const apiKey = req.headers.get("x-api-key") ?? (auth.startsWith("Bearer ") ? auth.slice(7) : "");
  if (!apiKey) return json({ error: "Missing API key" }, 401);

  // Validate API key against merchants OR api_credentials table
  const [{ data: merchant }, { data: bankCred }] = await Promise.all([
    supabase.from("merchants").select("*").eq("api_key", apiKey).maybeSingle(),
    supabase.from("api_credentials").select("*").eq("api_key", apiKey).maybeSingle(),
  ]);
  if (!merchant && !bankCred) return json({ error: "Invalid API key" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const payloads = Array.isArray(body) ? body : [body];
  const inserts: any[] = [];

  for (const p of payloads) {
    let mId = merchant?.id ?? null;
    let mName = merchant?.name ?? p.merchantName ?? null;
    let mCode = merchant?.merchant_code ?? p.merchantId ?? null;

    if (!mId && (p.merchantId || p.merchantName)) {
      const { data: byCode } = await supabase.from("merchants").select("*").eq("merchant_code", p.merchantId).maybeSingle();
      if (byCode) { mId = byCode.id; mName = byCode.name; mCode = byCode.merchant_code; }
      else if (p.merchantId) {
        const { data: created } = await supabase.from("merchants").insert({
          merchant_code: p.merchantId, name: p.merchantName ?? p.merchantId,
        }).select("*").maybeSingle();
        if (created) { mId = created.id; mName = created.name; mCode = created.merchant_code; }
      }
    }

    let cId: string | null = null;
    if (p.customerName) {
      const { data: c } = await supabase.from("customers").select("*").eq("name", p.customerName).maybeSingle();
      if (c) cId = c.id;
      else {
        const { data: nc } = await supabase.from("customers").insert({ name: p.customerName }).select("*").maybeSingle();
        if (nc) cId = nc.id;
      }
    }

    inserts.push({
      transaction_id: p.transactionId ?? `TXN${Date.now()}${Math.floor(Math.random() * 999)}`,
      merchant_id: mId,
      merchant_code: mCode,
      merchant_name: mName,
      customer_id: cId,
      customer_name: p.customerName ?? null,
      order_id: p.orderId ?? null,
      amount: Number(p.amount ?? 0),
      tax: Number(p.tax ?? 0),
      payment_method: p.paymentMethod ?? "UPI",
      status: p.status ?? "SUCCESS",
      transaction_type: p.transactionType ?? "Food Order",
      booking_type: p.bookingType ?? "Dine In",
      items: p.items ?? [],
      raw: p,
      occurred_at: p.timestamp ?? new Date().toISOString(),
    });
  }

  const { data, error } = await supabase.from("transactions").insert(inserts).select();
  if (error) return json({ error: error.message }, 400);

  // Auto-notify
  for (const r of data ?? []) {
    if (r.status === "SUCCESS") {
      await supabase.from("notifications").insert({
        type: "payment_success",
        title: `Payment received · ${r.merchant_name ?? ""}`,
        message: `₹${Number(r.amount).toLocaleString("en-IN")} from ${r.customer_name ?? "customer"}`,
        metadata: { transaction_id: r.transaction_id },
      });
    } else if (r.status === "REFUND" || r.status === "REFUNDED") {
      await supabase.from("notifications").insert({ type: "refund", title: "Refund processed", message: r.transaction_id });
    }
  }

  return json({ ok: true, inserted: data?.length ?? 0, transactions: data });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}