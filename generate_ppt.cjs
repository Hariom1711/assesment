const pptxgen = require("pptxgenjs");
const pptx = new pptxgen();

// Set 16:9 widescreen layout
pptx.layout = "LAYOUT_16x9";

const COLORS = {
  bg: "FCF8FF", // Light mesh-blue surface tint
  primary: "4F46E5", // Vibrant Indigo brand accent
  textDark: "1B1B24", // Charcoal heading color
  textMuted: "464555", // Slate gray description color
  accent: "0EA5E9", // Electric Blue accent
  success: "22C55E", // Emerald Green success color
  warning: "FFB800", // Amber Orange warning color
  danger: "BA1A1A", // Crimson red alert color
  cardBg: "FFFFFF"
};

// Helper function to build slide headers
function addHeader(slide, title, category) {
  // Background color
  slide.background = { color: COLORS.bg };
  
  // Category tracker (small uppercase tag)
  slide.addText(category.toUpperCase(), {
    x: 0.6,
    y: 0.3,
    w: 8.0,
    h: 0.3,
    fontSize: 10,
    fontFace: "Arial",
    bold: true,
    color: COLORS.primary
  });

  // Slide main title
  slide.addText(title, {
    x: 0.6,
    y: 0.5,
    w: 8.0,
    h: 0.6,
    fontSize: 22,
    fontFace: "Arial",
    bold: true,
    color: COLORS.textDark
  });
  
  // Thin decorative header line separator
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6,
    y: 1.15,
    w: 12.1,
    h: 0.02,
    fill: { color: COLORS.primary }
  });
}

// Helper to add visual mockups on the right side of a slide
function addWireframeCard(slide, title, x = 6.6, y = 1.4, w = 5.8, h = 3.6) {
  // Main card container
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x,
    y: y,
    w: w,
    h: h,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.primary, width: 1.5 },
    rectRadius: 0.15
  });
  
  // Card header/title
  slide.addText(title.toUpperCase(), {
    x: x + 0.2,
    y: y + 0.15,
    w: w - 0.4,
    h: 0.3,
    fontSize: 11,
    fontFace: "Arial",
    bold: true,
    color: COLORS.primary,
    align: "left"
  });
}

// ==========================================
// SLIDE 1: Title Slide (Cover Page)
// ==========================================
const s1 = pptx.addSlide();
s1.background = { color: COLORS.bg };

// Giant Indigo Card Decoration
s1.addShape(pptx.ShapeType.roundRect, {
  x: 0.6,
  y: 0.8,
  w: 12.1,
  h: 4.0,
  fill: { color: COLORS.primary },
  rectRadius: 0.08
});

// Title Text
s1.addText("WasteOps Admin Panel", {
  x: 1.2,
  y: 1.5,
  w: 10.0,
  h: 1.0,
  fontSize: 44,
  fontFace: "Arial",
  bold: true,
  color: "FFFFFF"
});

// Subtitle Text
s1.addText("Complete Operator & Administrator User Guide", {
  x: 1.2,
  y: 2.4,
  w: 10.0,
  h: 0.6,
  fontSize: 20,
  fontFace: "Arial",
  color: "E2DFFF"
});

// Description
s1.addText("Multi-Country Operations, Real-Time Dispatching, Channels Simulator & Verification Systems", {
  x: 1.2,
  y: 3.2,
  w: 10.0,
  h: 0.8,
  fontSize: 13,
  fontFace: "Arial",
  color: "FFFFFF",
  italic: true
});

// Metadata Footer
s1.addText("WasteOps Governance Systems | Version 1.1", {
  x: 0.6,
  y: 5.0,
  w: 12.1,
  h: 0.4,
  fontSize: 11,
  fontFace: "Arial",
  color: COLORS.textMuted,
  align: "center"
});


// ==========================================
// SLIDE 2: Navigation & Global Controls
// ==========================================
const s2 = pptx.addSlide();
addHeader(s2, "Global Header & Navigation Shell", "Core Interface Layout");

// Left Column: Detailed Bullet Points
s2.addText(
  "Every screen shares the same header bar and sidebar controls:\n\n" +
  "• Country Scope (Top Right flag dropdown):\n" +
  "   Sets all visual stats to either Ghana (GHS), Nigeria (NGN), or Côte d'Ivoire (XOF).\n\n" +
  "• Theme Switcher:\n" +
  "   Toggles layouts between Obsidian dark mode and Luminous light mode.\n\n" +
  "• Sidebar Links:\n" +
  "   Accesses operational tasks, core service modules, verification channels, resources, and platforms.",
  { x: 0.6, y: 1.4, w: 5.6, h: 3.6, fontSize: 13, fontFace: "Arial", color: COLORS.textMuted, align: "left" }
);

// Right Column: Layout Mockup Wireframe
addWireframeCard(s2, "Visual Shell Layout Wireframe");
s2.addShape(pptx.ShapeType.rect, { x: 6.8, y: 2.0, w: 1.4, h: 2.8, fill: { color: "F3EFFC" }, line: { color: COLORS.primary } });
s2.addText("SIDEBAR\n- Dashboard\n- All Requests\n- Dispatch\n- Core Services\n- SMS Gate\n- Settings", {
  x: 6.9, y: 2.1, w: 1.2, h: 2.6, fontSize: 9, fontFace: "Arial", color: COLORS.textDark
});

s2.addShape(pptx.ShapeType.rect, { x: 8.35, y: 2.0, w: 3.8, h: 0.4, fill: { color: "EFF6FF" }, line: { color: COLORS.primary } });
s2.addText("TOPBAR   [ 🇬🇭 Scope Dropdown ]  [ ☀️/🌙 Toggle ]", {
  x: 8.4, y: 2.05, w: 3.7, h: 0.3, fontSize: 9, fontFace: "Arial", color: COLORS.primary, bold: true
});

s2.addShape(pptx.ShapeType.rect, { x: 8.35, y: 2.5, w: 3.8, h: 2.3, fill: { color: "FFFFFF" }, line: { color: "E2E8F0" } });
s2.addText("[ WORKSPACE CONTAINER ]\nDisplays the currently selected module interface. Resizes dynamically.", {
  x: 8.4, y: 3.0, w: 3.7, h: 1.3, fontSize: 10, fontFace: "Arial", color: COLORS.textMuted, align: "center"
});


// ==========================================
// SLIDE 3: Operations Dashboard
// ==========================================
const s3 = pptx.addSlide();
addHeader(s3, "Operations Dashboard (Homepage)", "Operations Panel");

s3.addText(
  "The operational dashboard monitors volumes, dispatcher queues, and telemetry:\n\n" +
  "• KPIs (Top Cards):\n" +
  "   Total Customers, Active Collectors, Today's Pickups, Today's Revenue, and Pending Queue.\n\n" +
  "• Live Collector Telemetry Map:\n" +
  "   SVG tracking maps showing active driver coordinates. Click coordinates to review profiles.\n\n" +
  "• Requests Queue Table:\n" +
  "   Overview of requests (ID, client names, address location, local currency, status badge).",
  { x: 0.6, y: 1.4, w: 5.6, h: 3.6, fontSize: 13, fontFace: "Arial", color: COLORS.textMuted, align: "left" }
);

// Right Column: Dashboard Image
s3.addImage({
  path: "./dashboard_screenshot.png",
  x: 6.6,
  y: 1.4,
  w: 5.8,
  h: 3.6
});


// ==========================================
// SLIDE 4: Requests & Manual Dispatch
// ==========================================
const s4 = pptx.addSlide();
addHeader(s4, "Manual Dispatch & All Requests", "Operations Panel");

s4.addText(
  "Work order routing handles manual driver routing:\n\n" +
  "• All Requests Grid:\n" +
  "   Lists all entries. Search by customer or address, and filter by status badges.\n\n" +
  "• Manual Dispatch Queue:\n" +
  "   Shows only bookings in 'Pending Assignment' state.\n\n" +
  "• Dispatch Process Flow:\n" +
  "   Click 'Assign Driver' -> Review available collectors modal (ratings, vehicle capacity) -> Click 'Confirm Dispatch'.",
  { x: 0.6, y: 1.4, w: 5.6, h: 3.6, fontSize: 13, fontFace: "Arial", color: COLORS.textMuted, align: "left" }
);

addWireframeCard(s4, "Driver Assignment Modal");
s4.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.9, w: 5.4, h: 2.9, fill: { color: "F9F8FD" }, line: { color: COLORS.primary } });
s4.addText("DISPATCH ORDER PU-1002 (3 Sacks)", { x: 6.9, y: 2.0, w: 5.2, h: 0.3, fontSize: 11, fontFace: "Arial", bold: true, color: COLORS.textDark });

s4.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 2.4, w: 5.2, h: 0.6, fill: { color: "FFFFFF" }, line: { color: "E2E8F0" }, rectRadius: 0.05 });
s4.addText("Yaw Boateng - Tricycle - 4.8 Rating - [ ASSIGN ]", { x: 7.0, y: 2.45, w: 5.0, h: 0.5, fontSize: 9, fontFace: "Arial", color: COLORS.success, bold: true });

s4.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 3.1, w: 5.2, h: 0.6, fill: { color: "FFFFFF" }, line: { color: "E2E8F0" }, rectRadius: 0.05 });
s4.addText("Chinedu Obi - Van - 4.6 Rating - [ ASSIGN ]", { x: 7.0, y: 3.15, w: 5.0, h: 0.5, fontSize: 9, fontFace: "Arial", color: COLORS.success, bold: true });

s4.addText("Only online, approved drivers are listed in the dispatch modal.", { x: 6.8, y: 3.9, w: 5.4, h: 0.3, fontSize: 9, fontFace: "Arial", color: COLORS.textMuted, italic: true });


// ==========================================
// SLIDE 5: Live Dispatch Map & Telemetry
// ==========================================
const s5 = pptx.addSlide();
addHeader(s5, "Live Dispatch Telemetry Map", "Operations Panel");

s5.addText(
  "Tracking your field crew is essential for routing efficiency:\n\n" +
  "• Color Coded Pulsing Statuses:\n" +
  "   🟢 Green Pin: Collector is online and available for bookings.\n" +
  "   🟡 Yellow Pin: Collector has an active assigned job.\n" +
  "   🔴 Red Pin: Collector is offline/off-shift.\n\n" +
  "• Real-Time Drifting Simulation:\n" +
  "   Pins move dynamically on the SVG map using a mock coordinates generator to reflect actual movement.\n\n" +
  "• Zoom Controls & Overlays:\n" +
  "   Zoom controls at the bottom right. Fleet cards at the bottom indicate active sectors (Accra, Lagos, etc.).",
  { x: 0.6, y: 1.4, w: 5.6, h: 3.6, fontSize: 13, fontFace: "Arial", color: COLORS.textMuted, align: "left" }
);

addWireframeCard(s5, "Live Dispatch Map Interface");
s5.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.9, w: 5.4, h: 2.9, fill: { color: "1E293B" }, line: { color: COLORS.accent } }); // Dark blue layout
s5.addText("[ Accra Street Network SVG Grid ]", { x: 6.9, y: 2.6, w: 5.2, h: 0.5, fontSize: 12, fontFace: "Arial", color: "94A3B8", align: "center" });

// Pulsing Map Pins
s5.addShape(pptx.ShapeType.ellipse, { x: 7.5, y: 2.3, w: 0.2, h: 0.2, fill: { color: COLORS.success }, line: { color: "FFFFFF" } });
s5.addText(" col-1 (Online)", { x: 7.7, y: 2.25, w: 1.2, h: 0.3, fontSize: 8, fontFace: "Arial", color: "FFFFFF" });

s5.addShape(pptx.ShapeType.ellipse, { x: 9.8, y: 3.2, w: 0.2, h: 0.2, fill: { color: COLORS.warning }, line: { color: "FFFFFF" } });
s5.addText(" col-2 (On Job)", { x: 10.0, y: 3.15, w: 1.2, h: 0.3, fontSize: 8, fontFace: "Arial", color: "FFFFFF" });

// Zoom overlay controls
s5.addShape(pptx.ShapeType.roundRect, { x: 11.4, y: 3.8, w: 0.6, h: 0.8, fill: { color: "FFFFFF" }, line: { color: "CCCCCC" }, rectRadius: 0.1 });
s5.addText("[+]\n[-]", { x: 11.4, y: 3.85, w: 0.6, h: 0.7, fontSize: 10, fontFace: "Arial", color: COLORS.textDark, align: "center" });


// ==========================================
// SLIDE 6: Core Services - Waste Collection
// ==========================================
const s6 = pptx.addSlide();
addHeader(s6, "Waste Collection & Special Pickups", "Core Services");

s6.addText(
  "Waste collections are structured into two categories:\n\n" +
  "• Sack Pickups (Tab 1):\n" +
  "   Houses standard collections. Bookings are made using small, medium, or large pre-paid bags.\n\n" +
  "• Special Pickups (Tab 2):\n" +
  "   For oversized waste (furniture, tires). Shows custom photo attachments and description lists.\n\n" +
  "• Quoting Workflow (Special Pickups):\n" +
  "   Find a pending special request -> Click pencil edit icon -> Enter price -> Confirm. Order shifts to dispatcher queue.",
  { x: 0.6, y: 1.4, w: 5.6, h: 3.6, fontSize: 13, fontFace: "Arial", color: COLORS.textMuted, align: "left" }
);

addWireframeCard(s6, "Special Pickup Quoting");
s6.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.9, w: 5.4, h: 2.9, fill: { color: "FFFFFF" }, line: { color: "E2E8F0" } });
s6.addText("SPECIAL PICKUP SP-1003\nClient: Ama Mensah\nDescription: Large wooden wardrobe and cabinet", { x: 6.9, y: 2.0, w: 5.2, h: 0.7, fontSize: 10, fontFace: "Arial", color: COLORS.textDark });

s6.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 2.8, w: 2.0, h: 1.2, fill: { color: "F3EFFC" }, line: { color: COLORS.primary }, rectRadius: 0.05 });
s6.addText("[ Wardrobe Image Preview ]", { x: 6.9, y: 3.3, w: 2.0, h: 0.3, fontSize: 8, fontFace: "Arial", color: COLORS.primary, align: "center" });

s6.addText("Enter Quote Amount (GHS):", { x: 9.1, y: 2.8, w: 2.9, h: 0.3, fontSize: 10, fontFace: "Arial", bold: true, color: COLORS.textDark });
s6.addShape(pptx.ShapeType.rect, { x: 9.1, y: 3.1, w: 2.8, h: 0.4, fill: { color: "FFFFFF" }, line: { color: "CCCCCC" } });
s6.addText("GHS 120.00", { x: 9.2, y: 3.15, w: 2.6, h: 0.3, fontSize: 11, fontFace: "Arial", color: COLORS.textDark, bold: true });

s6.addShape(pptx.ShapeType.roundRect, { x: 9.1, y: 3.6, w: 2.8, h: 0.4, fill: { color: COLORS.primary }, rectRadius: 0.1 });
s6.addText("CONFIRM QUOTE", { x: 9.1, y: 3.65, w: 2.8, h: 0.3, fontSize: 9, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center" });


// ==========================================
// SLIDE 7: Cleaning & Pest Control
// ==========================================
const s7 = pptx.addSlide();
addHeader(s7, "Cleaning & Pest Control Services", "Core Services");

s7.addText(
  "Operations controls extend beyond waste collection:\n\n" +
  "• Home Cleaning Module:\n" +
  "   Exposes requests for cleaning. Bookings detail property types (Apartment, House, Office), rooms, and dates. Cleaners are dispatched via cards.\n\n" +
  "• Pest Extermination Module:\n" +
  "   Treatment requests for termites, rats, bedbugs, and mosquitoes. Admins can upload inspection files and assign specialists.\n\n" +
  "• Cleaner & Specialist dispatch maps:\n" +
  "   Both decks allow manual provider assignment by matching active status fields.",
  { x: 0.6, y: 1.4, w: 5.6, h: 3.6, fontSize: 13, fontFace: "Arial", color: COLORS.textMuted, align: "left" }
);

addWireframeCard(s7, "Services Dispatch Center");
s7.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.9, w: 5.4, h: 2.9, fill: { color: "FFFFFF" }, line: { color: "E2E8F0" } });

s7.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 2.1, w: 5.2, h: 1.1, fill: { color: "EFF6FF" }, line: { color: COLORS.accent }, rectRadius: 0.08 });
s7.addText("CLEANING JOB CL-2001 (Apartment - 3 Rooms)\nClient: Ama Mensah | Deep clean kitchen and bedrooms.\nStatus: Assigned | Provider: Efua Cleaning Co.", { x: 7.0, y: 2.15, w: 5.0, h: 0.9, fontSize: 9, fontFace: "Arial", color: COLORS.textDark });

s7.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 3.4, w: 5.2, h: 1.1, fill: { color: "FDF2F8" }, line: { color: "EC4899" }, rectRadius: 0.08 });
s7.addText("PEST JOB PC-3001 (Termite Extermination)\nClient: Kojo Appiah | Office warehouse inspection.\nStatus: New | [ ASSIGN EXTERMINATOR BUTTON ]", { x: 7.0, y: 3.45, w: 5.0, h: 0.9, fontSize: 9, fontFace: "Arial", color: COLORS.textDark });


// ==========================================
// SLIDE 8: Channels - SMS Gateway Center
// ==========================================
const s8 = pptx.addSlide();
addHeader(s8, "SMS Gateway Center & Simulator", "Channels & Verifications");

s8.addText(
  "Test and manage bookings created by text messaging:\n\n" +
  "• SMS Feature Phone Simulator:\n" +
  "   Type bookings (e.g., 'PICKUP 3 SACKS') and click send to test real-time parsing.\n\n" +
  "• Inbound Webhook Event Log:\n" +
  "   Trace incoming SMS strings, customer phone matching, automated database registrations, and system responses.\n\n" +
  "• Template Editor:\n" +
  "   Configure automated templates (e.g. invalid formatting alerts, confirmation replies, and completion notices).",
  { x: 0.6, y: 1.4, w: 5.6, h: 3.6, fontSize: 13, fontFace: "Arial", color: COLORS.textMuted, align: "left" }
);

addWireframeCard(s8, "SMS Gateway Phone Simulator");
// Mobile frame
s8.addShape(pptx.ShapeType.roundRect, { x: 8.0, y: 1.9, w: 3.0, h: 2.9, fill: { color: "0F172A" }, line: { color: "334155", width: 4 }, rectRadius: 0.15 });

// Message bubble
s8.addShape(pptx.ShapeType.roundRect, { x: 8.2, y: 2.3, w: 1.8, h: 0.5, fill: { color: COLORS.primary }, rectRadius: 0.05 });
s8.addText("PICKUP 3 SACKS", { x: 8.25, y: 2.35, w: 1.7, h: 0.4, fontSize: 8, fontFace: "Arial", color: "FFFFFF" });

s8.addShape(pptx.ShapeType.roundRect, { x: 9.0, y: 2.9, w: 1.8, h: 0.5, fill: { color: "334155" }, rectRadius: 0.05 });
s8.addText("Confirmation reply: PU-1002 registered.", { x: 9.05, y: 2.95, w: 1.7, h: 0.4, fontSize: 8, fontFace: "Arial", color: "E2E8F0" });

// Message Input
s8.addShape(pptx.ShapeType.rect, { x: 8.1, y: 4.3, w: 2.2, h: 0.3, fill: { color: "FFFFFF" }, line: { color: "CCCCCC" } });
s8.addText("Type here...", { x: 8.15, y: 4.35, w: 2.1, h: 0.2, fontSize: 8, fontFace: "Arial", color: "999999" });

s8.addShape(pptx.ShapeType.roundRect, { x: 10.4, y: 4.3, w: 0.5, h: 0.3, fill: { color: COLORS.primary }, rectRadius: 0.05 });
s8.addText("SEND", { x: 10.4, y: 4.35, w: 0.5, h: 0.2, fontSize: 8, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center" });


// ==========================================
// SLIDE 9: Verifications - Proof Photos Gallery
// ==========================================
const s9 = pptx.addSlide();
addHeader(s9, "Driver Proof Verification Gallery", "Channels & Verifications");

s9.addText(
  "Maintain quality control by reviewing photos uploaded by drivers on job completion:\n\n" +
  "• Proof Photos Feed:\n" +
  "   Completed orders display photo attachments (bags collected at the curb).\n\n" +
  "• Audit Verification Actions:\n" +
  "   Admins click green 'Approve Proof' (marks job as verified, releases driver payout) or red 'Flag Disputed' (marks job as disputed for supervisor review).\n\n" +
  "• Verification Compliance:\n" +
  "   Enforces driver photo requirements before closure.",
  { x: 0.6, y: 1.4, w: 5.6, h: 3.6, fontSize: 13, fontFace: "Arial", color: COLORS.textMuted, align: "left" }
);

addWireframeCard(s9, "Verification Portal Screen");
s9.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.9, w: 5.4, h: 2.9, fill: { color: "FFFFFF" }, line: { color: "E2E8F0" } });

s9.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 2.1, w: 5.0, h: 1.3, fill: { color: "FCF8FF" }, line: { color: "E2E8F0" }, rectRadius: 0.08 });
s9.addText("[ Complete Curb Sacks Photo Upload ]", { x: 7.1, y: 2.6, w: 4.8, h: 0.3, fontSize: 10, fontFace: "Arial", color: COLORS.primary, align: "center" });

s9.addText("ORDER PU-1001   |   Driver: Yaw Boateng   |   3 Sacks", { x: 7.0, y: 3.5, w: 5.0, h: 0.3, fontSize: 9, fontFace: "Arial", bold: true, color: COLORS.textDark });

s9.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 3.9, w: 2.4, h: 0.4, fill: { color: COLORS.success }, rectRadius: 0.1 });
s9.addText("APPROVE PROOF", { x: 7.0, y: 3.95, w: 2.4, h: 0.3, fontSize: 8, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center" });

s9.addShape(pptx.ShapeType.roundRect, { x: 9.6, y: 3.9, w: 2.4, h: 0.4, fill: { color: COLORS.danger }, rectRadius: 0.1 });
s9.addText("FLAG DISPUTED", { x: 9.6, y: 3.95, w: 2.4, h: 0.3, fontSize: 8, fontFace: "Arial", color: "FFFFFF", bold: true, align: "center" });


// ==========================================
// SLIDE 10: Resource Directories
// ==========================================
const s10 = pptx.addSlide();
addHeader(s10, "Service Providers, Customers & Inventory", "Resource Management");

s10.addText(
  "Operations require managing fleet providers, customers, and inventory levels:\n\n" +
  "• Service Providers Listing:\n" +
  "   Shows collectors names, vehicle type, onboarding status (Approved, Pending, Suspended), star rating, and availability controls.\n\n" +
  "• Customer Directory:\n" +
  "   Tracks client addresses, wallet balances, total spend logs, and active status switches.\n\n" +
  "• Sack Inventory Tracker:\n" +
  "   Check Small, Medium, Large stock levels (warning bars show on low stock). Restock warehouse inventories via form.",
  { x: 0.6, y: 1.4, w: 5.6, h: 3.6, fontSize: 13, fontFace: "Arial", color: COLORS.textMuted, align: "left" }
);

addWireframeCard(s10, "Sack Stock & Inventory");
s10.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.9, w: 5.4, h: 2.9, fill: { color: "FFFFFF" }, line: { color: "E2E8F0" } });

// Stock Meters
s10.addText("Small Sacks: 840 Sold / 2000 Stock", { x: 7.0, y: 2.1, w: 5.0, h: 0.3, fontSize: 9, fontFace: "Arial", color: COLORS.textDark });
s10.addShape(pptx.ShapeType.rect, { x: 7.0, y: 2.35, w: 5.0, h: 0.15, fill: { color: "E2E8F0" } });
s10.addShape(pptx.ShapeType.rect, { x: 7.0, y: 2.35, w: 2.1, h: 0.15, fill: { color: COLORS.primary } });

s10.addText("Medium Sacks: 910 Sold / 1800 Stock", { x: 7.0, y: 2.6, w: 5.0, h: 0.3, fontSize: 9, fontFace: "Arial", color: COLORS.textDark });
s10.addShape(pptx.ShapeType.rect, { x: 7.0, y: 2.85, w: 5.0, h: 0.15, fill: { color: "E2E8F0" } });
s10.addShape(pptx.ShapeType.rect, { x: 7.0, y: 2.85, w: 2.5, h: 0.15, fill: { color: COLORS.primary } });

s10.addText("Large Sacks: 760 Sold / 1200 Stock", { x: 7.0, y: 3.1, w: 5.0, h: 0.3, fontSize: 9, fontFace: "Arial", color: COLORS.textDark });
s10.addShape(pptx.ShapeType.rect, { x: 7.0, y: 3.35, w: 5.0, h: 0.15, fill: { color: "E2E8F0" } });
s10.addShape(pptx.ShapeType.rect, { x: 7.0, y: 3.35, w: 3.1, h: 0.15, fill: { color: COLORS.primary } });

s10.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 3.8, w: 5.0, h: 0.8, fill: { color: "FEF2F2" }, line: { color: COLORS.danger }, rectRadius: 0.05 });
s10.addText("⚠️ INVENTORY ALERT: Large sacks stock level is under 10% in Ghana region. Please submit restock wholesale form.", {
  x: 7.05, y: 3.85, w: 4.9, h: 0.7, fontSize: 8, fontFace: "Arial", color: COLORS.danger, bold: true
});


// ==========================================
// SLIDE 11: Financial Ledger & Platform Settings
// ==========================================
const s11 = pptx.addSlide();
addHeader(s11, "Financial Ledger & Platform Settings", "Administration");

s11.addText(
  "Manage finance splits, security logging, and country parameters:\n\n" +
  "• Financial Ledger:\n" +
  "   Tracks payments via MoMo, Card, Bank, and Cash. Calculates commission splits dynamically.\n\n" +
  "• Platform Settings:\n" +
  "   Configure tax rates per country, enable payment providers, and adjust SMS provider credentials.\n\n" +
  "• System Audit Log:\n" +
  "   Tracks all admin modifications (role changes, settings updates) with timestamps and details, ensuring transparency.",
  { x: 0.6, y: 1.4, w: 5.6, h: 3.6, fontSize: 13, fontFace: "Arial", color: COLORS.textMuted, align: "left" }
);

addWireframeCard(s11, "Platform Settings & Audit Logs");
s11.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.9, w: 5.4, h: 2.9, fill: { color: "FFFFFF" }, line: { color: "E2E8F0" } });

s11.addShape(pptx.ShapeType.rect, { x: 6.9, y: 2.1, w: 5.2, h: 0.9, fill: { color: "F3EFFC" }, line: { color: COLORS.primary } });
s11.addText("GHANA REGION PARAMETERS\nTax Rate: 12.5%  |  Sms Gateway: Hubtel\nPayment Providers: [x] MTN MoMo [x] Card [x] Cash", { x: 7.0, y: 2.15, w: 5.0, h: 0.8, fontSize: 9, fontFace: "Arial", color: COLORS.textDark });

s11.addText("SYSTEM SECURITY AUDIT LOG", { x: 6.9, y: 3.1, w: 5.2, h: 0.2, fontSize: 8, fontFace: "Arial", bold: true, color: COLORS.textMuted });
s11.addShape(pptx.ShapeType.rect, { x: 6.9, y: 3.3, w: 5.2, h: 1.3, fill: { color: "FFFFFF" }, line: { color: "CCCCCC" } });
s11.addText(
  "Time           | Actor       | Action           | Details\n" +
  "14:20:05       | super_admin | settings.update  | Tax rate -> 12.5%\n" +
  "14:18:10       | admin_ops   | driver.assign    | PU-1002 -> col-1", 
  { x: 6.95, y: 3.35, w: 5.1, h: 1.2, fontSize: 8, fontFace: "Courier New", color: COLORS.textMuted }
);


// Write PPTX to File
pptx.writeFile({ fileName: "WasteOps_Admin_Panel_User_Guide.pptx" })
  .then(() => console.log("PowerPoint presentation generated successfully: WasteOps_Admin_Panel_User_Guide.pptx"))
  .catch((err) => console.error("Error writing presentation:", err));
