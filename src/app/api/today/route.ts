import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";
import { todayIso, toWorkDate } from "@/lib/timezone";
import { expectedMinutes, idleMinutes } from "@/lib/capacity";

function isoFrom(req: Request) {
  return new URL(req.url).searchParams.get("date") || todayIso();
}

async function getOrCreateReport(userId: string, workDate: Date) {
  const found = await prisma.dayReport.findFirst({
    where: { userId, workDate },
    select: { id: true, status: true },
  });
  if (found) return found;
  try {
    return await prisma.dayReport.create({
      data: { userId, workDate, status: "MISSING" },
      select: { id: true, status: true },
    });
  } catch {
    const again = await prisma.dayReport.findFirst({
      where: { userId, workDate },
      select: { id: true, status: true },
    });
    if (!again) throw new Error("Nu pot deschide ziua de pontaj");
    return again;
  }
}

async function payload(iso: string) {
  const user = await currentUser();
  const workDate = toWorkDate(iso);

  const [entries, report, timeOff, clients, projects] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { userId: user.id, workDate },
      select: {
        id: true,
        projectId: true,
        taskId: true,
        minutes: true,
        notes: true,
        project: {
          select: {
            id: true,
            clientId: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.dayReport.findFirst({
      where: { userId: user.id, workDate },
      select: { id: true, status: true },
    }),
    prisma.timeOff.findFirst({
      where: { userId: user.id, date: workDate },
      select: { hours: true },
    }),
    prisma.client.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        clientId: true,
        client: { select: { id: true, name: true } },
        tasks: {
          where: { active: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const worked = entries.reduce((s, e) => s + e.minutes, 0);
  const expected = expectedMinutes(
    iso,
    Number(user.expectedDailyHours),
    timeOff ? Number(timeOff.hours) : 0,
  );

  return {
    date: iso,
    status: report?.status ?? "MISSING",
    expectedMinutes: expected,
    workedMinutes: worked,
    idleMinutes: idleMinutes(expected, worked),
    entries,
    clients,
    projects,
  };
}

export async function GET(req: Request) {
  try {
    return NextResponse.json(await payload(isoFrom(req)));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await currentUser();
    const iso = isoFrom(req);
    const workDate = toWorkDate(iso);
    const body = await req.json();
    const report = await getOrCreateReport(user.id, workDate);
    if (report.status === "SUBMITTED") {
      return NextResponse.json({ error: "Ziua e blocată. Deblochează întâi." }, { status: 400 });
    }

    const lines = (body.entries ?? []) as {
      projectId: string;
      taskId?: string | null;
      minutes: number;
      notes?: string;
    }[];
    const valid = lines.filter((l) => l.projectId && l.taskId && l.minutes > 0);

    await prisma.timeEntry.deleteMany({ where: { userId: user.id, workDate } });
    if (valid.length) {
      await prisma.timeEntry.createMany({
        data: valid.map((l) => ({
          userId: user.id,
          projectId: l.projectId,
          taskId: l.taskId || null,
          workDate,
          minutes: Math.round(Number(l.minutes)),
          notes: l.notes || null,
          billable: true,
          status: "DRAFT" as const,
        })),
      });
    }
    await prisma.dayReport.update({
      where: { id: report.id },
      data: { status: "DRAFT" },
    });
    return NextResponse.json(await payload(iso));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    const iso = isoFrom(req);
    const workDate = toWorkDate(iso);
    const report = await getOrCreateReport(user.id, workDate);
    await prisma.timeEntry.updateMany({
      where: { userId: user.id, workDate },
      data: { status: "SUBMITTED" },
    });
    await prisma.dayReport.update({
      where: { id: report.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    return NextResponse.json(await payload(iso));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
