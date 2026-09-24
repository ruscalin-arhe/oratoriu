"use client";

import { Fragment, useEffect, useState } from "react";

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
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
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

  async function patch(id: string, body: object) {
    setError("");
    const res = await fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await readJson(res);
    if (!res.ok) setError(json.error || "Eroare");
    else load();
  }

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
    setShowAdd(false);
    load();
  }

  return (
    <main className="people-page">
      <h1>Angajați</h1>
      {error && <p style={{ color: "#8a2e1a" }}>{error}</p>}

      <p>
        <button type="button" className="ghost" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Anulează" : "+ Angajat"}
        </button>
      </p>

      {showAdd && (
        <div className="stack">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nume" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parolă inițială" />
          <select value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "EMPLOYEE")}>
            <option value="EMPLOYEE">Angajat</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="button" onClick={add}>Adaugă</button>
        </div>
      )}

      <table className="sheet">
        <thead>
          <tr>
            <th>Nume</th>
            <th>Rol</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <Fragment key={u.id}>
              <tr>
                <td>
                  <button
                    type="button"
                    className="cell-edit"
                    onClick={() => setOpenId(openId === u.id ? null : u.id)}
                  >
                    {u.name}
                    <div style={{ color: "#6f675c", fontSize: 12 }}>{u.email}</div>
                  </button>
                </td>
                <td>{u.role === "ADMIN" ? "Admin" : "Angajat"}</td>
                <td>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setOpenId(openId === u.id ? null : u.id)}
                  >
                    {openId === u.id ? "Închide" : "Editează"}
                  </button>
                </td>
              </tr>
              {openId === u.id && (
                <tr>
                  <td colSpan={3}>
                    <div className="stack" style={{ margin: "8px 0 16px" }}>
                      <label>Nume</label>
                      <input
                        defaultValue={u.name}
                        onBlur={(e) => e.target.value !== u.name && patch(u.id, { name: e.target.value })}
                      />
                      <label>Email</label>
                      <input
                        defaultValue={u.email}
                        onBlur={(e) => e.target.value !== u.email && patch(u.id, { email: e.target.value })}
                      />
                      <label>Drepturi</label>
                      <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}>
                        <option value="EMPLOYEE">Angajat</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <label>Cost / oră</label>
                      <input
                        type="number"
                        defaultValue={u.costRate ?? ""}
                        placeholder="0"
                        onBlur={(e) => patch(u.id, { costRate: e.target.value })}
                      />
                      <label>Tarif / oră</label>
                      <input
                        type="number"
                        defaultValue={u.billRate ?? ""}
                        placeholder="0"
                        onBlur={(e) => patch(u.id, { billRate: e.target.value })}
                      />
                      <label>Parolă {u.hasPassword ? "(reset)" : "(lipsește)"}</label>
                      <input
                        type="password"
                        value={passwords[u.id] ?? ""}
                        placeholder="minim 6 caractere"
                        onChange={(e) => setPasswords((p) => ({ ...p, [u.id]: e.target.value }))}
                      />
                      <div className="actions">
                        <button type="button" className="ghost" onClick={() => patch(u.id, { password: passwords[u.id] })}>
                          Setează parola
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() =>
                            confirm("Ștergi " + u.name + "?") &&
                            fetch("/api/people/" + u.id, { method: "DELETE" }).then(load)
                          }
                        >
                          Șterge
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </main>
  );
}
