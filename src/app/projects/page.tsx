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
  const [addingFor, setAddingFor] = useState<string | null>(null);
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
    setAddingFor(null);
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
    <main className="projects-page">
      <h1>Proiecte și activități</h1>
      {error && <p style={{ color: "#8a2e1a" }}>{error}</p>}

      <div className="top-add">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Proiect (sau — )"
        />
        <button type="button" onClick={addProject} disabled={!clientId}>
          Adaugă proiect
        </button>
      </div>

      <table className="sheet">
        <colgroup>
          <col style={{ width: "24%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "40%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
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
              <td>
                <span className="cell-clip">{p.client?.name}</span>
              </td>
              <td>
                {editingId === p.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => saveName(p.id, p.name)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.target as HTMLInputElement).blur()
                    }
                  />
                ) : (
                  <button
                    type="button"
                    className="cell-edit cell-clip"
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
                <select
                  value={addingFor === p.id ? "__new" : ""}
                  onChange={(e) => {
                    if (e.target.value === "__new") setAddingFor(p.id);
                    else setAddingFor(null);
                  }}
                >
                  <option value="">
                    {(p.tasks ?? []).length
                      ? `${(p.tasks ?? []).length} activități`
                      : "Fără activități"}
                  </option>
                  {(p.tasks ?? []).map((t: any) => (
                    <option key={t.id} value={t.id} disabled>
                      {t.name}
                    </option>
                  ))}
                  <option value="__new">+ activitate nouă</option>
                </select>
                {addingFor === p.id && (
                  <div className="add-task" style={{ marginTop: 6 }}>
                    <input
                      autoFocus
                      value={activity[p.id] ?? ""}
                      onChange={(e) =>
                        setActivity((a) => ({ ...a, [p.id]: e.target.value }))
                      }
                      placeholder="nume activitate"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addActivity(p.id);
                        if (e.key === "Escape") setAddingFor(null);
                      }}
                    />
                    <button type="button" className="ghost" onClick={() => addActivity(p.id)}>
                      OK
                    </button>
                  </div>
                )}
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
