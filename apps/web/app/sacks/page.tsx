"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Boxes, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  Layers,
  ArrowUpRight,
  TrendingDown,
  CheckCircle
} from "lucide-react";
import { Shell, Topbar } from "../../src/components/Shell";
import { getSacks, apiBase } from "../../src/lib/api";
import type { SackType } from "@waste/shared";

export default function SacksPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // State
  const [sacks, setSacks] = useState<SackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form State
  const [selectedSackId, setSelectedSackId] = useState("");
  const [price, setPrice] = useState("");
  const [stockReceived, setStockReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("Ready to update sack pricing or restock.");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getSacks(countryId);
        setSacks(data);
        if (data.length > 0) {
          setSelectedSackId(data[0].id);
        }
      } catch (err) {
        console.error("Error loading sacks data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  const activeCountry = countryId === "country-ng" ? { currency: "NGN", name: "Nigeria" } : countryId === "country-ci" ? { currency: "XOF", name: "Côte d'Ivoire" } : { currency: "GHS", name: "Ghana" };

  const handleUpdateSacks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSackId || !price || !stockReceived) return;
    setSubmitting(true);
    setMessage("Updating inventory...");
    try {
      const response = await fetch(`${apiBase}/sack-types/${selectedSackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify({
          price: Number(price),
          stockReceived: Number(stockReceived)
        })
      });
      if (response.ok) {
        setPrice("");
        setStockReceived("");
        setMessage("Sack parameters updated successfully!");
        setRefreshKey(prev => prev + 1);
      } else {
        setMessage(`Error: ${await response.text()}`);
      }
    } catch (err) {
      setMessage("Failed to write update. Backend might be unreachable.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper calculations
  const totalReceived = sacks.reduce((sum, s) => sum + s.stockReceived, 0);
  const totalSold = sacks.reduce((sum, s) => sum + s.stockSold, 0);
  const totalRemaining = totalReceived - totalSold;
  const totalRevenue = sacks.reduce((sum, s) => sum + (s.stockSold * s.price), 0);

  // Check if any sack type is running low (remaining stock < 20% of received)
  const lowStockItems = sacks.filter(s => {
    const remaining = s.stockReceived - s.stockSold;
    return remaining < (s.stockReceived * 0.25);
  });

  return (
    <Shell active="/sacks">
      <Topbar title="Sack Inventory & Distribution" subtitle="Track official company-issued waste sacks, manage localized pricing, monitor warehouse restocks, and review sales logs.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Stock
        </button>
      </Topbar>

      {/* KPI Stats */}
      <div className="grid three" style={{ marginBottom: 24 }}>
        <div className="card kpi-card success-accent">
          <div className="kpi-label">Total Sacks Distributed</div>
          <div className="kpi-value">
            <Boxes size={24} style={{ color: "var(--primary)" }} />
            {totalSold} <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 6 }}>/ {totalReceived} received</span>
          </div>
          <div className="kpi-subtext">{totalRemaining} remaining in warehouse</div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-label">Sack Sales Revenue</div>
          <div className="kpi-value">
            <DollarSign size={24} style={{ color: "var(--accent)" }} />
            {activeCountry.currency} {totalRevenue}
          </div>
          <div className="kpi-subtext">Cumulative payments received</div>
        </div>

        <div className="card kpi-card warning-accent">
          <div className="kpi-label">Inventory Status</div>
          <div className="kpi-value" style={{ color: lowStockItems.length > 0 ? "var(--danger)" : "var(--primary)" }}>
            {lowStockItems.length > 0 ? (
              <>
                <AlertTriangle size={24} style={{ color: "var(--danger)" }} />
                {lowStockItems.length} Low Stock Alert(s)
              </>
            ) : (
              <>
                <CheckCircle size={24} style={{ color: "var(--primary)" }} />
                Healthy Stock Levels
              </>
            )}
          </div>
          <div className="kpi-subtext">Automatic warning threshold set at 25%</div>
        </div>
      </div>

      {/* Warning Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="card" style={{ 
          marginBottom: 24, 
          background: "rgba(244,63,94,0.06)", 
          border: "1px solid rgba(244,63,94,0.25)",
          padding: "16px 20px" 
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <AlertTriangle style={{ color: "var(--danger)" }} />
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>
                Restock Action Required
              </h4>
              <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                The following sack types are running low: {lowStockItems.map(s => `"${s.name}"`).join(", ")}. Restock immediately to prevent collection delays.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Stock list & Updates */}
      <div className="grid two">
        
        {/* Left: Stock sheets */}
        <div className="card">
          <h2>Sack Catalog & Stock Ledger</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Sack Specification</th>
                  <th>Price Rate</th>
                  <th>Total Restocked</th>
                  <th>Total Sold</th>
                  <th>Remaining Stock</th>
                  <th>Level Chart</th>
                </tr>
              </thead>
              <tbody>
                {sacks.length > 0 ? (
                  sacks.map((s) => {
                    const remaining = s.stockReceived - s.stockSold;
                    const percent = Math.max(0, Math.min(100, (remaining / s.stockReceived) * 100));
                    const isLow = remaining < (s.stockReceived * 0.25);
                    
                    return (
                      <tr key={s.id}>
                        <td><b>{s.name} Sack</b></td>
                        <td style={{ fontWeight: 700 }}>{activeCountry.currency} {s.price}</td>
                        <td>{s.stockReceived} pcs</td>
                        <td>{s.stockSold} pcs</td>
                        <td style={{ color: isLow ? "var(--danger)" : "var(--primary)", fontWeight: 700 }}>
                          {remaining} pcs
                        </td>
                        <td style={{ width: 140 }}>
                          <div style={{ 
                            width: "100%", 
                            height: 6, 
                            background: "rgba(255,255,255,0.05)", 
                            borderRadius: 3,
                            overflow: "hidden" 
                          }}>
                            <div style={{ 
                              width: `${percent}%`, 
                              height: "100%", 
                              background: isLow ? "var(--danger)" : "var(--primary)",
                              boxShadow: isLow ? "0 0 8px var(--danger)" : "none",
                              borderRadius: 3
                            }}></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                      No sack types found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: pricing Restock forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          <div className="card">
            <h2>Inventory Restock & Price Adjustments</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -12, marginBottom: 20 }}>
              Adjust official price tags or record wholesale sacks deliveries from factories.
            </p>

            <form onSubmit={handleUpdateSacks} className="form">
              <div className="full">
                <label>
                  Select Sack Specification
                  <select 
                    value={selectedSackId} 
                    onChange={e => setSelectedSackId(e.target.value)}
                    required
                  >
                    {sacks.map(s => (
                      <option key={s.id} value={s.id}>{s.name} Sack</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <label>
                  New Price ({activeCountry.currency})
                  <input 
                    type="number" 
                    placeholder="Enter price unit" 
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required 
                  />
                </label>
              </div>

              <div>
                <label>
                  Total Sacks Received (Absolute)
                  <input 
                    type="number" 
                    placeholder="Total stock count" 
                    value={stockReceived}
                    onChange={e => setStockReceived(e.target.value)}
                    required 
                  />
                </label>
              </div>

              <div className="full" style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button type="submit" className="btn full" disabled={submitting}>
                  {submitting ? "Updating..." : "Save Pricing & Restock"}
                </button>
              </div>

              <div className="full" style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                {message}
              </div>
            </form>
          </div>

          <div className="card">
            <h2>Sack Distribution Rules</h2>
            <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: "var(--text-muted)" }}>
              <li>Clients must buy official sacks via mobile app to schedule recurring cleanups.</li>
              <li>Only company-issued sacks (printed with barcoded labels) are authorized for sorting.</li>
              <li>Sack pricing matches country tax limits and MoMo gateway transaction adjustments.</li>
            </ul>
          </div>

        </div>

      </div>
    </Shell>
  );
}
