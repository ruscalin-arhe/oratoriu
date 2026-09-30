import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toWorkDate } from "@/lib/timezone";
import { endOfMonth, format, startOfMonth } from "date-fns";

function money(hours: number, rate?: any) {
  const r = rate == null ? 0 : Number(rate);
  return Math.round(hours * r * 100) / 100;
}

function ids(raw: string | null) {
  return (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fin(row: any) {
  const hours = Math.round((row.hours ?? 0) * 100) / 100;
  const billableHours = Math.round((row.billableHours ?? 0) * 100) / 100;
  const revenue = Math.round((row.revenue ?? 0) * 100) / 100;
  const cost = Math.round((row.cost ?? 0) * 100) / 100;
  return {
    ...row,
    hours,
    billableHours,
    revenue,
    cost,
    profit: Math.round((revenue - cost) * 100) / 100,
    costPerHour: hours ? Math.round((cost / hours) * 100) / 100 : 0,
  };
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
    const userIds = ids(url.searchParams.get("userIds") || url.searchParams.get("userId"));
    const projectIds = ids(url.searchParams.get("projectIds") || url.searchParams.get("projectId"));
    const clientId = url.searchParams.get("clientId") || undefined;

    const entries = await prisma.timeEntry.findMany({
      where: {
        workDate: { gte: fromDate, lte: toDate },
        ...(userIds.length ? { userId: { in: userIds } } : {}),
        ...(projectIds.length ? { projectId: { in: projectIds } } : {}),
        ...(clientId ? { project: { clientId } } : {}),
      },
      select: {
        minutes: true,
        billable: true,
        userId: true,
        projectId: true,
        taskId: true,
        workDate: true,
        user: { select: { id: true, name: true, costRate: true, billRate: true } },
        task: { select: { id: true, name: true } },
        project: {
          select: {
            id: true,
            name: true,
            billRate: true,
            clientId: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
    });

    const byEmp = new Map<string, any>();
    const byProj = new Map<string, any>();
    const byTask = new Map<string, any>();
    const cell = new Map<string, number>();
    const cellBill = new Map<string, number>();
    let hours = 0, billableHours = 0, revenue = 0, cost = 0;

    for (const e of entries) {
      const h = e.minutes / 60;
      const bh = e.billable ? h : 0;
      const billRate = e.project.billRate ?? e.user.billRate ?? 0;
      const costRate = e.user.costRate ?? 0;
      const rev = e.billable ? money(h, billRate) : 0;
      const cst = money(h, costRate);
      hours += h;
      billableHours += bh;
      revenue += rev;
      cost += cst;

      const emp = byEmp.get(e.userId) ?? {
        id: e.userId, name: e.user.name, hours: 0, billableHours: 0, revenue: 0, cost: 0,
      };
      emp.hours += h; emp.billableHours += bh; emp.revenue += rev; emp.cost += cst;
      byEmp.set(e.userId, emp);

      const label = `${e.project.client.name} / ${e.project.name}`;
      const proj = byProj.get(e.projectId) ?? {
        id: e.projectId, label, hours: 0, billableHours: 0, revenue: 0, cost: 0,
      };
      proj.hours += h; proj.billableHours += bh; proj.revenue += rev; proj.cost += cst;
      byProj.set(e.projectId, proj);

      const tid = e.taskId || "none";
      const tlabel = `${label} / ${e.task?.name ?? "—"}`;
      const task = byTask.get(tid) ?? {
        id: tid, label: tlabel, hours: 0, billableHours: 0, revenue: 0, cost: 0,
      };
      task.hours += h; task.billableHours += bh; task.revenue += rev; task.cost += cst;
      byTask.set(tid, task);

      const k = `${e.userId}::${e.projectId}`;
      cell.set(k, (cell.get(k) ?? 0) + h);
      cellBill.set(k, (cellBill.get(k) ?? 0) + bh);
    }

    const employees = [...byEmp.values()].map(fin).sort((a, b) => b.hours - a.hours);
    const projects = [...byProj.values()].map(fin).sort((a, b) => b.hours - a.hours);

    const compare = {
      users: employees.map((e) => ({ id: e.id, name: e.name, hours: e.hours })),
      projects: projects.map((p) => ({ id: p.id, label: p.label, hours: p.hours })),
      hours: Object.fromEntries(
        [...cell.entries()].map(([k, v]) => [k, Math.round(v * 100) / 100]),
      ),
    };

    return NextResponse.json({
      from,
      to,
      filters: { userIds, projectIds },
      totals: fin({ hours, billableHours, revenue, cost }),
      employees,
      projects,
      tasks: [...byTask.values()].map(fin).sort((a, b) => b.hours - a.hours),
      compare,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
