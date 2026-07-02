import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

const TABS = ["Profile","Bank","Organization","API","Billing","Security","Audit","Roles","Preferences"] as const;

function SettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Configuration" title="Settings" subtitle="Institution, developer, and workspace configuration." />
      <div className="grid gap-3" style={{ gridTemplateColumns: "220px minmax(0,1fr)" }}>
        <Panel dense>
          <nav className="flex flex-col text-[12px]">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-2 border-l-2 px-3 py-2 text-left ${tab === t ? "border-foreground bg-accent font-semibold" : "border-transparent text-muted-foreground row-hover hover:text-foreground"}`}>{t}</button>
            ))}
          </nav>
        </Panel>
        <Panel title={tab} eyebrow="Section">
          <div className="space-y-3 text-[12px]">
            {tab === "Profile" && <Grid rows={[["Full name","Aditya Kapoor"],["Email","aditya@nexusbank.io"],["Timezone","Asia/Kolkata"],["Language","English (India)"]]} />}
            {tab === "Bank" && <Grid rows={[["Legal name","Nexus Bank Ltd"],["RBI licence","BR-2018-4421"],["Nodal account","HDFC ••••1204"],["IFSC","HDFC0000042"]]} />}
            {tab === "Organization" && <Grid rows={[["Org ID","org_9f4a"],["Members","24"],["Workspaces","3"],["Region","IN-South"]]} />}
            {tab === "API" && <Grid rows={[["Live keys","1 active"],["Sandbox keys","2 active"],["Rate limit","2000 req/min"],["Idempotency","24h window"]]} />}
            {tab === "Billing" && <Grid rows={[["Plan","Enterprise"],["MRR","₹4,20,000"],["Next invoice","01 Jul"],["Contract","Annual"]]} />}
            {tab === "Security" && <Grid rows={[["MFA","Required · TOTP"],["SSO","Okta · SAML 2.0"],["IP allow-list","4 CIDRs"],["Session TTL","8h"]]} />}
            {tab === "Audit" && <Grid rows={[["Retention","7 years"],["Export","S3 · daily"],["Last review","12 Jun 2026"],["Compliance","PCI-DSS L1"]]} />}
            {tab === "Roles" && <Grid rows={[["Admins","3"],["Managers","6"],["Viewers","15"],["Custom roles","2"]]} />}
            {tab === "Preferences" && <Grid rows={[["Theme","System"],["Density","Compact"],["Currency","INR"],["Number format","Indian (lakh, crore)"]]} />}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-md border border-border">
      {rows.map(([k, v], i) => (
        <div key={k} className={`grid grid-cols-[220px_1fr] items-center gap-3 px-3 py-2.5 ${i < rows.length - 1 ? "border-b border-border" : ""}`}>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</span>
          <span className="text-[13px]">{v}</span>
        </div>
      ))}
    </div>
  );
}
