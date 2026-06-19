import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Collector, Country, Customer, Payment, Pickup, PlatformSettings, SackType, ServiceBooking, ServiceCategory, ServiceProvider, SmsTemplate, SmsWorkflowEvent } from "@waste/shared";

export interface WasteDatabase {
  countries: Country[];
  sacks: SackType[];
  collectors: Collector[];
  customers: Customer[];
  pickups: Pickup[];
  payments: Payment[];
  serviceCategories: ServiceCategory[];
  serviceProviders: ServiceProvider[];
  serviceBookings: ServiceBooking[];
  smsEvents: SmsWorkflowEvent[];
  smsTemplates: SmsTemplate[];
  settings: PlatformSettings;
  auditLogs: Array<{ id: string; actor: string; action: string; at: string; details: string }>;
}

const dataPath = join(process.cwd(), "data", "waste-db.json");

export function createSeedDatabase(): WasteDatabase {
  const ghana: Country = { id: "country-gh", code: "GH", name: "Ghana", currency: "GHS", taxRate: 0.125, active: true, paymentProviders: ["MTN MoMo", "Vodafone Cash", "AirtelTigo Money", "Card", "Wallet", "Cash"] };
  const nigeria: Country = { id: "country-ng", code: "NG", name: "Nigeria", currency: "NGN", taxRate: 0.075, active: true, paymentProviders: ["Bank Transfer", "Card", "Wallet", "Cash"] };
  const civ: Country = { id: "country-ci", code: "CI", name: "Côte d'Ivoire", currency: "XOF", taxRate: 0.18, active: false, paymentProviders: ["Mobile Wallet", "Card", "Cash"] };
  const customers: Customer[] = [
    { id: "cust-1", countryId: ghana.id, name: "Ama Mensah", phone: "+233241000001", address: "East Legon, Accra", walletBalance: 85, totalSpend: 420, status: "active" },
    { id: "cust-2", countryId: ghana.id, name: "Kojo Appiah", phone: "+233241000002", address: "Osu, Accra", walletBalance: 20, totalSpend: 160, status: "active" },
    { id: "cust-3", countryId: nigeria.id, name: "Ada Okafor", phone: "+234801000001", address: "Lekki Phase 1, Lagos", walletBalance: 12500, totalSpend: 76000, status: "active" }
  ];
  const collectors: Collector[] = [
    { id: "col-1", countryId: ghana.id, name: "Yaw Boateng", phone: "+233551000001", vehicleType: "Tricycle", status: "approved", availability: "online", rating: 4.8, earnings: 1240, activeJobs: 1, completedJobs: 86, latitude: 5.6501, longitude: -0.1869 },
    { id: "col-2", countryId: ghana.id, name: "Akosua Darko", phone: "+233551000002", vehicleType: "Mini Truck", status: "pending_approval", availability: "offline", rating: 0, earnings: 0, activeJobs: 0, completedJobs: 0, latitude: 5.6037, longitude: -0.1870 },
    { id: "col-3", countryId: nigeria.id, name: "Chinedu Obi", phone: "+234901000001", vehicleType: "Van", status: "approved", availability: "online", rating: 4.6, earnings: 220000, activeJobs: 2, completedJobs: 104, latitude: 6.4698, longitude: 3.5852 }
  ];
  return {
    countries: [ghana, nigeria, civ],
    sacks: [
      { id: "sack-gh-small", countryId: ghana.id, name: "Small", price: 10, stockReceived: 2000, stockSold: 840 },
      { id: "sack-gh-medium", countryId: ghana.id, name: "Medium", price: 20, stockReceived: 1800, stockSold: 910 },
      { id: "sack-gh-large", countryId: ghana.id, name: "Large", price: 30, stockReceived: 1200, stockSold: 760 },
      { id: "sack-ng-small", countryId: nigeria.id, name: "Small", price: 1500, stockReceived: 3000, stockSold: 1200 },
      { id: "sack-ng-medium", countryId: nigeria.id, name: "Medium", price: 3000, stockReceived: 2400, stockSold: 980 },
      { id: "sack-ng-large", countryId: nigeria.id, name: "Large", price: 4500, stockReceived: 2000, stockSold: 870 }
    ],
    collectors,
    customers,
    pickups: [
      { id: "PU-1001", countryId: ghana.id, customerId: "cust-1", collectorId: "col-1", source: "mobile", type: "sack", status: "assigned", pickupWindow: "morning", address: "East Legon, Accra", sackSummary: "1 Small, 2 Large", amount: 70, proofPhotos: [], createdAt: new Date().toISOString() },
      { id: "PU-1002", countryId: ghana.id, customerId: "cust-2", source: "sms", type: "sack", status: "pending_assignment", pickupWindow: "afternoon", address: "Osu, Accra", sackSummary: "3 Large", amount: 90, proofPhotos: [], createdAt: new Date().toISOString() },
      { id: "PU-1003", countryId: ghana.id, customerId: "cust-1", source: "admin", type: "special", status: "quote_review", pickupWindow: "evening", address: "East Legon, Accra", sackSummary: "Furniture and appliance pickup", amount: 0, proofPhotos: ["/proofs/furniture-before.jpg"], createdAt: new Date().toISOString() }
    ],
    serviceCategories: [
      { id: "waste_collection", name: "Waste Collection", bookingFields: ["sackSummary", "pickupWindow", "photoProof"], active: true },
      { id: "home_cleaning", name: "Home Cleaning", bookingFields: ["propertyType", "rooms", "dateTime", "instructions", "address"], active: true },
      { id: "pest_control", name: "Pest Control", bookingFields: ["pestType", "propertySize", "dateTime", "images", "address"], active: true }
    ],
    serviceProviders: [
      { id: "prov-clean-1", countryId: ghana.id, name: "Efua Cleaning Co.", phone: "+233552000001", providerType: "home_cleaner", serviceCategory: "home_cleaning", availability: "online", assignedJobs: 2, completedJobs: 44, earnings: 3600, rating: 4.7 },
      { id: "prov-pest-1", countryId: ghana.id, name: "Safe Pest Ghana", phone: "+233552000002", providerType: "pest_control_technician", serviceCategory: "pest_control", availability: "assigned", assignedJobs: 1, completedJobs: 31, earnings: 5200, rating: 4.6 },
      { id: "prov-clean-ng-1", countryId: nigeria.id, name: "Lagos Sparkle Team", phone: "+234902000001", providerType: "home_cleaner", serviceCategory: "home_cleaning", availability: "online", assignedJobs: 0, completedJobs: 58, earnings: 410000, rating: 4.8 }
    ],
    serviceBookings: [
      { id: "CL-2001", countryId: ghana.id, customerId: "cust-1", serviceType: "home_cleaning", providerId: "prov-clean-1", status: "assigned", scheduledAt: new Date(Date.now()+86400000).toISOString(), address: "East Legon, Accra", details: { propertyType: "Apartment", rooms: 3, instructions: "Deep clean kitchen and bathrooms" }, images: [], createdAt: new Date().toISOString() },
      { id: "PC-3001", countryId: ghana.id, customerId: "cust-2", serviceType: "pest_control", providerId: "prov-pest-1", status: "on_the_way", scheduledAt: new Date(Date.now()+172800000).toISOString(), address: "Osu, Accra", details: { pestType: "Cockroaches", propertySize: "2 bedroom office" }, images: ["/uploads/pest-kitchen.jpg"], createdAt: new Date().toISOString() }
    ],
    smsEvents: [
      { id: "SMS-1", requestId: "PU-1002", customerPhone: "+233241000002", inboundText: "PICKUP 3 SACKS", status: "request_created", referenceNumber: "PU-1002", gatewayProvider: "Hubtel", deliveryStatus: "delivered", lastMessage: "Pickup request PU-1002 confirmed for 3 Large sacks.", createdAt: new Date().toISOString() },
      { id: "SMS-2", requestId: "OTP-9001", customerPhone: "+234801000001", inboundText: "OTP registration", status: "delivered", gatewayProvider: "Africa's Talking", deliveryStatus: "sent", lastMessage: "Your verification code is 482913.", createdAt: new Date().toISOString() }
    ],
    smsTemplates: [
      { id: "tpl-invalid", name: "Invalid pickup format", trigger: "invalid_format", body: "Please send PICKUP followed by quantity, for example PICKUP 3 SACKS.", countries: ["GH", "NG"] },
      { id: "tpl-confirm", name: "Pickup confirmation", trigger: "request_created", body: "Your pickup request {{reference}} has been received: {{details}}.", countries: ["GH", "NG"] },
      { id: "tpl-assigned", name: "Collector assigned", trigger: "assigned", body: "Your pickup {{reference}} has been assigned and is being scheduled.", countries: ["GH", "NG"] },
      { id: "tpl-complete", name: "Pickup completed", trigger: "completed", body: "Your pickup {{reference}} is complete. Thank you.", countries: ["GH", "NG"] }
    ],
    payments: [
      { id: "PAY-1", countryId: ghana.id, customerId: "cust-1", method: "momo", status: "successful", amount: 70, createdAt: new Date().toISOString() },
      { id: "PAY-2", countryId: ghana.id, customerId: "cust-2", method: "cash", status: "pending", amount: 90, createdAt: new Date().toISOString() }
    ],
    settings: { assignmentMode: "manual", collectorLocationIntervalSeconds: 45, defaultCountryId: ghana.id, smsProvider: "Hubtel", proofPhotosRequired: 2 },
    auditLogs: []
  };
}

export function loadDatabase(): WasteDatabase {
  if (!existsSync(dataPath)) return createSeedDatabase();
  return JSON.parse(readFileSync(dataPath, "utf8")) as WasteDatabase;
}

export function saveDatabase(db: WasteDatabase) {
  mkdirSync(dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, JSON.stringify(db, null, 2));
}

export function audit(db: WasteDatabase, actor: string, action: string, details: string) {
  db.auditLogs.unshift({ id: randomUUID(), actor, action, details, at: new Date().toISOString() });
  db.auditLogs = db.auditLogs.slice(0, 100);
}
