"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Briefcase, 
  RefreshCw, 
  Cpu, 
  UserPlus, 
  MapPin, 
  Clock, 
  Truck, 
  Sparkles, 
  Bug, 
  CheckCircle, 
  Info,
  X,
  UserCheck
} from "lucide-react";
import { Shell, Topbar } from "../../src/components/Shell";
import { StatusBadge } from "../../src/components/Ui";
import { getPickups, getServiceBookings, getCollectors, getServiceProviders, apiBase } from "../../src/lib/api";
import type { Pickup, ServiceBooking, Collector, ServiceProvider } from "@waste/shared";

export default function JobAssignmentPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [serviceType, setServiceType] = useState<"waste" | "cleaning" | "pest">("waste");

  // Interaction State
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [assigneeId, setAssigneeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoMessage, setAutoMessage] = useState("");

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
        console.error("Error loading dispatch data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  const activeCountry = countryId === "country-ng" ? { currency: "NGN", name: "Nigeria" } : countryId === "country-ci" ? { currency: "XOF", name: "Côte d'Ivoire" } : { currency: "GHS", name: "Ghana" };

  // Filter pending unassigned jobs based on active tab
  const getPendingJobs = () => {
    if (serviceType === "waste") {
      return pickups
        .filter(p => p.status === "pending_assignment" || p.status === "quote_review")
        .map(p => ({
          id: p.id,
          type: "waste",
          label: "Waste Pickup",
          address: p.address,
          details: p.sackSummary,
          status: p.status,
          date: p.createdAt
        }));
    } else if (serviceType === "cleaning") {
      return bookings
        .filter(b => b.serviceType === "home_cleaning" && (b.status === "new" || b.status === "cancelled"))
        .map(b => ({
          id: b.id,
          type: "home_cleaning",
          label: "Home Cleaning",
          address: b.address,
          details: `${(b.details as any).propertyType} · ${(b.details as any).rooms} R`,
          status: b.status,
          date: b.createdAt
        }));
    } else {
      return bookings
        .filter(b => b.serviceType === "pest_control" && (b.status === "new" || b.status === "cancelled"))
        .map(b => ({
          id: b.id,
          type: "pest_control",
          label: "Pest Control",
          address: b.address,
          details: `${(b.details as any).pestType} · ${(b.details as any).propertySize}`,
          status: b.status,
          date: b.createdAt
        }));
    }
  };

  // Filter online providers based on active tab
  const getActiveProviders = () => {
    if (serviceType === "waste") {
      return collectors.map(c => ({
        id: c.id,
        name: c.name,
        type: "waste",
        spec: c.vehicleType,
        rating: c.rating || 4.5,
        availability: c.availability,
        activeJobs: c.activeJobs,
        status: c.status
      }));
    } else if (serviceType === "cleaning") {
      return providers
        .filter(p => p.serviceCategory === "home_cleaning")
        .map(p => ({
          id: p.id,
          name: p.name,
          type: "cleaning",
          spec: "Deep Cleaner",
          rating: p.rating || 4.5,
          availability: p.availability,
          activeJobs: p.assignedJobs,
          status: "approved"
        }));
    } else {
      return providers
        .filter(p => p.serviceCategory === "pest_control")
        .map(p => ({
          id: p.id,
          name: p.name,
          type: "pest",
          spec: "Licensed Technician",
          rating: p.rating || 4.5,
          availability: p.availability,
          activeJobs: p.assignedJobs,
          status: "approved"
        }));
    }
  };

  const pendingJobs = getPendingJobs();
  const activeProviders = getActiveProviders();

  const handleAssignProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !assigneeId) return;
    setSubmitting(true);
    try {
      const isWaste = selectedJob.type === "waste";
      const apiPath = isWaste 
        ? `/pickups/${selectedJob.id}/assign` 
        : `/service-bookings/${selectedJob.id}/assign`;
      
      const body = isWaste 
        ? { collectorId: assigneeId } 
        : { providerId: assigneeId };

      const response = await fetch(`${apiBase}${apiPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setSelectedJob(null);
        setAssigneeId("");
        setRefreshKey(prev => prev + 1);
      } else {
        alert(await response.text());
      }
    } catch (err) {
      alert("Failed to assign contractor.");
    } finally {
      setSubmitting(false);
    }
  };

  // Simulate proximity autopilot dispatch
  const handleAutopilotDispatch = () => {
    if (pendingJobs.length === 0) {
      alert("No pending unassigned jobs to auto-dispatch.");
      return;
    }
    const onlineMatching = activeProviders.filter(p => p.status === "approved" && p.availability === "online");
    if (onlineMatching.length === 0) {
      alert("No online approved providers available to receive auto-assignments.");
      return;
    }

    setAutoRunning(true);
    setAutoMessage("Initializing proximity calculations...");

    setTimeout(() => {
      setAutoMessage("Analyzing provider capacities...");
      setTimeout(async () => {
        // Dispatch each job to the first online provider found
        let count = 0;
        for (let i = 0; i < pendingJobs.length; i++) {
          const job = pendingJobs[i];
          const provider = onlineMatching[i % onlineMatching.length];
          
          if (job.status === "quote_review") continue; // Skip quoting reviews

          try {
            const isWaste = job.type === "waste";
            const apiPath = isWaste ? `/pickups/${job.id}/assign` : `/service-bookings/${job.id}/assign`;
            const body = isWaste ? { collectorId: provider.id } : { providerId: provider.id };

            await fetch(`${apiBase}${apiPath}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-role": "operations_admin" },
              body: JSON.stringify(body)
            });
            count++;
          } catch (e) {
            console.error(e);
          }
        }
        setAutoMessage(`Autopilot finished! Dispatched ${count} work orders successfully.`);
        setTimeout(() => {
          setAutoRunning(false);
          setRefreshKey(prev => prev + 1);
        }, 1500);
      }, 1000);
    }, 800);
  };

  return (
    <Shell active="/job-assignment">
      <Topbar title="Dispatch Center" subtitle="Coordinate automated autopilot matches or manually drag-assign providers to active service locations.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync board
        </button>
        <button className="btn" onClick={handleAutopilotDispatch} disabled={autoRunning}>
          <Cpu size={16} /> Run Autopilot Proximity Dispatch
        </button>
      </Topbar>

      {/* Autopilot loading overlay */}
      {autoRunning && (
        <div className="card" style={{ 
          marginBottom: 24, 
          background: "rgba(16,185,129,0.06)", 
          border: "1px solid rgba(16,185,129,0.25)",
          padding: "16px 24px" 
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Cpu className="animate-spin" style={{ color: "var(--primary)" }} />
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Auto-Dispatch Active</h4>
              <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "var(--text-muted)" }}>{autoMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${serviceType === "waste" ? "active" : ""}`} onClick={() => setServiceType("waste")}>
          🗑️ Waste Collection
        </button>
        <button className={`tab ${serviceType === "cleaning" ? "active" : ""}`} onClick={() => setServiceType("cleaning")}>
          🧹 Home Cleaning
        </button>
        <button className={`tab ${serviceType === "pest" ? "active" : ""}`} onClick={() => setServiceType("pest")}>
          🪳 Pest Control
        </button>
      </div>

      {/* Grid */}
      <div className="grid two">
        
        {/* Left: Pending Unassigned Jobs */}
        <div className="card">
          <h2>Pending Dispatch Queue ({pendingJobs.length} Orders)</h2>
          <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
            {pendingJobs.length > 0 ? (
              pendingJobs.map((job) => (
                <div key={job.id} style={{ 
                  background: "rgba(255,255,255,0.02)", 
                  border: "1px solid var(--line)", 
                  borderRadius: 16, 
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800, color: "var(--primary)" }}>{job.id}</span>
                      <span className="badge" style={{ padding: "2px 6px", fontSize: 10 }}>{job.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, marginTop: 8 }}>
                      <MapPin size={12} style={{ color: "var(--danger)" }} /> {job.address}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                      <Info size={12} /> {job.details}
                    </div>
                  </div>
                  <div>
                    {job.status === "quote_review" ? (
                      <span className="badge red">Awaiting Quote</span>
                    ) : (
                      <button className="btn secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => setSelectedJob(job)}>
                        <UserPlus size={12} /> Dispatch
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 48 }}>
                <CheckCircle size={36} style={{ color: "var(--primary)", opacity: 0.5, marginBottom: 12 }} />
                <div>All jobs successfully dispatched!</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Field Providers */}
        <div className="card">
          <h2>Provider Capacity Monitor</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {activeProviders.map((prov) => (
              <div key={prov.id} style={{ 
                background: "rgba(255,255,255,0.01)", 
                border: "1px solid var(--line)", 
                borderRadius: 16, 
                padding: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{prov.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    ID: {prov.id} · {prov.spec}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12 }}>
                    <span>⭐ {prov.rating}</span>
                    <span style={{ color: prov.activeJobs > 0 ? "var(--warning)" : "var(--primary)" }}>
                      💼 {prov.activeJobs} Active Jobs
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <StatusBadge value={prov.availability} />
                  <StatusBadge value={prov.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Manual Dispatch Assignment Popup */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dispatch Job Assignment</h3>
              <button className="modal-close" onClick={() => setSelectedJob(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignProvider} className="form">
              <div className="full" style={{ background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 12, fontSize: 13, display: "grid", gap: 6 }}>
                <div><b>Job ID:</b> {selectedJob.id}</div>
                <div><b>Service Category:</b> {selectedJob.label}</div>
                <div><b>Address:</b> {selectedJob.address}</div>
                <div><b>Details:</b> {selectedJob.details}</div>
              </div>

              <div className="full">
                <label>
                  Assign Available Provider
                  <select 
                    value={assigneeId} 
                    onChange={e => setAssigneeId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose online provider --</option>
                    {activeProviders
                      .filter(p => p.status === "approved" && p.availability !== "offline")
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.spec} · {p.availability} · Active: {p.activeJobs})
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <div className="full" style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Assigning..." : "Confirm Manual Dispatch"}
                </button>
                <button type="button" className="btn secondary" onClick={() => setSelectedJob(null)}>
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
