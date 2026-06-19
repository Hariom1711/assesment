import { Card, DataTable, StatusBadge } from "../../src/components/Ui";
import { Shell, Topbar } from "../../src/components/Shell";
import { getCollectors, getPickups } from "../../src/lib/api";

export default async function DispatchPage() {
  const [pickups, collectors] = await Promise.all([getPickups(), getCollectors()]);
  const unassigned = pickups.filter((pickup) => pickup.status === "pending_assignment" || pickup.status === "quote_review");
  return <Shell active="/dispatch"><Topbar title="Dispatch Center" subtitle="Drag-and-drop-ready assignment board for unassigned jobs, active jobs, and nearby collectors."><button className="btn">Run Auto Dispatch</button><button className="btn secondary">Refresh Locations</button></Topbar>
    <div className="grid three"><Card><h2>Unassigned jobs</h2>{unassigned.map((pickup) => <p key={pickup.id}><b>{pickup.id}</b><br />{pickup.address}<br /><StatusBadge value={pickup.status} /></p>)}</Card><Card><h2>Nearby collectors</h2>{collectors.map((collector) => <p key={collector.id}><b>{collector.name}</b> · {collector.vehicleType}<br /><StatusBadge value={collector.availability} /></p>)}</Card><Card><h2>Live map</h2><div className="map">{collectors.map((collector, index) => <span key={collector.id} className={`pin ${collector.availability}`} style={{ left: `${35 + index * 22}%`, top: `${30 + index * 20}%` }}>{collector.name}</span>)}</div></Card></div>
    <Card><h2>Active dispatch queue</h2><DataTable rows={pickups as unknown as Record<string, unknown>[]} columns={[["id", "Job", (row) => String(row.id)], ["address", "Address", (row) => String(row.address)], ["pickupWindow", "Window", (row) => String(row.pickupWindow)], ["status", "Status", (row) => <StatusBadge value={String(row.status)} />]]} /></Card>
  </Shell>;
}
