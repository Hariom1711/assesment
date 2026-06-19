"use client";

import { useState } from "react";
import type { Collector, Pickup, PlatformSettings, SackType } from "@waste/shared";
import { apiBase } from "../lib/api";

async function mutate(path: string, body: unknown, role = "super_admin") {
  const response = await fetch(`${apiBase}${path}`, { method: path.includes("/assign") || path.includes("/quote") ? "POST" : "PATCH", headers: { "content-type": "application/json", "x-role": role }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export function AssignmentForm({ pickups, collectors }: { pickups: Pickup[]; collectors: Collector[] }) {
  const [message, setMessage] = useState("Ready to assign jobs.");
  return <form className="form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await mutate(`/pickups/${form.get("pickupId")}/assign`, { collectorId: form.get("collectorId") }, "operations_admin"); setMessage("Pickup assigned. Refresh to see updated board."); }}>
    <select name="pickupId" className="full">{pickups.map((pickup) => <option key={pickup.id} value={pickup.id}>{pickup.id} · {pickup.address}</option>)}</select>
    <select name="collectorId" className="full">{collectors.filter((collector) => collector.status === "approved").map((collector) => <option key={collector.id} value={collector.id}>{collector.name} · {collector.availability}</option>)}</select>
    <button className="btn full">Assign Collector</button><small className="full">{message}</small>
  </form>;
}

export function CollectorApprovalForm({ collectors }: { collectors: Collector[] }) {
  const [message, setMessage] = useState("Select an applicant to approve, reject, or suspend.");
  return <form className="controls" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await mutate(`/collectors/${form.get("collectorId")}/approval`, { status: form.get("status") }, "operations_admin"); setMessage("Collector status updated. Refresh for the latest list."); }}>
    <select name="collectorId">{collectors.map((collector) => <option key={collector.id} value={collector.id}>{collector.name}</option>)}</select>
    <select name="status"><option value="approved">Approve</option><option value="rejected">Reject</option><option value="suspended">Suspend</option></select>
    <button className="btn">Update Collector</button><span className="badge">{message}</span>
  </form>;
}

export function SackPricingForm({ sacks }: { sacks: SackType[] }) {
  const [message, setMessage] = useState("Update a country's official sack price or stock received.");
  return <form className="form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await mutate(`/sack-types/${form.get("sackId")}`, { price: Number(form.get("price")), stockReceived: Number(form.get("stockReceived")) }, "operations_admin"); setMessage("Sack inventory updated. Refresh to verify totals."); }}>
    <select name="sackId" className="full">{sacks.map((sack) => <option key={sack.id} value={sack.id}>{sack.name}</option>)}</select>
    <input name="price" type="number" placeholder="New price" required /><input name="stockReceived" type="number" placeholder="Stock received" required />
    <button className="btn full">Save Sack Update</button><small className="full">{message}</small>
  </form>;
}

export function PlatformSettingsForm({ settings }: { settings: PlatformSettings }) {
  const [message, setMessage] = useState("Global settings are restricted to super admins.");
  return <form className="form" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await mutate("/platform/settings", { assignmentMode: form.get("assignmentMode"), collectorLocationIntervalSeconds: Number(form.get("collectorLocationIntervalSeconds")), smsProvider: form.get("smsProvider"), proofPhotosRequired: Number(form.get("proofPhotosRequired")) }, "super_admin"); setMessage("Platform settings saved. Refresh to reload configuration."); }}>
    <label>Assignment Mode<select name="assignmentMode" defaultValue={settings.assignmentMode}><option value="manual">Manual</option><option value="automatic">Automatic</option></select></label>
    <label>Location Ping Seconds<input name="collectorLocationIntervalSeconds" defaultValue={settings.collectorLocationIntervalSeconds} /></label>
    <label>SMS Provider<input name="smsProvider" defaultValue={settings.smsProvider} /></label>
    <label>Required Proof Photos<input name="proofPhotosRequired" defaultValue={settings.proofPhotosRequired} /></label>
    <button className="btn full">Save Settings</button><small className="full">{message}</small>
  </form>;
}
