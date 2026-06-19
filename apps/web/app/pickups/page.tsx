"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Clipboard, 
  Clock, 
  Trash2, 
  Eye, 
  Plus, 
  HelpCircle,
  FileText,
  UserPlus,
  RefreshCw,
  Camera,
  X,
  MapPin,
  CheckCircle,
  DollarSign
} from "lucide-react";
import { Shell, Topbar, toast } from "../../src/components/Shell";
import { StatusBadge, SkeletonTable } from "../../src/components/Ui";
import { getPickups, getCollectors, apiBase } from "../../src/lib/api";
import type { Pickup, Collector } from "@waste/shared";

export default function PickupsPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Tabs / Filters
  const [activeTab, setActiveTab] = useState<"sack" | "special">("sack");
  const [statusFilter, setStatusFilter] = useState("all");

  // Interactive Operations
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSpecialModalOpen, setIsSpecialModalOpen] = useState(false);

  // Special Pickup Form
  const [specialDesc, setSpecialDesc] = useState("");
  const [specialAddress, setSpecialAddress] = useState("");
  const [specialWindow, setSpecialWindow] = useState<"morning" | "afternoon" | "evening">("morning");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [pList, cList] = await Promise.all([
          getPickups(countryId),
          getCollectors(countryId)
        ]);
        setPickups(pList);
        setCollectors(cList);
      } catch (err) {
        console.error("Error loading pickups data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  const activeCountry = countryId === "country-ng" ? { currency: "NGN", name: "Nigeria" } : countryId === "country-ci" ? { currency: "XOF", name: "Côte d'Ivoire" } : { currency: "GHS", name: "Ghana" };

  // Filter pickups
  const filteredPickups = pickups.filter(p => {
    const matchesTab = p.type === activeTab;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesTab && matchesStatus;
  });

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPickup || !quoteAmount) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/pickups/${selectedPickup.id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify({ amount: Number(quoteAmount) })
      });
      if (response.ok) {
        setSelectedPickup(null);
        setQuoteAmount("");
        setRefreshKey(prev => prev + 1);
        toast.success(`Special pickup quote successfully set to ${activeCountry.currency} ${quoteAmount}!`);
      } else {
        toast.error("Failed to submit quote.");
      }
    } catch (err: any) {
      toast.error(`Quote submission failed: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPickup || !assigneeId) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/pickups/${selectedPickup.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify({ collectorId: assigneeId })
      });
      if (response.ok) {
        setSelectedPickup(null);
        setAssigneeId("");
        setRefreshKey(prev => prev + 1);
        toast.success("Collector assigned successfully!");
      } else {
        toast.error("Failed to assign collector.");
      }
    } catch (err: any) {
      toast.error(`Assignment failed: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSpecialPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/pickups/special`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify({
          countryId,
          customerId: "cust-2", // Demo customer Kojo Appiah
          pickupWindow: specialWindow,
          address: specialAddress,
          description: specialDesc,
          photos: ["/proofs/furniture-before.jpg"]
        })
      });
      if (response.ok) {
        setSpecialDesc("");
        setSpecialAddress("");
        setIsSpecialModalOpen(false);
        setRefreshKey(prev => prev + 1);
        toast.success("Special bulk pickup booking request created successfully!");
      } else {
        toast.error("Failed to create special bulk pickup booking.");
      }
    } catch (err: any) {
      toast.error(`Special booking failed: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell active="/pickups">
      <Topbar title="Waste Collection Portal" subtitle="Organize sack collections, review photo-proofs, approve specialized quotes, and manually assign haulers.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
        <button className="btn" onClick={() => setIsSpecialModalOpen(true)}>
          <Plus size={16} /> Book Special Bulk Pickup
        </button>
      </Topbar>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "sack" ? "active" : ""}`} onClick={() => { setActiveTab("sack"); setStatusFilter("all"); }}>
          🛍️ Regular Sack Pickups
        </button>
        <button className={`tab ${activeTab === "special" ? "active" : ""}`} onClick={() => { setActiveTab("special"); setStatusFilter("all"); }}>
          📦 Special Bulk & Furniture Pickups
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24, padding: "12px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Status Filter:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 12px", minWidth: 140 }}>
            <option value="all">All Statuses</option>
            {activeTab === "sack" ? (
              <>
                <option value="pending_assignment">Pending Assignment</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
              </>
            ) : (
              <>
                <option value="quote_review">Under Quote Review</option>
                <option value="pending_assignment">Pending Assignment</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
              </>
            )}
          </select>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
            Viewing {filteredPickups.length} entries
          </span>
        </div>
      </div>

      {/* Pickups Table */}
      <div className="card">
        <h2>Waste Collection Queue ({activeTab === "sack" ? "Official Sacks Only" : "Bulk Pricing Model"})</h2>
        {loading ? (
          <SkeletonTable cols={9} rows={5} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Pickup ID</th>
                  <th>Window</th>
                  <th>Address</th>
                  <th>{activeTab === "sack" ? "Sack Quantity" : "Bulk Description"}</th>
                  <th>Assigned Hauler</th>
                  <th>Status</th>
                  <th>Proof Photos</th>
                  <th>Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPickups.length > 0 ? (
                  filteredPickups.map((p) => (
                    <tr key={p.id}>
                      <td><b>{p.id}</b></td>
                      <td><span style={{ textTransform: "capitalize" }}>{p.pickupWindow}</span></td>
                      <td>{p.address}</td>
                      <td style={{ fontWeight: 600, color: "var(--primary)" }}>{p.sackSummary}</td>
                      <td>
                        {p.collectorId ? (
                          collectors.find(c => c.id === p.collectorId)?.name ?? p.collectorId
                        ) : (
                          <span style={{ fontStyle: "italic", opacity: 0.6 }}>Unassigned</span>
                        )}
                      </td>
                      <td><StatusBadge value={p.status} /></td>
                      <td>
                        {p.proofPhotos.length > 0 ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--primary)", fontWeight: 700, fontSize: 12 }}>
                            <Camera size={14} /> {p.proofPhotos.length} Proofs
                          </span>
                        ) : (
                          <span style={{ opacity: 0.5 }}>None</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {p.amount > 0 ? `${activeCountry.currency} ${p.amount}` : "Quoting Required"}
                      </td>
                      <td>
                        <button className="btn secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setSelectedPickup(p)}>
                          <Eye size={12} /> Manage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: 36 }}>
                      No pickups logged under this criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pickup Detail & Operations Modal */}
      {selectedPickup && (
        <div className="modal-overlay" onClick={() => setSelectedPickup(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pickup dispatch panel</h3>
              <button className="modal-close" onClick={() => setSelectedPickup(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{selectedPickup.id}</span>
                <span className="badge">{selectedPickup.type === "special" ? "Special Bulk" : "Regular Sack"}</span>
              </div>

              <div style={{ display: "grid", gap: 10, background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 16, fontSize: 14 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Address</span>
                  <span style={{ fontWeight: 600, display: "block", marginTop: 2 }}>{selectedPickup.address}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Waste Summary</span>
                  <span style={{ fontWeight: 600, color: "var(--primary)", display: "block", marginTop: 2 }}>{selectedPickup.sackSummary}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Schedule Window</span>
                  <span style={{ fontWeight: 600, textTransform: "capitalize", display: "block", marginTop: 2 }}>{selectedPickup.pickupWindow}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Fee / Price</span>
                  <span style={{ fontWeight: 700, fontSize: 15, display: "block", marginTop: 2 }}>
                    {selectedPickup.amount > 0 ? `${activeCountry.currency} ${selectedPickup.amount}` : "Pricing Quote Pending"}
                  </span>
                </div>
              </div>

              {/* Special Quote Input */}
              {selectedPickup.type === "special" && selectedPickup.status === "quote_review" && (
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: 14 }}>Quote special pickup price</h4>
                  <form onSubmit={handleUpdateQuote} style={{ display: "flex", gap: 8 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "var(--text-muted)" }}>
                        {activeCountry.currency}
                      </span>
                      <input 
                        type="number" 
                        placeholder="Enter bulk price quote" 
                        required 
                        style={{ paddingLeft: 44, width: "100%" }}
                        value={quoteAmount}
                        onChange={e => setQuoteAmount(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn" disabled={submitting}>
                      Save Quote
                    </button>
                  </form>
                </div>
              )}

              {/* Manual Assignment Form */}
              {selectedPickup.status !== "quote_review" && selectedPickup.status !== "completed" && (
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Manually assign approved hauler</h4>
                  
                  {selectedPickup.collectorId && (
                    <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", padding: 12, borderRadius: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Currently Assigned:</span>
                      <span style={{ display: "block", fontWeight: 700, color: "var(--primary)", marginTop: 2 }}>
                        {collectors.find(c => c.id === selectedPickup.collectorId)?.name ?? selectedPickup.collectorId}
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleAssignCollector} style={{ display: "grid", gap: 10 }}>
                    <select 
                      value={assigneeId} 
                      onChange={e => setAssigneeId(e.target.value)}
                      required
                      className="full"
                    >
                      <option value="">-- Choose approved online collector --</option>
                      {collectors
                        .filter(c => c.status === "approved" && c.availability !== "offline")
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.vehicleType} · {c.availability})
                          </option>
                        ))}
                    </select>
                    <button type="submit" className="btn" disabled={submitting}>
                      Confirm Assignment
                    </button>
                  </form>
                </div>
              )}

              {/* Display Proof Photos */}
              {selectedPickup.proofPhotos.length > 0 && (
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Collector proof-photo verification</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                    {selectedPickup.proofPhotos.map((photo, i) => (
                      <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", height: 120, position: "relative" }}>
                        <div style={{ height: "100%", width: "100%", background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(99,102,241,0.2))", display: "grid", placeItems: "center", fontSize: 12, color: "var(--text-muted)" }}>
                          Proof Photo #{i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <button type="button" className="btn secondary full" onClick={() => setSelectedPickup(null)}>
                  Close Panel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Book Special Bulk Modal */}
      {isSpecialModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSpecialModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book Special Bulk Pickup</h3>
              <button className="modal-close" onClick={() => setIsSpecialModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSpecialPickup} className="form">
              <div className="full">
                <label>
                  Bulk Waste Description (e.g. Old Sofa, Construction Scrap)
                  <textarea 
                    rows={3}
                    placeholder="Describe items, dimensions, or special instructions..."
                    value={specialDesc}
                    onChange={e => setSpecialDesc(e.target.value)}
                    required
                    style={{ width: "100%", resize: "none" }}
                  />
                </label>
              </div>

              <div className="full">
                <label>
                  Customer Location Address
                  <input 
                    type="text" 
                    placeholder="Enter district details" 
                    value={specialAddress}
                    onChange={e => setSpecialAddress(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="full">
                <label>
                  Schedule Window
                  <select 
                    value={specialWindow}
                    onChange={e => setSpecialWindow(e.target.value as any)}
                  >
                    <option value="morning">🌅 Morning Pickup</option>
                    <option value="afternoon">☀️ Afternoon Pickup</option>
                    <option value="evening">🌆 Evening Pickup</option>
                  </select>
                </label>
              </div>

              <div className="full" style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Booking..." : "Book and Send to Quote Review"}
                </button>
                <button type="button" className="btn secondary" onClick={() => setIsSpecialModalOpen(false)}>
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
