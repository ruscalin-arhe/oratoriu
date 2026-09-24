"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

function lei(n: number) {
  return (n ?? 0).toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " lei";
}

export default function ReportsPage() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  async function load(m = month) {
    const res = await fetch(`/api/reports?month=${m}`);
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Eroare raport");
    setData(json);
  }
  useEffect(() => { load(month); }, [month]);

  return (
    <main>
      <h1>Profitabilitate lunară</h1>
      <div className="actions">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        <a href={`/api/export/csv?from=${data?.from ?? ""}&to=${data?.to ?? ""}`}>
          <button type="button" className="ghost">CSV</button>
        </a>
      </div>
      {error && <p style={{ color: "#8a2e1a" }}>{error}</p>}

      {data && (
        <>
          <p>
            {data.from} → {data.to} · {data.totals.hours} h · venit {lei(data.totals.revenue)} ·
            cost {lei(data.totals.cost)} · <b>profit {lei(data.totals.profit)}</b>
          </p>

          <h2>Pe angajat</h2>
          <table className="sheet">
            <thead>
              <tr>
                <th>Angajat</th><th>Ore</th><th>Venit</th><th>Cost</th><th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.hours}</td>
                  <td>{lei(r.revenue)}</td>
                  <td>{lei(r.cost)}</td>
                  <td>{lei(r.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Pe proiect</h2>
          <table className="sheet">
            <thead>
              <tr>
                <th>Proiect</th><th>Ore</th><th>Venit</th><th>Cost</th><th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.label}</td>
                  <td>{r.hours}</td>
                  <td>{lei(r.revenue)}</td>
                  <td>{lei(r.cost)}</td>
                  <td>{lei(r.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
