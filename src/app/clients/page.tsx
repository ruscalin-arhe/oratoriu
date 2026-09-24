"use client";

import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  active: boolean;
  _count?: { projects: number };
};

export default function ClientsPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setItems(await (await fetch("/api/clients")).json());
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    setError("");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error);
    setName("");
    load();
  }

  async function saveName(id: string, original: string) {
    const next = editingName.trim();
    setEditingId(null);
    if (!next || next === original) return;
    setError("");
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: next }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error);
    load();
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Ștergi clientul „${label}”?`)) return;
    setError("");
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) return setError(json.error);
    load();
  }

  return (
    <main>
      <h1>Clienți</h1>
      {error && <p style={{ color: "#8a2e1a" }}>{error}</p>}

      <div className="actions">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nume client nou"
        />
        <button type="button" onClick={add}>
          Adaugă
        </button>
      </div>

      <table className="sheet">
        <thead>
          <tr>
            <th>Denumire</th>
            <th>Proiecte</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>
                {editingId === c.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => saveName(c.id, c.name)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="cell-edit"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditingName(c.name);
                    }}
                  >
                    {c.name}
                  </button>
                )}
              </td>
              <td>{c._count?.projects ?? 0}</td>
              <td>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => remove(c.id, c.name)}
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
