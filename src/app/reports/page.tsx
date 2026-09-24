"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

function lei(n: number) {
  return (n ?? 0).toLocaleString("ro-RO", { maximumFractionDigits: 0 }) + " lei";
}

export default function ReportsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [mode, setMode] = useState<"day" | "month" | "range">("month");
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [from, setFrom] = useState(format(new Date(), "yyyy-MM-01"));
  const [to, setTo] = useState(today);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [offs, setOffs] = useState<any[]>([]);
  const [offFrom, setOffFrom] = useState(today);
  const [offTo, setOffTo] = useState(today);
  const [offHours, setOffHours] = useState("8");
  const [offType, setOffType] = useState("concediu");

  const range = useMemo(() => {
    if (mode === "day") return { from: day, to: day };
    if (mode === "month") {
      const end = format(
        new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
        "yyyy-MM-dd",
      );
      return { from: `${month}-01`, to: end };
    }
    return { from, to };
  }, [mode, day, month, from, to]);

  async function loadReport() {
    const res = await fetch(`/api/reports?from=${range.from}&to=${range.to}`);
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Eroare raport");
    setError("");
    setData(json);
  }

  async function loadOff() {
    const res = await fetch("/api/time-off");
    const json = await res.json();
    if (res.ok) setOffs(Array.isArray(json) ? json : []);
  }

  useEffect(() => {
    loadReport();
  }, [range.from, range.to]);

  useEffect(() => {
    loadOff();
  }, []);

  async function addOff() {
    const res = await fetch("/api/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: offFrom,
        to: offTo,
        hours: offHours,
        type: offType,
      }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Eroare concediu");
    setError("");
    loadOff();
  }

  return (
    <main>
      <h1>Rapoarte</h1>
      <div className="actions">
        <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
          <option value="day">Zi</option>
          <option value="month">Lună</option>
          <option value="range">Interval</option>
        </select>
        {mode === "day" && (
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        )}
        {mode === "month" && (
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        )}
        {mode === "range" && (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </>
        )}
        <a href={`/api/export/csv?from=${range.from}&to=${range.to}`}>
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
                <th>Angajat</th>
                <th>Ore</th>
                <th>Venit</th>
                <th>Cost</th>
                <th>Profit</th>
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
                <th>Proiect</th>
                <th>Ore</th>
                <th>Venit</th>
                <th>Cost</th>
                <th>Profit</th>
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

      <h2>Concediu / zi liberă</h2>
      <p>Început și sfârșit. Weekend-ul și sărbătorile din interval se sar.</p>
      <div className="actions">
        <input type="date" value={offFrom} onChange={(e) => setOffFrom(e.target.value)} />
        <input type="date" value={offTo} onChange={(e) => setOffTo(e.target.value)} />
        <select value={offType} onChange={(e) => setOffType(e.target.value)}>
          <option value="concediu">Concediu</option>
          <option value="zi libera">Zi liberă</option>
        </select>
        <input
          type="number"
          min="0.5"
          max="8"
          step="0.5"
          value={offHours}
          onChange={(e) => setOffHours(e.target.value)}
        />
        <button type="button" onClick={addOff}>Treci</button>
      </div>
      <table className="sheet">
        <thead>
          <tr>
            <th>Data</th>
            <th>Tip</th>
            <th>Ore</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {offs.map((r) => (
            <tr key={r.id}>
              <td>{r.date}</td>
              <td>{r.type}</td>
              <td>{r.hours}</td>
              <td>
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    fetch("/api/time-off?id=" + r.id, { method: "DELETE" }).then(loadOff)
                  }
                >
                  Șterge
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
