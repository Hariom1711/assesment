"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  UserPlus, 
  Sparkles, 
  Bug, 
  Trash, 
  Info,
  Calendar,
  MapPin,
  Smartphone,
  MessageSquare,
  ShieldAlert,
  X,
  RefreshCw
} from "lucide-react";
import { Shell, Topbar, toast } from "../../src/components/Shell";
import { StatusBadge, SkeletonTable } from "../../src/components/Ui";
import { getPickups, getServiceBookings, getCollectors, getServiceProviders, apiBase } from "../../src/lib/api";
import type { Pickup, ServiceBooking, Collector, ServiceProvider } from "@waste/shared";

export default function RequestsPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // State
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [assigneeId, setAssigneeId] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [pList, bList, colList, provList] = await Promise.all([
          getPickups(countryId),
          getServiceBookings(countryId),
          getCollectors(countryId),
          getServiceProviders(countryId)
        ]);
        setPickups(pList);
        setBookings(bList);
        setCollectors(colList);
        setProviders(provList);
      } catch (err) {
        console.error("Error loading requests data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  // Aggregate and format all bookings
  const unifiedRows = [
    ...pickups.map(p => ({
      id: p.id,
      rawType: "waste",
      service: "Waste Collection",
      status: p.status,
      address: p.address,
      source: p.source,
      amount: p.amount,
      date: p.createdAt,
      window: p.pickupWindow,
      detailLabel: "Sacks",
      detailValue: p.sackSummary,
      providerId: p.collectorId,
      raw: p
    })),
    ...bookings.map(b => ({
      id: b.id,
      rawType: b.serviceType,
      service: b.serviceType === "home_cleaning" ? "Home Cleaning" : "Pest Control",
      status: b.status,
      address: b.address,
      source: "mobile",
      amount: b.serviceType === "home_cleaning" ? 120 : 250, // mock price
      date: b.createdAt,
      window: b.scheduledAt,
      detailLabel: b.serviceType === "home_cleaning" ? "Rooms" : "Pest Type",
      detailValue: b.serviceType === "home_cleaning" 
        ? `${(b.details as any).propertyType} (${(b.details as any).rooms} R)` 
        : `${(b.details as any).pestType} (${(b.details as any).propertySize})`,
      providerId: b.providerId,
      raw: b
    }))
  ];

  // Apply filters
  const filteredRows = unifiedRows.filter(row => {
    const matchesService = serviceFilter === "all" 
      || (serviceFilter === "waste" && row.rawType === "waste")
      || (serviceFilter === "cleaning" && row.rawType === "home_cleaning")
      || (serviceFilter === "pest" && row.rawType === "pest_control");
      
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    const matchesSource = sourceFilter === "all" || row.source === sourceFilter;
    
    const matchesSearch = searchQuery === "" 
      || row.id.toLowerCase().includes(searchQuery.toLowerCase())
      || row.address.toLowerCase().includes(searchQuery.toLowerCase())
      || row.detailValue.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesService && matchesStatus && matchesSource && matchesSearch;
  });

  const getCurrencySymbol = () => {
    return countryId === "country-ng" ? "NGN" : countryId === "country-ci" ? "XOF" : "GHS";
  };

  const handleAssignProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeId || !selectedItem) return;
    setAssigning(true);
    try {
      const isWaste = selectedItem.rawType === "waste";
      const path = isWaste 
        ? `/pickups/${selectedItem.id}/assign` 
        : `/service-bookings/${selectedItem.id}/assign`;
      
      const body = isWaste 
        ? { collectorId: assigneeId } 
        : { providerId: assigneeId };

      const response = await fetch(`${apiBase}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setSelectedItem(null);
        setAssigneeId("");
        setRefreshKey(prev => prev + 1);
        toast.success("Service provider successfully assigned to work order!");
      } else {
        toast.error(`Assignment failed: ${await response.text()}`);
      }
    } catch (err: any) {
      toast.error(`Assignment error: ${err.message || err}`);
    } finally {
      setAssigning(false);
    }
  };

  // Find assigned provider name
  const getAssignedName = (item: any) => {
    if (!item.providerId) return "Unassigned";
    if (item.rawType === "waste") {
      return collectors.find(c => c.id === item.providerId)?.name ?? item.providerId;
    } else {
      return providers.find(p => p.id === item.providerId)?.name ?? item.providerId;
    }
  };

  return (
    <Shell active="/requests">
      <Topbar title="All Service Requests" subtitle="Unified work-order tracking system for waste pickups, cleaning bookings, and pest control technicians.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </Topbar>

      {/* Filters bar */}
      <div className="card" style={{ marginBottom: 24, padding: "16px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text" 
                placeholder="Search request ID, address..." 
                style={{ paddingLeft: 36, width: 240 }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}>
              <option value="all">📁 All Categories</option>
              <option value="waste">🗑️ Waste Collection</option>
              <option value="cleaning">🧹 Home Cleaning</option>
              <option value="pest">🪳 Pest Control</option>
            </select>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">🚦 All Statuses</option>
              <option value="pending_assignment">Pending Assignment</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="new">New</option>
            </select>

            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
              <option value="all">🔌 All Channels</option>
              <option value="mobile">📱 Mobile App</option>
              <option value="sms">💬 SMS Portal</option>
              <option value="admin">💻 Admin Created</option>
            </select>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
            Found <span style={{ color: "var(--primary)" }}>{filteredRows.length}</span> work orders
          </div>

        </div>
      </div>

      {/* Main Request Queue */}
      <div className="card">
        <h2>Unified Requests Feed</h2>
        {loading ? (
          <SkeletonTable cols={9} rows={6} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Category</th>
                  <th>Channel</th>
                  <th>Address</th>
                  <th>Details</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Fare</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td><b>{row.id}</b></td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                          {row.rawType === "waste" ? (
                            <Trash size={14} style={{ color: "var(--primary)" }} />
                          ) : row.rawType === "home_cleaning" ? (
                            <Sparkles size={14} style={{ color: "var(--accent)" }} />
                          ) : (
                            <Bug size={14} style={{ color: "var(--warning)" }} />
                          )}
                          {row.service}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, opacity: 0.8 }}>
                          {row.source === "sms" ? <MessageSquare size={12} /> : <Smartphone size={12} />}
                          {row.source.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.address}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {row.detailValue}
                      </td>
                      <td style={{ fontStyle: row.providerId ? "normal" : "italic", fontWeight: row.providerId ? 600 : 400 }}>
                        {getAssignedName(row)}
                      </td>
                      <td><StatusBadge value={row.status} /></td>
                      <td style={{ fontWeight: 700 }}>{getCurrencySymbol()} {row.amount}</td>
                      <td>
                        <button className="btn secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setSelectedItem(row)}>
                          <Eye size={12} /> Dispatch
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: 36 }}>
                      No service requests match the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer overlay for dispatch/assignment details */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dispatch Console</h3>
              <button className="modal-close" onClick={() => setSelectedItem(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{selectedItem.id}</span>
                <span className="badge">{selectedItem.service}</span>
              </div>

              <div style={{ display: "grid", gap: 12, background: "rgba(255,255,255,0.02)", padding: 18, borderRadius: 16 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Target Location</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                    <MapPin size={14} style={{ color: "var(--danger)" }} /> {selectedItem.address}
                  </span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Scheduled Time Window</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                    <Calendar size={14} style={{ color: "var(--accent)" }} /> 
                    {selectedItem.rawType === "waste" ? `${selectedItem.window} pickup` : new Date(selectedItem.window).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Details / Instructions</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, marginTop: 4, color: "var(--primary)" }}>
                    <Info size={14} /> {selectedItem.detailValue}
                  </span>
                </div>
              </div>

              {/* Assignment Form */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15 }}>Manual Work Order Assignment</h4>
                
                {selectedItem.providerId ? (
                  <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", padding: 14, borderRadius: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Currently Dispatched To:</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)", marginTop: 4 }}>
                      {getAssignedName(selectedItem)}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--warning)", background: "rgba(245,158,11,0.06)", padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 16 }}>
                    <ShieldAlert size={14} /> This job is unassigned. Please dispatch a provider now.
                  </div>
                )}

                <form onSubmit={handleAssignProvider} style={{ display: "grid", gap: 12 }}>
                  <label>
                    Select Available Service Provider
                    <select 
                      value={assigneeId} 
                      onChange={e => setAssigneeId(e.target.value)}
                      required
                      className="full"
                    >
                      <option value="">-- Choose matching provider --</option>
                      {selectedItem.rawType === "waste" ? (
                        collectors
                          .filter(col => col.status === "approved" && col.availability !== "offline")
                          .map(col => (
                            <option key={col.id} value={col.id}>
                              {col.name} ({col.vehicleType} · {col.availability})
                            </option>
                          ))
                      ) : (
                        providers
                          .filter(prov => prov.serviceCategory === selectedItem.rawType && prov.availability !== "offline")
                          .map(prov => (
                            <option key={prov.id} value={prov.id}>
                              {prov.name} ({prov.availability})
                            </option>
                          ))
                      )}
                    </select>
                  </label>

                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button type="submit" className="btn" style={{ flex: 1 }} disabled={assigning}>
                      {assigning ? "Assigning..." : "Confirm Dispatch Assignment"}
                    </button>
                    <button type="button" className="btn secondary" onClick={() => setSelectedItem(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
