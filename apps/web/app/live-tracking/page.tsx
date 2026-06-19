"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Map, 
  RefreshCw, 
  MapPin, 
  Navigation, 
  Phone, 
  Activity, 
  TrendingUp,
  X,
  Compass
} from "lucide-react";
import { Shell, Topbar } from "../../src/components/Shell";
import { StatusBadge } from "../../src/components/Ui";
import { getCollectors, getServiceProviders, apiBase } from "../../src/lib/api";
import type { Collector, ServiceProvider } from "@waste/shared";

export default function LiveTrackingPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Active / Highlighted Provider
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cList, spList] = await Promise.all([
          getCollectors(countryId),
          getServiceProviders(countryId)
        ]);
        setCollectors(cList);
        setProviders(spList);
      } catch (err) {
        console.error("Error loading live tracking registry:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  // Polling simulated GPS coordinates drift (every 4 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCollectors(prev => prev.map(c => {
        if (c.availability !== "offline") {
          const driftX = (Math.random() - 0.5) * 0.003;
          const driftY = (Math.random() - 0.5) * 0.003;
          return {
            ...c,
            latitude: c.latitude + driftX,
            longitude: c.longitude + driftY
          };
        }
        return c;
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const activeCountry = countryId === "country-ng" ? { currency: "NGN", name: "Nigeria" } : countryId === "country-ci" ? { currency: "XOF", name: "Côte d'Ivoire" } : { currency: "GHS", name: "Ghana" };

  // Merge into a list of trackable agents
  const trackingAgents = [
    ...collectors.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      type: "waste_collector",
      category: "Waste Collection",
      spec: c.vehicleType,
      availability: c.availability,
      lat: c.latitude,
      lng: c.longitude,
      jobs: c.activeJobs
    })),
    ...providers.map((p, idx) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      type: p.providerType,
      category: p.serviceCategory === "home_cleaning" ? "Home Cleaning" : "Pest Control",
      spec: p.providerType === "home_cleaner" ? "Home Cleaner" : "Pest Technician",
      availability: p.availability,
      // Seeded mock coordinates
      lat: 5.61 + (idx * 0.015),
      lng: -0.19 - (idx * 0.012),
      jobs: p.assignedJobs
    }))
  ];

  const highlightedAgent = trackingAgents.find(a => a.id === activeId);

  return (
    <Shell active="/live-tracking">
      <Topbar title="Live Dispatch Map" subtitle="Real-time geographic status of field providers, active collection trucks, and cleaning crews.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync GPS
        </button>
      </Topbar>

      {/* Roster & Map Grid */}
      <div className="grid two">
        
        {/* Left: Map Visualizer */}
        <div className="card" style={{ padding: 16 }}>
          <h2>
            <Navigation size={18} style={{ color: "var(--primary)" }} />
            Capital District Live Dispatch Tracking Grid
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -12, marginBottom: 16 }}>
            Simulating live telemetry feeds via periodic coordinate updates.
          </p>

          <div className="map-container" style={{ height: 480 }}>
            {/* SVG coordinates mesh grid */}
            <svg className="map-svg" viewBox="0 0 100 100">
              <defs>
                <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid-pattern)" />
              
              {/* Map topology outline mock */}
              <path d="M 5 45 C 20 50, 45 40, 60 70 S 85 80, 95 65" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <path d="M 15 20 C 35 15, 60 45, 80 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
            </svg>

            <div className="map-pins">
              {trackingAgents.map((agent, index) => {
                // Map lat/lng coordinates to absolute percentages inside map area
                let x = 20 + ((agent.lng + 1) * 35);
                let y = 30 + ((agent.lat - 5) * 45);
                if (isNaN(x) || x < 5 || x > 95) x = 15 + (index * 22);
                if (isNaN(y) || y < 5 || y > 95) y = 25 + (index * 14);

                const isHighlighted = agent.id === activeId;

                return (
                  <div 
                    key={agent.id} 
                    className={`pin ${agent.availability}`}
                    style={{ 
                      left: `${x}%`, 
                      top: `${y}%`,
                      transform: isHighlighted ? "translate(-50%, -50%) scale(1.4)" : "translate(-50%, -50%)"
                    }}
                    onClick={() => setActiveId(agent.id)}
                  >
                    <div className="pin-marker" style={{
                      boxShadow: isHighlighted ? "0 0 15px var(--primary)" : "none",
                      border: isHighlighted ? "3px solid var(--primary)" : "3px solid white"
                    }}></div>
                    <span className="pin-label" style={{
                      opacity: isHighlighted ? 1 : 0.8,
                      background: isHighlighted ? "var(--bg-sidebar)" : "rgba(15, 23, 42, 0.9)"
                    }}>
                      {agent.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Roster list & detail popup */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          <div className="card">
            <h2>Active Field Fleet</h2>
            <div style={{ maxHeight: 400, overflowY: "auto", display: "grid", gap: 10 }}>
              {trackingAgents.map((agent) => (
                <div 
                  key={agent.id}
                  style={{ 
                    padding: 12, 
                    background: agent.id === activeId ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.01)",
                    border: agent.id === activeId ? "1px solid rgba(16,185,129,0.25)" : "1px solid var(--line)",
                    borderRadius: 16,
                    cursor: "pointer",
                    transition: "var(--transition)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                  onClick={() => setActiveId(agent.id)}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {agent.category} · {agent.spec}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <StatusBadge value={agent.availability} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* detail card for highlighted agent */}
          {highlightedAgent && (
            <div className="card" style={{ border: "1px solid var(--primary-glow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>Telemetry Details</h3>
                <button className="modal-close" onClick={() => setActiveId(null)}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ 
                  width: 42, 
                  height: 42, 
                  borderRadius: "50%", 
                  background: "var(--primary-glow)", 
                  color: "var(--primary)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 16,
                  fontWeight: 800
                }}>
                  {highlightedAgent.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14 }}>{highlightedAgent.name}</h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                    {highlightedAgent.spec}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, fontSize: 12 }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>GPS Latitude</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{highlightedAgent.lat.toFixed(6)}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>GPS Longitude</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{highlightedAgent.lng.toFixed(6)}</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Active Orders</span>
                  <span style={{ fontWeight: 700 }}>{highlightedAgent.jobs} Jobs</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Telemetry status</span>
                  <span style={{ color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <Activity size={10} className="animate-pulse" /> Ping OK
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12, fontSize: 13, alignItems: "center" }}>
                <Phone size={12} style={{ color: "var(--primary)" }} /> {highlightedAgent.phone}
              </div>
            </div>
          )}

        </div>

      </div>
    </Shell>
  );
}
