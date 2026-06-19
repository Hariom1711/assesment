"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Shield, 
  Settings, 
  Globe2, 
  Clock, 
  Plus, 
  RefreshCw, 
  Check, 
  X,
  FileCode,
  FileCheck,
  ToggleLeft,
  AlertTriangle
} from "lucide-react";
import { Shell, Topbar } from "../../src/components/Shell";
import { StatusBadge } from "../../src/components/Ui";
import { getCountries, getSettings, apiBase, fallbackData } from "../../src/lib/api";
import type { Country, PlatformSettings } from "@waste/shared";

interface AuditLog {
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export default function SuperAdminPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [countries, setCountries] = useState<Country[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(fallbackData.settings);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Settings form inputs
  const [assignmentMode, setAssignmentMode] = useState<"manual" | "automatic">("manual");
  const [locationInterval, setLocationInterval] = useState(45);
  const [smsProvider, setSmsProvider] = useState("Hubtel");
  const [proofPhotos, setProofPhotos] = useState(2);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("Configure default dispatch settings.");

  // New Country Modal
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countryName, setCountryName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [taxRate, setTaxRate] = useState(0.125);
  const [savingCountry, setSavingCountry] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cList, platformSettings, logs] = await Promise.all([
          getCountries(),
          getSettings(),
          fetch(`${apiBase}/audit-logs`, { headers: { "x-role": "super_admin" } }).then(res => res.json()).catch(() => [
            { timestamp: new Date().toISOString(), actor: "system", action: "db.loaded", details: "Seeded 3 countries and 2 providers" }
          ])
        ]);
        setCountries(cList);
        setSettings(platformSettings);
        setAssignmentMode(platformSettings.assignmentMode);
        setLocationInterval(platformSettings.collectorLocationIntervalSeconds);
        setSmsProvider(platformSettings.smsProvider);
        setProofPhotos(platformSettings.proofPhotosRequired);
        setAuditLogs(logs);
      } catch (err) {
        console.error("Error loading settings panels:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg("Saving global options...");
    try {
      const response = await fetch(`${apiBase}/platform/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-role": "super_admin" },
        body: JSON.stringify({
          assignmentMode,
          collectorLocationIntervalSeconds: Number(locationInterval),
          smsProvider,
          proofPhotosRequired: Number(proofPhotos)
        })
      });
      if (response.ok) {
        setSettingsMsg("Platform settings committed successfully!");
        setRefreshKey(prev => prev + 1);
      } else {
        setSettingsMsg(`Error: ${await response.text()}`);
      }
    } catch (err) {
      setSettingsMsg("Failed to write to settings endpoint.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRegisterCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName || !countryCode || !currency) return;
    setSavingCountry(true);
    try {
      const providersList = countryCode === "NG" 
        ? ["Bank Transfer", "Card", "Wallet"] 
        : countryCode === "CI" 
        ? ["Mobile Wallet", "Card"] 
        : ["MTN MoMo", "Vodafone Cash", "Card"];

      const response = await fetch(`${apiBase}/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "super_admin" },
        body: JSON.stringify({
          code: countryCode.toUpperCase(),
          name: countryName,
          currency: currency.toUpperCase(),
          taxRate: Number(taxRate),
          active: true,
          paymentProviders: providersList
        })
      });
      if (response.ok) {
        setCountryName("");
        setCountryCode("");
        setCurrency("");
        setIsCountryModalOpen(false);
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      alert("Failed to register new country scope.");
    } finally {
      setSavingCountry(false);
    }
  };

  const handleToggleCountry = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${apiBase}/countries/${id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-role": "super_admin" },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (response.ok) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to toggle country active state:", err);
    }
  };

  return (
    <Shell active="/super-admin">
      <Topbar title="Super Admin Dashboard" subtitle="Govern country active states, default tax specifications, manual vs auto-dispatch rules, and audit events logs.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Reload Config
        </button>
        <button className="btn" onClick={() => setIsCountryModalOpen(true)}>
          <Plus size={16} /> Add Country Scope
        </button>
      </Topbar>

      {/* Main Configurations Grid */}
      <div className="grid two">
        
        {/* Left: Multi-Country Setup */}
        <div className="card">
          <h2>
            <Globe2 size={18} style={{ color: "var(--primary)" }} />
            Country Markets Setup
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -12, marginBottom: 20 }}>
            Toggling a country as inactive will suspend dispatch queues and payment flows for that specific market.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Country Name</th>
                  <th>ISO Code</th>
                  <th>Currency</th>
                  <th>Sales Tax</th>
                  <th>Gateway Providers</th>
                  <th>Status</th>
                  <th>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c.id}>
                    <td><b>{c.name}</b></td>
                    <td><code>{c.code}</code></td>
                    <td>{c.currency}</td>
                    <td>{(c.taxRate * 100).toFixed(1)}%</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {c.paymentProviders && c.paymentProviders.join(", ")}
                    </td>
                    <td>
                      <StatusBadge value={c.active ? "active" : "inactive"} />
                    </td>
                    <td>
                      <button 
                        className="btn secondary" 
                        style={{ padding: "4px 8px", fontSize: 11 }}
                        onClick={() => handleToggleCountry(c.id, c.active)}
                      >
                        {c.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Platform Settings */}
        <div className="card">
          <h2>
            <Settings size={18} style={{ color: "var(--accent)" }} />
            Global Platform Governance
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -12, marginBottom: 20 }}>
            Adjust dispatcher parameters, location telemetry interval, and SMS gateway hooks.
          </p>

          <form onSubmit={handleSaveSettings} className="form">
            <div className="full">
              <label>
                Auto-Dispatch Rules
                <select 
                  value={assignmentMode} 
                  onChange={e => setAssignmentMode(e.target.value as any)}
                >
                  <option value="manual">🙋‍♂️ Manual Assignment (Operations Approval)</option>
                  <option value="automatic">🤖 Automatic Proximity Dispatch (Auto-Find nearest)</option>
                </select>
              </label>
            </div>

            <div>
              <label>
                Location Ping Interval (s)
                <input 
                  type="number" 
                  value={locationInterval}
                  onChange={e => setLocationInterval(parseInt(e.target.value))}
                  required 
                />
              </label>
            </div>

            <div>
              <label>
                SMS Gateway Provider
                <input 
                  type="text" 
                  value={smsProvider}
                  onChange={e => setSmsProvider(e.target.value)}
                  required 
                />
              </label>
            </div>

            <div className="full">
              <label>
                Required Collector Proof Photos
                <input 
                  type="number" 
                  min={1} 
                  max={5} 
                  value={proofPhotos}
                  onChange={e => setProofPhotos(parseInt(e.target.value))}
                  required 
                />
              </label>
            </div>

            <div className="full" style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button type="submit" className="btn full" disabled={savingSettings}>
                {savingSettings ? "Saving Settings..." : "Save Platform Configurations"}
              </button>
            </div>

            <div className="full" style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              {settingsMsg}
            </div>
          </form>
        </div>

      </div>

      {/* System Event Audit Logs (Below Grid) */}
      <div className="card" style={{ marginTop: 24 }}>
        <h2>
          <Clock size={18} style={{ color: "var(--primary)" }} />
          Immutable Security Audit Event Logs
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -12, marginBottom: 20 }}>
          This log record is write-only. It tracks every administrative dispatch override, provider onboarding status update, and pricing change.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator Actor</th>
                <th>Operation Event</th>
                <th>Operation Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length > 0 ? (
                auditLogs.map((log, index) => (
                  <tr key={index}>
                    <td><code>{new Date(log.timestamp).toLocaleString()}</code></td>
                    <td style={{ color: "var(--accent)", fontWeight: 700 }}>{log.actor}</td>
                    <td><span className="badge" style={{ padding: "2px 8px" }}>{log.action}</span></td>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>
                    No audit records logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Country Modal */}
      {isCountryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCountryModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configure New Country Market</h3>
              <button className="modal-close" onClick={() => setIsCountryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterCountry} className="form">
              <div>
                <label>
                  Country Name
                  <input 
                    type="text" 
                    placeholder="E.g. Nigeria" 
                    value={countryName}
                    onChange={e => setCountryName(e.target.value)}
                    required 
                  />
                </label>
              </div>

              <div>
                <label>
                  ISO 2-Letter Code
                  <input 
                    type="text" 
                    placeholder="E.g. NG" 
                    maxLength={2}
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    required 
                  />
                </label>
              </div>

              <div>
                <label>
                  Currency Symbol
                  <input 
                    type="text" 
                    placeholder="E.g. NGN" 
                    maxLength={3}
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    required 
                  />
                </label>
              </div>

              <div>
                <label>
                  Sales Tax rate (e.g. 0.075)
                  <input 
                    type="number" 
                    step="0.001"
                    min="0"
                    max="0.5"
                    value={taxRate}
                    onChange={e => setTaxRate(parseFloat(e.target.value))}
                    required 
                  />
                </label>
              </div>

              <div className="full" style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={savingCountry}>
                  {savingCountry ? "Registering..." : "Add Country Scope"}
                </button>
                <button type="button" className="btn secondary" onClick={() => setIsCountryModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
