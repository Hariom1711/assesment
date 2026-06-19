"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Camera, 
  Check, 
  AlertOctagon, 
  Eye, 
  Trash, 
  RefreshCw, 
  X,
  FileText,
  MapPin,
  Calendar,
  Sparkles,
  Bug
} from "lucide-react";
import { Shell, Topbar, toast } from "../../src/components/Shell";
import { StatusBadge, Skeleton } from "../../src/components/Ui";
import { getPickups, getServiceBookings, apiBase } from "../../src/lib/api";
import type { Pickup, ServiceBooking } from "@waste/shared";

export default function GalleryPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Photo Modal
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [pList, bList] = await Promise.all([
          getPickups(countryId),
          getServiceBookings(countryId)
        ]);
        setPickups(pList);
        setBookings(bList);
      } catch (err) {
        console.error("Error loading gallery media:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  // Merge pickups and service bookings into a unified media list
  const mediaItems: any[] = [];

  pickups.forEach(p => {
    // If the pickup has proof photos or is completed
    const photos = p.proofPhotos.length > 0 ? p.proofPhotos : ["/proofs/sacks-accra.jpg"];
    const hasPhoto = p.status === "completed" || p.proofPhotos.length > 0 || p.type === "special";
    
    if (hasPhoto) {
      photos.forEach((photo: string, idx: number) => {
        mediaItems.push({
          id: `${p.id}-IMG-${idx + 1}`,
          jobId: p.id,
          jobType: "waste",
          service: "Waste Collection",
          photoUrl: photo,
          address: p.address,
          details: p.sackSummary,
          date: p.createdAt,
          status: p.status === "completed" ? "verified" : p.status === "disputed" ? "flagged" : "pending_verification",
          raw: p
        });
      });
    }
  });

  bookings.forEach(b => {
    const photos = b.images.length > 0 ? b.images : ["/proofs/cleaning-legon.jpg"];
    const hasPhoto = b.status === "completed" || b.images.length > 0;
    
    if (hasPhoto) {
      photos.forEach((photo: string, idx: number) => {
        mediaItems.push({
          id: `${b.id}-IMG-${idx + 1}`,
          jobId: b.id,
          jobType: b.serviceType,
          service: b.serviceType === "home_cleaning" ? "Home Cleaning" : "Pest Control",
          photoUrl: photo,
          address: b.address,
          details: b.serviceType === "home_cleaning" ? "Property cleaning completed" : "Site inspection report",
          date: b.createdAt,
          status: b.status === "completed" ? "verified" : b.status === "cancelled" ? "flagged" : "pending_verification",
          raw: b
        });
      });
    }
  });

  // Apply filters
  const filteredItems = mediaItems.filter(item => {
    const matchesService = serviceFilter === "all" 
      || (serviceFilter === "waste" && item.jobType === "waste")
      || (serviceFilter === "cleaning" && item.jobType === "home_cleaning")
      || (serviceFilter === "pest" && item.jobType === "pest_control");
      
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesService && matchesStatus;
  });

  const handleUpdateStatus = async (jobId: string, jobType: string, status: "completed" | "disputed" | "assigned") => {
    setSubmitting(true);
    try {
      const isWaste = jobType === "waste";
      const apiPath = isWaste 
        ? `/pickups/${jobId}/status` 
        : `/service-bookings/${jobId}/status`;
      
      const payloadStatus = isWaste 
        ? (status === "completed" ? "completed" : status === "disputed" ? "disputed" : "assigned")
        : (status === "completed" ? "completed" : status === "disputed" ? "cancelled" : "assigned");

      const response = await fetch(`${apiBase}${apiPath}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify({ status: payloadStatus })
      });

      if (response.ok) {
        setSelectedPhoto(null);
        setRefreshKey(prev => prev + 1);
        toast.success(`Verification status successfully updated to ${status}!`);
      } else {
        toast.error("Failed to update verification status.");
      }
    } catch (err: any) {
      toast.error(`Verification update failed: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell active="/gallery">
      <Topbar title="Job Proof Verification Gallery" subtitle="Central verification deck. Audit uploaded photographs, check collection proofs, and resolve driver service disputes.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </Topbar>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24, padding: "12px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Filters:</span>
          
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} style={{ padding: "6px 12px", minWidth: 140 }}>
            <option value="all">All Services</option>
            <option value="waste">🗑️ Waste Collection</option>
            <option value="cleaning">🧹 Home Cleaning</option>
            <option value="pest">🪳 Pest Control</option>
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 12px", minWidth: 160 }}>
            <option value="all">All Verifications</option>
            <option value="pending_verification">⏳ Pending Review</option>
            <option value="verified">✅ Approved / Verified</option>
            <option value="flagged">🚨 Flagged / Disputed</option>
          </select>

          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
            Showing {filteredItems.length} media logs
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="proof-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 0 }}>
              <Skeleton style={{ height: 140, width: "100%", borderRadius: "16px 16px 0 0" }} />
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton style={{ height: 14, width: "60%" }} />
                <Skeleton style={{ height: 10, width: "80%" }} />
                <Skeleton style={{ height: 10, width: "40%" }} />
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <Skeleton style={{ height: 28, flex: 1, borderRadius: 8 }} />
                  <Skeleton style={{ height: 28, width: 28, borderRadius: 8 }} />
                  <Skeleton style={{ height: 28, width: 28, borderRadius: 8 }} />
                </div>
              </div>
            </div>
          ))
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.id} className="proof-card" style={{ border: item.status === "flagged" ? "1px solid rgba(244,63,94,0.3)" : "1px solid var(--line)" }}>
              
              {/* Visual Card image */}
              <div 
                className="proof-image-placeholder"
                style={{ 
                  background: item.jobType === "waste" 
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 10, 20, 0.9))" 
                    : item.jobType === "home_cleaning"
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 10, 20, 0.9))"
                    : "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(6, 10, 20, 0.9))"
                }}
              >
                <div style={{ position: "absolute", top: 12, right: 12 }}>
                  <StatusBadge value={item.status} />
                </div>
                
                <Camera size={32} style={{ 
                  color: item.jobType === "waste" 
                    ? "var(--primary)" 
                    : item.jobType === "home_cleaning" 
                    ? "var(--accent)" 
                    : "var(--warning)",
                  opacity: 0.65
                }} />
                
                <div style={{ position: "absolute", bottom: 8, left: 12, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                  {item.jobId}
                </div>
              </div>

              <div className="proof-details">
                <div className="proof-meta">
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    {item.jobType === "waste" ? <Trash size={12} /> : item.jobType === "home_cleaning" ? <Sparkles size={12} /> : <Bug size={12} />}
                    {item.service}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <MapPin size={10} /> {item.address}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <FileText size={10} /> {item.details}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 4 }}>
                  <button className="btn secondary" style={{ flex: 1, padding: "6px 8px", fontSize: 11 }} onClick={() => setSelectedPhoto(item)}>
                    <Eye size={12} /> Review
                  </button>
                  {item.status === "pending_verification" && (
                    <>
                      <button className="btn" style={{ padding: "6px 10px" }} onClick={() => handleUpdateStatus(item.jobId, item.jobType, "completed")}>
                        <Check size={12} />
                      </button>
                      <button className="btn danger" style={{ padding: "6px 10px" }} onClick={() => handleUpdateStatus(item.jobId, item.jobType, "disputed")}>
                        <AlertOctagon size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
            <Camera size={44} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>No photos found matching filters.</div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h3>Verify Collection Proof</h3>
              <button className="modal-close" onClick={() => setSelectedPhoto(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Giant mock image representation */}
              <div 
                style={{ 
                  height: 280, 
                  borderRadius: 16, 
                  border: "1px solid var(--line)", 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  justifyContent: "center",
                  background: selectedPhoto.jobType === "waste"
                    ? "radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(6,10,20,0.95) 100%)"
                    : "radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(6,10,20,0.95) 100%)"
                }}
              >
                <Camera size={64} style={{ opacity: 0.25, color: "var(--primary)", marginBottom: 16 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                  [SIMULATED CAMERA ENTRANCE PROOF PHOTO]
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                  Filename: {selectedPhoto.photoUrl.split("/").pop()}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 16, fontSize: 14 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Job ID Reference</span>
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>{selectedPhoto.jobId}</span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Verification Status</span>
                  <span style={{ display: "inline-block", marginTop: 4 }}><StatusBadge value={selectedPhoto.status} /></span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Address Scope</span>
                  <span style={{ fontWeight: 600 }}>{selectedPhoto.address}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Upload Timestamp</span>
                  <span style={{ fontWeight: 600 }}>{new Date(selectedPhoto.date).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                {selectedPhoto.status === "pending_verification" && (
                  <>
                    <button className="btn" style={{ flex: 1 }} onClick={() => handleUpdateStatus(selectedPhoto.jobId, selectedPhoto.jobType, "completed")} disabled={submitting}>
                      Approve and Clear Job
                    </button>
                    <button className="btn danger" style={{ flex: 1 }} onClick={() => handleUpdateStatus(selectedPhoto.jobId, selectedPhoto.jobType, "disputed")} disabled={submitting}>
                      Flag as Disputed
                    </button>
                  </>
                )}
                {selectedPhoto.status === "flagged" && (
                  <button className="btn secondary" style={{ flex: 1 }} onClick={() => handleUpdateStatus(selectedPhoto.jobId, selectedPhoto.jobType, "assigned")} disabled={submitting}>
                    Re-assign to Another Provider
                  </button>
                )}
                <button type="button" className="btn secondary" onClick={() => setSelectedPhoto(null)}>
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
