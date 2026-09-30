"use client";

import { useEffect, useState } from "react";

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function Who() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then(readJson)
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  async function changeUser(e: React.MouseEvent) {
    e.preventDefault();
    await fetch("/api/session", { method: "DELETE" });
    window.location.href = "/login";
  }

  if (!ready) return null;

  if (!user) {
    return (
      <nav>
        <a href="/login" onClick={changeUser}>
          Schimbă user
        </a>
      </nav>
    );
  }

  const admin = user.role === "ADMIN";

  return (
    <>
      <nav>
        <a href="/today">Pontaj</a>
        <a href="/projects">Proiecte</a>
        {admin && <a href="/clients">Clienți</a>}
        {admin && <a href="/people">Angajați</a>}
        {admin && <a href="/reports">Rapoarte</a>}
        {admin && <a href="/missing">Restanțe</a>}
        <a href="/login" onClick={changeUser}>
          Schimbă user
        </a>
      </nav>
      <p className="who">Logat: {user.name}</p>
    </>
  );
}
