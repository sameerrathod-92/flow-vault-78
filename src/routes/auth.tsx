import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Building2, ShieldCheck, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Nexus Bank" },
      { name: "description", content: "Secure access to the Nexus Bank digital banking dashboard." },
    ],
  }),
  component: AuthPage,
});

const ROLES = [
  { id: "admin", label: "Bank Admin", desc: "Full control of the platform", icon: ShieldCheck },
  { id: "manager", label: "Relationship Manager", desc: "Merchants, settlements, customers", icon: UserCog },
  { id: "viewer", label: "Bank Staff", desc: "Read-only dashboards & reports", icon: Building2 },
] as const;

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "manager" | "viewer">("admin");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Nexus Bank", { description: "Account ready. Signing you in…" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "var(--gradient-aurora)" }} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative grid w-full max-w-5xl gap-0 overflow-hidden rounded-3xl border border-border/50 shadow-elegant glass-strong md:grid-cols-2"
      >
        <div className="relative hidden flex-col justify-between p-10 md:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-glow" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold">Nexus Bank</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Digital Banking Suite</div>
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="font-display text-4xl font-semibold leading-tight">
              Realtime payments,
              <br />
              <span className="gradient-text">enterprise control.</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Monitor live transactions from partner restaurants, manage merchant settlements, and detect fraud — all from one beautifully simple console.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map((r) => (
                <div key={r.id} className="rounded-xl border border-border/40 p-3 glass">
                  <r.icon className="h-4 w-4 text-primary" />
                  <div className="mt-2 text-xs font-semibold">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">© 2026 Nexus Bank · ISO 27001 · PCI-DSS</div>
        </div>

        <div className="bg-card/60 p-8 md:p-10">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary/60">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <h3 className="font-display text-2xl font-semibold">Welcome back</h3>
              <p className="mt-1 text-sm text-muted-foreground">Sign in to your bank console.</p>
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <h3 className="font-display text-2xl font-semibold">Create your console</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose your role to scope your access.</p>
            </TabsContent>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Rohan Verma" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLES.map((r) => (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => setRole(r.id)}
                          className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition ${
                            role === r.id ? "border-primary bg-primary/10 shadow-glow" : "border-border/50 hover:bg-secondary/60"
                          }`}
                        >
                          <r.icon className="h-4 w-4 text-primary" />
                          <span className="text-[11px] font-semibold leading-tight">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@nexusbank.com" autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" autoComplete={mode === "signin" ? "current-password" : "new-password"} />
              </div>
              <Button type="submit" className="w-full font-semibold shadow-glow" disabled={busy} style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                {busy ? "Working…" : mode === "signin" ? "Sign in securely" : "Create account"}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Protected with 256-bit encryption · Role-based access control
              </p>
            </form>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}