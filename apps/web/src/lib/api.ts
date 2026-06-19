import type { Collector, Country, Customer, Payment, Pickup, PlatformSettings, SackType, ServiceBooking, ServiceCategory, ServiceProvider, SmsTemplate, SmsWorkflowEvent } from "@waste/shared";

export interface DashboardData {
  kpis: { totalCustomers: number; totalCollectors: number; todaysPickups: number; revenueToday: number; pendingRequests: number; activeJobs: number };
  recentPickups: Pickup[];
  collectorMap: Collector[];
}

export const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    cache: "no-store",
    ...init,
    headers: { "content-type": "application/json", "x-role": "super_admin", ...(init?.headers ?? {}) }
  });
  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

const fallbackCountries: Country[] = [
  { id: "country-gh", code: "GH", name: "Ghana", currency: "GHS", taxRate: 0.125, active: true, paymentProviders: ["MTN MoMo", "Vodafone Cash", "AirtelTigo Money", "Card", "Wallet", "Cash"] },
  { id: "country-ng", code: "NG", name: "Nigeria", currency: "NGN", taxRate: 0.075, active: true, paymentProviders: ["Bank Transfer", "Card", "Wallet", "Cash"] },
  { id: "country-ci", code: "CI", name: "Côte d'Ivoire", currency: "XOF", taxRate: 0.18, active: false, paymentProviders: ["Mobile Wallet", "Card", "Cash"] }
];

const fallbackCollectors: Collector[] = [
  { id: "col-1", countryId: "country-gh", name: "Yaw Boateng", phone: "+233551000001", vehicleType: "Tricycle", status: "approved", availability: "online", rating: 4.8, earnings: 1240, activeJobs: 1, completedJobs: 86, latitude: 5.65, longitude: -0.18 },
  { id: "col-2", countryId: "country-gh", name: "Akosua Darko", phone: "+233551000002", vehicleType: "Mini Truck", status: "pending_approval", availability: "offline", rating: 0, earnings: 0, activeJobs: 0, completedJobs: 0, latitude: 5.6, longitude: -0.2 }
];

export const fallbackData = {
  countries: fallbackCountries,
  dashboard: {
    kpis: { totalCustomers: 2, totalCollectors: 2, todaysPickups: 3, revenueToday: 70, pendingRequests: 2, activeJobs: 1 },
    recentPickups: [
      { id: "PU-1001", countryId: "country-gh", customerId: "cust-1", collectorId: "col-1", source: "mobile", type: "sack", status: "assigned", pickupWindow: "morning", address: "East Legon, Accra", sackSummary: "1 Small, 2 Large", amount: 70, proofPhotos: [], createdAt: new Date().toISOString() },
      { id: "PU-1002", countryId: "country-gh", customerId: "cust-2", source: "sms", type: "sack", status: "pending_assignment", pickupWindow: "afternoon", address: "Osu, Accra", sackSummary: "3 Large", amount: 90, proofPhotos: [], createdAt: new Date().toISOString() },
      { id: "PU-1003", countryId: "country-gh", customerId: "cust-1", source: "admin", type: "special", status: "quote_review", pickupWindow: "evening", address: "East Legon, Accra", sackSummary: "Furniture and appliance pickup", amount: 0, proofPhotos: ["/proofs/furniture-before.jpg"], createdAt: new Date().toISOString() }
    ],
    collectorMap: fallbackCollectors
  } satisfies DashboardData,
  sacks: [
    { id: "sack-gh-small", countryId: "country-gh", name: "Small", price: 10, stockReceived: 2000, stockSold: 840 },
    { id: "sack-gh-medium", countryId: "country-gh", name: "Medium", price: 20, stockReceived: 1800, stockSold: 910 },
    { id: "sack-gh-large", countryId: "country-gh", name: "Large", price: 30, stockReceived: 1200, stockSold: 760 }
  ] satisfies SackType[],
  collectors: fallbackCollectors,
  customers: [
    { id: "cust-1", countryId: "country-gh", name: "Ama Mensah", phone: "+233241000001", address: "East Legon, Accra", walletBalance: 85, totalSpend: 420, status: "active" },
    { id: "cust-2", countryId: "country-gh", name: "Kojo Appiah", phone: "+233241000002", address: "Osu, Accra", walletBalance: 20, totalSpend: 160, status: "active" }
  ] satisfies Customer[],
  payments: [
    { id: "PAY-1", countryId: "country-gh", customerId: "cust-1", method: "momo", status: "successful", amount: 70, createdAt: new Date().toISOString() },
    { id: "PAY-2", countryId: "country-gh", customerId: "cust-2", method: "cash", status: "pending", amount: 90, createdAt: new Date().toISOString() }
  ] satisfies Payment[],
  serviceCategories: [
    { id: "waste_collection", name: "Waste Collection", bookingFields: ["sackSummary", "pickupWindow"], active: true },
    { id: "home_cleaning", name: "Home Cleaning", bookingFields: ["propertyType", "rooms", "dateTime", "instructions", "address"], active: true },
    { id: "pest_control", name: "Pest Control", bookingFields: ["pestType", "propertySize", "dateTime", "images", "address"], active: true }
  ] satisfies ServiceCategory[],
  serviceProviders: [
    { id: "prov-clean-1", countryId: "country-gh", name: "Efua Cleaning Co.", phone: "+233552000001", providerType: "home_cleaner", serviceCategory: "home_cleaning", availability: "online", assignedJobs: 2, completedJobs: 44, earnings: 3600, rating: 4.7 },
    { id: "prov-pest-1", countryId: "country-gh", name: "Safe Pest Ghana", phone: "+233552000002", providerType: "pest_control_technician", serviceCategory: "pest_control", availability: "assigned", assignedJobs: 1, completedJobs: 31, earnings: 5200, rating: 4.6 }
  ] satisfies ServiceProvider[],
  serviceBookings: [
    { id: "CL-2001", countryId: "country-gh", customerId: "cust-1", serviceType: "home_cleaning", providerId: "prov-clean-1", status: "assigned", scheduledAt: new Date().toISOString(), address: "East Legon, Accra", details: { propertyType: "Apartment", rooms: 3, instructions: "Deep clean kitchen" }, images: [], createdAt: new Date().toISOString() },
    { id: "PC-3001", countryId: "country-gh", customerId: "cust-2", serviceType: "pest_control", providerId: "prov-pest-1", status: "on_the_way", scheduledAt: new Date().toISOString(), address: "Osu, Accra", details: { pestType: "Cockroaches", propertySize: "2 bedroom office" }, images: ["/uploads/pest-kitchen.jpg"], createdAt: new Date().toISOString() }
  ] satisfies ServiceBooking[],
  smsEvents: [
    { id: "SMS-1", requestId: "PU-1002", customerPhone: "+233241000002", inboundText: "PICKUP 3 SACKS", status: "request_created", referenceNumber: "PU-1002", gatewayProvider: "Hubtel", deliveryStatus: "delivered", lastMessage: "Pickup request PU-1002 confirmed.", createdAt: new Date().toISOString() }
  ] satisfies SmsWorkflowEvent[],
  smsTemplates: [
    { id: "tpl-confirm", name: "Pickup confirmation", trigger: "request_created", body: "Your pickup request {{reference}} has been received.", countries: ["GH", "NG"] }
  ] satisfies SmsTemplate[],
  settings: { assignmentMode: "manual", collectorLocationIntervalSeconds: 45, defaultCountryId: "country-gh", smsProvider: "Hubtel", proofPhotosRequired: 2 } satisfies PlatformSettings
};

export async function getCountries() { try { return await api<Country[]>("/countries"); } catch { return fallbackData.countries; } }
export async function getDashboard(countryId = "country-gh") { try { return await api<DashboardData>(`/dashboard?countryId=${countryId}`); } catch { return fallbackData.dashboard; } }
export async function getPickups(countryId = "country-gh") { try { return await api<Pickup[]>(`/pickups?countryId=${countryId}`); } catch { return fallbackData.dashboard.recentPickups; } }
export async function getCollectors(countryId = "country-gh") { try { return await api<Collector[]>(`/collectors?countryId=${countryId}`); } catch { return fallbackData.collectors; } }
export async function getCustomers(countryId = "country-gh") { try { return await api<Customer[]>(`/customers?countryId=${countryId}`); } catch { return fallbackData.customers; } }
export async function getSacks(countryId = "country-gh") { try { return await api<SackType[]>(`/sack-types?countryId=${countryId}`); } catch { return fallbackData.sacks; } }
export async function getPayments(countryId = "country-gh") { try { return await api<Payment[]>(`/payments?countryId=${countryId}`); } catch { return fallbackData.payments; } }
export async function getSettings() { try { return await api<PlatformSettings>("/platform/settings"); } catch { return fallbackData.settings; } }

export async function getServiceCategories() { try { return await api<ServiceCategory[]>("/service-categories"); } catch { return fallbackData.serviceCategories; } }
export async function getServiceProviders(countryId = "country-gh", serviceType?: string) { try { return await api<ServiceProvider[]>(`/service-providers?countryId=${countryId}${serviceType ? `&serviceType=${serviceType}` : ""}`); } catch { return fallbackData.serviceProviders.filter((provider) => !serviceType || provider.serviceCategory === serviceType); } }
export async function getServiceBookings(countryId = "country-gh", serviceType?: string) { try { return await api<ServiceBooking[]>(`/service-bookings?countryId=${countryId}${serviceType ? `&serviceType=${serviceType}` : ""}`); } catch { return fallbackData.serviceBookings.filter((booking) => !serviceType || booking.serviceType === serviceType); } }
export async function getSmsEvents() { try { return await api<SmsWorkflowEvent[]>("/sms/events"); } catch { return fallbackData.smsEvents; } }
export async function getSmsTemplates() { try { return await api<SmsTemplate[]>("/sms/templates"); } catch { return fallbackData.smsTemplates; } }
