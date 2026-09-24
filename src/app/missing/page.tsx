"use client";

import { useEffect, useState } from "react";

export default function MissingPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/missing")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <main><p>Se încarcă…</p></main>;

  return (
    <main>
      <h1>Restanțe pontaj</h1>
      <p>{data.date}{data.off ? " · zi nelucrătoare" : ""}</p>
      <table className="sheet">
        <thead>
          <tr>
            <th>Angajat</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r: any) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.email}</td>
              <td>
                {r.status === "SUBMITTED"
                  ? "trimis"
                  : r.status === "DRAFT"
                    ? "ciornă"
                    : "netrimis"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
