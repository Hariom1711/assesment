"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, Loader2, Globe2, User } from "lucide-react";
import { apiBase } from "../../src/lib/api";
import { toast } from "../../src/components/Shell";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [countryId, setCountryId] = useState("country-gh");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem("token")) {
      router.push("/");
    }
    // Set theme default on mount
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, countryId })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Save token & user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      toast.success(`Welcome to WasteOps, ${data.user.name}! Your account has been registered.`);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ 
      minHeight: "100vh", 
      display: "grid", 
      placeItems: "center", 
      background: "var(--bg)", 
      color: "var(--text-main)",
      padding: 24,
      position: "relative"
    }}>
      {/* Visual glowing blobs matching the theme background */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "20%",
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "rgba(79, 70, 229, 0.1)",
        filter: "blur(80px)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: "20%",
        right: "20%",
        width: 350,
        height: 350,
        borderRadius: "50%",
        background: "rgba(16, 185, 129, 0.08)",
        filter: "blur(90px)",
        pointerEvents: "none"
      }} />

      <section className="card" style={{ 
        maxWidth: 460, 
        width: "100%", 
        padding: "40px 32px", 
        border: "1px solid var(--line)", 
        borderRadius: 24,
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ 
            display: "inline-grid", 
            placeItems: "center", 
            width: 52, 
            height: 52, 
            borderRadius: 16, 
            background: "linear-gradient(135deg, var(--primary), var(--accent))", 
            color: "white",
            marginBottom: 16,
            boxShadow: "0 8px 16px rgba(16, 185, 129, 0.2)"
          }}>
            <Globe2 size={26} className="animate-spin-slow" />
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Join WasteOps</h1>
          <p style={{ margin: "8px 0 0 0", color: "var(--text-muted)", fontSize: 14 }}>
            Create a new account on the Multi-Country Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label>
            Full Name
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text" 
                placeholder="Jane Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ paddingLeft: 42, width: "100%" }}
              />
            </div>
          </label>

          <label>
            Email Address
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="email" 
                placeholder="jane.doe@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ paddingLeft: 42, width: "100%" }}
              />
            </div>
          </label>

          <label>
            Secure Password
            <div style={{ position: "relative" }}>
              <KeyRound size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="password" 
                placeholder="•••••••• (Min 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingLeft: 42, width: "100%" }}
              />
            </div>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              Role
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)}
                style={{ width: "100%", height: 38, padding: "0 10px" }}
              >
                <option value="customer">Customer</option>
                <option value="collector">Service Provider</option>
              </select>
            </label>

            <label>
              Country Scope
              <select 
                value={countryId} 
                onChange={e => setCountryId(e.target.value)}
                style={{ width: "100%", height: 38, padding: "0 10px" }}
              >
                <option value="country-gh">🇬🇭 Ghana (GHS)</option>
                <option value="country-ng">🇳🇬 Nigeria (NGN)</option>
                <option value="country-ci">🇨🇮 Côte d'Ivoire (XOF)</option>
              </select>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn full" 
            style={{ height: 46, marginTop: 12 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating Account...
              </>
            ) : (
              "Register & Log In"
            )}
          </button>
        </form>

        <div style={{ 
          marginTop: 24, 
          fontSize: 13, 
          color: "var(--text-muted)", 
          textAlign: "center" 
        }}>
          Already have an account?{" "}
          <span 
            onClick={() => router.push("/login")}
            style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
          >
            Sign In
          </span>
        </div>
      </section>
    </main>
  );
}
