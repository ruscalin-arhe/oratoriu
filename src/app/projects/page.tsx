"use client";

import { useEffect, useState } from "react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [activity, setActivity] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [p, c] = await Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]);
    setProjects(Array.isArray(p) ? p : []);
    setClients(Array.isArray(c) ? c : []);
  }
  useEffect(() => {
    load();
  }, []);

  async function addProject() {
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "—", clientId }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Eroare proiect");
    setName("");
    load();
  }

  async function addActivity(projectId: string) {
    const taskName = (activity[projectId] || "").trim();
    if (!taskName) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name: taskName }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error || "Eroare activitate");
    setActivity((a) => ({ ...a, [projectId]: "" }));
    load();
  }

  async function patch(id: string, body: object) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error);
    load();
  }

  async function saveName(id: string, original: string) {
    const next = editingName.trim();
    setEditingId(null);
    if (!next || next === original) return;
    patch(id, { name: next });
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Ștergi proiectul „${label}”?`)) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) return setError(json.error);
    load();
  }

  return (
    <main>
      <h1>Proiecte și activități</h1>
      {error && <p style={{ color: "#8a2e1a" }}>{error}</p>}

      <div className="actions">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Proiect (sau — )'
        />
        <button type="button" onClick={addProject} disabled={!clientId}>
          Adaugă proiect
        </button>
      </div>

      <table className="sheet">
        <thead>
          <tr>
            <th>Client</th>
            <th>Proiect</th>
            <th>Activități</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.client?.name}</td>
              <td>
                {editingId === p.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => saveName(p.id, p.name)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                ) : (
                  <button
                    type="button"
                    className="cell-edit"
                    onClick={() => {
                      setEditingId(p.id);
                      setEditingName(p.name);
                    }}
                  >
                    {p.name}
                  </button>
                )}
              </td>
              <td>
                {(p.tasks ?? []).map((t: any) => t.name).join(", ") || "—"}
                <div className="actions">
                  <input
                    value={activity[p.id] ?? ""}
                    onChange={(e) => setActivity((a) => ({ ...a, [p.id]: e.target.value }))}
                    placeholder="activitate nouă"
                    onKeyDown={(e) => e.key === "Enter" && addActivity(p.id)}
                  />
                  <button type="button" className="ghost" onClick={() => addActivity(p.id)}>
                    + activitate
                  </button>
                </div>
              </td>
              <td>
                <button type="button" className="ghost" onClick={() => remove(p.id, p.name)}>
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
