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
  Moon,
  LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiBase } from "../lib/api";

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

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

type ToastCallback = (toast: ToastMessage) => void;
let toastListeners: Set<ToastCallback> = new Set();

export const toast = {
  success: (message: string) => notify("success", message),
  error: (message: string) => notify("error", message),
  info: (message: string) => notify("info", message),
  warning: (message: string) => notify("warning", message),
};

function notify(type: ToastType, message: string) {
  const newToast: ToastMessage = {
    id: Math.random().toString(36).substring(2, 9),
    type,
    message,
  };
  toastListeners.forEach((listener) => listener(newToast));
}

function subscribeToToasts(listener: ToastCallback) {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return subscribeToToasts((newToast) => {
      setToasts((prev) => [...prev, newToast]);
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    });
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`toast toast-${t.type}`}
          onClick={() => removeToast(t.id)}
          style={{ cursor: "pointer" }}
        >
          <span style={{ flex: 1 }}>{t.message}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); removeToast(t.id); }}
            style={{ 
              background: "transparent", 
              border: 0, 
              color: "inherit", 
              opacity: 0.6, 
              cursor: "pointer", 
              fontSize: 14,
              fontWeight: 700,
              paddingLeft: 8
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

const roleNames: Record<string, string> = {
  super_admin: "Super Admin",
  operations_admin: "Operations Admin",
  collector: "Collector",
  customer: "Customer"
};

export function Shell({ children, active }: { children: React.ReactNode; active: string }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // Intercept window.fetch to automatically append Authorization header if token exists
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
      let url = "";
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input && typeof input === "object" && "url" in input) {
        url = (input as any).url;
      }

      if (url.startsWith(apiBase)) {
        const token = localStorage.getItem("token");
        if (token) {
          init = init || {};
          const headers = new Headers(init.headers || {});
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          init.headers = headers;
        }
      }
      return originalFetch.call(this, input, init);
    };

    // Load theme
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }

    // Verify session
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && Date.now() / 1000 > payload.exp) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          toast.error("Session expired. Please log in again.");
          router.push("/login");
          return;
        }
        
        const userData = JSON.parse(userStr);
        setUser(userData);
        setLoadingUser(false);

        // Access guard for /super-admin
        if (pathname.startsWith("/super-admin") && userData.role !== "super_admin") {
          toast.error("Access denied. You do not have super admin permissions.");
          router.push("/");
        }
      } else {
        throw new Error("Invalid session token format.");
      }
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }

    return () => {
      window.fetch = originalFetch;
    };
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Successfully logged out. Secure session terminated.");
    router.push("/login");
  };

  // Filter navigation by role
  const filteredNavGroups = navGroups.map((group) => {
    if (group.title === "Administration") {
      return {
        ...group,
        items: group.items.filter((item) => {
          if (item.href === "/super-admin") {
            return user?.role === "super_admin";
          }
          return true;
        })
      };
    }
    return group;
  }).filter((group) => group.items.length > 0);

  if (loadingUser) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg)",
        color: "var(--text-muted)",
        fontFamily: "inherit"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            display: "inline-grid",
            placeItems: "center",
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            color: "white",
            marginBottom: 16,
            boxShadow: "0 8px 16px rgba(16, 185, 129, 0.15)"
          }}>
            <Globe2 size={24} className="animate-spin-slow" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Authenticating Session...</div>
        </div>
      </div>
    );
  }

  // Render Access Denied layout for unauthorized platform settings access
  if (pathname.startsWith("/super-admin") && user && user.role !== "super_admin") {
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
            {filteredNavGroups.map((group) => (
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
                {user?.name || "Loading..."}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {roleNames[user?.role] || user?.role || "Admin"}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log Out of Session"
              style={{
                width: 32,
                height: 32,
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--line)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "var(--accent)",
                transition: "var(--transition)"
              }}
              className="hover:scale-105 active:scale-95 hover:bg-[rgba(255,255,255,0.06)]"
            >
              <LogOut size={14} />
            </button>
          </div>
        </aside>
        <main className="main" style={{ display: "grid", placeItems: "center", padding: 40 }}>
          <div className="card" style={{ maxWidth: 500, textAlign: "center", padding: "40px 24px", border: "1px solid var(--line)" }}>
            <Shield size={48} style={{ color: "var(--accent)", marginBottom: 16 }} />
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Access Denied</h2>
            <p style={{ color: "var(--text-muted)", margin: "12px 0 24px 0" }}>
              You do not have the required administrative permissions to access the platform settings.
            </p>
            <Link href="/" className="btn">
              Return to Dashboard
            </Link>
          </div>
        </main>
        <ToastContainer />
      </div>
    );
  }

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
          {filteredNavGroups.map((group) => (
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
              {user?.name || "Loading..."}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {roleNames[user?.role] || user?.role || "Admin"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out of Session"
            style={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--line)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--accent)",
              transition: "var(--transition)"
            }}
            className="hover:scale-105 active:scale-95 hover:bg-[rgba(255,255,255,0.06)]"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
      <ToastContainer />
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
