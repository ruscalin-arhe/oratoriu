"use client";

import { useEffect, useState } from "react";

type Line = {
  key: string;
  clientId: string;
  projectId: string;
  taskId: string;
  hours: string;
  notes: string;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function queryDate() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("date") || "";
}

function todayApi(path = "") {
  const date = queryDate();
  const q = date ? `?date=${date}` : "";
  return `/api/today${path}${q}`;
}

export default function TodayPage() {
  const [data, setData] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [lines, setLines] = useState<Line[]>([
    { key: uid(), clientId: "", projectId: "", taskId: "", hours: "1", notes: "" },
  ]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const locked = data?.status === "SUBMITTED";

  function projectsFor(clientId: string) {
    return projects.filter((p) => (p.clientId || p.client?.id) === clientId);
  }

  function tasksFor(projectId: string) {
    const p = projects.find((x) => x.id === projectId);
    return p?.tasks ?? [];
  }

  async function load() {
    setError("");
    try {
      const cached = sessionStorage.getItem("oratoriu-catalog");
      if (cached) {
        const cat = JSON.parse(cached);
        setClients(cat.clients ?? []);
        setProjects(cat.projects ?? []);
      }
    } catch {}

    const todayRes = await fetch(todayApi());
    const todayJson = await todayRes.json();
    if (!todayRes.ok) return setError(todayJson.error ?? "Eroare pontaj");

    setData(todayJson);
    setClients(todayJson.clients ?? []);
    setProjects(todayJson.projects ?? []);
    try {
      sessionStorage.setItem(
        "oratoriu-catalog",
        JSON.stringify({ clients: todayJson.clients ?? [], projects: todayJson.projects ?? [] }),
      );
    } catch {}

    if (todayJson.entries?.length) {
      setLines(todayJson.entries.map((e: any) => ({
        key: e.id,
        clientId: e.project.client.id,
        projectId: e.projectId,
        taskId: e.taskId || "",
        hours: String(e.minutes / 60),
        notes: e.notes ?? "",
      })));
    } else {
      setLines([{ key: uid(), clientId: "", projectId: "", taskId: "", hours: "1", notes: "" }]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  async function save(submit = false) {
    setError("");
    const incomplete = lines.some((l) => Number(l.hours) > 0 && (!l.projectId || !l.taskId));
    if (incomplete) {
      return setError("Fiecare rând cu ore trebuie client, proiect și activitate.");
    }
    const entries = lines
      .filter((l) => l.projectId && l.taskId && Number(l.hours) > 0)
      .map((l) => ({
        projectId: l.projectId,
        taskId: l.taskId,
        minutes: Math.round(Number(l.hours) * 60),
        notes: l.notes,
      }));
    if (submit && entries.length === 0) {
      return setError("Nu poți trimite ziua fără activitate pontată.");
    }
    setSaving(true);
    const res = await fetch(todayApi(), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    const json = await res.json();
    if (!res.ok) {
      setSaving(false);
      return setError(json.error);
    }
    if (submit) {
      const sent = await fetch(todayApi(), { method: "POST" });
      const sentJson = await sent.json();
      setSaving(false);
      if (!sent.ok) return setError(sentJson.error);
      setData(sentJson);
      return;
    }
    setSaving(false);
    setData(json);
  }

  async function unlock() {
    const res = await fetch(todayApi("/reopen"), { method: "POST" });
    const json = await res.json();
    if (!res.ok) return setError(json.error);
    await load();
  }

  const totalHours = lines.reduce((s, l) => s + (Number(l.hours) || 0), 0);
  

  return (
    <main>
      <h1>Pontaj</h1>
      <input
        type="date"
        value={data?.date ?? ""}
        onChange={(e) => {
          window.location.href = "/today?date=" + e.target.value;
        }}
      />
      <p>
        {data?.date} ·{" "}
        {data?.status === "SUBMITTED" ? "trimis" : data?.status === "DRAFT" ? "ciorna" : "netrimis"}
      </p>
      {error && <p style={{ color: "#8a2e1a" }}>{error}</p>}
      <table className="sheet">
        <thead>
          <tr>
            <th>Client</th>
            <th>Proiect</th>
            <th>Activitate</th>
            <th>Ore</th>
            <th>Nota</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.key}>
              <td>
                <select disabled={locked} value={l.clientId} onChange={(e) => update(l.key, { clientId: e.target.value, projectId: "", taskId: "" })}>
                  <option value="">Alege</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </td>
              <td>
                <select disabled={locked} value={l.projectId} onChange={(e) => update(l.key, { projectId: e.target.value, taskId: "" })}>
                  <option value="">Alege</option>
                  {projectsFor(l.clientId).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </td>
              <td>
                <select disabled={locked} value={l.taskId} onChange={(e) => update(l.key, { taskId: e.target.value })}>
                  <option value="">Alege</option>
                  {tasksFor(l.projectId).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </td>
              <td>
                <input disabled={locked} className="hours" type="number" min="0" step="0.25" value={l.hours} onChange={(e) => update(l.key, { hours: e.target.value })} />
              </td>
              <td>
                <input disabled={locked} value={l.notes} onChange={(e) => update(l.key, { notes: e.target.value })} />
              </td>
              <td>
                <button type="button" className="ghost" disabled={locked} onClick={() => setLines((prev) => prev.length === 1 ? [{ key: uid(), clientId: "", projectId: "", taskId: "", hours: "", notes: "" }] : prev.filter((x) => x.key !== l.key))}>Sterge</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="actions">
        <button type="button" className="ghost" disabled={locked} onClick={() => setLines([...lines, { key: uid(), clientId: "", projectId: "", taskId: "", hours: "1", notes: "" }])}>+ rand</button>
        {!locked && (
          <>
            <button type="button" disabled={saving} onClick={() => save(false)}>Salveaza</button>
            <button type="button" disabled={saving} onClick={() => save(true)}>Trimite ziua</button>
          </>
        )}
        {locked && <button type="button" onClick={unlock}>Deblocheaza</button>}
      </div>
    </main>
  );
}
