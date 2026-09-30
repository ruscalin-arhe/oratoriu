"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

function lei(n: number) {
  return (n ?? 0).toLocaleString("ro-RO", { maximumFractionDigits: 0 }) + " lei";
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export default function ReportsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [mode, setMode] = useState<"day" | "month" | "range">("range");
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [from, setFrom] = useState(format(new Date(), "yyyy-MM-01"));
  const [to, setTo] = useState(today);
  const [people, setPeople] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
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

  const qs = useMemo(() => {
    const p = new URLSearchParams({ from: range.from, to: range.to });
    if (userIds.length) p.set("userIds", userIds.join(","));
    if (projectIds.length) p.set("projectIds", projectIds.join(","));
    return p.toString();
  }, [range.from, range.to, userIds, projectIds]);

  async function loadReport() {
    const res = await fetch("/api/reports?" + qs);
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Eroare raport");
    setError("");
    setData(json);
  }

  useEffect(() => {
    fetch("/api/people").then((r) => r.json()).then((d) => setPeople(Array.isArray(d) ? d : []));
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(Array.isArray(d) ? d : []));
    fetch("/api/time-off").then((r) => r.json()).then((d) => setOffs(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    loadReport();
  }, [qs]);

  async function addOff() {
    const res = await fetch("/api/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: offFrom, to: offTo, hours: offHours, type: offType }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Eroare concediu");
    setError("");
    const list = await fetch("/api/time-off").then((r) => r.json());
    setOffs(Array.isArray(list) ? list : []);
  }

  const cmpUsers = data?.compare?.users ?? [];
  const cmpProjects = data?.compare?.projects ?? [];
  const hoursMap = data?.compare?.hours ?? {};

  return (
    <main>
      <h1>Rapoarte</h1>
      <p>Ore lucrate pe selecție. Costul și venitul sunt estimate din tarife, pentru eficiență mai târziu.</p>

      <div className="actions">
        <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
          <option value="day">Zi</option>
          <option value="month">Lună</option>
          <option value="range">Interval</option>
        </select>
        {mode === "day" && <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />}
        {mode === "month" && <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />}
        {mode === "range" && (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </>
        )}
        <a href={"/api/export/csv?" + qs}>
          <button type="button" className="ghost">CSV</button>
        </a>
      </div>

      <div className="actions" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <fieldset style={{ border: "1px solid #d7d0c4", padding: 8, minWidth: 220 }}>
          <legend>Angajați (2+)</legend>
          <button type="button" className="ghost" onClick={() => setUserIds([])}>Toți</button>
          {people.map((u) => (
            <label key={u.id} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={userIds.includes(u.id)}
                onChange={() => setUserIds(toggle(userIds, u.id))}
              />{" "}
              {u.name}
            </label>
          ))}
        </fieldset>
        <fieldset style={{ border: "1px solid #d7d0c4", padding: 8, minWidth: 260 }}>
          <legend>Proiecte (1+)</legend>
          <button type="button" className="ghost" onClick={() => setProjectIds([])}>Toate</button>
          {projects.map((p) => (
            <label key={p.id} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={projectIds.includes(p.id)}
                onChange={() => setProjectIds(toggle(projectIds, p.id))}
              />{" "}
              {p.client?.name} / {p.name}
            </label>
          ))}
        </fieldset>
      </div>

      {error && <p style={{ color: "#8a2e1a" }}>{error}</p>}

      {data && (
        <>
          <p>
            {data.from} → {data.to} · <b>{data.totals.hours} h lucrate</b>
            {data.totals.billableHours != null && <> · {data.totals.billableHours} h facturabile</>}
            {" "}· cost {lei(data.totals.cost)} · venit {lei(data.totals.revenue)}
          </p>

          <h2>Compară ore: angajat × proiect</h2>
          {cmpUsers.length < 2 && <p>Bifează cel puțin două nume ca să compari.</p>}
          <table className="sheet">
            <thead>
              <tr>
                <th>Proiect</th>
                {cmpUsers.map((u: any) => <th key={u.id}>{u.name}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {cmpProjects.map((p: any) => (
                <tr key={p.id}>
                  <td>{p.label}</td>
                  {cmpUsers.map((u: any) => (
                    <td key={u.id}>{hoursMap[`${u.id}::${p.id}`] || ""}</td>
                  ))}
                  <td>{p.hours}</td>
                </tr>
              ))}
              <tr>
                <td>Total</td>
                {cmpUsers.map((u: any) => <td key={u.id}>{u.hours}</td>)}
                <td>{data.totals.hours}</td>
              </tr>
            </tbody>
          </table>

          <h2>Ore pe angajat</h2>
          <table className="sheet">
            <thead>
              <tr>
                <th>Angajat</th>
                <th>Ore</th>
                <th>Facturabile</th>
                <th>% din selecție</th>
                <th>Cost/h</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {(data.employees ?? []).map((r: any) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.hours}</td>
                  <td>{r.billableHours}</td>
                  <td>{data.totals.hours ? Math.round((r.hours / data.totals.hours) * 100) : 0}%</td>
                  <td>{r.costPerHour}</td>
                  <td>{lei(r.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Ore pe proiect</h2>
          <table className="sheet">
            <thead>
              <tr>
                <th>Proiect</th>
                <th>Ore</th>
                <th>Facturabile</th>
                <th>Cost</th>
                <th>Venit</th>
                <th>Marjă</th>
              </tr>
            </thead>
            <tbody>
              {(data.projects ?? []).map((r: any) => (
                <tr key={r.id}>
                  <td>{r.label}</td>
                  <td>{r.hours}</td>
                  <td>{r.billableHours}</td>
                  <td>{lei(r.cost)}</td>
                  <td>{lei(r.revenue)}</td>
                  <td>{lei(r.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Ore pe activitate</h2>
          <table className="sheet">
            <thead>
              <tr>
                <th>Activitate</th>
                <th>Ore</th>
                <th>Facturabile</th>
              </tr>
            </thead>
            <tbody>
              {(data.tasks ?? []).map((r: any) => (
                <tr key={r.id}>
                  <td>{r.label}</td>
                  <td>{r.hours}</td>
                  <td>{r.billableHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Concediu / zi liberă</h2>
      <div className="actions">
        <input type="date" value={offFrom} onChange={(e) => setOffFrom(e.target.value)} />
        <input type="date" value={offTo} onChange={(e) => setOffTo(e.target.value)} />
        <select value={offType} onChange={(e) => setOffType(e.target.value)}>
          <option value="concediu">Concediu</option>
          <option value="zi libera">Zi liberă</option>
        </select>
        <input type="number" min="0.5" max="8" step="0.5" value={offHours} onChange={(e) => setOffHours(e.target.value)} />
        <button type="button" onClick={addOff}>Treci</button>
      </div>
      <table className="sheet">
        <thead>
          <tr><th>Data</th><th>Tip</th><th>Ore</th><th></th></tr>
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
                  onClick={() => fetch("/api/time-off?id=" + r.id, { method: "DELETE" }).then(async () => {
                    const list = await fetch("/api/time-off").then((x) => x.json());
                    setOffs(Array.isArray(list) ? list : []);
                  })}
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
