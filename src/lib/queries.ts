import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Transaction = {
  id: string;
  transaction_id: string;
  merchant_id: string | null;
  merchant_code: string | null;
  merchant_name: string | null;
  customer_id: string | null;
  customer_name: string | null;
  order_id: string | null;
  amount: number;
  tax: number;
  payment_method: string;
  status: string;
  transaction_type: string | null;
  booking_type: string | null;
  items: unknown;
  occurred_at: string;
  created_at: string;
};

export function useTransactions(limit = 500) {
  const q = useQuery({
    queryKey: ["transactions", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });
  useEffect(() => {
    const ch = supabase
      .channel("tx-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        q.refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return q;
}

export function useMerchants() {
  return useQuery({
    queryKey: ["merchants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("merchants").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSettlements() {
  return useQuery({
    queryKey: ["settlements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settlements")
        .select("*, merchant:merchants(name, merchant_code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNotifications() {
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  useEffect(() => {
    const ch = supabase
      .channel("notif-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => q.refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return q;
}

export function useFraudAlerts() {
  return useQuery({
    queryKey: ["fraud_alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fraud_alerts")
        .select("*, transaction:transactions(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useApiCredentials() {
  return useQuery({
    queryKey: ["api_credentials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_credentials").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}