"use client";

import { useEffect, useState } from "react";

type EditField = "name" | "email" | null;

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || `HTTP ${res.status}` };
  }
}

export default function PeoplePage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "ADMIN">("EMPLOYEE");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditField>(null);
  const [editingValue, setEditingValue] = useState("");
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/people");
    const json = await readJson(res);
    setItems(Array.isArray(json) ? json : []);
    if (!Array.isArray(json) && json.error) setError(json.error);
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    setError("");
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, password, expectedDailyHours: 8 }),
    });
    const json = await readJson(res);
    if (!res.ok) return setError(json.error || "Eroare la adăugare");
    setName("");
    setEmail("");
    setPassword("");
    setRole("EMPLOYEE");
    load();
  }

  function startEdit(id: string, field: "name" | "email", value: string) {
    setEditingId(id);
    setEditingField(field);
    setEditingValue(value);
  }

  async function saveEdit(id: string, original: string) {
    const field = editingField;
    const next = editingValue.trim();
    setEditingId(null);
    setEditingField(null);
    if (!field || !next || next === original) return;
    const body = field === "email" ? { email: next } : { name: next };
    const res = await fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await readJson(res);
    if (!res.ok) return setError(json.error || "Eroare la salvare");
    load();
  }

  async function saveRole(id: string, nextRole: "ADMIN" | "EMPLOYEE") {
    const res = await fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const json = await readJson(res);
    if (!res.ok) return setError(json.error || "Eroare la rol");
    load();
  }

  async function savePassword(id: string) {
    const next = (passwords[id] || "").trim();
    if (next.length < 6) return setError("Parola minim 6 caractere.");
    const res = await fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: next }),
    });
    const json = await readJson(res);
    if (!res.ok) return setError(json.error || "Eroare la parolă");
    setPasswords((p) => ({ ...p, [id]: "" }));
    load();
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Ștergi angajatul „${label}”?`)) return;
    const res = await fetch(`/api/people/${id}`, { method: "DELETE" });
    const json = await readJson(res);
    if (!res.ok) return setError(json.error || "Eroare la ștergere");
    load();
  }

  return (
    <main>
      <h1>Angajați</h1>
      {error && <p style={{ color: "#8a2e1a" }}>{error}</p>}

      <div className="actions">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nume" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Parolă inițială"
        />
        <select value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "EMPLOYEE")}>
          <option value="EMPLOYEE">Angajat</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button type="button" onClick={add}>Adaugă</button>
      </div>

      <div className="table-wrap">
      <table className="sheet">
        <thead>
          <tr>
            <th>Nume</th>
            <th>Email</th>
            <th>Drepturi</th>
            <th>Parolă</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td>
                {editingId === u.id && editingField === "name" ? (
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => saveEdit(u.id, u.name)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                ) : (
                  <button type="button" className="cell-edit" onClick={() => startEdit(u.id, "name", u.name)}>
                    {u.name}
                  </button>
                )}
              </td>
              <td>
                {editingId === u.id && editingField === "email" ? (
                  <input
                    autoFocus
                    type="email"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => saveEdit(u.id, u.email)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                ) : (
                  <button type="button" className="cell-edit" onClick={() => startEdit(u.id, "email", u.email)}>
                    {u.email}
                  </button>
                )}
              </td>
              <td>
                <select value={u.role} onChange={(e) => saveRole(u.id, e.target.value as "ADMIN" | "EMPLOYEE")}>
                  <option value="EMPLOYEE">Angajat</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td>
                <input
                  type="password"
                  placeholder={u.hasPassword ? "parolă nouă" : "fără parolă"}
                  value={passwords[u.id] ?? ""}
                  onChange={(e) => setPasswords((p) => ({ ...p, [u.id]: e.target.value }))}
                />
                <button type="button" className="ghost" onClick={() => savePassword(u.id)}>
                  Setează
                </button>
              </td>
              <td>
                <button type="button" className="ghost" onClick={() => remove(u.id, u.name)}>
                  Șterge
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </main>
  );
}
