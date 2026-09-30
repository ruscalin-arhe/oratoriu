import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";

export async function POST(req: Request) {
  try {
    const me = await currentUser();
    if (me.role !== "ADMIN") {
      return NextResponse.json({ error: "Doar adminul copiază catalogul." }, { status: 403 });
    }
    const body = await req.json();
    const mode = String(body.mode || "");

    if (mode === "tasks") {
      const { fromProjectId, toProjectId } = body;
      if (!fromProjectId || !toProjectId) {
        return NextResponse.json({ error: "Alege proiectul sursă și destinația." }, { status: 400 });
      }
      if (fromProjectId === toProjectId) {
        return NextResponse.json({ error: "Sursă și destinație identice." }, { status: 400 });
      }
      const [from, to] = await Promise.all([
        prisma.project.findUnique({ where: { id: fromProjectId }, include: { tasks: true } }),
        prisma.project.findUnique({ where: { id: toProjectId }, include: { tasks: true } }),
      ]);
      if (!from || !to) return NextResponse.json({ error: "Proiect inexistent." }, { status: 404 });
      const have = new Set(to.tasks.map((t) => t.name.toLowerCase()));
      const names = from.tasks
        .filter((t) => t.active && !have.has(t.name.toLowerCase()))
        .map((t) => t.name);
      if (names.length) {
        await prisma.task.createMany({
          data: names.map((name) => ({ projectId: toProjectId, name, active: true })),
        });
      }
      return NextResponse.json({
        ok: true,
        copied: names.length,
        skipped: from.tasks.length - names.length,
      });
    }

    if (mode === "project") {
      const { fromProjectId, toClientId, name } = body;
      if (!fromProjectId || !toClientId) {
        return NextResponse.json({ error: "Proiect sursă și client destinație." }, { status: 400 });
      }
      const from = await prisma.project.findUnique({
        where: { id: fromProjectId },
        include: { tasks: true },
      });
      if (!from) return NextResponse.json({ error: "Proiect inexistent." }, { status: 404 });
      const created = await prisma.project.create({
        data: {
          name: String(name || from.name).trim() || from.name,
          clientId: toClientId,
          billRate: from.billRate,
          tasks: {
            create: from.tasks.filter((t) => t.active).map((t) => ({ name: t.name, active: true })),
          },
        },
        include: { tasks: true, client: true },
      });
      return NextResponse.json({ ok: true, project: created, copied: created.tasks.length });
    }

    if (mode === "client") {
      const { fromClientId, name } = body;
      if (!fromClientId || !String(name || "").trim()) {
        return NextResponse.json({ error: "Client sursă și nume nou." }, { status: 400 });
      }
      const from = await prisma.client.findUnique({
        where: { id: fromClientId },
        include: { projects: { include: { tasks: true } } },
      });
      if (!from) return NextResponse.json({ error: "Client inexistent." }, { status: 404 });
      const created = await prisma.client.create({
        data: {
          name: String(name).trim(),
          projects: {
            create: from.projects.map((p) => ({
              name: p.name,
              billRate: p.billRate,
              tasks: {
                create: p.tasks.filter((t) => t.active).map((t) => ({ name: t.name, active: true })),
              },
            })),
          },
        },
        include: { projects: { include: { tasks: true } } },
      });
      return NextResponse.json({
        ok: true,
        client: created,
        projects: created.projects.length,
        tasks: created.projects.reduce((n, p) => n + p.tasks.length, 0),
      });
    }

    return NextResponse.json({ error: "mode: tasks | project | client" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
