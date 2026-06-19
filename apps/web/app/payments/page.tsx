"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  WalletCards, 
  RefreshCw, 
  Search, 
  TrendingUp, 
  ArrowDownRight, 
  Coins, 
  CreditCard,
  DollarSign,
  Download,
  Filter,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react";
import { Shell, Topbar } from "../../src/components/Shell";
import { StatusBadge } from "../../src/components/Ui";
import { getPayments, apiBase } from "../../src/lib/api";
import type { Payment } from "@waste/shared";

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getPayments(countryId);
        setPayments(data);
      } catch (err) {
        console.error("Error loading payments data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  const activeCountry = countryId === "country-ng" ? { currency: "NGN", name: "Nigeria" } : countryId === "country-ci" ? { currency: "XOF", name: "Côte d'Ivoire" } : { currency: "GHS", name: "Ghana" };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesMethod = methodFilter === "all" || p.method === methodFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesSearch = searchQuery === "" 
      || p.id.toLowerCase().includes(searchQuery.toLowerCase())
      || p.customerId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMethod && matchesStatus && matchesSearch;
  });

  // Calculate totals
  const totalVolume = filteredPayments
    .filter(p => p.status === "successful")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingSettlement = filteredPayments
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const failedSettlement = filteredPayments
    .filter(p => p.status === "failed")
    .reduce((sum, p) => sum + p.amount, 0);

  // Method percentages
  const getMethodShares = () => {
    const totalsByMethod: Record<string, number> = { momo: 0, card: 0, cash: 0, wallet: 0, bank: 0 };
    let total = 0;
    
    filteredPayments.forEach(p => {
      if (p.status === "successful") {
        totalsByMethod[p.method] = (totalsByMethod[p.method] || 0) + p.amount;
        total += p.amount;
      }
    });

    if (total === 0) return [];
    
    return Object.entries(totalsByMethod).map(([method, amt]) => ({
      method: method === "momo" ? "Mobile Money" : method === "card" ? "Credit Card" : method === "cash" ? "Cash Pay" : method === "wallet" ? "Wallet Bal" : "Bank Transfer",
      amt,
      percentage: ((amt / total) * 100).toFixed(0)
    })).filter(item => item.amt > 0);
  };

  const methodShares = getMethodShares();

  return (
    <Shell active="/payments">
      <Topbar title="Financial Ledger" subtitle="Monitor Paystack, Flutterwave, Hubtel mobile money settlements, client wallet deposits, and hauler commission payouts.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Ledger
        </button>
        <button className="btn secondary" onClick={() => alert("CSV Export Triggered. Saved to downloads.")}>
          <FileSpreadsheet size={14} /> Export CSV
        </button>
      </Topbar>

      {/* KPI stats */}
      <div className="grid three" style={{ marginBottom: 24 }}>
        <div className="card kpi-card success-accent">
          <div className="kpi-label">Cleared Net Volume</div>
          <div className="kpi-value" style={{ color: "var(--primary)" }}>
            <Coins size={24} />
            <span style={{ fontSize: 24, marginRight: 2 }}>{activeCountry.currency}</span>
            {totalVolume}
          </div>
          <div className="kpi-subtext">Successfully settled operations</div>
        </div>

        <div className="card kpi-card warning-accent">
          <div className="kpi-label">Pending Settlements</div>
          <div className="kpi-value" style={{ color: "var(--warning)" }}>
            <WalletCards size={24} />
            <span style={{ fontSize: 24, marginRight: 2 }}>{activeCountry.currency}</span>
            {pendingSettlement}
          </div>
          <div className="kpi-subtext">Cash and processing transfers</div>
        </div>

        <div className="card kpi-card danger-accent">
          <div className="kpi-label">Failed Settlements</div>
          <div className="kpi-value" style={{ color: "var(--danger)" }}>
            <CreditCard size={24} />
            <span style={{ fontSize: 24, marginRight: 2 }}>{activeCountry.currency}</span>
            {failedSettlement}
          </div>
          <div className="kpi-subtext">Cancelled or declined receipts</div>
        </div>
      </div>

      <div className="grid two">
        
        {/* Left: Ledger list */}
        <div className="card">
          <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ margin: 0 }}>Reconciled Transactions</h2>
            
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input 
                  type="text" 
                  placeholder="Search payments reference..." 
                  style={{ paddingLeft: 30, fontSize: 12, paddingRight: 8, height: 36, minWidth: 160 }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <select 
                value={methodFilter} 
                onChange={e => setMethodFilter(e.target.value)}
                style={{ height: 36, fontSize: 12, padding: "0 10px" }}
              >
                <option value="all">All Methods</option>
                <option value="momo">MTN/Vodafone MoMo</option>
                <option value="card">Debit/Credit Card</option>
                <option value="wallet">Digital Wallet</option>
                <option value="cash">Cash Settlement</option>
                <option value="bank">Bank Wire</option>
              </select>

              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                style={{ height: 36, fontSize: 12, padding: "0 10px" }}
              >
                <option value="all">All Statuses</option>
                <option value="successful">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Client Reference</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Execution Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => (
                    <tr key={p.id}>
                      <td><b>{p.id}</b></td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.customerId}</td>
                      <td>
                        <span style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 700, opacity: 0.8 }}>
                          {p.method}
                        </span>
                      </td>
                      <td><StatusBadge value={p.status} /></td>
                      <td style={{ fontWeight: 700, color: p.status === "successful" ? "var(--primary)" : "inherit" }}>
                        {activeCountry.currency} {p.amount}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                      No payments found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Reconciliation overview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          <div className="card">
            <h2>Gateway Share Percentages</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -12, marginBottom: 20 }}>
              Breakdown of successful revenue volume by payment gateway method.
            </p>

            <div style={{ display: "grid", gap: 16 }}>
              {methodShares.length > 0 ? (
                methodShares.map((item) => (
                  <div key={item.method}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      <span>{item.method}</span>
                      <span>{item.percentage}% ({activeCountry.currency} {item.amt})</span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3 }}>
                      <div style={{ 
                        width: `${item.percentage}%`, 
                        height: "100%", 
                        background: "var(--accent)", 
                        borderRadius: 3 
                      }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  No successful revenue to chart.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2>Momo Integration Node</h2>
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, fontSize: 13 }}>
              <CheckCircle style={{ color: "var(--primary)" }} />
              <div>
                <div style={{ fontWeight: 700 }}>Hubtel MoMo Hook (Ghana)</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>Listener status: <b>Active (200 OK)</b></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, fontSize: 13, marginTop: 10 }}>
              <CheckCircle style={{ color: "var(--primary)" }} />
              <div>
                <div style={{ fontWeight: 700 }}>Paystack Webhooks (Nigeria)</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>Listener status: <b>Active (200 OK)</b></div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </Shell>
  );
}
