import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayIso, toWorkDate } from "@/lib/timezone";
import { holidayName } from "@/lib/holidays-ro";
import { isWeekend } from "@/lib/capacity";

export async function GET() {
  const iso = todayIso();
  const workDate = toWorkDate(iso);
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  const reports = await prisma.dayReport.findMany({
    where: { workDate },
  });
  const byUser = new Map(reports.map((r) => [r.userId, r]));

  return NextResponse.json({
    date: iso,
    off: isWeekend(iso) || Boolean(holidayName(iso)),
    rows: users.map((u) => {
      const r = byUser.get(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        status: r?.status ?? "MISSING",
      };
    }),
  });
}
