"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function enter() {
    setError("");
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error ?? "Eroare login");
    window.location.href = "/today";
  }

  return (
    <main>
      <h1>Intră în Oratoriu</h1>
      {error && <p style={{ color: "#8a2e1a" }}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Parolă"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && enter()}
      />
      <button type="button" onClick={enter} disabled={!email || !password}>
        Intră
      </button>
    </main>
  );
}
