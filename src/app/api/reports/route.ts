import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toWorkDate } from "@/lib/timezone";
import { endOfMonth, format, startOfMonth } from "date-fns";

function money(hours: number, rate?: any) {
  const r = rate == null ? 0 : Number(rate);
  return Math.round(hours * r * 100) / 100;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    let from = url.searchParams.get("from");
    let to = url.searchParams.get("to");

    if (!from || !to) {
      const m = month || format(new Date(), "yyyy-MM");
      const start = startOfMonth(new Date(`${m}-01T00:00:00`));
      from = format(start, "yyyy-MM-dd");
      to = format(endOfMonth(start), "yyyy-MM-dd");
    }

    const fromDate = toWorkDate(from);
    const toDate = toWorkDate(to);
    const userId = url.searchParams.get("userId") || undefined;
    const projectId = url.searchParams.get("projectId") || undefined;
    const clientId = url.searchParams.get("clientId") || undefined;

    const entries = await prisma.timeEntry.findMany({
      where: {
        workDate: { gte: fromDate, lte: toDate },
        ...(userId ? { userId } : {}),
        ...(projectId ? { projectId } : {}),
        ...(clientId ? { project: { clientId } } : {}),
      },
      select: {
        minutes: true,
        billable: true,
        userId: true,
        projectId: true,
        user: { select: { id: true, name: true, costRate: true, billRate: true } },
        project: {
          select: {
            id: true,
            name: true,
            billRate: true,
            client: { select: { name: true } },
          },
        },
      },
    });

    const byEmp = new Map<string, any>();
    const byProj = new Map<string, any>();
    let hours = 0, revenue = 0, cost = 0;

    for (const e of entries) {
      const h = e.minutes / 60;
      const billRate = e.project.billRate ?? e.user.billRate ?? 0;
      const costRate = e.user.costRate ?? 0;
      const rev = e.billable ? money(h, billRate) : 0;
      const cst = money(h, costRate);
      hours += h;
      revenue += rev;
      cost += cst;

      const emp = byEmp.get(e.userId) ?? { id: e.userId, name: e.user.name, hours: 0, revenue: 0, cost: 0 };
      emp.hours += h; emp.revenue += rev; emp.cost += cst;
      byEmp.set(e.userId, emp);

      const label = `${e.project.client.name} / ${e.project.name}`;
      const proj = byProj.get(e.projectId) ?? { id: e.projectId, label, hours: 0, revenue: 0, cost: 0 };
      proj.hours += h; proj.revenue += rev; proj.cost += cst;
      byProj.set(e.projectId, proj);
    }

    const fin = (row: any) => ({
      ...row,
      hours: Math.round(row.hours * 100) / 100,
      revenue: Math.round(row.revenue * 100) / 100,
      cost: Math.round(row.cost * 100) / 100,
      profit: Math.round((row.revenue - row.cost) * 100) / 100,
    });

    return NextResponse.json({
      from,
      to,
      totals: fin({ hours, revenue, cost }),
      employees: [...byEmp.values()].map(fin).sort((a, b) => b.profit - a.profit),
      projects: [...byProj.values()].map(fin).sort((a, b) => b.profit - a.profit),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
