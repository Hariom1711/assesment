"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Bug, 
  Plus, 
  Calendar, 
  MapPin, 
  Eye,
  UserCheck,
  RefreshCw,
  X,
  ShieldAlert,
  Camera,
  AlertCircle
} from "lucide-react";
import { Shell, Topbar } from "../../src/components/Shell";
import { StatusBadge } from "../../src/components/Ui";
import { getServiceBookings, getServiceProviders, apiBase } from "../../src/lib/api";
import type { ServiceBooking, ServiceProvider } from "@waste/shared";

export default function PestControlPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [bookings, setBookings] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");

  // Interaction State
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
  const [assigneeId, setAssigneeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Booking States
  const [pestType, setPestType] = useState("Cockroaches");
  const [propertySize, setPropertySize] = useState("Medium (2-3 Bed)");
  const [scheduledAt, setScheduledAt] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bList, tList] = await Promise.all([
          getServiceBookings(countryId, "pest_control"),
          getServiceProviders(countryId, "pest_control")
        ]);
        setBookings(bList);
        setTechnicians(tList);
      } catch (err) {
        console.error("Error loading pest control bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  const filteredBookings = bookings.filter(b => {
    return statusFilter === "all" || b.status === statusFilter;
  });

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !assigneeId) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/service-bookings/${selectedBooking.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify({ providerId: assigneeId })
      });
      if (response.ok) {
        setSelectedBooking(null);
        setAssigneeId("");
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      alert("Failed to assign technician.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/service-bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify({
          countryId,
          customerId: "cust-2", // Demo customer Kojo Appiah
          serviceType: "pest_control",
          scheduledAt: scheduledAt || new Date().toISOString(),
          address,
          details: { pestType, propertySize, instructions },
          images: ["/uploads/pest-kitchen.jpg"]
        })
      });
      if (response.ok) {
        setAddress("");
        setInstructions("");
        setIsModalOpen(false);
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      alert("Failed to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell active="/pest-control">
      <Topbar title="Pest Control Dispatch" subtitle="Monitor active extermination contracts, assign licensed field technicians, and review site inspection reports.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Book Extermination Service
        </button>
      </Topbar>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 24, padding: "12px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Filter Status:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 12px", minWidth: 140 }}>
            <option value="all">All bookings</option>
            <option value="new">New Requests</option>
            <option value="assigned">Assigned</option>
            <option value="on_the_way">On the Way</option>
            <option value="completed">Completed</option>
          </select>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
            Viewing {filteredBookings.length} pest bookings
          </span>
        </div>
      </div>

      <div className="grid two">
        {/* Left Side: Pest Bookings */}
        <div className="card">
          <h2>Active Pest Bookings</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Status</th>
                  <th>Pest & Size Spec</th>
                  <th>Address</th>
                  <th>Assigned Agent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td><b>{b.id}</b></td>
                      <td><StatusBadge value={b.status} /></td>
                      <td style={{ color: "var(--warning)", fontWeight: 600 }}>
                        {String((b.details as any).pestType)} · {String((b.details as any).propertySize)}
                      </td>
                      <td>{b.address}</td>
                      <td>
                        {b.providerId ? (
                          technicians.find(t => t.id === b.providerId)?.name ?? b.providerId
                        ) : (
                          <span style={{ fontStyle: "italic", opacity: 0.6 }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <button className="btn secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setSelectedBooking(b)}>
                          <Eye size={12} /> Dispatch
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 36 }}>
                      No pest control bookings logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Exterminator Technicians */}
        <div className="card">
          <h2>Field Exterminators</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Rating</th>
                  <th>Availability</th>
                  <th>Completed Jobs</th>
                </tr>
              </thead>
              <tbody>
                {technicians.length > 0 ? (
                  technicians.map((t) => (
                    <tr key={t.id}>
                      <td><b>{t.name}</b></td>
                      <td>⭐ {t.rating}</td>
                      <td><StatusBadge value={t.availability} /></td>
                      <td>{t.completedJobs} jobs completed</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                      No pest control providers registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Extermination Work Order Dispatch</h3>
              <button className="modal-close" onClick={() => setSelectedBooking(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", justifyItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--warning)" }}>{selectedBooking.id}</span>
                <span className="badge">Pest Control</span>
              </div>

              <div style={{ display: "grid", gap: 10, background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 16, fontSize: 14 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Target Location</span>
                  <span style={{ fontWeight: 600, display: "flex", marginTop: 2, gap: 6, alignItems: "center" }}>
                    <MapPin size={14} style={{ color: "var(--danger)" }} /> {selectedBooking.address}
                  </span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Infestation Type & Size</span>
                  <span style={{ fontWeight: 600, display: "block", marginTop: 2, color: "var(--warning)" }}>
                    {String((selectedBooking.details as any).pestType)} · {String((selectedBooking.details as any).propertySize)} size
                  </span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Advisories / Description</span>
                  <span style={{ fontWeight: 600, display: "block", marginTop: 2 }}>
                    {String((selectedBooking.details as any).instructions || "None")}
                  </span>
                </div>
              </div>

              {/* Photo Proof / Image inspection report */}
              {selectedBooking.images && selectedBooking.images.length > 0 && (
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Site Inspection Attachment</span>
                  <div style={{ display: "flex", gap: 10, border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", height: 100, alignItems: "center", background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ width: 100, height: "100%", background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(244,63,94,0.2))", display: "grid", placeItems: "center", color: "var(--warning)" }}>
                      <Camera size={20} />
                    </div>
                    <div style={{ padding: 12, fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>pest-kitchen.jpg</div>
                      <div style={{ color: "var(--text-muted)" }}>Proof of cockroach infestation</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Manual technician dispatch</h4>
                
                {selectedBooking.providerId ? (
                  <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", padding: 12, borderRadius: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Currently Assigned:</span>
                    <span style={{ display: "block", fontWeight: 700, color: "var(--primary)", marginTop: 2 }}>
                      {technicians.find(t => t.id === selectedBooking.providerId)?.name ?? selectedBooking.providerId}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--warning)", background: "rgba(245,158,11,0.06)", padding: 8, borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                    <AlertCircle size={14} /> Licensed technician dispatch pending.
                  </div>
                )}

                <form onSubmit={handleAssignTechnician} style={{ display: "grid", gap: 10 }}>
                  <select 
                    value={assigneeId} 
                    onChange={e => setAssigneeId(e.target.value)}
                    required
                    className="full"
                  >
                    <option value="">-- Select licensed technician --</option>
                    {technicians
                      .filter(t => t.availability !== "offline")
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.availability})
                        </option>
                      ))}
                  </select>
                  <button type="submit" className="btn" disabled={submitting}>
                    Dispatch Technician
                  </button>
                </form>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn secondary full" onClick={() => setSelectedBooking(null)}>
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Book Extermination Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book Extermination Service</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="form">
              <div>
                <label>
                  Target Pest Type
                  <select value={pestType} onChange={e => setPestType(e.target.value)}>
                    <option value="Cockroaches">🪳 Cockroaches</option>
                    <option value="Rats">🐀 Rats & Mice</option>
                    <option value="Mosquitoes">🦟 Mosquitoes</option>
                    <option value="Termites">🪵 Termites</option>
                    <option value="Bedbugs">🛏️ Bedbugs</option>
                  </select>
                </label>
              </div>

              <div>
                <label>
                  Property Dimensions
                  <select value={propertySize} onChange={e => setPropertySize(e.target.value)}>
                    <option value="Small (1 Bed)">Small (1 Bed)</option>
                    <option value="Medium (2-3 Bed)">Medium (2-3 Bed)</option>
                    <option value="Large (4+ Bed)">Large (4+ Bed)</option>
                    <option value="Commercial">Commercial Warehouse/Office</option>
                  </select>
                </label>
              </div>

              <div className="full">
                <label>
                  Scheduled Inspection Date & Time
                  <input 
                    type="datetime-local" 
                    value={scheduledAt} 
                    onChange={e => setScheduledAt(e.target.value)}
                    required 
                  />
                </label>
              </div>

              <div className="full">
                <label>
                  Property Location Address
                  <input 
                    type="text" 
                    placeholder="Enter full address details" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                    required 
                  />
                </label>
              </div>

              <div className="full">
                <label>
                  Infestation Symptoms / Instructions
                  <textarea 
                    rows={3}
                    placeholder="Describe symptoms, locations, or safety instructions (e.g. pets present)..." 
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    style={{ width: "100%", resize: "none" }}
                  />
                </label>
              </div>

              <div className="full" style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Booking..." : "Book Extermination"}
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
