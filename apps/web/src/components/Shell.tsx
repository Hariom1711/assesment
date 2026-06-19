"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  BarChart3, 
  Boxes, 
  ClipboardList, 
  Globe2, 
  LayoutDashboard, 
  Map, 
  Shield, 
  Truck, 
  Users, 
  WalletCards, 
  MessageSquare, 
  Image, 
  ClipboardCheck, 
  BriefcaseBusiness, 
  Bug, 
  Sparkles,
  ChevronDown,
  User,
  Settings,
  Sun,
  Moon
} from "lucide-react";
import { useState, useEffect } from "react";

// Navigation divided into logical groups
const navGroups = [
  {
    title: "Operations",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/requests", label: "All Requests", icon: ClipboardCheck },
      { href: "/job-assignment", label: "Manual Dispatch", icon: BriefcaseBusiness },
      { href: "/live-tracking", label: "Live Dispatch Map", icon: Map },
    ]
  },
  {
    title: "Core Services",
    items: [
      { href: "/pickups", label: "Waste Collection", icon: ClipboardList },
      { href: "/cleaning", label: "Home Cleaning", icon: Sparkles },
      { href: "/pest-control", label: "Pest Control", icon: Bug },
    ]
  },
  {
    title: "Channels & Verifications",
    items: [
      { href: "/sms", label: "SMS Gateway Center", icon: MessageSquare },
      { href: "/gallery", label: "Proof Photos Gallery", icon: Image },
    ]
  },
  {
    title: "Resources",
    items: [
      { href: "/collectors", label: "Service Providers", icon: Truck },
      { href: "/customers", label: "Customer List", icon: Users },
      { href: "/sacks", label: "Sack Inventory", icon: Boxes },
      { href: "/payments", label: "Financial Ledger", icon: WalletCards },
      { href: "/reports", label: "Analytics & Reports", icon: BarChart3 },
    ]
  },
  {
    title: "Administration",
    items: [
      { href: "/super-admin", label: "Platform Settings", icon: Shield }
    ]
  }
];

export function Shell({ children, active }: { children: React.ReactNode; active: string }) {
  const pathname = usePathname();
  
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, []);
  
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Globe2 size={22} className="animate-spin-slow" />
          </span>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>WasteOps</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Multi-Country Platform</span>
          </div>
        </div>
        
        <nav className="nav" style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
          {navGroups.map((group) => (
            <div key={group.title} style={{ marginBottom: 20 }}>
              <div style={{ 
                fontSize: 10, 
                textTransform: "uppercase", 
                letterSpacing: "0.1em", 
                fontWeight: 700, 
                color: "rgba(255,255,255,0.25)",
                paddingLeft: 16,
                marginBottom: 8
              }}>
                {group.title}
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link 
                      key={item.href} 
                      className={isActive ? "active" : ""} 
                      href={item.href}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ 
          borderTop: "1px solid var(--line)", 
          paddingTop: 16, 
          marginTop: 16,
          display: "flex", 
          alignItems: "center", 
          gap: 12 
        }}>
          <div style={{ 
            width: 38, 
            height: 38, 
            borderRadius: "50%", 
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--line)",
            display: "grid",
            placeItems: "center",
            color: "var(--primary)"
          }}>
            <User size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Yaw Mensah
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Operations Admin
            </div>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Detect theme on mount
    const isLight = document.body.classList.contains("light");
    setTheme(isLight ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  };

  return (
    <button 
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      style={{
        width: 38,
        height: 38,
        borderRadius: "14px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--line)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        color: "var(--text-main)",
        transition: "var(--transition)"
      }}
      className="hover:scale-105 active:scale-95 hover:bg-[rgba(255,255,255,0.06)]"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export function Topbar({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCountry = searchParams.get("countryId") ?? "country-gh";

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCountry = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("countryId", nextCountry);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="topbar">
      <div className="title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="controls">
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: "14px", padding: "4px 12px" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
            <Globe2 size={14} /> Country Scope:
          </span>
          <select 
            value={currentCountry} 
            onChange={handleCountryChange}
            style={{ 
              border: 0, 
              background: "transparent", 
              padding: "4px 8px", 
              fontSize: 13, 
              fontWeight: 700, 
              minWidth: "auto", 
              cursor: "pointer" 
            }}
          >
            <option value="country-gh">🇬🇭 Ghana (GHS)</option>
            <option value="country-ng">🇳🇬 Nigeria (NGN)</option>
            <option value="country-ci">🇨🇮 Côte d'Ivoire (XOF)</option>
          </select>
        </div>
        <ThemeToggle />
        {children}
      </div>
    </div>
  );
}
