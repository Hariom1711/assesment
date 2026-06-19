import cors from "cors";
import express from "express";
import morgan from "morgan";
import { z } from "zod";
import { audit, loadDatabase, saveDatabase } from "./database.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
let db = loadDatabase();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

const requireRole = (...roles: string[]) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const role = req.header("x-role") ?? "operations_admin";
  if (!roles.includes(role)) return res.status(403).json({ error: `Requires one of: ${roles.join(", ")}` });
  next();
};

const persist = (actor: string, action: string, details: string) => {
  audit(db, actor, action, details);
  saveDatabase(db);
};

app.get("/api/v1/health", (_req, res) => res.json({ ok: true, service: "waste-api" }));
app.get("/api/v1/auth/me", (req, res) => {
  const role = req.header("x-role") ?? "super_admin";
  res.json({ id: "demo-user", name: role === "super_admin" ? "Super Admin" : "Operations Admin", role, countryId: db.settings.defaultCountryId });
});

app.get("/api/v1/dashboard", (req, res) => {
  const countryId = String(req.query.countryId ?? db.settings.defaultCountryId);
  const scopedPickups = db.pickups.filter((pickup) => pickup.countryId === countryId);
  const scopedPayments = db.payments.filter((payment) => payment.countryId === countryId);
  res.json({
    kpis: {
      totalCustomers: db.customers.filter((customer) => customer.countryId === countryId).length,
      totalCollectors: db.collectors.filter((collector) => collector.countryId === countryId).length,
      todaysPickups: scopedPickups.length,
      revenueToday: scopedPayments.filter((payment) => payment.status === "successful").reduce((sum, payment) => sum + payment.amount, 0),
      pendingRequests: scopedPickups.filter((pickup) => pickup.status === "pending_assignment" || pickup.status === "quote_review").length,
      activeJobs: scopedPickups.filter((pickup) => pickup.status === "assigned" || pickup.status === "in_progress").length
    },
    recentPickups: scopedPickups.slice(0, 8),
    collectorMap: db.collectors.filter((collector) => collector.countryId === countryId)
  });
});

app.get("/api/v1/countries", (_req, res) => res.json(db.countries));
app.post("/api/v1/countries", requireRole("super_admin"), (req, res) => {
  const payload = z.object({ code: z.string(), name: z.string(), currency: z.string(), taxRate: z.number().default(0), active: z.boolean().default(true), paymentProviders: z.array(z.string()).default([]) }).parse(req.body);
  const country = { ...payload, id: `country-${payload.code.toLowerCase()}` };
  db.countries.push(country as never);
  persist("super_admin", "country.created", country.name);
  res.status(201).json(country);
});
app.patch("/api/v1/countries/:id/settings", requireRole("super_admin"), (req, res) => {
  const country = db.countries.find((item) => item.id === req.params.id);
  if (!country) return res.status(404).json({ error: "Country not found" });
  Object.assign(country, req.body);
  persist("super_admin", "country.settings.updated", country.name);
  res.json(country);
});

app.get("/api/v1/pickups", (req, res) => {
  const { status, countryId } = req.query;
  res.json(db.pickups.filter((pickup) => (!countryId || pickup.countryId === countryId) && (!status || pickup.status === status)));
});
app.post("/api/v1/pickups", (req, res) => {
  const payload = z.object({ countryId: z.string(), customerId: z.string(), pickupWindow: z.enum(["morning", "afternoon", "evening"]), address: z.string(), sackSummary: z.string(), amount: z.number(), source: z.enum(["mobile", "sms", "admin"]).default("admin") }).parse(req.body);
  const pickup = { id: `PU-${1000 + db.pickups.length + 1}`, type: "sack" as const, status: "pending_assignment" as const, proofPhotos: [], createdAt: new Date().toISOString(), ...payload };
  db.pickups.unshift(pickup);
  persist("operations_admin", "pickup.created", pickup.id);
  res.status(201).json(pickup);
});
app.post("/api/v1/pickups/special", (req, res) => {
  const payload = z.object({ countryId: z.string(), customerId: z.string(), pickupWindow: z.enum(["morning", "afternoon", "evening"]), address: z.string(), description: z.string(), photos: z.array(z.string()).default([]) }).parse(req.body);
  const pickup = { id: `SP-${1000 + db.pickups.length + 1}`, type: "special" as const, status: "quote_review" as const, source: "admin" as const, sackSummary: payload.description, amount: 0, proofPhotos: payload.photos, createdAt: new Date().toISOString(), ...payload };
  db.pickups.unshift(pickup);
  persist("operations_admin", "special_pickup.created", pickup.id);
  res.status(201).json(pickup);
});
app.patch("/api/v1/pickups/:id/status", (req, res) => {
  const pickup = db.pickups.find((item) => item.id === req.params.id);
  if (!pickup) return res.status(404).json({ error: "Pickup not found" });
  pickup.status = req.body.status;
  persist("operations_admin", "pickup.status.updated", `${pickup.id} -> ${pickup.status}`);
  res.json(pickup);
});
app.post("/api/v1/pickups/:id/assign", requireRole("operations_admin", "super_admin"), (req, res) => {
  const pickup = db.pickups.find((item) => item.id === req.params.id);
  const collector = db.collectors.find((item) => item.id === req.body.collectorId && item.status === "approved");
  if (!pickup || !collector) return res.status(404).json({ error: "Pickup or approved collector not found" });
  pickup.collectorId = collector.id;
  pickup.status = "assigned";
  collector.availability = "assigned";
  collector.activeJobs += 1;
  persist(req.header("x-role") ?? "operations_admin", "pickup.assigned", `${pickup.id} -> ${collector.name}`);
  res.json({ pickup, collector });
});
app.post("/api/v1/pickups/:id/quote", requireRole("operations_admin", "super_admin"), (req, res) => {
  const pickup = db.pickups.find((item) => item.id === req.params.id);
  if (!pickup) return res.status(404).json({ error: "Pickup not found" });
  pickup.amount = Number(req.body.amount);
  pickup.status = "pending_assignment";
  persist("operations_admin", "special_pickup.quoted", `${pickup.id} = ${pickup.amount}`);
  res.json(pickup);
});
app.post("/api/v1/pickups/:id/proofs", (req, res) => {
  const pickup = db.pickups.find((item) => item.id === req.params.id);
  if (!pickup) return res.status(404).json({ error: "Pickup not found" });
  pickup.proofPhotos.push(...z.object({ photos: z.array(z.string()) }).parse(req.body).photos);
  if (pickup.proofPhotos.length >= db.settings.proofPhotosRequired) pickup.status = "completed";
  persist("collector", "pickup.proof_uploaded", pickup.id);
  res.json(pickup);
});

app.get("/api/v1/collectors", (req, res) => res.json(db.collectors.filter((collector) => !req.query.countryId || collector.countryId === req.query.countryId)));
app.patch("/api/v1/collectors/:id/approval", requireRole("operations_admin", "super_admin"), (req, res) => {
  const collector = db.collectors.find((item) => item.id === req.params.id);
  if (!collector) return res.status(404).json({ error: "Collector not found" });
  collector.status = req.body.status;
  persist(req.header("x-role") ?? "operations_admin", "collector.approval.updated", `${collector.name} -> ${collector.status}`);
  res.json(collector);
});
app.patch("/api/v1/collectors/:id/availability", (req, res) => {
  const collector = db.collectors.find((item) => item.id === req.params.id);
  if (!collector) return res.status(404).json({ error: "Collector not found" });
  collector.availability = req.body.availability;
  res.json(collector);
});

app.get("/api/v1/customers", (req, res) => res.json(db.customers.filter((customer) => !req.query.countryId || customer.countryId === req.query.countryId)));
app.get("/api/v1/sack-types", (req, res) => res.json(db.sacks.filter((sack) => !req.query.countryId || sack.countryId === req.query.countryId)));
app.patch("/api/v1/sack-types/:id", requireRole("operations_admin", "super_admin"), (req, res) => {
  const sack = db.sacks.find((item) => item.id === req.params.id);
  if (!sack) return res.status(404).json({ error: "Sack type not found" });
  Object.assign(sack, req.body);
  persist("operations_admin", "sack.updated", sack.id);
  res.json(sack);
});
app.get("/api/v1/payments", (req, res) => res.json(db.payments.filter((payment) => !req.query.countryId || payment.countryId === req.query.countryId)));
app.get("/api/v1/reports/operations/daily", (req, res) => {
  const countryId = String(req.query.countryId ?? db.settings.defaultCountryId);
  res.json({ countryId, completed: db.pickups.filter((pickup) => pickup.countryId === countryId && pickup.status === "completed").length, pending: db.pickups.filter((pickup) => pickup.countryId === countryId && pickup.status === "pending_assignment").length, revenue: db.payments.filter((payment) => payment.countryId === countryId && payment.status === "successful").reduce((sum, payment) => sum + payment.amount, 0) });
});
app.get("/api/v1/platform/settings", requireRole("super_admin"), (_req, res) => res.json(db.settings));
app.patch("/api/v1/platform/settings", requireRole("super_admin"), (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  persist("super_admin", "platform.settings.updated", "global settings changed");
  res.json(db.settings);
});
app.get("/api/v1/audit-logs", requireRole("super_admin"), (_req, res) => res.json(db.auditLogs));

app.get("/api/v1/service-categories", (_req, res) => res.json(db.serviceCategories));
app.get("/api/v1/service-providers", (req, res) => res.json(db.serviceProviders.filter((provider) => (!req.query.countryId || provider.countryId === req.query.countryId) && (!req.query.serviceType || provider.serviceCategory === req.query.serviceType))));
app.get("/api/v1/service-bookings", (req, res) => res.json(db.serviceBookings.filter((booking) => (!req.query.countryId || booking.countryId === req.query.countryId) && (!req.query.serviceType || booking.serviceType === req.query.serviceType))));
app.post("/api/v1/service-bookings", (req, res) => {
  const payload = z.object({ countryId: z.string(), customerId: z.string(), serviceType: z.enum(["waste_collection", "home_cleaning", "pest_control"]), scheduledAt: z.string(), address: z.string(), details: z.record(z.union([z.string(), z.number(), z.array(z.string())])), images: z.array(z.string()).default([]) }).parse(req.body);
  const prefix = payload.serviceType === "home_cleaning" ? "CL" : payload.serviceType === "pest_control" ? "PC" : "SV";
  const booking = { id: `${prefix}-${2000 + db.serviceBookings.length + 1}`, status: "new" as const, createdAt: new Date().toISOString(), ...payload };
  db.serviceBookings.unshift(booking);
  persist("operations_admin", "service_booking.created", `${booking.id} ${booking.serviceType}`);
  res.status(201).json(booking);
});
app.post("/api/v1/service-bookings/:id/assign", requireRole("operations_admin", "super_admin"), (req, res) => {
  const booking = db.serviceBookings.find((item) => item.id === req.params.id);
  const provider = db.serviceProviders.find((item) => item.id === req.body.providerId && (!booking || item.serviceCategory === booking.serviceType));
  if (!booking || !provider) return res.status(404).json({ error: "Booking or matching provider not found" });
  booking.providerId = provider.id;
  booking.status = "assigned";
  provider.availability = "assigned";
  provider.assignedJobs += 1;
  persist(req.header("x-role") ?? "operations_admin", "service_booking.assigned", `${booking.id} -> ${provider.name}`);
  res.json({ booking, provider });
});
app.patch("/api/v1/service-bookings/:id/status", (req, res) => {
  const booking = db.serviceBookings.find((item) => item.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  booking.status = req.body.status;
  persist("operations_admin", "service_booking.status.updated", `${booking.id} -> ${booking.status}`);
  res.json(booking);
});
app.get("/api/v1/sms/events", (req, res) => res.json(db.smsEvents.filter((event) => !req.query.status || event.status === req.query.status)));
app.get("/api/v1/sms/templates", (_req, res) => res.json(db.smsTemplates));
app.post("/api/v1/sms/inbound", (req, res) => {
  const payload = z.object({ from: z.string(), text: z.string(), countryId: z.string().default(db.settings.defaultCountryId) }).parse(req.body);
  const valid = /^PICKUP\s+\d+\s+SACKS?$/i.test(payload.text.trim());
  const id = `SMS-${db.smsEvents.length + 1}`;
  if (!valid) {
    const event = { id, requestId: `INVALID-${id}`, customerPhone: payload.from, inboundText: payload.text, status: "invalid" as const, gatewayProvider: db.settings.smsProvider, deliveryStatus: "sent" as const, lastMessage: "Please send PICKUP followed by quantity, for example PICKUP 3 SACKS.", createdAt: new Date().toISOString() };
    db.smsEvents.unshift(event); persist("sms_gateway", "sms.invalid", payload.from); return res.status(202).json(event);
  }
  const customer = db.customers.find((item) => item.phone === payload.from) ?? db.customers[0];
  const quantity = Number(payload.text.match(/\d+/)?.[0] ?? 1);
  const pickup = { id: `PU-${1000 + db.pickups.length + 1}`, countryId: payload.countryId, customerId: customer.id, source: "sms" as const, type: "sack" as const, status: "pending_assignment" as const, pickupWindow: "morning" as const, address: customer.address, sackSummary: `${quantity} Sacks`, amount: quantity * 30, proofPhotos: [], createdAt: new Date().toISOString() };
  db.pickups.unshift(pickup);
  const event = { id, requestId: pickup.id, customerPhone: payload.from, inboundText: payload.text, status: "request_created" as const, referenceNumber: pickup.id, gatewayProvider: db.settings.smsProvider, deliveryStatus: "sent" as const, lastMessage: `Pickup request ${pickup.id} confirmed for ${quantity} sacks.`, createdAt: new Date().toISOString() };
  db.smsEvents.unshift(event); persist("sms_gateway", "sms.pickup.created", pickup.id); res.status(201).json({ event, pickup });
});


app.listen(port, () => console.log(`Waste API listening on http://localhost:${port}/api/v1`));
