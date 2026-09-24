import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { name, clientId, userId, billRate } = await req.json();
  const data: { name?: string; clientId?: string; billRate?: number } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof clientId === "string" && clientId) data.clientId = clientId;
  if (billRate !== undefined && billRate !== "") data.billRate = Number(billRate);

  const project = await prisma.project.update({ where: { id }, data });

  if (typeof userId === "string") {
    await prisma.projectMember.deleteMany({ where: { projectId: id } });
    if (userId) {
      await prisma.projectMember.create({ data: { projectId: id, userId } });
    }
  }

  return NextResponse.json(project);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const entries = await prisma.timeEntry.count({ where: { projectId: id } });
  if (entries > 0) {
    return NextResponse.json(
      { error: `Proiectul are ${entries} ore pontate. Nu-l șterge, redenumește-l.` },
      { status: 400 },
    );
  }
  await prisma.projectMember.deleteMany({ where: { projectId: id } });
  await prisma.task.deleteMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
