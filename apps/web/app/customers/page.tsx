"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Users, 
  Search, 
  RefreshCw, 
  DollarSign, 
  History,
  ShieldAlert,
  UserX,
  UserCheck,
  CheckCircle,
  X,
  MapPin,
  Phone
} from "lucide-react";
import { Shell, Topbar } from "../../src/components/Shell";
import { StatusBadge } from "../../src/components/Ui";
import { getCustomers, apiBase } from "../../src/lib/api";
import type { Customer } from "@waste/shared";

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Interactions State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refundMessage, setRefundMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getCustomers(countryId);
        setCustomers(data);
      } catch (err) {
        console.error("Error loading customers data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [countryId, refreshKey]);

  const activeCountry = countryId === "country-ng" ? { currency: "NGN", name: "Nigeria" } : countryId === "country-ci" ? { currency: "XOF", name: "Côte d'Ivoire" } : { currency: "GHS", name: "Ghana" };

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSearch = searchQuery === "" 
      || c.name.toLowerCase().includes(searchQuery.toLowerCase())
      || c.phone.toLowerCase().includes(searchQuery.toLowerCase())
      || c.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = (custId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    // Optimistic UI state update
    setCustomers(prev => prev.map(c => c.id === custId ? { ...c, status: nextStatus as any } : c));
    if (selectedCustomer && selectedCustomer.id === custId) {
      setSelectedCustomer({ ...selectedCustomer, status: nextStatus as any });
    }
  };

  const handleIssueRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !refundAmount) return;
    setSubmitting(true);
    setRefundMessage("Processing wallet adjustment...");

    setTimeout(() => {
      const amt = Number(refundAmount);
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, walletBalance: c.walletBalance + amt } : c));
      setSelectedCustomer(prev => prev ? { ...prev, walletBalance: prev.walletBalance + amt } : null);
      setRefundAmount("");
      setRefundMessage(`Successfully refunded ${activeCountry.currency} ${amt} to wallet!`);
      setSubmitting(false);
    }, 800);
  };

  return (
    <Shell active="/customers">
      <Topbar title="Customer Directory" subtitle="Audit customer registry details, adjust digital wallet balances, and manage status suspensions.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Directory
        </button>
      </Topbar>

      <div className="card" style={{ marginBottom: 24, padding: "16px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text" 
                placeholder="Search name, phone, address..." 
                style={{ paddingLeft: 36, width: 240 }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">🚦 All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
            </select>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
            Found <span style={{ color: "var(--primary)" }}>{filteredCustomers.length}</span> customer accounts
          </div>

        </div>
      </div>

      {/* Customer list */}
      <div className="card">
        <h2>Customer Registry</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Full Name</th>
                <th>Phone Number</th>
                <th>Home/Office Address</th>
                <th>Digital Wallet</th>
                <th>Total Value spent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td><code>{c.id}</code></td>
                    <td><b>{c.name}</b></td>
                    <td>{c.phone}</td>
                    <td>{c.address}</td>
                    <td style={{ fontWeight: 700, color: "var(--primary)" }}>{activeCountry.currency} {c.walletBalance}</td>
                    <td style={{ fontWeight: 700 }}>{activeCountry.currency} {c.totalSpend}</td>
                    <td><StatusBadge value={c.status} /></td>
                    <td>
                      <button className="btn secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => { setSelectedCustomer(c); setRefundMessage(""); }}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 36 }}>
                    No customer accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer overlay */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customer Account Audit</h3>
              <button className="modal-close" onClick={() => setSelectedCustomer(null)}>
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
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{selectedCustomer.name}</h4>
                  <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: 12 }}>
                    ID: {selectedCustomer.id} · Active in {activeCountry.name}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 16, fontSize: 14 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Wallet Balance</span>
                  <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: 16, display: "block", marginTop: 4 }}>
                    {activeCountry.currency} {selectedCustomer.walletBalance}
                  </span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>Total Value Spent</span>
                  <span style={{ fontWeight: 700, fontSize: 16, display: "block", marginTop: 4 }}>
                    {activeCountry.currency} {selectedCustomer.totalSpend}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <Phone size={14} style={{ color: "var(--primary)" }} /> {selectedCustomer.phone}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <MapPin size={14} style={{ color: "var(--danger)" }} /> {selectedCustomer.address}
                </div>
              </div>

              {/* Wallet Adjustment / Refund form */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Wallet Refund & Adjustments</h4>
                <form onSubmit={handleIssueRefund} style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "var(--text-muted)", fontSize: 13 }}>
                      {activeCountry.currency}
                    </span>
                    <input 
                      type="number" 
                      placeholder="Enter amount to refund" 
                      required 
                      style={{ paddingLeft: 44, width: "100%" }}
                      value={refundAmount}
                      onChange={e => setRefundAmount(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <button type="submit" className="btn full" disabled={submitting}>
                    {submitting ? "Processing..." : "Issue Wallet Refund"}
                  </button>
                  {refundMessage && (
                    <div style={{ 
                      fontSize: 12, 
                      textAlign: "center", 
                      color: refundMessage.includes("Error") ? "var(--danger)" : "var(--primary)",
                      fontWeight: 600,
                      marginTop: 4 
                    }}>
                      {refundMessage}
                    </div>
                  )}
                </form>
              </div>

              {/* Suspension Actions */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Platform Access Status</h4>
                <button 
                  className={selectedCustomer.status === "active" ? "btn danger full" : "btn full"} 
                  onClick={() => handleUpdateStatus(selectedCustomer.id, selectedCustomer.status)}
                >
                  {selectedCustomer.status === "active" ? "Suspend Customer Account" : "Activate Customer Account"}
                </button>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn secondary full" onClick={() => setSelectedCustomer(null)}>
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
