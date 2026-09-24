import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toWorkDate } from "@/lib/timezone";
import { format } from "date-fns";

function csvEscape(value: string | number) {
  const s = String(value ?? "");
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? format(new Date(), "yyyy-MM-01");
  const to = url.searchParams.get("to") ?? format(new Date(), "yyyy-MM-dd");

  const entries = await prisma.timeEntry.findMany({
    where: {
      workDate: { gte: toWorkDate(from), lte: toWorkDate(to) },
    },
    include: {
      user: true,
      project: { include: { client: true } },
    },
    orderBy: [{ workDate: "asc" }, { createdAt: "asc" }],
  });

  const header = [
    "Data",
    "Angajat",
    "Email",
    "Client",
    "Proiect",
    "Ore",
    "Minute",
    "Facturabil",
    "Status",
    "Nota",
  ];

  const rows = entries.map((e) => [
    format(e.workDate, "yyyy-MM-dd"),
    e.user.name,
    e.user.email,
    e.project.client.name,
    e.project.name,
    (e.minutes / 60).toString().replace(".", ","),
    e.minutes,
    e.billable ? "da" : "nu",
    e.status,
    e.notes ?? "",
  ]);

  const csv =
    "\uFEFF" +
    [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="oratoriu-${from}-${to}.csv"`,
    },
  });
}
