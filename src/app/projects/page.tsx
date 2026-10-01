"use client";

import { useEffect, useMemo, useState } from "react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [newName, setNewName] = useState("");
  const [fromProjectId, setFromProjectId] = useState("");
  const [activity, setActivity] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function readJson(res: Response) {
    const text = await res.text();
    if (!text) return { error: "Răspuns gol" };
    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  }

  async function load() {
    const [p, c] = await Promise.all([
      fetch("/api/projects").then(readJson),
      fetch("/api/clients").then(readJson),
    ]);
    setProjects(Array.isArray(p) ? p : []);
    setClients(Array.isArray(c) ? c : []);
    const err = (!Array.isArray(p) && p.error) || (!Array.isArray(c) && c.error);
    if (err) setError(String(err));
  }

  useEffect(() => {
    load();
  }, []);

  const forClient = useMemo(
    () => projects.filter((p) => (p.clientId || p.client?.id) === clientId),
    [projects, clientId],
  );
  const current = forClient.find((p) => p.id === projectId) ?? null;
  const tasks = (current?.tasks ?? [])
    .slice()
    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  function pickClient(id: string) {
    setClientId(id);
    setProjectId("");
    setFromProjectId("");
    setActivity("");
  }

  async function addProject() {
    if (!clientId) return;
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName || "—", clientId }),
    });
    const json = await readJson(res);
    if (!res.ok) return setError(json.error || "Eroare proiect");
    if (json.id && fromProjectId) {
      await fetch("/api/catalog/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "tasks", fromProjectId, toProjectId: json.id }),
      });
    }
    setNewName("");
    setFromProjectId("");
    await load();
    if (json.id) setProjectId(json.id);
  }

  async function addActivity() {
    if (!projectId) return setError("Alege întâi un proiect.");
    if (!activity.trim()) return setError("Scrie numele activității.");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name: activity.trim() }),
    });
    const json = await readJson(res);
    if (!res.ok) return setError(json.error || "Eroare activitate");
    setActivity("");
    load();
  }

  async function deleteTask(id: string, label: string) {
    if (!confirm("Ștergi activitatea „" + label + "”?")) return;
    const res = await fetch("/api/tasks/" + id, { method: "DELETE" });
    const json = await readJson(res);
    if (!res.ok) return setError(json.error || "Nu s-a șters");
    load();
  }

  async function moveTask(id: string, dir: "up" | "down") {
    if (!current) return;
    const list = tasks.slice();
    const i = list.findIndex((t: any) => t.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return;
    const next = list.slice();
    const [moved] = next.splice(i, 1);
    next.splice(j, 0, moved);
    const ordered = next.map((t: any, idx: number) => ({ ...t, sortOrder: idx }));
    setProjects((prev) => prev.map((p) => (p.id === current.id ? { ...p, tasks: ordered } : p)));
    fetch("/api/tasks/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dir }),
    }).then(async (res) => {
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Nu s-a mutat");
        load();
      }
    });
  }

  async function saveName() {
    if (!current || editingName == null) return;
    const next = editingName.trim();
    setEditingName(null);
    if (!next || next === current.name) return;
    const res = await fetch("/api/projects/" + current.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: next }),
    });
    const json = await readJson(res);
    if (!res.ok) return setError(json.error);
    load();
  }

  async function removeProject() {
    if (!current) return;
    if (!confirm("Ștergi proiectul „" + current.name + "”?")) return;
    const res = await fetch("/api/projects/" + current.id, { method: "DELETE" });
    const json = await readJson(res);
    if (!res.ok) return setError(json.error);
    setProjectId("");
    load();
  }

  return (
    <main className="projects-page">
      <h1>Proiecte și activități</h1>
      {error && <p style={{ color: "#8a2e1a" }}>{error}</p>}

      <div className="top-add">
        <select value={clientId} onChange={(e) => pickClient(e.target.value)}>
          <option value="">Client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={!clientId}
        >
          <option value="">{clientId ? "Proiect" : "Alege clientul"}</option>
          {forClient.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="top-add">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Proiect nou (sau — )"
          disabled={!clientId}
        />
        <select
          value={fromProjectId}
          onChange={(e) => setFromProjectId(e.target.value)}
          disabled={!clientId}
        >
          <option value="">Fără copiere activități</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.client?.name} / {p.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={addProject} disabled={!clientId}>
          Adaugă proiect
        </button>
      </div>

      {current && (
        <>
          <h2>
            {current.client?.name} /{" "}
            {editingName == null ? (
              <button type="button" className="cell-edit" onClick={() => setEditingName(current.name)}>
                {current.name}
              </button>
            ) : (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              />
            )}
          </h2>
          <p>Activitățile apar în ordinea procesului.</p>
          {tasks.map((t: any) => (
            <div key={t.id} className="actions">
              <span>{t.name}</span>
              <button type="button" className="ghost" title="Sus" onClick={() => moveTask(t.id, "up")}>↑</button>
              <button type="button" className="ghost" title="Jos" onClick={() => moveTask(t.id, "down")}>↓</button>
              <button type="button" className="ghost" title="Șterge" onClick={() => deleteTask(t.id, t.name)}>×</button>
            </div>
          ))}
          {!tasks.length && <p>Nicio activitate pe proiectul ăsta.</p>}
          <div className="add-task">
            <input
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="următorul pas din proces"
              onKeyDown={(e) => e.key === "Enter" && addActivity()}
            />
            <button type="button" onClick={addActivity}>Adaugă activitate</button>
            <button type="button" className="ghost" onClick={removeProject}>Șterge proiectul</button>
          </div>
        </>
      )}
    </main>
  );
}
