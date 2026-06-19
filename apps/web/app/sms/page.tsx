"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  MessageSquare, 
  Send, 
  PhoneCall, 
  Smartphone, 
  FileCode,
  Settings,
  HelpCircle,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { Shell, Topbar, toast } from "../../src/components/Shell";
import { StatusBadge, Skeleton, SkeletonTable } from "../../src/components/Ui";
import { getSmsEvents, getSmsTemplates, apiBase, fallbackData } from "../../src/lib/api";
import type { SmsWorkflowEvent, SmsTemplate } from "@waste/shared";

interface ChatMessage {
  id: string;
  sender: "customer" | "system";
  text: string;
  timestamp: string;
}

export default function SmsPage() {
  const searchParams = useSearchParams();
  const countryId = searchParams.get("countryId") ?? "country-gh";

  // Data State
  const [events, setEvents] = useState<SmsWorkflowEvent[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Phone Simulator state
  const [customerPhone, setCustomerPhone] = useState("+233241000001"); // Ghana customer phone
  const [inputText, setInputText] = useState("PICKUP 3 SACKS");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "init-1", sender: "system", text: "Welcome to WasteOps SMS Dispatcher. Send 'PICKUP <number> SACKS' to request a collection.", timestamp: new Date().toLocaleTimeString() }
  ]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [eList, tList] = await Promise.all([
          getSmsEvents(),
          getSmsTemplates()
        ]);
        setEvents(eList);
        setTemplates(tList);
      } catch (err) {
        console.error("Error loading SMS data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey]);

  // Adjust default phone based on country scope
  useEffect(() => {
    if (countryId === "country-ng") {
      setCustomerPhone("+234803000001");
      setInputText("PICKUP 4 SACKS");
    } else {
      setCustomerPhone("+233241000001");
      setInputText("PICKUP 3 SACKS");
    }
  }, [countryId]);

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setSending(true);

    const messageToSend = inputText.trim();
    // Append customer message
    const customerMsg: ChatMessage = {
      id: `cust-${Date.now()}`,
      sender: "customer",
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, customerMsg]);
    setInputText("");

    try {
      const response = await fetch(`${apiBase}/sms/inbound`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: customerPhone,
          text: messageToSend,
          countryId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Append response message from system
        const systemMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          sender: "system",
          text: data.event.lastMessage,
          timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages(prev => [...prev, systemMsg]);
        setRefreshKey(prev => prev + 1);
        toast.success("SMS request dispatched and reply compiled!");
      } else {
        toast.error("SMS simulator received a bad gateway response.");
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "system",
        text: "⚠️ Gateway Timeout. Please check if api backend is running.",
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, errorMsg]);
      toast.error(`SMS dispatch error: ${err.message || err}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Shell active="/sms">
      <Topbar title="SMS Gateway Dispatch" subtitle="Simulate customer feature-phone request handling, view automated templates, and monitor incoming SMS hooks.">
        <button className="btn secondary" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync logs
        </button>
      </Topbar>

      {/* Simulator + Logs */}
      <div className="sms-layout">
        
        {/* Left Side: Mobile Phone Simulator */}
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Smartphone size={18} style={{ color: "var(--primary)" }} />
            Inbound SMS Simulator
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -4, marginBottom: 20 }}>
            Interact with the platform using simulated SMS commands. Senders must send commands like <code>PICKUP 3 SACKS</code>.
          </p>

          <div className="phone-case">
            <div className="phone-speaker"></div>
            <div className="phone-screen">
              <div className="phone-header">
                <div className="phone-avatar">💬</div>
                <div className="phone-contact">
                  <div className="phone-contact-name">WasteOps Gateway</div>
                  <div className="phone-contact-status">
                    <span style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: "50%", 
                      background: "var(--primary)", 
                      display: "inline-block",
                      marginRight: 4
                    }}></span>
                    Shortcode Active (Hubtel/Twilio)
                  </div>
                </div>
              </div>

              {/* Chat history */}
              <div className="chat-history">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble ${msg.sender === "customer" ? "inbound" : "outbound"}`}>
                    <div>{msg.text}</div>
                    <div className="chat-timestamp">{msg.timestamp}</div>
                  </div>
                ))}
              </div>

              {/* Form Input */}
              <form onSubmit={handleSendSms} className="phone-footer">
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                  required
                  style={{ width: "30%", minWidth: "auto", fontSize: 11, padding: "8px 6px" }}
                />
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type command..."
                  required
                  style={{ flex: 1, minWidth: "auto", fontSize: 12, padding: "8px 10px" }}
                  disabled={sending}
                />
                <button type="submit" disabled={sending}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side: Gateway Log & Templates */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          <div className="card">
            <h2>
              <Clock size={18} style={{ color: "var(--accent)" }} />
              Live SMS Webhook Logs
            </h2>
            <div className="sms-events-log">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div className="sms-event-card animate-pulse" key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Skeleton style={{ height: 12, width: "40%" }} />
                      <Skeleton style={{ height: 12, width: "20%" }} />
                    </div>
                    <Skeleton style={{ height: 10, width: "60%" }} />
                    <Skeleton style={{ height: 10, width: "80%" }} />
                    <Skeleton style={{ height: 24, width: "100%", borderRadius: 6, marginTop: 4 }} />
                  </div>
                ))
              ) : events.length > 0 ? (
                events.map((evt) => (
                  <div className="sms-event-card" key={evt.id}>
                    <div className="sms-event-header">
                      <span>{evt.id} · {evt.customerPhone}</span>
                      <span><StatusBadge value={evt.status} /></span>
                    </div>
                    <div><b>Inbound SMS:</b> "{evt.inboundText}"</div>
                    <div style={{ marginTop: 4 }}><b>Gateway Provider:</b> {evt.gatewayProvider} (Delivery: <StatusBadge value={evt.deliveryStatus} />)</div>
                    <div className="sms-event-body">
                      <b>Reply Sent:</b> {evt.lastMessage}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                  No webhook events logged yet. Use the phone simulator to generate logs.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2>
              <FileCode size={18} style={{ color: "var(--primary)" }} />
              SMS Automation Templates
            </h2>
            {loading ? (
              <SkeletonTable cols={3} rows={2} />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Trigger Event</th>
                      <th>Template Body</th>
                      <th>Countries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.length > 0 ? (
                      templates.map((tpl) => (
                        <tr key={tpl.id}>
                          <td><b>{tpl.name}</b></td>
                          <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{tpl.body}</td>
                          <td>
                            {tpl.countries.map(c => (
                              <span key={c} className="badge" style={{ marginRight: 4, padding: "2px 6px" }}>{c}</span>
                            ))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)", padding: 12 }}>
                          No templates configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </Shell>
  );
}
