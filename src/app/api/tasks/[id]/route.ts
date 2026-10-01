import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/current-user";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await currentUser();
    const { id } = await params;
    const { dir } = await req.json();
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: "Activitate inexistentă" }, { status: 404 });

    const siblings = await prisma.task.findMany({
      where: { projectId: task.projectId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
      select: { id: true, sortOrder: true },
    });
    const i = siblings.findIndex((s) => s.id === id);
    const j = dir === "up" ? i - 1 : dir === "down" ? i + 1 : -1;
    if (i < 0 || j < 0 || j >= siblings.length) return NextResponse.json({ ok: true });

    await prisma.$transaction([
      prisma.task.update({ where: { id: siblings[i].id }, data: { sortOrder: j } }),
      prisma.task.update({ where: { id: siblings[j].id }, data: { sortOrder: i } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await currentUser();
    const { id } = await params;
    const hours = await prisma.timeEntry.count({ where: { taskId: id } });
    if (hours > 0) {
      return NextResponse.json({ error: "Are ore pontate. Nu se șterge." }, { status: 400 });
    }
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
