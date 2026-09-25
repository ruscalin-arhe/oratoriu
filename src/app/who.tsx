"use client";

import { useEffect, useState } from "react";

export function Who() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null));
  }, []);

  const admin = user?.role === "ADMIN";

  async function changeUser(e: React.MouseEvent) {
    e.preventDefault();
    await fetch("/api/session", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <>
      <nav>
        <a href="/today">Pontaj</a>
        {admin && <a href="/clients">Clienți</a>}
        {admin && <a href="/projects">Proiecte</a>}
        {admin && <a href="/people">Angajați</a>}
        {admin && <a href="/reports">Rapoarte</a>}
        {admin && <a href="/missing">Restanțe</a>}
        <a href="/login" onClick={changeUser}>
          Schimbă user
        </a>
      </nav>
      {user && <p className="who">Logat: {user.name}</p>}
    </>
  );
}
