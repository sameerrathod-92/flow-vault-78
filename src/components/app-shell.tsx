import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Store,
  Users,
  BarChart3,
  Wallet,
  ShieldAlert,
  Bell,
  Code2,
  FileText,
  Settings,
  LogOut,
  Moon,
  Sun,
  Search,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Pin,
  Command as CmdIcon,
  Clock,
  ShieldCheck,
  Radio,
  CircleDot,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";

/* -------- nav -------- */

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; shortcut?: string };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operate",
    items: [
      { to: "/dashboard", label: "Operations", icon: LayoutDashboard, shortcut: "G D" },
      { to: "/transactions", label: "Transactions", icon: ArrowLeftRight, shortcut: "G T" },
      { to: "/fraud", label: "Risk & Fraud", icon: ShieldAlert, shortcut: "G F" },
      { to: "/notifications", label: "Activity Feed", icon: Bell, shortcut: "G N" },
    ],
  },
  {
    label: "Money Movement",
    items: [
      { to: "/settlements", label: "Settlement Pipeline", icon: Wallet, shortcut: "G S" },
      { to: "/merchants", label: "Merchants", icon: Store, shortcut: "G M" },
      { to: "/customers", label: "Customers", icon: Users, shortcut: "G C" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3, shortcut: "G A" },
      { to: "/reports", label: "Reports", icon: FileText, shortcut: "G R" },
    ],
  },
  {
    label: "Developer",
    items: [
      { to: "/api", label: "API & Webhooks", icon: Code2, shortcut: "G K" },
      { to: "/settings", label: "Settings", icon: Settings, shortcut: "G ," },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

/* -------- sidebar -------- */

function EnvPill() {
  const [env, setEnv] = useState<"Production" | "Sandbox" | "Development">("Sandbox");
  const [open, setOpen] = useState(false);
  const color =
    env === "Production"
      ? "bg-[color:var(--color-destructive)]"
      : env === "Sandbox"
        ? "bg-[color:var(--color-warning)]"
        : "bg-[color:var(--color-info)]";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-sidebar-border bg-sidebar-accent/60 px-2 py-1.5 text-[11px] font-medium row-hover"
      >
        <span className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
          <span className="uppercase tracking-wider text-muted-foreground text-[10px]">Env</span>
          <span className="text-foreground">{env}</span>
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1 rounded-md border border-border bg-popover p-1 shadow-lg">
          {(["Production", "Sandbox", "Development"] as const).map((e) => (
            <button
              key={e}
              onClick={() => {
                setEnv(e);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] row-hover"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  e === "Production"
                    ? "bg-[color:var(--color-destructive)]"
                    : e === "Sandbox"
                      ? "bg-[color:var(--color-warning)]"
                      : "bg-[color:var(--color-info)]"
                }`}
              />
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkspaceSelector() {
  return (
    <button className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/60 px-2 py-2 text-left row-hover">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-foreground text-background text-[11px] font-bold tracking-tight">
        NB
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-semibold text-foreground">Nexus Bank</div>
        <div className="truncate text-[10px] text-muted-foreground">Payments · IN · Tier-1</div>
      </div>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

function NavLink({ item, collapsed, onClick }: { item: NavItem; collapsed: boolean; onClick?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === item.to || pathname.startsWith(item.to + "/");
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
        active
          ? "bg-sidebar-accent text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
      }`}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-foreground" />}
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.shortcut && (
        <span className="mono opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground">
          {item.shortcut}
        </span>
      )}
    </Link>
  );
}

function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const { user, role, signOut } = useAuth();
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    setRecent((r) => {
      const next = [pathname, ...r.filter((p) => p !== pathname)].slice(0, 4);
      return next;
    });
  }, [pathname]);

  const pinned = ["/transactions", "/settlements", "/fraud"];

  return (
    <aside
      style={{ width: collapsed ? 56 : 260 }}
      className="sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200"
    >
      {/* Institution header */}
      <div className={`flex items-center gap-2 border-b border-sidebar-border ${collapsed ? "h-11 justify-center px-1" : "h-11 px-3"}`}>
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-foreground text-background text-[10px] font-bold">
          NB
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-[12px] font-semibold leading-tight">Nexus Bank</div>
            <div className="truncate text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Merchant Services
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="space-y-2 border-b border-sidebar-border px-2 py-2">
          <WorkspaceSelector />
          <EnvPill />
        </div>
      )}

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <div className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((it) => (
                <NavLink key={it.to} item={it} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}

        {!collapsed && (
          <>
            <div className="mb-1 mt-4 flex items-center gap-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Pin className="h-2.5 w-2.5" /> Pinned
            </div>
            <div className="flex flex-col gap-0.5">
              {pinned
                .map((p) => ALL_NAV.find((n) => n.to === p))
                .filter(Boolean)
                .map((it) => (
                  <NavLink key={it!.to} item={it!} collapsed={false} />
                ))}
            </div>
            <div className="mb-1 mt-4 flex items-center gap-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Clock className="h-2.5 w-2.5" /> Recently viewed
            </div>
            <div className="flex flex-col gap-0.5">
              {recent
                .map((p) => ALL_NAV.find((n) => n.to === p))
                .filter(Boolean)
                .slice(0, 4)
                .map((it) => (
                  <NavLink key={"r-" + it!.to} item={it!} collapsed={false} />
                ))}
            </div>
          </>
        )}
      </div>

      {/* Command hint */}
      {!collapsed && (
        <div className="border-t border-sidebar-border px-2 py-2">
          <div className="flex items-center justify-between rounded-md border border-sidebar-border bg-sidebar-accent/60 px-2 py-1.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CmdIcon className="h-3 w-3" /> Command
            </span>
            <span className="flex items-center gap-1">
              <span className="kbd">⌘</span>
              <span className="kbd">K</span>
            </span>
          </div>
        </div>
      )}

      {/* User */}
      <div className={`flex items-center gap-2 border-t border-sidebar-border ${collapsed ? "h-11 justify-center px-1" : "h-12 px-2"}`}>
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold uppercase text-foreground">
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold">{user?.email?.split("@")[0]}</div>
              <div className="mono truncate text-[10px] text-muted-foreground uppercase">{role ?? "viewer"}</div>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="rounded p-1 text-muted-foreground row-hover hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
          className={`rounded p-1 text-muted-foreground row-hover hover:text-foreground ${collapsed ? "" : "ml-1"}`}
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  );
}

/* -------- header -------- */

function Clock12() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return (
    <div className="mono flex items-center gap-1.5 border-l border-border pl-3 text-[11px] text-muted-foreground">
      <span className="tabular text-foreground">{time}</span>
      <span className="text-[10px]">IST</span>
    </div>
  );
}

function SettlementWindow() {
  const now = new Date();
  const h = now.getHours();
  const status = h >= 9 && h < 17 ? "Open" : h >= 17 && h < 19 ? "Closing" : "Closed";
  const color =
    status === "Open"
      ? "text-[color:var(--color-success)]"
      : status === "Closing"
        ? "text-[color:var(--color-warning)]"
        : "text-muted-foreground";
  return (
    <div className="flex items-center gap-1.5 border-l border-border pl-3 text-[11px]">
      <ShieldCheck className="h-3 w-3 text-muted-foreground" />
      <span className="text-muted-foreground">Settlement</span>
      <span className={`font-semibold uppercase tracking-wider text-[10px] ${color}`}>{status}</span>
    </div>
  );
}

function CurrencyPicker() {
  const [cur, setCur] = useState<"INR" | "USD" | "EUR">("INR");
  return (
    <div className="mono flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[11px]">
      {(["INR", "USD", "EUR"] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCur(c)}
          className={`rounded px-1 py-0.5 ${cur === c ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function RealtimeDot() {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const ch = supabase
      .channel("realtime-heartbeat")
      .subscribe((status) => setOk(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);
  return (
    <div className="flex items-center gap-1.5 border-l border-border pl-3 text-[11px]">
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${ok ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-destructive)]"}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${ok ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-destructive)]"}`} />
      </span>
      <span className="text-muted-foreground">Realtime</span>
    </div>
  );
}

function Breadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  return (
    <div className="flex items-center gap-1.5 text-[12px]">
      <span className="text-muted-foreground">Nexus Bank</span>
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-muted-foreground">/</span>
          <span className={i === parts.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </span>
        </span>
      ))}
    </div>
  );
}

/* -------- command palette -------- */

function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return { open, setOpen };
}

function Palette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search transactions, merchants, customers, actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {ALL_NAV.map((n) => (
            <CommandItem
              key={n.to}
              onSelect={() => {
                onOpenChange(false);
                navigate({ to: n.to });
              }}
            >
              <n.icon className="mr-2 h-3.5 w-3.5" /> {n.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem>Approve pending settlements</CommandItem>
          <CommandItem>Flag transaction for review</CommandItem>
          <CommandItem>Export daily reconciliation</CommandItem>
          <CommandItem>Rotate webhook secret</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/* -------- shell -------- */

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const [unread, setUnread] = useState(0);
  const [pending] = useState(7);
  const [collapsed, setCollapsed] = useState(false);
  const palette = useCommandPalette();

  useEffect(() => {
    let mounted = true;
    const load = () =>
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false)
        .then(({ count }) => mounted && setUnread(count ?? 0));
    load();
    const ch = supabase
      .channel("notif-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-11 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
          <Breadcrumb />
          <button
            onClick={() => palette.setOpen(true)}
            className="ml-4 flex h-7 min-w-[280px] items-center gap-2 rounded-md border border-border bg-panel-2 px-2 text-[11px] text-muted-foreground row-hover"
          >
            <Search className="h-3 w-3" />
            <span className="flex-1 text-left">Search or run a command…</span>
            <span className="kbd">⌘K</span>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <RealtimeDot />
            <SettlementWindow />
            <Clock12 />
            <div className="flex items-center gap-1.5 border-l border-border pl-3">
              <Link to="/notifications" className="relative rounded p-1 text-muted-foreground row-hover hover:text-foreground">
                <Bell className="h-3.5 w-3.5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[color:var(--color-destructive)] px-1 text-[9px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <button
                title={`${pending} pending approvals`}
                className="relative flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground row-hover hover:text-foreground"
              >
                <CircleDot className="h-3.5 w-3.5" />
                <span className="tabular font-semibold text-foreground">{pending}</span>
                <span>pending</span>
              </button>
            </div>
            <CurrencyPicker />
            <button onClick={toggle} className="rounded border border-border p-1 text-muted-foreground row-hover hover:text-foreground">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1700px] flex-1 p-4">{children}</main>
      </div>
      <Palette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
}