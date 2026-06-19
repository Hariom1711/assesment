"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Users, 
  Truck, 
  Clipboard, 
  DollarSign, 
  Clock, 
  PlayCircle,
  Plus,
  RefreshCw,
  Phone,
  Star,
  MapPin,
  X,
  TrendingUp
} from "lucide-react";
import { Shell, Topbar, toast } from "../src/components/Shell";
import { StatusBadge, SkeletonCard, SkeletonTable } from "../src/components/Ui";
import { getCountries, getDashboard, apiBase, fallbackData } from "../src/lib/api";
import type { Country, Collector, Pickup } from "@waste/shared";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // State variables
  const [countries, setCountries] = useState<Country[]>([]);
  const [dashboard, setDashboard] = useState<any>(fallbackData.dashboard);
  const [loading, setLoading] = useState(true);
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form states
  const [address, setAddress] = useState("");
  const [pickupWindow, setPickupWindow] = useState<"morning" | "afternoon" | "evening">("morning");
  const [sackCount, setSackCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [cList, dashData] = await Promise.all([
          getCountries(),
          getDashboard(countryId)
        ]);
        setCountries(cList);
        setDashboard(dashData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  // Polling simulator for live coordinates & queues (every 5 seconds)
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const dashData = await getDashboard(countryId);
        // Introduce small random drift to map coordinates to simulate actual vehicle movement
        if (dashData.collectorMap) {
          dashData.collectorMap = dashData.collectorMap.map((col: any) => {
            if (col.availability === "online" || col.availability === "assigned") {
              const driftX = (Math.random() - 0.5) * 0.005;
              const driftY = (Math.random() - 0.5) * 0.005;
              return {
                ...col,
                latitude: col.latitude + driftX,
                longitude: col.longitude + driftY
              };
            }
            return col;
          });
        }
        setDashboard(dashData);
      } catch (err) {
        console.warn("Failed to poll live telemetry updates:", err);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [countryId]);

  const activeCountry = countries.find(c => c.id === countryId) ?? { currency: "GHS", name: "Ghana" };

  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/pickups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify({
          countryId,
          customerId: "cust-1", // Demo customer Ama Mensah
          pickupWindow,
          address,
          sackSummary: `${sackCount} Sacks`,
          amount: sackCount * (countryId === "country-ng" ? 2500 : countryId === "country-ci" ? 1500 : 30),
          source: "admin"
        })
      });
      if (response.ok) {
        setAddress("");
        setSackCount(1);
        setIsModalOpen(false);
        setRefreshKey(prev => prev + 1);
        toast.success("New pickup request successfully dispatched!");
      } else {
        toast.error("Failed to submit pickup request.");
      }
    } catch (err: any) {
      toast.error(`Pickup creation failed: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCollectorStatus = async (colId: string, status: string) => {
    try {
      const response = await fetch(`${apiBase}/collectors/${colId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        const updated = await response.json();
        if (selectedCollector && selectedCollector.id === colId) {
          setSelectedCollector({ ...selectedCollector, status: updated.status });
        }
        toast.success(`Collector status successfully updated to ${status}!`);
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error("Failed to update collector status.");
      }
    } catch (err: any) {
      toast.error(`Collector update failed: ${err.message || err}`);
    }
  };

  return (
    <Shell active="/">
      <Topbar 
        title={`${activeCountry.name} Operations Board`} 
        subtitle="Real-time control panel monitoring active collection queues, payment flows, and field dispatch."
      >
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Pickup Request
        </button>
      </Topbar>

      {/* KPI Stats Panel */}
      <div className="grid kpis">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="card kpi-card">
              <div className="kpi-label">Total Customers</div>
              <div className="kpi-value">
                <Users size={24} style={{ color: "var(--accent)" }} />
                {dashboard.kpis.totalCustomers}
              </div>
              <div className="kpi-subtext">Registered clients</div>
            </div>
            <div className="card kpi-card success-accent">
              <div className="kpi-label">Active Collectors</div>
              <div className="kpi-value">
                <Truck size={24} style={{ color: "var(--primary)" }} />
                {dashboard.kpis.totalCollectors}
              </div>
              <div className="kpi-subtext">Onboarding & approved</div>
            </div>
            <div className="card kpi-card success-accent">
              <div className="kpi-label">Today's Pickups</div>
              <div className="kpi-value">
                <Clipboard size={24} style={{ color: "#14b8a6" }} />
                {dashboard.kpis.todaysPickups}
              </div>
              <div className="kpi-subtext">Bookings logged today</div>
            </div>
            <div className="card kpi-card success-accent">
              <div className="kpi-label">Today's Revenue</div>
              <div className="kpi-value" style={{ color: "var(--primary)" }}>
                <DollarSign size={24} />
                <span style={{ fontSize: 24, marginRight: 2 }}>{activeCountry.currency}</span>
                {dashboard.kpis.revenueToday}
              </div>
              <div className="kpi-subtext">Cleared Momo/Card/Cash</div>
            </div>
            <div className="card kpi-card warning-accent">
              <div className="kpi-label">Pending Queue</div>
              <div className="kpi-value" style={{ color: "var(--warning)" }}>
                <Clock size={24} />
                {dashboard.kpis.pendingRequests}
              </div>
              <div className="kpi-subtext">Needs dispatching</div>
            </div>
            <div className="card kpi-card warning-accent">
              <div className="kpi-label">Active Jobs</div>
              <div className="kpi-value" style={{ color: "var(--accent)" }}>
                <PlayCircle size={24} />
                {dashboard.kpis.activeJobs}
              </div>
              <div className="kpi-subtext">In-progress routes</div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid: Interactive Map & Requests */}
      <div className="grid two" style={{ marginTop: 24 }}>
        
        {/* Left Side: Recent Requests */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card">
            <h2>
              <Clipboard size={18} style={{ color: "var(--primary)" }} />
              Live Collection Requests Queue
            </h2>
            {loading ? (
              <SkeletonTable cols={6} rows={4} />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Source</th>
                      <th>Address</th>
                      <th>Waste Spec</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentPickups && dashboard.recentPickups.length > 0 ? (
                      dashboard.recentPickups.map((pickup: Pickup) => (
                        <tr key={pickup.id}>
                          <td><b>{pickup.id}</b></td>
                          <td>
                            <span style={{ 
                              fontSize: 11, 
                              fontWeight: 700, 
                              textTransform: "uppercase",
                              opacity: 0.8
                            }}>
                              {pickup.source}
                            </span>
                          </td>
                          <td>{pickup.address}</td>
                          <td style={{ color: "var(--primary)", fontWeight: 600 }}>{pickup.sackSummary}</td>
                          <td><StatusBadge value={pickup.status} /></td>
                          <td style={{ fontWeight: 700 }}>{activeCountry.currency} {pickup.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                          No collection requests found for this country.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map & Profiles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card">
            <h2>
              <TrendingUp size={18} style={{ color: "var(--accent)" }} />
              Live Field Dispatch Tracking Map
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -12, marginBottom: 16 }}>
              Simulating actual GPS locations of collectors in the capital district. Click on any pin to dispatch or manage.
            </p>

            {loading ? (
              <div className="map-container animate-pulse" style={{ display: "grid", placeItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading tracking telemetry...</span>
              </div>
            ) : (
              <div className="map-container">
                {/* Grid overlay lines */}
                <svg className="map-svg" viewBox="0 0 100 100">
                  <line x1="10" y1="0" x2="10" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="30" y1="0" x2="30" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="70" y1="0" x2="70" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="90" y1="0" x2="90" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  
                  {/* Ghana Coast outline representation */}
                  {countryId === "country-gh" && (
                    <path d="M 5,95 Q 40,80 60,65 T 95,50" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="2" strokeDasharray="4,4" />
                  )}
                  {/* Nigeria representation */}
                  {countryId === "country-ng" && (
                    <path d="M 10,10 Q 50,40 90,10 M 10,90 Q 50,60 90,90" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="2" />
                  )}
                </svg>

                <div className="map-pins">
                  {dashboard.collectorMap && dashboard.collectorMap.map((col: Collector, index: number) => {
                    // Normalize coordinates to fit inside [10-90]% boundaries in the SVG view
                    let x = 20 + ((col.longitude + 1) * 35);
                    let y = 30 + ((col.latitude - 5) * 45);
                    if (isNaN(x) || x < 5 || x > 95) x = 20 + (index * 25);
                    if (isNaN(y) || y < 5 || y > 95) y = 40 + (index * 15);
                    
                    return (
                      <div 
                        key={col.id} 
                        className={`pin ${col.availability}`} 
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onClick={() => setSelectedCollector(col)}
                      >
                        <div className="pin-marker"></div>
                        <span className="pin-label">{col.name} ({col.vehicleType})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick list below map */}
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 12, height: 38 }}>
                    <div className="skeleton-bar animate-pulse" style={{ width: "50%", height: 12 }} />
                    <div className="skeleton-bar animate-pulse" style={{ width: "30%", height: 12 }} />
                  </div>
                ))
              ) : (
                dashboard.collectorMap && dashboard.collectorMap.slice(0, 3).map((col: Collector) => (
                  <div key={col.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 12, fontSize: 13 }}>
                    <span><b>{col.name}</b> · <span style={{ opacity: 0.7 }}>{col.vehicleType}</span></span>
                    <span style={{ display: "flex", gap: 6 }}>
                      <StatusBadge value={col.availability} />
                      <StatusBadge value={col.status} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collector Detail Popup Modal */}
      {selectedCollector && (
        <div className="modal-overlay" onClick={() => setSelectedCollector(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Provider Profile Scope</h3>
              <button className="modal-close" onClick={() => setSelectedCollector(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: "50%", 
                  background: "var(--primary-glow)", 
                  color: "var(--primary)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  fontWeight: 800,
                  border: "2px solid var(--primary)"
                }}>
                  {selectedCollector.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedCollector.name}</h4>
                  <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: 13 }}>
                    ID: {selectedCollector.id} · {selectedCollector.vehicleType} Operator
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 16 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Current Availability</span>
                  <span style={{ display: "inline-block", marginTop: 4 }}><StatusBadge value={selectedCollector.availability} /></span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Application Status</span>
                  <span style={{ display: "inline-block", marginTop: 4 }}><StatusBadge value={selectedCollector.status} /></span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Total Earnings</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{activeCountry.currency} {selectedCollector.earnings}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Completed Pickups</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{selectedCollector.completedJobs} Jobs</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <Phone size={14} style={{ color: "var(--primary)" }} /> {selectedCollector.phone}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <Star size={14} style={{ color: "var(--warning)", fill: "var(--warning)" }} /> {selectedCollector.rating || "No ratings yet"} / 5.0 Rating
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <MapPin size={14} style={{ color: "var(--accent)" }} /> Lat: {selectedCollector.latitude.toFixed(5)}, Lng: {selectedCollector.longitude.toFixed(5)}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, display: "flex", gap: 10 }}>
                {selectedCollector.status !== "approved" ? (
                  <button className="btn" style={{ flex: 1 }} onClick={() => updateCollectorStatus(selectedCollector.id, "approved")}>
                    Approve Applicant
                  </button>
                ) : (
                  <button className="btn danger" style={{ flex: 1 }} onClick={() => updateCollectorStatus(selectedCollector.id, "suspended")}>
                    Suspend Collector
                  </button>
                )}
                <button className="btn secondary" onClick={() => setSelectedCollector(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Pickup Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dispatch New Sack Pickup</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePickup} className="form">
              <div className="full">
                <label>
                  Customer Pickup Location/Address
                  <input 
                    type="text" 
                    placeholder="Enter district, street details" 
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required 
                  />
                </label>
              </div>

              <div>
                <label>
                  Schedule Window
                  <select 
                    value={pickupWindow}
                    onChange={e => setPickupWindow(e.target.value as any)}
                  >
                    <option value="morning">🌅 Morning Pickup</option>
                    <option value="afternoon">☀️ Afternoon Pickup</option>
                    <option value="evening">🌆 Evening Pickup</option>
                  </select>
                </label>
              </div>

              <div>
                <label>
                  Number of Official Sacks
                  <input 
                    type="number" 
                    min={1} 
                    max={20} 
                    value={sackCount}
                    onChange={e => setSackCount(parseInt(e.target.value))}
                    required 
                  />
                </label>
              </div>

              <div className="full" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", padding: 14, borderRadius: 12, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Sack Price Unit:</span>
                  <span>
                    {activeCountry.currency} {countryId === "country-ng" ? "2,500" : countryId === "country-ci" ? "1,500" : "30"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 6, fontSize: 14, color: "var(--primary)" }}>
                  <span>Total Due:</span>
                  <span>
                    {activeCountry.currency} {sackCount * (countryId === "country-ng" ? 2500 : countryId === "country-ci" ? 1500 : 30)}
                  </span>
                </div>
              </div>

              <div className="full" style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? "Dispatching..." : "Submit Dispatch Request"}
                </button>
                <button type="button" className="btn secondary" onClick={() => setIsModalOpen(false)}>
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
