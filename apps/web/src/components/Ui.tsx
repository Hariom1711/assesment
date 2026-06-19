export function StatusBadge({ value }: { value: string }) {
  const tone = value.includes("approved") || value.includes("completed") || value.includes("successful") || value.includes("online") ? "green" : value.includes("pending") || value.includes("assigned") || value.includes("review") ? "yellow" : value.includes("failed") || value.includes("suspended") || value.includes("offline") ? "red" : "";
  return <span className={`badge ${tone}`}>{value.replaceAll("_", " ")}</span>;
}

export function Card({ children }: { children: React.ReactNode }) { return <section className="card">{children}</section>; }

export function DataTable<T extends Record<string, unknown>>({ columns, rows }: { columns: Array<[keyof T, string, (row: T) => React.ReactNode]>; rows: T[] }) {
  return <table><thead><tr>{columns.map(([key, label]) => <th key={String(key)}>{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}>{columns.map(([key, _label, render]) => <td key={String(key)}>{render(row)}</td>)}</tr>)}</tbody></table>;
}

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton-bar animate-pulse ${className}`} style={style} />;
}

export function SkeletonCard() {
  return (
    <section className="card animate-pulse" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Skeleton style={{ width: "60%", height: 14 }} />
      <Skeleton style={{ width: "45%", height: 28, marginTop: 4 }} />
      <Skeleton style={{ width: "75%", height: 10, marginTop: 4 }} />
    </section>
  );
}

export function SkeletonTable({ cols = 5, rows = 3 }: { cols?: number; rows?: number }) {
  return (
    <div className="animate-pulse" style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} style={{ padding: "16px 12px" }}><Skeleton style={{ height: 12, width: "60%" }} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} style={{ padding: "16px 12px" }}><Skeleton style={{ height: 14, width: c === 0 ? "50%" : c === 1 ? "80%" : "60%" }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
