import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, KeyRound, Webhook, Users, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<any>({ full_name: "", email: "" });
  const [bank, setBank] = useState({
    name: "Nexus Bank", swift: "NEXUSINBB", ifsc: "NEXB0000001", license: "RBI/DBR/2026/91",
  });
  const [api, setApi] = useState({ rate_limit: 60, retries: 3, sandbox: true });
  const [webhook, setWebhook] = useState({ url: "", secret: "wh_sec_" + Math.random().toString(36).slice(2, 12), retries: true });
  const [security, setSecurity] = useState({ mfa: true, alerts: true, session: 60 });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => data && setProfile(data));
    supabase.from("profiles").select("id, email, full_name").then(({ data }) => setUsers(data ?? []));
  }, [user]);

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update({ full_name: profile.full_name }).eq("id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure your bank, integrations, roles and security policies" />

      <Tabs defaultValue="bank" className="space-y-4">
        <TabsList className="flex-wrap bg-secondary/40">
          <TabsTrigger value="bank" className="gap-2"><Building2 className="h-4 w-4" /> Bank</TabsTrigger>
          <TabsTrigger value="api" className="gap-2"><KeyRound className="h-4 w-4" /> API</TabsTrigger>
          <TabsTrigger value="webhook" className="gap-2"><Webhook className="h-4 w-4" /> Webhooks</TabsTrigger>
          <TabsTrigger value="roles" className="gap-2"><Users className="h-4 w-4" /> Roles</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="bank">
          <Panel title="Bank Details">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Bank Name"><Input value={bank.name} onChange={(e) => setBank({ ...bank, name: e.target.value })} /></Field>
              <Field label="SWIFT Code"><Input value={bank.swift} onChange={(e) => setBank({ ...bank, swift: e.target.value })} /></Field>
              <Field label="IFSC"><Input value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value })} /></Field>
              <Field label="License"><Input value={bank.license} onChange={(e) => setBank({ ...bank, license: e.target.value })} /></Field>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => toast.success("Bank details saved")} style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>Save</Button>
            </div>
          </Panel>

          <Panel title="Your Profile" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full Name"><Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></Field>
              <Field label="Email"><Input value={profile.email ?? user?.email ?? ""} disabled /></Field>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveProfile} style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>Save profile</Button>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="api">
          <Panel title="API Settings">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Rate limit (req/min)"><Input type="number" value={api.rate_limit} onChange={(e) => setApi({ ...api, rate_limit: Number(e.target.value) })} /></Field>
              <Field label="Retry attempts"><Input type="number" value={api.retries} onChange={(e) => setApi({ ...api, retries: Number(e.target.value) })} /></Field>
              <div className="flex items-end justify-between rounded-xl border border-border/50 bg-secondary/30 p-3">
                <Label className="text-sm">Sandbox mode</Label>
                <Switch checked={api.sandbox} onCheckedChange={(v) => setApi({ ...api, sandbox: v })} />
              </div>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="webhook">
          <Panel title="Webhook Settings">
            <div className="grid gap-4">
              <Field label="Default Webhook URL"><Input value={webhook.url} onChange={(e) => setWebhook({ ...webhook, url: e.target.value })} placeholder="https://your-app.com/webhooks" /></Field>
              <Field label="Signing Secret"><Input value={webhook.secret} readOnly /></Field>
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-3">
                <Label className="text-sm">Auto-retry on failure</Label>
                <Switch checked={webhook.retries} onCheckedChange={(v) => setWebhook({ ...webhook, retries: v })} />
              </div>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="roles">
          <Panel title="Roles & Permissions">
            <div className="mb-3 text-xs text-muted-foreground">Current role: <span className="rounded-md bg-secondary px-2 py-0.5 font-mono">{role ?? "viewer"}</span></div>
            <div className="grid gap-3">
              {[
                { name: "Admin", desc: "Full access to bank operations, merchants, settlements, and security policies." },
                { name: "Manager", desc: "Manage merchants, run fraud scans, approve settlements, and post notifications." },
                { name: "Viewer", desc: "Read-only access to dashboards, reports, and transaction history." },
              ].map((r) => (
                <div key={r.name} className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                  <div className="font-display text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <div className="mb-2 font-display text-sm font-semibold">Team members</div>
              <div className="overflow-hidden rounded-xl border border-border/50">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-left text-[11px] uppercase text-muted-foreground"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th></tr></thead>
                  <tbody className="divide-y divide-border/40">
                    {users.map((u) => <tr key={u.id}><td className="px-3 py-2">{u.full_name}</td><td className="px-3 py-2 text-muted-foreground">{u.email}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="security">
          <Panel title="Security">
            <div className="grid gap-3">
              <Row label="Multi-factor authentication" desc="Require an additional factor at login.">
                <Switch checked={security.mfa} onCheckedChange={(v) => setSecurity({ ...security, mfa: v })} />
              </Row>
              <Row label="Security alerts" desc="Email notifications on suspicious sign-ins.">
                <Switch checked={security.alerts} onCheckedChange={(v) => setSecurity({ ...security, alerts: v })} />
              </Row>
              <Field label="Session timeout (minutes)"><Input type="number" value={security.session} onChange={(e) => setSecurity({ ...security, session: Number(e.target.value) })} /></Field>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border/50 p-5 glass shadow-elegant ${className}`}>
      <h3 className="mb-4 font-display text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-3">
      <div>
        <div className="font-display text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}