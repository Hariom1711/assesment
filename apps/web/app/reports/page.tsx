"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  BarChart3, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  DollarSign, 
  Package, 
  CheckCircle,
  Clock,
  Download,
  Calendar,
  X,
  FileText
} from "lucide-react";
import { Shell, Topbar } from "../../src/components/Shell";
import { StatusBadge } from "../../src/components/Ui";
import { getDashboard, getPayments, getSacks, getCollectors } from "../../src/lib/api";
import type { Payment, SackType, Collector } from "@waste/shared";

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [dashboard, setDashboard] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sacks, setSacks] = useState<SackType[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [dashData, pList, sList, colList] = await Promise.all([
          getDashboard(countryId),
          getPayments(countryId),
          getSacks(countryId),
          getCollectors(countryId)
        ]);
        setDashboard(dashData);
        setPayments(pList);
        setSacks(sList);
        setCollectors(colList);
      } catch (err) {
        console.error("Error loading reports data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  const activeCountry = countryId === "country-ng" ? { currency: "NGN", name: "Nigeria" } : countryId === "country-ci" ? { currency: "XOF", name: "Côte d'Ivoire" } : { currency: "GHS", name: "Ghana" };

  if (loading || !dashboard) {
    return (
      <Shell active="/reports">
        <Topbar title="Reporting & Analytics" subtitle="Loading analytics deck..." />
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <RefreshCw className="animate-spin" size={32} />
        </div>
      </Shell>
    );
  }

  // Revenue by method calculation
  const revenueByMethod = payments
    .filter(p => p.status === "successful")
    .reduce<Record<string, number>>((acc, payment) => {
      const methodLabel = payment.method === "momo" ? "Mobile Money" : payment.method === "card" ? "Credit Card" : payment.method === "cash" ? "Cash" : payment.method === "wallet" ? "Digital Wallet" : "Bank Wire";
      return {
        ...acc,
        [methodLabel]: (acc[methodLabel] ?? 0) + payment.amount
      };
    }, {});

  const maxMethodAmt = Math.max(...Object.values(revenueByMethod), 1);

  // Revenue by sack type
  const sackRevenue = sacks.map(s => ({
    name: s.name,
    sold: s.stockSold,
    revenue: s.stockSold * s.price
  }));

  const maxSackRev = Math.max(...sackRevenue.map(s => s.revenue), 1);

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setIsReportModalOpen(false);
      alert(`Custom report generated for scope: ${reportType.toUpperCase()} between ${startDate || "inception"} and ${endDate || "today"}. Download started.`);
    }, 1200);
  };

  return (
    <Shell active="/reports">
      <Topbar title="Platform Performance & Analytics" subtitle="Platform metrics reporting deck. Review collection volumes, transaction methods, and provider leaderboards.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} /> Refresh
        </button>
        <button className="btn" onClick={() => setIsReportModalOpen(true)}>
          <Download size={14} /> Export Custom Report
        </button>
      </Topbar>

      {/* Overview Cards */}
      <div className="grid three" style={{ marginBottom: 24 }}>
        <div className="card">
          <h2>
            <CheckCircle size={18} style={{ color: "var(--primary)" }} />
            Collection Operations
          </h2>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--text-muted)" }}>Today's Pickups:</span>
              <span style={{ fontWeight: 700 }}>{dashboard.kpis.todaysPickups} jobs</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--text-muted)" }}>Pending Dispatch Queue:</span>
              <span style={{ fontWeight: 700, color: "var(--warning)" }}>{dashboard.kpis.pendingRequests} jobs</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--text-muted)" }}>Active Field Jobs:</span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>{dashboard.kpis.activeJobs} jobs</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>
            <DollarSign size={18} style={{ color: "var(--primary)" }} />
            Revenue by Method
          </h2>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {Object.entries(revenueByMethod).map(([method, amount]) => {
              const pct = (amount / maxMethodAmt) * 100;
              return (
                <div key={method}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>{method}</span>
                    <span>{activeCountry.currency} {amount}</span>
                  </div>
                  <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.03)", borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)", borderRadius: 2 }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2>
            <Package size={18} style={{ color: "var(--accent)" }} />
            Sack Sales Revenues
          </h2>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {sackRevenue.map((s) => {
              const pct = (s.revenue / maxSackRev) * 100;
              return (
                <div key={s.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>{s.name} Sack ({s.sold} sold)</span>
                    <span>{activeCountry.currency} {s.revenue}</span>
                  </div>
                  <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.03)", borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Provider Leaderboard */}
      <div className="card">
        <h2>
          <Award size={18} style={{ color: "var(--warning)" }} />
          Top Performing Collectors Leaderboard
        </h2>
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Collector Name</th>
                <th>Vehicle Type</th>
                <th>Customer Rating</th>
                <th>Jobs Completed</th>
                <th>Total Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {collectors.length > 0 ? (
                collectors
                  .sort((a, b) => b.completedJobs - a.completedJobs)
                  .map((col, index) => (
                    <tr key={col.id}>
                      <td><b>#{index + 1}</b></td>
                      <td><b>{col.name}</b></td>
                      <td>{col.vehicleType}</td>
                      <td>⭐ {col.rating || 4.5}</td>
                      <td style={{ color: "var(--primary)", fontWeight: 700 }}>{col.completedJobs} Jobs</td>
                      <td style={{ fontWeight: 700 }}>{activeCountry.currency} {col.earnings}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>
                    No collector leaderboard data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Report Modal */}
      {isReportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsReportModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Custom Platform Report</h3>
              <button className="modal-close" onClick={() => setIsReportModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="form">
              <div className="full">
                <label>
                  Report Target Category
                  <select value={reportType} onChange={e => setReportType(e.target.value)}>
                    <option value="all">📊 Complete Platform Aggregations</option>
                    <option value="waste">🗑️ Waste Collection Dispatch Logs</option>
                    <option value="financial">💰 Revenue and Momo Transactions</option>
                    <option value="performance">👷 Provider Ratings & Leaderboard</option>
                  </select>
                </label>
              </div>

              <div>
                <label>
                  Start Date
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </label>
              </div>

              <div>
                <label>
                  End Date
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </label>
              </div>

              <div className="full" style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={exporting}>
                  {exporting ? "Generating Ledger..." : "Generate & Download Report"}
                </button>
                <button type="button" className="btn secondary" onClick={() => setIsReportModalOpen(false)}>
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
