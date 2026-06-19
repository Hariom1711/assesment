export function StatusBadge({ value }: { value: string }) {
  const tone = value.includes("approved") || value.includes("completed") || value.includes("successful") || value.includes("online") ? "green" : value.includes("pending") || value.includes("assigned") || value.includes("review") ? "yellow" : value.includes("failed") || value.includes("suspended") || value.includes("offline") ? "red" : "";
  return <span className={`badge ${tone}`}>{value.replaceAll("_", " ")}</span>;
}

export function Card({ children }: { children: React.ReactNode }) { return <section className="card">{children}</section>; }

export function DataTable<T extends Record<string, unknown>>({ columns, rows }: { columns: Array<[keyof T, string, (row: T) => React.ReactNode]>; rows: T[] }) {
  return <table><thead><tr>{columns.map(([key, label]) => <th key={String(key)}>{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}>{columns.map(([key, _label, render]) => <td key={String(key)}>{render(row)}</td>)}</tr>)}</tbody></table>;
}
