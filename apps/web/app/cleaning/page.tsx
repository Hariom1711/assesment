"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  MapPin, 
  FileText,
  UserCheck,
  RefreshCw,
  Eye,
  X,
  Briefcase
} from "lucide-react";
import { Shell, Topbar } from "../../src/components/Shell";
import { StatusBadge } from "../../src/components/Ui";
import { getServiceBookings, getServiceProviders, apiBase } from "../../src/lib/api";
import type { ServiceBooking, ServiceProvider } from "@waste/shared";

export default function CleaningPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // State
  const [bookings, setBookings] = useState<any[]>([]);
  const [cleaners, setCleaners] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");

  // Interaction
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
  const [assigneeId, setAssigneeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Booking Form States
  const [propertyType, setPropertyType] = useState("Apartment");
  const [rooms, setRooms] = useState(2);
  const [scheduledAt, setScheduledAt] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bList, cList] = await Promise.all([
          getServiceBookings(countryId, "home_cleaning"),
          getServiceProviders(countryId, "home_cleaning")
        ]);
        setBookings(bList);
        setCleaners(cList);
      } catch (err) {
        console.error("Error loading cleaning services:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  const activeCountry = countryId === "country-ng" ? { currency: "NGN", name: "Nigeria" } : countryId === "country-ci" ? { currency: "XOF", name: "Côte d'Ivoire" } : { currency: "GHS", name: "Ghana" };

  const filteredBookings = bookings.filter(b => {
    return statusFilter === "all" || b.status === statusFilter;
  });

  const handleAssignCleaner = async (e: React.FormEvent) => {
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
      alert("Failed to assign cleaner.");
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
          customerId: "cust-1", // Demo customer Ama Mensah
          serviceType: "home_cleaning",
          scheduledAt: scheduledAt || new Date().toISOString(),
          address,
          details: { propertyType, rooms, instructions },
          images: []
        })
      });
      if (response.ok) {
        setAddress("");
        setInstructions("");
        setRooms(2);
        setIsModalOpen(false);
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      alert("Failed to submit cleaning booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell active="/cleaning">
      <Topbar title="Home Cleaning Dispatch" subtitle="Admin panel for scheduling and dispatching house/office cleaning service requests.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Book Cleaning Service
        </button>
      </Topbar>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 24, padding: "12px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Filter by Status:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 12px", minWidth: 140 }}>
            <option value="all">All bookings</option>
            <option value="new">New Requests</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
          </select>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
            Viewing {filteredBookings.length} bookings
          </span>
        </div>
      </div>

      <div className="grid two">
        {/* Left Side: Cleaning Bookings */}
        <div className="card">
          <h2>Active Cleaning Bookings</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Status</th>
                  <th>Property Details</th>
                  <th>Target Location</th>
                  <th>Assigned Cleaner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td><b>{b.id}</b></td>
                      <td><StatusBadge value={b.status} /></td>
                      <td style={{ color: "var(--primary)", fontWeight: 600 }}>
                        {String((b.details as any).propertyType)} · {String((b.details as any).rooms)} rooms
                      </td>
                      <td>{b.address}</td>
                      <td>
                        {b.providerId ? (
                          cleaners.find(c => c.id === b.providerId)?.name ?? b.providerId
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
                      No cleaning bookings logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Available Cleaners */}
        <div className="card">
          <h2>Cleaning Service Providers</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Cleaner Name</th>
                  <th>Rating</th>
                  <th>Availability</th>
                  <th>Jobs Done</th>
                </tr>
              </thead>
              <tbody>
                {cleaners.length > 0 ? (
                  cleaners.map((c) => (
                    <tr key={c.id}>
                      <td><b>{c.name}</b></td>
                      <td>⭐ {c.rating}</td>
                      <td><StatusBadge value={c.availability} /></td>
                      <td>{c.completedJobs} completed</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                      No cleaning providers registered.
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
              <h3>Cleaning Work Order Dispatch</h3>
              <button className="modal-close" onClick={() => setSelectedBooking(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{selectedBooking.id}</span>
                <span className="badge">Home Cleaning</span>
              </div>

              <div style={{ display: "grid", gap: 10, background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 16, fontSize: 14 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Target Location</span>
                  <span style={{ fontWeight: 600, display: "flex", marginTop: 2, gap: 6, alignItems: "center" }}>
                    <MapPin size={14} style={{ color: "var(--danger)" }} /> {selectedBooking.address}
                  </span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Property Configuration</span>
                  <span style={{ fontWeight: 600, display: "block", marginTop: 2, color: "var(--primary)" }}>
                    {String((selectedBooking.details as any).propertyType)} · {String((selectedBooking.details as any).rooms)} Rooms
                  </span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Special Instructions</span>
                  <span style={{ fontWeight: 600, display: "block", marginTop: 2 }}>
                    {String((selectedBooking.details as any).instructions || "None")}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Manual cleaner dispatch</h4>
                
                {selectedBooking.providerId ? (
                  <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", padding: 12, borderRadius: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Currently Dispatched:</span>
                    <span style={{ display: "block", fontWeight: 700, color: "var(--primary)", marginTop: 2 }}>
                      {cleaners.find(c => c.id === selectedBooking.providerId)?.name ?? selectedBooking.providerId}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--warning)", background: "rgba(245,158,11,0.06)", padding: 8, borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                    <Briefcase size={14} /> Cleaner dispatch pending.
                  </div>
                )}

                <form onSubmit={handleAssignCleaner} style={{ display: "grid", gap: 10 }}>
                  <select 
                    value={assigneeId} 
                    onChange={e => setAssigneeId(e.target.value)}
                    required
                    className="full"
                  >
                    <option value="">-- Select cleaning contractor --</option>
                    {cleaners
                      .filter(c => c.availability !== "offline")
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.availability})
                        </option>
                      ))}
                  </select>
                  <button type="submit" className="btn" disabled={submitting}>
                    Dispatch Cleaner
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

      {/* Book Cleaning Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book Home Cleaning Service</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="form">
              <div>
                <label>
                  Property Type
                  <select value={propertyType} onChange={e => setPropertyType(e.target.value)}>
                    <option value="Apartment">🏢 Apartment</option>
                    <option value="House">🏠 Residential House</option>
                    <option value="Office">💼 Commercial Office</option>
                  </select>
                </label>
              </div>

              <div>
                <label>
                  Number of Rooms
                  <input 
                    type="number" 
                    min={1} 
                    max={15} 
                    value={rooms} 
                    onChange={e => setRooms(parseInt(e.target.value))}
                    required 
                  />
                </label>
              </div>

              <div className="full">
                <label>
                  Scheduled Date & Time
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
                  Property Address Details
                  <input 
                    type="text" 
                    placeholder="Enter full address" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                    required 
                  />
                </label>
              </div>

              <div className="full">
                <label>
                  Special Cleaning Instructions
                  <textarea 
                    rows={3}
                    placeholder="E.g. Deep clean kitchen, focus on master bedroom..." 
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    style={{ width: "100%", resize: "none" }}
                  />
                </label>
              </div>

              <div className="full" style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Booking..." : "Book Cleaning Service"}
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
