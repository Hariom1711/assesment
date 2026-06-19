"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Truck, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Star,
  DollarSign,
  Briefcase,
  AlertTriangle,
  UserPlus,
  X,
  Phone
} from "lucide-react";
import { Shell, Topbar } from "../../src/components/Shell";
import { StatusBadge } from "../../src/components/Ui";
import { getCollectors, getServiceProviders, apiBase } from "../../src/lib/api";
import type { Collector, ServiceProvider } from "@waste/shared";

export default function CollectorsPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer / Interaction State
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cList, spList] = await Promise.all([
          getCollectors(countryId),
          getServiceProviders(countryId)
        ]);
        setCollectors(cList);
        setServiceProviders(spList);
      } catch (err) {
        console.error("Error loading providers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  const activeCountry = countryId === "country-ng" ? { currency: "NGN", name: "Nigeria" } : countryId === "country-ci" ? { currency: "XOF", name: "Côte d'Ivoire" } : { currency: "GHS", name: "Ghana" };

  // Format all providers into a unified list
  const unifiedProviders = [
    ...collectors.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      type: "waste_collector",
      category: "Waste Collection",
      spec: c.vehicleType,
      status: c.status,
      availability: c.availability,
      rating: c.rating || 4.5,
      completedJobs: c.completedJobs,
      earnings: c.earnings,
      raw: c
    })),
    ...serviceProviders.map(sp => ({
      id: sp.id,
      name: sp.name,
      phone: sp.phone,
      type: sp.providerType,
      category: sp.serviceCategory === "home_cleaning" ? "Home Cleaning" : "Pest Control",
      spec: sp.providerType === "home_cleaner" ? "Professional Cleaner" : "Licensed Pest Tech",
      status: "approved", // Seeded mock providers are default approved
      availability: sp.availability,
      rating: sp.rating || 4.5,
      completedJobs: sp.completedJobs,
      earnings: sp.earnings,
      raw: sp
    }))
  ];

  // Apply filters
  const filteredProviders = unifiedProviders.filter(p => {
    const matchesCategory = categoryFilter === "all" 
      || (categoryFilter === "waste" && p.type === "waste_collector")
      || (categoryFilter === "cleaning" && p.type === "home_cleaner")
      || (categoryFilter === "pest" && p.type === "pest_control_technician");

    const matchesStatus = statusFilter === "all" 
      || p.status === statusFilter 
      || p.availability === statusFilter;

    const matchesSearch = searchQuery === "" 
      || p.name.toLowerCase().includes(searchQuery.toLowerCase())
      || p.phone.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  // KPI calculations
  const totalFleet = unifiedProviders.length;
  const onlineFleet = unifiedProviders.filter(p => p.availability !== "offline").length;
  const averageRating = (unifiedProviders.reduce((sum, p) => sum + p.rating, 0) / (totalFleet || 1)).toFixed(1);

  const handleUpdateStatus = async (provId: string, type: string, newStatus: string) => {
    setSubmitting(true);
    try {
      // In Express API, only waste collectors have approval endpoints currently.
      const isWaste = type === "waste_collector";
      if (isWaste) {
        const response = await fetch(`${apiBase}/collectors/${provId}/approval`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
          body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
          const updated = await response.json();
          if (selectedProvider && selectedProvider.id === provId) {
            setSelectedProvider({ ...selectedProvider, status: updated.status });
          }
          setRefreshKey(prev => prev + 1);
        }
      } else {
        // Mock success for service providers
        if (selectedProvider && selectedProvider.id === provId) {
          setSelectedProvider({ ...selectedProvider, status: newStatus });
        }
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      alert("Failed to update provider status.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell active="/collectors">
      <Topbar title="Service Provider Network" subtitle="Govern independent waste haulers, deep-cleaning specialists, and pest exterminators. Audit registrations and track earnings.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Directory
        </button>
      </Topbar>

      {/* KPIs */}
      <div className="grid three" style={{ marginBottom: 24 }}>
        <div className="card kpi-card success-accent">
          <div className="kpi-label">Registered Fleet</div>
          <div className="kpi-value">
            <Truck size={24} style={{ color: "var(--primary)" }} />
            {totalFleet} <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 6 }}>Providers</span>
          </div>
          <div className="kpi-subtext">Across all service categories</div>
        </div>

        <div className="card kpi-card success-accent">
          <div className="kpi-label">Online Status</div>
          <div className="kpi-value">
            <span style={{ 
              width: 12, 
              height: 12, 
              borderRadius: "50%", 
              background: "var(--primary)", 
              display: "inline-block", 
              boxShadow: "0 0 10px var(--primary)",
              marginRight: 8
            }}></span>
            {onlineFleet} <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 6 }}>Ready for jobs</span>
          </div>
          <div className="kpi-subtext">Online or active on duty</div>
        </div>

        <div className="card kpi-card warning-accent">
          <div className="kpi-label">Average Fleet Rating</div>
          <div className="kpi-value">
            <Star size={24} style={{ color: "var(--warning)", fill: "var(--warning)" }} />
            {averageRating} <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 6 }}>/ 5.0 Rating</span>
          </div>
          <div className="kpi-subtext">Customer feedback reviews</div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="card" style={{ marginBottom: 24, padding: "16px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text" 
                placeholder="Search provider name, phone..." 
                style={{ paddingLeft: 36, width: 240 }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">📁 All Categories</option>
              <option value="waste">🗑️ Waste Collectors</option>
              <option value="cleaning">🧹 Home Cleaners</option>
              <option value="pest">🪳 Pest Technicians</option>
            </select>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">🚦 All Availability</option>
              <option value="online">Online</option>
              <option value="assigned">Assigned / Busy</option>
              <option value="offline">Offline</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
            Found <span style={{ color: "var(--primary)" }}>{filteredProviders.length}</span> contractors
          </div>

        </div>
      </div>

      {/* Provider List */}
      <div className="card">
        <h2>Service Providers Directory</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Provider Name</th>
                <th>Category</th>
                <th>Sub-Type / Vehicle</th>
                <th>Availability</th>
                <th>Rating</th>
                <th>Total Jobs</th>
                <th>Net Earnings</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.length > 0 ? (
                filteredProviders.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.id}</code></td>
                    <td><b>{p.name}</b></td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{p.category}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{p.spec}</td>
                    <td><StatusBadge value={p.availability} /></td>
                    <td style={{ fontWeight: 700 }}>⭐ {p.rating}</td>
                    <td>{p.completedJobs} Completed</td>
                    <td style={{ fontWeight: 700 }}>{activeCountry.currency} {p.earnings}</td>
                    <td><StatusBadge value={p.status} /></td>
                    <td>
                      <button className="btn secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setSelectedProvider(p)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", color: "var(--text-muted)", padding: 36 }}>
                    No service providers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer overlay */}
      {selectedProvider && (
        <div className="modal-overlay" onClick={() => setSelectedProvider(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Provider Audit Details</h3>
              <button className="modal-close" onClick={() => setSelectedProvider(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ 
                  width: 54, 
                  height: 54, 
                  borderRadius: "50%", 
                  background: "var(--primary-glow)", 
                  color: "var(--primary)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  border: "2px solid var(--primary)"
                }}>
                  {selectedProvider.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{selectedProvider.name}</h4>
                  <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: 12 }}>
                    ID: {selectedProvider.id} · {selectedProvider.spec}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 16, fontSize: 14 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Availability Status</span>
                  <span style={{ display: "inline-block", marginTop: 4 }}><StatusBadge value={selectedProvider.availability} /></span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Approval Status</span>
                  <span style={{ display: "inline-block", marginTop: 4 }}><StatusBadge value={selectedProvider.status} /></span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Total Earnings</span>
                  <span style={{ fontWeight: 700 }}>{activeCountry.currency} {selectedProvider.earnings}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Jobs Completed</span>
                  <span style={{ fontWeight: 700 }}>{selectedProvider.completedJobs} Jobs</span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <Phone size={14} style={{ color: "var(--primary)" }} /> {selectedProvider.phone}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <Star size={14} style={{ color: "var(--warning)", fill: "var(--warning)" }} /> {selectedProvider.rating} / 5.0 Average Rating
                </div>
              </div>

              {/* Management Actions */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Platform Governance Actions</h4>
                
                <div style={{ display: "flex", gap: 8 }}>
                  {selectedProvider.status !== "approved" ? (
                    <button className="btn" style={{ flex: 1 }} onClick={() => handleUpdateStatus(selectedProvider.id, selectedProvider.type, "approved")} disabled={submitting}>
                      Approve Provider
                    </button>
                  ) : (
                    <button className="btn danger" style={{ flex: 1 }} onClick={() => handleUpdateStatus(selectedProvider.id, selectedProvider.type, "suspended")} disabled={submitting}>
                      Suspend Account
                    </button>
                  )}
                  {selectedProvider.status === "pending_approval" && (
                    <button className="btn secondary" style={{ flex: 0.5 }} onClick={() => handleUpdateStatus(selectedProvider.id, selectedProvider.type, "rejected")} disabled={submitting}>
                      Reject
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn secondary full" onClick={() => setSelectedProvider(null)}>
                  Close Details
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
